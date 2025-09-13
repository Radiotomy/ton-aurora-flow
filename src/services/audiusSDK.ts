import { Audius } from '@audius/sdk';
import { supabase } from '@/integrations/supabase/client';
import { AudiusTrack, AudiusUser } from './audiusService';

export interface AudiusSDKConfig {
  apiKey?: string;
  apiSecret?: string;
  appName: string;
  endpoint?: string;
}

export interface TrackUploadData {
  title: string;
  description?: string;
  genre: string;
  mood?: string;
  tags?: string[];
  artwork?: File;
  audio: File;
  isrc?: string;
  iswc?: string;
  license?: string;
  is_unlisted?: boolean;
  field_visibility?: {
    genre?: boolean;
    mood?: boolean;
    tags?: boolean;
    share?: boolean;
    play_count?: boolean;
  };
}

export interface PlaylistUploadData {
  playlist_name: string;
  description?: string;
  is_private?: boolean;
  is_album?: boolean;
  artwork?: File;
}

export class AudiusSDKService {
  private static sdk: Audius | null = null;
  private static config: AudiusSDKConfig = {
    appName: 'AudioTon',
    endpoint: 'https://discoveryprovider.audius.co'
  };

  /**
   * Initialize the Audius SDK
   */
  static async initialize(): Promise<void> {
    try {
      // Get API credentials from Supabase secrets if available
      const { data: credentials } = await supabase.functions.invoke('get-audius-credentials');
      
      if (credentials?.apiKey && credentials?.apiSecret) {
        this.config.apiKey = credentials.apiKey;
        this.config.apiSecret = credentials.apiSecret;
      }

      this.sdk = new Audius({
        apiKey: this.config.apiKey,
        apiSecret: this.config.apiSecret,
        appName: this.config.appName,
        endpoint: this.config.endpoint
      });

      console.log('Audius SDK initialized successfully');
    } catch (error) {
      console.warn('Audius SDK initialization with credentials failed, using public access:', error);
      
      // Fallback to public access
      this.sdk = new Audius({
        appName: this.config.appName
      });
    }
  }

  /**
   * Get SDK instance, initializing if necessary
   */
  static async getSDK(): Promise<Audius> {
    if (!this.sdk) {
      await this.initialize();
    }
    return this.sdk!;
  }

  /**
   * Set OAuth token for authenticated requests
   */
  static async setOAuthToken(token: string): Promise<void> {
    const sdk = await this.getSDK();
    // Note: The actual SDK method may differ based on the latest SDK version
    if (sdk && 'setAuthToken' in sdk) {
      (sdk as any).setAuthToken(token);
    }
  }

  /**
   * Get trending tracks using SDK
   */
  static async getTrendingTracks(options: {
    genre?: string;
    limit?: number;
    offset?: number;
    time?: 'week' | 'month' | 'allTime';
  } = {}): Promise<{ tracks: AudiusTrack[]; hasMore: boolean }> {
    try {
      const sdk = await this.getSDK();
      const params = {
        limit: options.limit || 20,
        offset: options.offset || 0,
        time: options.time || 'week' as const,
        genre: options.genre
      };

      const response = await sdk.tracks.getTrendingTracks(params);
      
      return {
        tracks: response.data || [],
        hasMore: (response.data?.length || 0) === params.limit
      };
    } catch (error) {
      console.error('Error fetching trending tracks with SDK:', error);
      return { tracks: [], hasMore: false };
    }
  }

  /**
   * Search tracks using SDK
   */
  static async searchTracks(query: string, limit = 20): Promise<AudiusTrack[]> {
    if (!query.trim()) return [];
    
    try {
      const sdk = await this.getSDK();
      const response = await sdk.tracks.searchTracks({
        query: query.trim(),
        limit
      });
      
      return response.data || [];
    } catch (error) {
      console.error('Error searching tracks with SDK:', error);
      return [];
    }
  }

  /**
   * Get track by ID using SDK
   */
  static async getTrack(trackId: string): Promise<AudiusTrack | null> {
    try {
      const sdk = await this.getSDK();
      const response = await sdk.tracks.getTrack({
        trackId
      });
      
      return response.data || null;
    } catch (error) {
      console.error('Error fetching track with SDK:', error);
      return null;
    }
  }

  /**
   * Get user by ID using SDK
   */
  static async getUser(userId: string): Promise<AudiusUser | null> {
    try {
      const sdk = await this.getSDK();
      const response = await sdk.users.getUser({
        id: userId
      });
      
      return response.data || null;
    } catch (error) {
      console.error('Error fetching user with SDK:', error);
      return null;
    }
  }

  /**
   * Search users using SDK
   */
  static async searchUsers(query: string, limit = 20): Promise<AudiusUser[]> {
    if (!query.trim()) return [];
    
    try {
      const sdk = await this.getSDK();
      const response = await sdk.users.searchUsers({
        query: query.trim(),
        limit
      });
      
      return response.data || [];
    } catch (error) {
      console.error('Error searching users with SDK:', error);
      return [];
    }
  }

  /**
   * Get user's tracks using SDK
   */
  static async getUserTracks(userId: string, limit = 20): Promise<AudiusTrack[]> {
    try {
      const sdk = await this.getSDK();
      const response = await sdk.users.getUsersTracks({
        id: userId,
        limit
      });
      
      return response.data || [];
    } catch (error) {
      console.error('Error fetching user tracks with SDK:', error);
      return [];
    }
  }

  /**
   * Get user's playlists using SDK
   */
  static async getUserPlaylists(userId: string, limit = 20): Promise<any[]> {
    try {
      const sdk = await this.getSDK();
      const response = await sdk.users.getUsersPlaylists({
        id: userId,
        limit
      });
      
      return response.data || [];
    } catch (error) {
      console.error('Error fetching user playlists with SDK:', error);
      return [];
    }
  }

  /**
   * Upload track to Audius (requires authentication)
   */
  static async uploadTrack(trackData: TrackUploadData): Promise<{ trackId: string; txHash?: string }> {
    try {
      const sdk = await this.getSDK();
      
      // Convert File to Buffer for SDK upload
      const audioBuffer = await trackData.audio.arrayBuffer();
      const artworkBuffer = trackData.artwork ? await trackData.artwork.arrayBuffer() : undefined;

      const uploadData = {
        ...trackData,
        audio: Buffer.from(audioBuffer),
        artwork: artworkBuffer ? Buffer.from(artworkBuffer) : undefined
      };

      // Note: Actual upload method may vary based on SDK version
      const response = await (sdk as any).tracks.uploadTrack(uploadData);
      
      return {
        trackId: response.trackId,
        txHash: response.txHash
      };
    } catch (error) {
      console.error('Error uploading track:', error);
      throw new Error(`Failed to upload track: ${error}`);
    }
  }

  /**
   * Create playlist on Audius
   */
  static async createPlaylist(playlistData: PlaylistUploadData): Promise<{ playlistId: string }> {
    try {
      const sdk = await this.getSDK();
      
      const artworkBuffer = playlistData.artwork ? await playlistData.artwork.arrayBuffer() : undefined;

      const uploadData = {
        ...playlistData,
        artwork: artworkBuffer ? Buffer.from(artworkBuffer) : undefined
      };

      const response = await (sdk as any).playlists.createPlaylist(uploadData);
      
      return {
        playlistId: response.playlistId
      };
    } catch (error) {
      console.error('Error creating playlist:', error);
      throw new Error(`Failed to create playlist: ${error}`);
    }
  }

  /**
   * Follow user on Audius
   */
  static async followUser(userId: string): Promise<void> {
    try {
      const sdk = await this.getSDK();
      await (sdk as any).users.followUser({ userId });
    } catch (error) {
      console.error('Error following user:', error);
      throw new Error(`Failed to follow user: ${error}`);
    }
  }

  /**
   * Unfollow user on Audius
   */
  static async unfollowUser(userId: string): Promise<void> {
    try {
      const sdk = await this.getSDK();
      await (sdk as any).users.unfollowUser({ userId });
    } catch (error) {
      console.error('Error unfollowing user:', error);
      throw new Error(`Failed to unfollow user: ${error}`);
    }
  }

  /**
   * Favorite track on Audius
   */
  static async favoriteTrack(trackId: string): Promise<void> {
    try {
      const sdk = await this.getSDK();
      await (sdk as any).tracks.favoriteTrack({ trackId });
    } catch (error) {
      console.error('Error favoriting track:', error);
      throw new Error(`Failed to favorite track: ${error}`);
    }
  }

  /**
   * Unfavorite track on Audius
   */
  static async unfavoriteTrack(trackId: string): Promise<void> {
    try {
      const sdk = await this.getSDK();
      await (sdk as any).tracks.unfavoriteTrack({ trackId });
    } catch (error) {
      console.error('Error unfavoriting track:', error);
      throw new Error(`Failed to unfavorite track: ${error}`);
    }
  }

  /**
   * Repost track on Audius
   */
  static async repostTrack(trackId: string): Promise<void> {
    try {
      const sdk = await this.getSDK();
      await (sdk as any).tracks.repostTrack({ trackId });
    } catch (error) {
      console.error('Error reposting track:', error);
      throw new Error(`Failed to repost track: ${error}`);
    }
  }

  /**
   * Get stream URL for track
   */
  static async getStreamUrl(trackId: string): Promise<string> {
    try {
      const sdk = await this.getSDK();
      const response = await sdk.tracks.streamTrack({
        trackId
      });
      
      return response.url || `https://discoveryprovider.audius.co/v1/tracks/${trackId}/stream`;
    } catch (error) {
      console.error('Error getting stream URL:', error);
      return `https://discoveryprovider.audius.co/v1/tracks/${trackId}/stream`;
    }
  }
}