import { supabase } from '@/integrations/supabase/client';
import { logError, logInfo } from '@/utils/secureLogger';

export interface AudiusTrack {
  id: string;
  title: string;
  permalink: string;
  user: {
    id: string;
    handle: string;
    name: string;
  };
  artwork?: {
    '150x150'?: string;
    '480x480'?: string;
    '1000x1000'?: string;
  };
  duration: number;
  genre: string;
  play_count: number;
  favorite_count: number;
  repost_count: number;
  stream_url?: string;
}

export interface AudiusUser {
  id: string;
  handle: string;
  name: string;
  bio?: string;
  location?: string;
  profile_picture?: {
    '150x150'?: string;
    '480x480'?: string;
    '1000x1000'?: string;
  };
  follower_count: number;
  following_count: number;
  track_count: number;
  verified: boolean;
}

/**
 * Audius SDK Service - All API calls are proxied through secure edge functions
 * to prevent API key exposure in client-side code
 */
export class AudiusSDKService {
  /**
   * Get trending tracks from Audius via edge function
   */
  static async getTrendingTracks(limit: number = 10): Promise<AudiusTrack[]> {
    try {
      const { data, error } = await supabase.functions.invoke('audius-api', {
        body: { path: 'trending-tracks', limit }
      });
      
      if (error) {
        logError('AudiusSDK.getTrendingTracks', 'Edge function error');
        return [];
      }
      
      return data?.tracks || [];
    } catch (error) {
      logError('AudiusSDK.getTrendingTracks', 'Failed to fetch trending tracks');
      return [];
    }
  }

  /**
   * Search tracks on Audius via edge function
   */
  static async searchTracks(query: string, limit: number = 20): Promise<AudiusTrack[]> {
    try {
      const { data, error } = await supabase.functions.invoke('audius-api', {
        body: { path: 'search-tracks', query, limit }
      });
      
      if (error) {
        logError('AudiusSDK.searchTracks', 'Edge function error');
        return [];
      }
      
      return data?.tracks || [];
    } catch (error) {
      logError('AudiusSDK.searchTracks', 'Failed to search tracks');
      return [];
    }
  }

  /**
   * Get track by ID via edge function
   */
  static async getTrack(trackId: string): Promise<AudiusTrack | null> {
    try {
      const { data, error } = await supabase.functions.invoke('audius-api', {
        body: { path: `track/${trackId}` }
      });
      
      if (error) {
        logError('AudiusSDK.getTrack', 'Edge function error');
        return null;
      }
      
      return data?.track || null;
    } catch (error) {
      logError('AudiusSDK.getTrack', 'Failed to fetch track');
      return null;
    }
  }

  /**
   * Get user by ID via edge function
   */
  static async getUser(userId: string): Promise<AudiusUser | null> {
    try {
      const { data, error } = await supabase.functions.invoke('audius-api', {
        body: { path: `user/${userId}` }
      });
      
      if (error) {
        logError('AudiusSDK.getUser', 'Edge function error');
        return null;
      }
      
      return data?.user || null;
    } catch (error) {
      logError('AudiusSDK.getUser', 'Failed to fetch user');
      return null;
    }
  }

  /**
   * Get user tracks via edge function
   */
  static async getUserTracks(userId: string, limit: number = 20): Promise<AudiusTrack[]> {
    try {
      const { data, error } = await supabase.functions.invoke('audius-api', {
        body: { path: `user/${userId}/tracks`, limit }
      });
      
      if (error) {
        logError('AudiusSDK.getUserTracks', 'Edge function error');
        return [];
      }
      
      return data?.tracks || [];
    } catch (error) {
      logError('AudiusSDK.getUserTracks', 'Failed to fetch user tracks');
      return [];
    }
  }

  /**
   * Upload track to Audius (requires authentication)
   */
  static async uploadTrack(
    trackData: {
      title: string;
      description?: string;
      genre: string;
      mood?: string;
      tags?: string;
      trackFile: File;
      coverArtFile?: File;
    },
    authToken?: string
  ): Promise<{ trackId: string } | null> {
    try {
      if (!authToken) {
        throw new Error('Authentication required for track upload');
      }

      // Use Supabase edge function for authenticated upload
      const { data, error } = await supabase.functions.invoke('audius-track-upload', {
        body: {
          title: trackData.title,
          description: trackData.description,
          genre: trackData.genre,
          mood: trackData.mood,
          tags: trackData.tags,
          token: authToken,
        },
      });

      if (error || !data?.success) {
        logError('AudiusSDK.uploadTrack', 'Track upload failed');
        return null;
      }

      return { trackId: data.trackId };
    } catch (error) {
      logError('AudiusSDK.uploadTrack', 'Failed to upload track');
      return null;
    }
  }

  /**
   * Create playlist on Audius
   */
  static async createPlaylist(
    playlistData: {
      name: string;
      description?: string;
      is_private?: boolean;
      track_ids?: string[];
    },
    authToken?: string
  ): Promise<{ playlistId: string } | null> {
    try {
      if (!authToken) {
        throw new Error('Authentication required for playlist creation');
      }

      const { data, error } = await supabase.functions.invoke('audius-playlist-create', {
        body: {
          ...playlistData,
          token: authToken,
        },
      });

      if (error || !data?.success) {
        logError('AudiusSDK.createPlaylist', 'Playlist creation failed');
        return null;
      }

      return { playlistId: data.playlistId };
    } catch (error) {
      logError('AudiusSDK.createPlaylist', 'Failed to create playlist');
      return null;
    }
  }

  /**
   * Follow/unfollow user on Audius
   */
  static async toggleUserFollow(
    userId: string, 
    action: 'follow' | 'unfollow',
    authToken?: string
  ): Promise<boolean> {
    try {
      if (!authToken) {
        throw new Error('Authentication required for follow actions');
      }

      const { data, error } = await supabase.functions.invoke('audius-user-follow', {
        body: {
          userId,
          action,
          token: authToken,
        },
      });

      if (error || !data?.success) {
        logError('AudiusSDK.toggleUserFollow', 'Follow action failed');
        return false;
      }

      return true;
    } catch (error) {
      logError('AudiusSDK.toggleUserFollow', 'Failed to toggle follow');
      return false;
    }
  }

  /**
   * Favorite/unfavorite track on Audius
   */
  static async toggleTrackFavorite(
    trackId: string,
    action: 'favorite' | 'unfavorite', 
    authToken?: string
  ): Promise<boolean> {
    try {
      if (!authToken) {
        throw new Error('Authentication required for favorite actions');
      }

      const { data, error } = await supabase.functions.invoke('audius-track-favorite', {
        body: {
          trackId,
          action,
          token: authToken,
        },
      });

      if (error || !data?.success) {
        logError('AudiusSDK.toggleTrackFavorite', 'Favorite action failed');
        return false;
      }

      return true;
    } catch (error) {
      logError('AudiusSDK.toggleTrackFavorite', 'Failed to toggle favorite');
      return false;
    }
  }

  /**
   * Sync Audius profile with AudioTon profile
   */
  static async syncAudiusProfile(audiusUserId: string, profileId: string): Promise<void> {
    try {
      const audiusUser = await this.getUser(audiusUserId);
      if (!audiusUser) return;

      // Update local profile with Audius data
      await supabase
        .from('profiles')
        .update({
          display_name: audiusUser.name,
          bio: audiusUser.bio,
          avatar_url: audiusUser.profile_picture?.['480x480'] || audiusUser.profile_picture?.['150x150']
        })
        .eq('id', profileId);

      logInfo('AudiusSDK.syncAudiusProfile', 'Profile sync completed');
    } catch (error) {
      logError('AudiusSDK.syncAudiusProfile', 'Failed to sync profile');
    }
  }

  /**
   * Get track stream URL via edge function
   */
  static async getTrackStreamUrl(trackId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase.functions.invoke('audius-api', {
        body: { path: `stream-url/${trackId}` }
      });
      
      if (error) {
        logError('AudiusSDK.getTrackStreamUrl', 'Edge function error');
        return null;
      }
      
      return data?.streamUrl || null;
    } catch (error) {
      logError('AudiusSDK.getTrackStreamUrl', 'Failed to get stream URL');
      return null;
    }
  }
}
