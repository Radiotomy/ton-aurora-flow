import { sdk } from '@audius/sdk';
import { supabase } from '@/integrations/supabase/client';

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

export class AudiusSDKService {
  private static sdkInstance: any = null;

  /**
   * Initialize Audius SDK
   */
  private static async getSDK() {
    if (!this.sdkInstance) {
      this.sdkInstance = sdk({
        apiKey: process.env.AUDIUS_API_KEY,
        apiSecret: process.env.AUDIUS_API_SECRET,
        appName: 'AudioTon'
      });
    }
    return this.sdkInstance;
  }

  /**
   * Get trending tracks from Audius
   */
  static async getTrendingTracks(limit: number = 10): Promise<AudiusTrack[]> {
    try {
      const audiusSdk = await this.getSDK();
      const response = await audiusSdk.tracks.getTrendingTracks({
        limit,
        time: 'week'
      });
      
      return response.data || [];
    } catch (error) {
      console.error('Error fetching trending tracks:', error);
      return [];
    }
  }

  /**
   * Search tracks on Audius
   */
  static async searchTracks(query: string, limit: number = 20): Promise<AudiusTrack[]> {
    try {
      const audiusSdk = await this.getSDK();
      const response = await audiusSdk.tracks.searchTracks({
        query,
        limit
      });
      
      return response.data || [];
    } catch (error) {
      console.error('Error searching tracks:', error);
      return [];
    }
  }

  /**
   * Get track by ID
   */
  static async getTrack(trackId: string): Promise<AudiusTrack | null> {
    try {
      const audiusSdk = await this.getSDK();
      const response = await audiusSdk.tracks.getTrack({
        trackId
      });
      
      return response.data || null;
    } catch (error) {
      console.error('Error fetching track:', error);
      return null;
    }
  }

  /**
   * Get user by ID
   */
  static async getUser(userId: string): Promise<AudiusUser | null> {
    try {
      const audiusSdk = await this.getSDK();
      const response = await audiusSdk.users.getUser({
        id: userId
      });
      
      return response.data || null;
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  }

  /**
   * Get user tracks
   */
  static async getUserTracks(userId: string, limit: number = 20): Promise<AudiusTrack[]> {
    try {
      const audiusSdk = await this.getSDK();
      const response = await audiusSdk.users.getUsersTracks({
        id: userId,
        limit
      });
      
      return response.data || [];
    } catch (error) {
      console.error('Error fetching user tracks:', error);
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
    }
  ): Promise<{ trackId: string } | null> {
    try {
      // This would require OAuth authentication
      // For now, return a placeholder
      console.log('Track upload functionality requires OAuth implementation');
      return { trackId: `placeholder_${Date.now()}` };
    } catch (error) {
      console.error('Error uploading track:', error);
      return null;
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

      // Store Audius sync data (when tables are available)
      console.log('Audius profile sync completed for:', audiusUser.handle);
    } catch (error) {
      console.error('Error syncing Audius profile:', error);
    }
  }

  /**
   * Get track stream URL
   */
  static async getTrackStreamUrl(trackId: string): Promise<string | null> {
    try {
      const audiusSdk = await this.getSDK();
      const response = await audiusSdk.tracks.streamTrack({
        trackId
      });
      
      return response.data || null;
    } catch (error) {
      console.error('Error getting track stream URL:', error);
      return null;
    }
  }
}