import { useState, useCallback, useEffect } from 'react';
import { useWeb3 } from '@/hooks/useWeb3';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { CurrentTrack } from '@/hooks/useAudioPlayer';

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  cover_url?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  profile_id: string;
  tracks: PlaylistTrack[];
}

export interface PlaylistTrack {
  id: string;
  playlist_id: string;
  track_id: string;
  position: number;
  added_at: string;
  track_data?: CurrentTrack; // Cached track info
}

export const usePlaylist = () => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPlaylist, setCurrentPlaylist] = useState<Playlist | null>(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'none' | 'one' | 'all'>('none');

  const { isConnected, profile } = useWeb3();

  // Load user's playlists
  const loadPlaylists = useCallback(async () => {
    if (!isConnected || !profile) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('playlists')
        .select(`
          *,
          playlist_tracks (
            *,
            position
          )
        `)
        .eq('profile_id', profile.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      
      setPlaylists(data || []);
    } catch (error) {
      console.error('Failed to load playlists:', error);
      toast({
        title: "Error",
        description: "Failed to load your playlists",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, profile]);

  // Create new playlist
  const createPlaylist = useCallback(async (name: string, description?: string, isPublic = false) => {
    if (!isConnected || !profile) {
      toast({
        title: "Error",
        description: "Please connect your wallet to create playlists",
        variant: "destructive",
      });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('playlists')
        .insert({
          name,
          description,
          is_public: isPublic,
          profile_id: profile.id,
        })
        .select()
        .single();

      if (error) throw error;

      const newPlaylist: Playlist = {
        ...data,
        tracks: [],
      };

      setPlaylists(prev => [newPlaylist, ...prev]);
      
      toast({
        title: "Success",
        description: `Playlist "${name}" created successfully`,
      });

      return newPlaylist;
    } catch (error) {
      console.error('Failed to create playlist:', error);
      toast({
        title: "Error",
        description: "Failed to create playlist",
        variant: "destructive",
      });
      return null;
    }
  }, [isConnected, profile]);

  // Add track to playlist
  const addTrackToPlaylist = useCallback(async (playlistId: string, track: CurrentTrack) => {
    if (!isConnected || !profile) return false;

    try {
      // Get current track count for position
      const { data: existingTracks, error: countError } = await supabase
        .from('playlist_tracks')
        .select('position')
        .eq('playlist_id', playlistId)
        .order('position', { ascending: false })
        .limit(1);

      if (countError) throw countError;

      const nextPosition = (existingTracks?.[0]?.position || 0) + 1;

      const { error } = await supabase
        .from('playlist_tracks')
        .insert({
          playlist_id: playlistId,
          track_id: track.id,
          position: nextPosition,
          track_data: track,
        });

      if (error) throw error;

      // Update local state
      setPlaylists(prev => prev.map(playlist => 
        playlist.id === playlistId 
          ? { 
              ...playlist, 
              tracks: [...playlist.tracks, {
                id: `${playlistId}-${track.id}`,
                playlist_id: playlistId,
                track_id: track.id,
                position: nextPosition,
                added_at: new Date().toISOString(),
                track_data: track,
              }]
            }
          : playlist
      ));

      toast({
        title: "Success",
        description: `Added "${track.title}" to playlist`,
      });

      return true;
    } catch (error) {
      console.error('Failed to add track to playlist:', error);
      toast({
        title: "Error",
        description: "Failed to add track to playlist",
        variant: "destructive",
      });
      return false;
    }
  }, [isConnected, profile]);

  // Remove track from playlist
  const removeTrackFromPlaylist = useCallback(async (playlistId: string, trackId: string) => {
    if (!isConnected || !profile) return false;

    try {
      const { error } = await supabase
        .from('playlist_tracks')
        .delete()
        .eq('playlist_id', playlistId)
        .eq('track_id', trackId);

      if (error) throw error;

      // Update local state
      setPlaylists(prev => prev.map(playlist => 
        playlist.id === playlistId 
          ? { 
              ...playlist, 
              tracks: playlist.tracks.filter(track => track.track_id !== trackId)
            }
          : playlist
      ));

      toast({
        title: "Success",
        description: "Track removed from playlist",
      });

      return true;
    } catch (error) {
      console.error('Failed to remove track from playlist:', error);
      toast({
        title: "Error",
        description: "Failed to remove track from playlist",
        variant: "destructive",
      });
      return false;
    }
  }, [isConnected, profile]);

  // Delete playlist
  const deletePlaylist = useCallback(async (playlistId: string) => {
    if (!isConnected || !profile) return false;

    try {
      const { error } = await supabase
        .from('playlists')
        .delete()
        .eq('id', playlistId)
        .eq('profile_id', profile.id);

      if (error) throw error;

      setPlaylists(prev => prev.filter(playlist => playlist.id !== playlistId));
      
      if (currentPlaylist?.id === playlistId) {
        setCurrentPlaylist(null);
        setCurrentTrackIndex(0);
      }

      toast({
        title: "Success",
        description: "Playlist deleted successfully",
      });

      return true;
    } catch (error) {
      console.error('Failed to delete playlist:', error);
      toast({
        title: "Error",
        description: "Failed to delete playlist",
        variant: "destructive",
      });
      return false;
    }
  }, [isConnected, profile, currentPlaylist]);

  // Playlist navigation
  const getNextTrack = useCallback(() => {
    if (!currentPlaylist || currentPlaylist.tracks.length === 0) return null;

    const tracks = isShuffled 
      ? [...currentPlaylist.tracks].sort(() => Math.random() - 0.5)
      : currentPlaylist.tracks.sort((a, b) => a.position - b.position);

    if (repeatMode === 'one') {
      return tracks[currentTrackIndex]?.track_data || null;
    }

    const nextIndex = (currentTrackIndex + 1) % tracks.length;
    
    if (nextIndex === 0 && repeatMode === 'none') {
      return null; // End of playlist
    }

    setCurrentTrackIndex(nextIndex);
    return tracks[nextIndex]?.track_data || null;
  }, [currentPlaylist, currentTrackIndex, isShuffled, repeatMode]);

  const getPreviousTrack = useCallback(() => {
    if (!currentPlaylist || currentPlaylist.tracks.length === 0) return null;

    const tracks = isShuffled 
      ? [...currentPlaylist.tracks].sort(() => Math.random() - 0.5)
      : currentPlaylist.tracks.sort((a, b) => a.position - b.position);

    const prevIndex = currentTrackIndex === 0 
      ? tracks.length - 1 
      : currentTrackIndex - 1;

    setCurrentTrackIndex(prevIndex);
    return tracks[prevIndex]?.track_data || null;
  }, [currentPlaylist, currentTrackIndex, isShuffled]);

  // Load playlists on mount
  useEffect(() => {
    loadPlaylists();
  }, [loadPlaylists]);

  return {
    // State
    playlists,
    isLoading,
    currentPlaylist,
    currentTrackIndex,
    isShuffled,
    repeatMode,

    // Actions
    loadPlaylists,
    createPlaylist,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    deletePlaylist,
    setCurrentPlaylist,
    setCurrentTrackIndex,
    setIsShuffled,
    setRepeatMode,

    // Navigation
    getNextTrack,
    getPreviousTrack,
  };
};