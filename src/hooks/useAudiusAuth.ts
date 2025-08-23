import { useState, useEffect, useCallback } from 'react';
import { AudiusAuthService, AudiusUserProfile, AudiusPlaylist } from '@/services/audiusAuthService';
import { AudiusTrack, AudiusUser } from '@/services/audiusService';
import { toast } from '@/hooks/use-toast';

export const useAudiusAuth = () => {
  const [user, setUser] = useState<AudiusUserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored user and token
    const token = AudiusAuthService.getAuthToken();
    const storedUser = AudiusAuthService.getStoredUser();
    
    if (token && storedUser) {
      setUser(storedUser);
      setIsAuthenticated(true);
    }
    
    setLoading(false);
  }, []);

  const login = useCallback(() => {
    try {
      AudiusAuthService.initiateOAuth();
    } catch (error) {
      toast({
        title: "Login Failed",
        description: "Failed to start Audius login process",
        variant: "destructive",
      });
    }
  }, []);

  const logout = useCallback(() => {
    AudiusAuthService.clearAuth();
    setUser(null);
    setIsAuthenticated(false);
    toast({
      title: "Logged Out",
      description: "Successfully logged out of Audius",
    });
  }, []);

  const handleOAuthCallback = useCallback(async (code: string, state: string) => {
    try {
      setLoading(true);
      const userProfile = await AudiusAuthService.handleOAuthCallback(code, state);
      setUser(userProfile);
      setIsAuthenticated(true);
      toast({
        title: "Login Successful",
        description: `Welcome back, ${userProfile.name}!`,
      });
      return userProfile;
    } catch (error) {
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : "Failed to complete login",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const userProfile = await AudiusAuthService.getCurrentUser();
      setUser(userProfile);
      AudiusAuthService.setStoredUser(userProfile);
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  }, [isAuthenticated]);

  return {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    handleOAuthCallback,
    refreshUser,
  };
};

export const useAudiusSocialFeatures = () => {
  const [loading, setLoading] = useState(false);

  const followUser = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      await AudiusAuthService.followUser(userId);
      toast({
        title: "Following",
        description: "Successfully followed user",
      });
    } catch (error) {
      toast({
        title: "Follow Failed",
        description: error instanceof Error ? error.message : "Failed to follow user",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const unfollowUser = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      await AudiusAuthService.unfollowUser(userId);
      toast({
        title: "Unfollowed",
        description: "Successfully unfollowed user",
      });
    } catch (error) {
      toast({
        title: "Unfollow Failed",
        description: error instanceof Error ? error.message : "Failed to unfollow user",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const favoriteTrack = useCallback(async (trackId: string) => {
    try {
      setLoading(true);
      await AudiusAuthService.favoriteTrack(trackId);
      toast({
        title: "Favorited",
        description: "Track added to favorites",
      });
    } catch (error) {
      toast({
        title: "Favorite Failed",
        description: error instanceof Error ? error.message : "Failed to favorite track",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const unfavoriteTrack = useCallback(async (trackId: string) => {
    try {
      setLoading(true);
      await AudiusAuthService.unfavoriteTrack(trackId);
      toast({
        title: "Removed from Favorites",
        description: "Track removed from favorites",
      });
    } catch (error) {
      toast({
        title: "Unfavorite Failed",
        description: error instanceof Error ? error.message : "Failed to unfavorite track",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const repostTrack = useCallback(async (trackId: string) => {
    try {
      setLoading(true);
      await AudiusAuthService.repostTrack(trackId);
      toast({
        title: "Reposted",
        description: "Track reposted to your profile",
      });
    } catch (error) {
      toast({
        title: "Repost Failed",
        description: error instanceof Error ? error.message : "Failed to repost track",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const unrepostTrack = useCallback(async (trackId: string) => {
    try {
      setLoading(true);
      await AudiusAuthService.unrepostTrack(trackId);
      toast({
        title: "Repost Removed",
        description: "Track repost removed from your profile",
      });
    } catch (error) {
      toast({
        title: "Unrepost Failed",
        description: error instanceof Error ? error.message : "Failed to unrepost track",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    followUser,
    unfollowUser,
    favoriteTrack,
    unfavoriteTrack,
    repostTrack,
    unrepostTrack,
  };
};

export const useAudiusUserData = (userId?: string) => {
  const [favorites, setFavorites] = useState<AudiusTrack[]>([]);
  const [reposts, setReposts] = useState<AudiusTrack[]>([]);
  const [playlists, setPlaylists] = useState<AudiusPlaylist[]>([]);
  const [following, setFollowing] = useState<AudiusUser[]>([]);
  const [followers, setFollowers] = useState<AudiusUser[]>([]);
  const [feed, setFeed] = useState<AudiusTrack[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFavorites = useCallback(async () => {
    try {
      setLoading(true);
      const data = await AudiusAuthService.getUserFavorites(userId);
      setFavorites(data);
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const fetchReposts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await AudiusAuthService.getUserReposts(userId);
      setReposts(data);
    } catch (error) {
      console.error('Failed to fetch reposts:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const fetchPlaylists = useCallback(async () => {
    try {
      setLoading(true);
      const data = await AudiusAuthService.getUserPlaylists(userId);
      setPlaylists(data);
    } catch (error) {
      console.error('Failed to fetch playlists:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const fetchFollowing = useCallback(async () => {
    try {
      setLoading(true);
      const data = await AudiusAuthService.getUserFollowing(userId);
      setFollowing(data);
    } catch (error) {
      console.error('Failed to fetch following:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const fetchFollowers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await AudiusAuthService.getUserFollowers(userId);
      setFollowers(data);
    } catch (error) {
      console.error('Failed to fetch followers:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const fetchFeed = useCallback(async () => {
    try {
      setLoading(true);
      const data = await AudiusAuthService.getUserFeed();
      setFeed(data);
    } catch (error) {
      console.error('Failed to fetch feed:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    favorites,
    reposts,
    playlists,
    following,
    followers,
    feed,
    loading,
    fetchFavorites,
    fetchReposts,
    fetchPlaylists,
    fetchFollowing,
    fetchFollowers,
    fetchFeed,
  };
};

export const useAudiusPlaylistManagement = () => {
  const [loading, setLoading] = useState(false);

  const createPlaylist = useCallback(async (data: {
    name: string;
    description?: string;
    is_private?: boolean;
  }) => {
    try {
      setLoading(true);
      const playlist = await AudiusAuthService.createPlaylist(data);
      toast({
        title: "Playlist Created",
        description: `"${data.name}" playlist created successfully`,
      });
      return playlist;
    } catch (error) {
      toast({
        title: "Creation Failed",
        description: error instanceof Error ? error.message : "Failed to create playlist",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePlaylist = useCallback(async (playlistId: string, data: {
    name?: string;
    description?: string;
    is_private?: boolean;
  }) => {
    try {
      setLoading(true);
      const playlist = await AudiusAuthService.updatePlaylist(playlistId, data);
      toast({
        title: "Playlist Updated",
        description: "Playlist updated successfully",
      });
      return playlist;
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update playlist",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const addTrackToPlaylist = useCallback(async (playlistId: string, trackId: string) => {
    try {
      setLoading(true);
      await AudiusAuthService.addTrackToPlaylist(playlistId, trackId);
      toast({
        title: "Track Added",
        description: "Track added to playlist",
      });
    } catch (error) {
      toast({
        title: "Failed to Add Track",
        description: error instanceof Error ? error.message : "Failed to add track to playlist",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const removeTrackFromPlaylist = useCallback(async (playlistId: string, trackId: string) => {
    try {
      setLoading(true);
      await AudiusAuthService.removeTrackFromPlaylist(playlistId, trackId);
      toast({
        title: "Track Removed",
        description: "Track removed from playlist",
      });
    } catch (error) {
      toast({
        title: "Failed to Remove Track",
        description: error instanceof Error ? error.message : "Failed to remove track from playlist",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const deletePlaylist = useCallback(async (playlistId: string) => {
    try {
      setLoading(true);
      await AudiusAuthService.deletePlaylist(playlistId);
      toast({
        title: "Playlist Deleted",
        description: "Playlist deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Deletion Failed",
        description: error instanceof Error ? error.message : "Failed to delete playlist",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    createPlaylist,
    updatePlaylist,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    deletePlaylist,
  };
};