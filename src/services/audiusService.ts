// Real Audius service using Supabase Edge Function
import { supabase } from '@/integrations/supabase/client';

export interface AudiusTrack {
  id: string;
  title: string;
  user: {
    id: string;
    name: string;
    handle: string;
    profile_picture?: {
      '150x150'?: string;
      '480x480'?: string;
      '1000x1000'?: string;
    };
  };
  artwork?: {
    '150x150'?: string;
    '480x480'?: string;
    '1000x1000'?: string;
  };
  genre: string;
  mood?: string;
  duration: number;
  play_count?: number;
  favorite_count?: number;
  repost_count?: number;
  description?: string;
  tags?: string;
  created_at?: string;
  permalink?: string;
  stream_url?: string;
}

export interface AudiusUser {
  id: string;
  name: string;
  handle: string;
  bio?: string;
  location?: string;
  profile_picture?: {
    '150x150'?: string;
    '480x480'?: string;
    '1000x1000'?: string;
  };
  cover_photo?: {
    '640x': string;
    '2000x': string;
  };
  follower_count?: number;
  followee_count?: number;
  track_count?: number;
  playlist_count?: number;
  verified?: boolean;
}

export class AudiusService {
  /**
   * Helper method to call our Audius Edge Function
   */
  private static async callAudiusAPI(endpoint: string, params?: Record<string, string>) {
    try {
      const queryParams = new URLSearchParams(params);
      const url = `${endpoint}${params ? `?${queryParams}` : ''}`;
      
      const { data, error } = await supabase.functions.invoke('audius-api', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        body: { path: url }
      });

      if (error) {
        console.error('Audius API error:', error);
        throw new Error(error.message || 'Failed to fetch from Audius API');
      }

      if (!data.success) {
        throw new Error(data.error || 'Audius API request failed');
      }

      return data;
    } catch (error) {
      console.error('Error calling Audius API:', error);
      throw error;
    }
  }

  /**
   * Direct fetch to edge function (alternative approach)
   */
  private static async fetchFromEdgeFunction(endpoint: string) {
    try {
      const response = await fetch(`https://cpjjaglmqvcwpzrdoyul.supabase.co/functions/v1/audius-api${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Audius API request failed');
      }

      return data;
    } catch (error) {
      console.error('Error fetching from edge function:', error);
      throw error;
    }
  }

  /**
   * Get trending tracks with pagination and time filtering
   */
  static async getTrendingTracks(
    genre?: string, 
    limit = 20, 
    offset = 0, 
    time: 'week' | 'month' | 'allTime' = 'week',
    sortMethod?: string
  ): Promise<{ tracks: AudiusTrack[]; hasMore: boolean; offset: number; limit: number }> {
    try {
      const params = new URLSearchParams({ 
        limit: limit.toString(),
        offset: offset.toString(),
        time: time
      });
      
      if (genre && genre !== 'all') {
        params.append('genre', genre);
      }
      
      if (sortMethod) {
        params.append('sort_method', sortMethod);
      }

      const data = await this.fetchFromEdgeFunction(`/trending-tracks?${params}`);
      return {
        tracks: data.tracks || [],
        hasMore: data.hasMore || false,
        offset: data.offset || offset,
        limit: data.limit || limit
      };
    } catch (error) {
      console.error('Error fetching trending tracks:', error);
      // Return empty result on error instead of throwing
      return {
        tracks: [],
        hasMore: false,
        offset: 0,
        limit: limit
      };
    }
  }

  /**
   * Search tracks
   */
  static async searchTracks(query: string, limit = 20): Promise<AudiusTrack[]> {
    if (!query.trim()) return [];
    
    try {
      const params = new URLSearchParams({ 
        query: query.trim(),
        limit: limit.toString() 
      });

      const data = await this.fetchFromEdgeFunction(`/search-tracks?${params}`);
      return data.tracks || [];
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
      const data = await this.fetchFromEdgeFunction(`/track/${trackId}`);
      return data.track || null;
    } catch (error) {
      console.error('Error fetching track:', error);
      return null;
    }
  }

  /**
   * Get tracks by user
   */
  static async getUserTracks(userId: string, limit = 20): Promise<AudiusTrack[]> {
    try {
      const params = new URLSearchParams({ limit: limit.toString() });
      const data = await this.fetchFromEdgeFunction(`/user/${userId}/tracks?${params}`);
      return data.tracks || [];
    } catch (error) {
      console.error('Error fetching user tracks:', error);
      return [];
    }
  }

  /**
   * Get user profile
   */
  static async getUser(userId: string): Promise<AudiusUser | null> {
    try {
      const data = await this.fetchFromEdgeFunction(`/user/${userId}`);
      return data.user || null;
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  }

  /**
   * Search users
   */
  static async searchUsers(query: string, limit = 20): Promise<AudiusUser[]> {
    if (!query.trim()) return [];
    
    try {
      const params = new URLSearchParams({ 
        query: query.trim(),
        limit: limit.toString() 
      });

      const data = await this.fetchFromEdgeFunction(`/search-users?${params}`);
      return data.users || [];
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  }

  /**
   * Stream track URL - get direct stream URL
   */
  static getStreamUrl(trackId: string): string {
    return `https://discoveryprovider.audius.co/v1/tracks/${trackId}/stream`;
  }

  /**
   * Format duration from seconds to MM:SS
   */
  static formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  /**
   * Get artwork URL with fallback
   */
  static getArtworkUrl(artwork?: AudiusTrack['artwork'], size: '150x150' | '480x480' | '1000x1000' = '480x480'): string {
    if (artwork?.[size]) {
      return artwork[size];
    }
    // Return placeholder based on track ID for variety
    const placeholders = [
      '/src/assets/track-1.jpg',  
      '/src/assets/track-2.jpg',
      '/src/assets/track-3.jpg'
    ];
    return placeholders[Math.floor(Math.random() * placeholders.length)];
  }

  /**
   * Get profile picture URL with fallback
   */
  static getProfilePictureUrl(profilePicture?: AudiusUser['profile_picture'], size: '150x150' | '480x480' | '1000x1000' = '150x150'): string {
    if (profilePicture?.[size]) {
      return profilePicture[size];
    }
    return '/placeholder.svg';
  }

  /**
   * Convert Audius track to our TrackCard format
   */
  static convertToTrackCardProps(track: AudiusTrack): {
    id: string;
    title: string;
    artist: string;
    artwork: string;
    duration: string;
    likes: number;
    isNft?: boolean;
    price?: number;
    fanClubOnly?: boolean;
    streamUrl: string;
    permalink: string;
  } {
    return {
      id: track.id,
      title: track.title,
      artist: track.user.name,
      artwork: this.getArtworkUrl(track.artwork),
      duration: this.formatDuration(track.duration),
      likes: track.favorite_count || 0,
      streamUrl: `https://discoveryprovider.audius.co/v1/tracks/${track.id}/stream`,
      permalink: track.permalink || '',
      // Web3 enhancements (would be determined by additional logic)
      isNft: Math.random() > 0.7, // Placeholder: 30% chance
      price: Math.random() > 0.8 ? Number((Math.random() * 5).toFixed(1)) : undefined, // 20% chance of being purchasable
      fanClubOnly: Math.random() > 0.9, // 10% chance of being fan club only
    };
  }

  /**
   * Get genres list (verified Audius genres)
   */
  static getGenres(): { id: string; label: string }[] {
    return [
      { id: 'all', label: 'All Genres' },
      { id: 'Electronic', label: 'Electronic' },
      { id: 'Hip-Hop/Rap', label: 'Hip-Hop/Rap' },
      { id: 'Alternative', label: 'Alternative' },
      { id: 'Rock', label: 'Rock' },
      { id: 'Pop', label: 'Pop' },
      { id: 'Ambient', label: 'Ambient' },
      { id: 'Soundtrack', label: 'Soundtrack' },
      { id: 'World', label: 'World' },
      { id: 'Jazz', label: 'Jazz' },
      { id: 'Acoustic', label: 'Acoustic' },
      { id: 'Funk', label: 'Funk' },
      { id: 'R&B/Soul', label: 'R&B/Soul' },
      { id: 'Experimental', label: 'Experimental' },
      { id: 'Punk', label: 'Punk' },
      { id: 'Folk', label: 'Folk' },
      { id: 'Classical', label: 'Classical' },
      { id: 'Country', label: 'Country' },
      { id: 'Latin', label: 'Latin' },
      { id: 'Reggae', label: 'Reggae' },
      { id: 'Metal', label: 'Metal' },
    ];
  }

  /**
   * Get time range options
   */
  static getTimeRanges(): { id: 'week' | 'month' | 'allTime'; label: string }[] {
    return [
      { id: 'week', label: 'This Week' },
      { id: 'month', label: 'This Month' },
      { id: 'allTime', label: 'All Time' },
    ];
  }
}