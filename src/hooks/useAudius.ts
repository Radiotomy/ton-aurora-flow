import { useState, useEffect, useCallback } from 'react';
import { AudiusService, AudiusTrack, AudiusUser } from '@/services/audiusService';
import { toast } from '@/hooks/use-toast';

export const useAudiusTracks = (genre?: string, autoFetch = true) => {
  const [tracks, setTracks] = useState<AudiusTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTracks = useCallback(async () => {
    if (!autoFetch) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await AudiusService.getTrendingTracks(genre, 20);
      setTracks(data);
    } catch (err) {
      const errorMessage = 'Failed to fetch tracks from Audius';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [genre, autoFetch]);

  const refreshTracks = useCallback(() => {
    fetchTracks();
  }, [fetchTracks]);

  useEffect(() => {
    fetchTracks();
  }, [fetchTracks]);

  return {
    tracks,
    loading,
    error,
    refreshTracks,
  };
};

export const useAudiusSearch = () => {
  const [tracks, setTracks] = useState<AudiusTrack[]>([]);
  const [users, setUsers] = useState<AudiusUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchTracks = useCallback(async (query: string) => {
    if (!query.trim()) {
      setTracks([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await AudiusService.searchTracks(query);
      setTracks(data);
    } catch (err) {
      const errorMessage = 'Search failed';
      setError(errorMessage);
      toast({
        title: "Search Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const searchUsers = useCallback(async (query: string) => {
    if (!query.trim()) {
      setUsers([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await AudiusService.searchUsers(query);
      setUsers(data);
    } catch (err) {
      const errorMessage = 'User search failed';
      setError(errorMessage);
      toast({
        title: "Search Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setTracks([]);
    setUsers([]);
    setError(null);
  }, []);

  return {
    tracks,
    users,
    loading,
    error,
    searchTracks,
    searchUsers,
    clearResults,
  };
};

export const useAudiusUser = (userId?: string) => {
  const [user, setUser] = useState<AudiusUser | null>(null);
  const [userTracks, setUserTracks] = useState<AudiusTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const [userData, tracksData] = await Promise.all([
        AudiusService.getUser(id),
        AudiusService.getUserTracks(id),
      ]);
      
      setUser(userData);
      setUserTracks(tracksData);
    } catch (err) {
      const errorMessage = 'Failed to fetch user data';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userId) {
      fetchUser(userId);
    }
  }, [userId, fetchUser]);

  return {
    user,
    userTracks,
    loading,
    error,
    fetchUser,
  };
};

export const useAudiusTrack = (trackId?: string) => {
  const [track, setTrack] = useState<AudiusTrack | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTrack = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const data = await AudiusService.getTrack(id);
      setTrack(data);
    } catch (err) {
      const errorMessage = 'Failed to fetch track';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (trackId) {
      fetchTrack(trackId);
    }
  }, [trackId, fetchTrack]);

  return {
    track,
    loading,
    error,
    fetchTrack,
  };
};