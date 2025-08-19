import { useState, useCallback, useEffect } from 'react';
import { AudiusTrack } from '@/services/audiusService';
import { TonStorageService, StoredPlaylist, PlaylistMetadata } from '@/services/tonStorageService';
import { useWeb3 } from '@/hooks/useWeb3';
import { toast } from '@/hooks/use-toast';

// Re-export types for convenience
export type { StoredPlaylist } from '@/services/tonStorageService';

export interface LocalPlaylist {
  id: string;
  name: string;
  description?: string;
  cover_url?: string;
  tracks: AudiusTrack[];
  created_at: number;
  updated_at: number;
  is_public: boolean;
  storage_type: 'local' | 'ton' | 'audius';
}

export interface CreatePlaylistData {
  name: string;
  description?: string;
  cover_url?: string;
  is_public?: boolean;
  tracks?: AudiusTrack[];
}

/**
 * Hybrid playlist hook supporting both free users (browser storage) 
 * and Web3 users (TON Storage)
 */
export const usePlaylist = () => {
  const [playlists, setPlaylists] = useState<(LocalPlaylist | StoredPlaylist)[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { isConnected, walletAddress } = useWeb3();

  // Load playlists on mount and wallet changes
  useEffect(() => {
    loadPlaylists();
  }, [isConnected, walletAddress]);

  /**
   * Load playlists from appropriate storage based on wallet connection
   */
  const loadPlaylists = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let loadedPlaylists: (LocalPlaylist | StoredPlaylist)[] = [];

      if (isConnected && walletAddress) {
        // Load Web3 playlists from TON Storage
        const tonPlaylists = await TonStorageService.getUserPlaylists(walletAddress);
        loadedPlaylists = [...loadedPlaylists, ...tonPlaylists];
      }

      // Always load local playlists for free tier
      const localPlaylists = getLocalPlaylists();
      loadedPlaylists = [...loadedPlaylists, ...localPlaylists];

      setPlaylists(loadedPlaylists);
    } catch (err) {
      const errorMsg = 'Failed to load playlists';
      setError(errorMsg);
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [isConnected, walletAddress]);

  /**
   * Create a new playlist
   */
  const createPlaylist = useCallback(async (data: CreatePlaylistData): Promise<LocalPlaylist | StoredPlaylist | null> => {
    setLoading(true);
    
    try {
      let newPlaylist: LocalPlaylist | StoredPlaylist;

      if (isConnected && walletAddress) {
        // Create Web3 playlist on TON Storage
        const tonPlaylist = await TonStorageService.storePlaylist({
          name: data.name,
          description: data.description,
          cover_url: data.cover_url,
          tracks: data.tracks || [],
          is_public: data.is_public || false,
          owner_address: walletAddress,
        }, walletAddress);

        newPlaylist = tonPlaylist;
        
        toast({
          title: "Web3 Playlist Created",
          description: `"${data.name}" stored on TON blockchain`,
        });
      } else {
        // Create local playlist for free users
        const localPlaylist: LocalPlaylist = {
          id: generateLocalPlaylistId(),
          name: data.name,
          description: data.description,
          cover_url: data.cover_url,
          tracks: data.tracks || [],
          created_at: Date.now(),
          updated_at: Date.now(),
          is_public: data.is_public || false,
          storage_type: 'local',
        };

        saveLocalPlaylist(localPlaylist);
        newPlaylist = localPlaylist;
        
        toast({
          title: "Playlist Created",
          description: `"${data.name}" saved locally. Connect wallet to save permanently.`,
        });
      }

      // Update state
      setPlaylists(prev => [newPlaylist, ...prev]);
      return newPlaylist;
    } catch (err) {
      const errorMsg = 'Failed to create playlist';
      setError(errorMsg);
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [isConnected, walletAddress]);

  /**
   * Update existing playlist
   */
  const updatePlaylist = useCallback(async (
    playlistId: string, 
    updates: Partial<CreatePlaylistData>
  ): Promise<boolean> => {
    setLoading(true);
    
    try {
      const existingPlaylist = playlists.find(p => p.id === playlistId);
      if (!existingPlaylist) {
        throw new Error('Playlist not found');
      }

      // Check if it's a TON playlist
      if ('metadata' in existingPlaylist) {
        if (!isConnected || !walletAddress) {
          throw new Error('Wallet not connected');
        }

        const updatedPlaylist = await TonStorageService.updatePlaylist(
          playlistId,
          updates,
          walletAddress
        );

        if (updatedPlaylist) {
          setPlaylists(prev => prev.map(p => 
            p.id === playlistId ? updatedPlaylist : p
          ));
          
          toast({
            title: "Web3 Playlist Updated",
            description: "Changes saved to blockchain",
          });
        }
      } else {
        // Update local playlist
        const updatedLocalPlaylist: LocalPlaylist = {
          ...existingPlaylist,
          ...updates,
          updated_at: Date.now(),
        };

        saveLocalPlaylist(updatedLocalPlaylist);
        setPlaylists(prev => prev.map(p => 
          p.id === playlistId ? updatedLocalPlaylist : p
        ));
        
        toast({
          title: "Playlist Updated",
          description: "Changes saved locally",
        });
      }

      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update playlist';
      setError(errorMsg);
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [playlists, isConnected, walletAddress]);

  /**
   * Delete playlist
   */
  const deletePlaylist = useCallback(async (playlistId: string): Promise<boolean> => {
    setLoading(true);
    
    try {
      const existingPlaylist = playlists.find(p => p.id === playlistId);
      if (!existingPlaylist) {
        throw new Error('Playlist not found');
      }

      // Check if it's a TON playlist
      if ('metadata' in existingPlaylist) {
        if (!isConnected || !walletAddress) {
          throw new Error('Wallet not connected');
        }

        await TonStorageService.deletePlaylist(playlistId, walletAddress);
        
        toast({
          title: "Web3 Playlist Deleted",
          description: "Removed from blockchain",
        });
      } else {
        // Delete local playlist
        removeLocalPlaylist(playlistId);
        
        toast({
          title: "Playlist Deleted",
          description: "Removed from local storage",
        });
      }

      setPlaylists(prev => prev.filter(p => p.id !== playlistId));
      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete playlist';
      setError(errorMsg);
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [playlists, isConnected, walletAddress]);

  /**
   * Add track to playlist
   */
  const addTrackToPlaylist = useCallback(async (playlistId: string, track: AudiusTrack): Promise<boolean> => {
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) return false;

    const currentTracks = 'metadata' in playlist ? playlist.metadata.tracks : playlist.tracks;
    
    // Check if track already exists
    if (currentTracks.some(t => t.id === track.id)) {
      toast({
        title: "Track Already Added",
        description: "This track is already in the playlist",
        variant: "destructive",
      });
      return false;
    }

    const newTracks = [...currentTracks, track];
    return await updatePlaylist(playlistId, { tracks: newTracks });
  }, [playlists, updatePlaylist]);

  /**
   * Remove track from playlist
   */
  const removeTrackFromPlaylist = useCallback(async (playlistId: string, trackId: string): Promise<boolean> => {
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) return false;

    const currentTracks = 'metadata' in playlist ? playlist.metadata.tracks : playlist.tracks;
    const newTracks = currentTracks.filter(t => t.id !== trackId);
    
    return await updatePlaylist(playlistId, { tracks: newTracks });
  }, [playlists, updatePlaylist]);

  /**
   * Get public playlists for discovery
   */
  const getPublicPlaylists = useCallback(async (): Promise<(LocalPlaylist | StoredPlaylist)[]> => {
    try {
      const tonPlaylists = await TonStorageService.getPublicPlaylists();
      const localPublicPlaylists = getLocalPlaylists().filter(p => p.is_public);
      
      return [...tonPlaylists, ...localPublicPlaylists];
    } catch (error) {
      console.error('Error fetching public playlists:', error);
      return [];
    }
  }, []);

  /**
   * Migrate local playlist to Web3 (when user connects wallet)
   */
  const migrateToWeb3 = useCallback(async (localPlaylistId: string): Promise<boolean> => {
    if (!isConnected || !walletAddress) {
      toast({
        title: "Wallet Required",
        description: "Connect your wallet to migrate playlist to blockchain",
        variant: "destructive",
      });
      return false;
    }

    const localPlaylist = playlists.find(p => 
      p.id === localPlaylistId && !('metadata' in p)
    ) as LocalPlaylist;

    if (!localPlaylist) return false;

    try {
      // Create on TON Storage
      const tonPlaylist = await TonStorageService.storePlaylist({
        name: localPlaylist.name,
        description: localPlaylist.description,
        cover_url: localPlaylist.cover_url,
        tracks: localPlaylist.tracks,
        is_public: localPlaylist.is_public,
        owner_address: walletAddress,
      }, walletAddress);

      // Remove local version
      removeLocalPlaylist(localPlaylistId);

      // Update state
      setPlaylists(prev => prev.map(p => 
        p.id === localPlaylistId ? tonPlaylist : p
      ));

      toast({
        title: "Migration Successful",
        description: "Playlist moved to blockchain storage",
      });

      return true;
    } catch (error) {
      console.error('Migration error:', error);
      toast({
        title: "Migration Failed",
        description: "Could not move playlist to blockchain",
        variant: "destructive",
      });
      return false;
    }
  }, [playlists, isConnected, walletAddress]);

  return {
    playlists,
    loading,
    error,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    loadPlaylists,
    getPublicPlaylists,
    migrateToWeb3,
  };
};

// Helper functions for local storage
function generateLocalPlaylistId(): string {
  return `local_playlist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function saveLocalPlaylist(playlist: LocalPlaylist): void {
  const key = `local_playlist_${playlist.id}`;
  localStorage.setItem(key, JSON.stringify(playlist));
}

function getLocalPlaylists(): LocalPlaylist[] {
  const playlists: LocalPlaylist[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('local_playlist_')) {
      const stored = localStorage.getItem(key);
      if (stored) {
        try {
          playlists.push(JSON.parse(stored));
        } catch (error) {
          console.error('Error parsing local playlist:', error);
        }
      }
    }
  }
  
  return playlists.sort((a, b) => b.updated_at - a.updated_at);
}

function removeLocalPlaylist(playlistId: string): void {
  const key = `local_playlist_${playlistId}`;
  localStorage.removeItem(key);
}