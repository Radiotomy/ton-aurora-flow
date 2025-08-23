import Cookies from 'js-cookie';
import { supabase } from '@/integrations/supabase/client';
import { AudiusTrack, AudiusUser } from './audiusService';

export interface AudiusUserProfile extends AudiusUser {
  email?: string;
  is_verified?: boolean;
  wallet?: string;
  associated_wallets?: string[];
  playlist_library?: {
    contents?: Array<{ playlist_id: string }>;
  };
  followee_reposts?: AudiusTrack[];
  feed?: AudiusTrack[];
}

export interface AudiusPlaylist {
  id: string;
  name: string;
  description?: string;
  owner: {
    id: string;
    name: string;
    handle: string;
  };
  artwork?: {
    '150x150'?: string;
    '480x480'?: string;
    '1000x1000'?: string;
  };
  track_count: number;
  total_play_count?: number;
  favorite_count?: number;
  repost_count?: number;
  is_private: boolean;
  created_at: string;
  updated_at: string;
  tracks?: AudiusTrack[];
}

export interface AudiusFollowing {
  user_id: string;
  followee_user_id: string;
  created_at: string;
}

export class AudiusAuthService {
  private static readonly AUDIUS_CLIENT_ID = 'audioton-app';
  private static readonly REDIRECT_URI = `${window.location.origin}/auth/audius/callback`;
  private static readonly STORAGE_KEY = 'audius_auth_token';
  private static readonly USER_KEY = 'audius_user_profile';

  /**
   * Check if user is authenticated with Audius
   */
  static isAuthenticated(): boolean {
    return !!this.getAuthToken();
  }

  /**
   * Get stored auth token
   */
  static getAuthToken(): string | null {
    return Cookies.get(this.STORAGE_KEY) || localStorage.getItem(this.STORAGE_KEY);
  }

  /**
   * Store auth token
   */
  static setAuthToken(token: string): void {
    Cookies.set(this.STORAGE_KEY, token, { expires: 30 }); // 30 days
    localStorage.setItem(this.STORAGE_KEY, token);
  }

  /**
   * Clear auth token and user data
   */
  static clearAuth(): void {
    Cookies.remove(this.STORAGE_KEY);
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  /**
   * Get stored user profile
   */
  static getStoredUser(): AudiusUserProfile | null {
    const userData = localStorage.getItem(this.USER_KEY);
    return userData ? JSON.parse(userData) : null;
  }

  /**
   * Store user profile
   */
  static setStoredUser(user: AudiusUserProfile): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  /**
   * Initiate Audius OAuth flow
   */
  static initiateOAuth(): void {
    const state = Math.random().toString(36).substring(2, 15);
    localStorage.setItem('audius_oauth_state', state);

    const params = new URLSearchParams({
      client_id: this.AUDIUS_CLIENT_ID,
      redirect_uri: this.REDIRECT_URI,
      response_type: 'code',
      state: state,
      scope: 'read write',
    });

    // Use Audius OAuth endpoint
    const authUrl = `https://audius.co/oauth/authorize?${params}`;
    window.location.href = authUrl;
  }

  /**
   * Handle OAuth callback
   */
  static async handleOAuthCallback(code: string, state: string): Promise<AudiusUserProfile> {
    const storedState = localStorage.getItem('audius_oauth_state');
    if (state !== storedState) {
      throw new Error('Invalid OAuth state');
    }

    localStorage.removeItem('audius_oauth_state');

    // Exchange code for token via our edge function
    const { data, error } = await supabase.functions.invoke('audius-oauth', {
      body: {
        code,
        redirect_uri: this.REDIRECT_URI,
        client_id: this.AUDIUS_CLIENT_ID,
      },
    });

    if (error || !data.success) {
      throw new Error(data?.error || error?.message || 'OAuth exchange failed');
    }

    this.setAuthToken(data.access_token);
    
    // Fetch user profile
    const userProfile = await this.getCurrentUser();
    this.setStoredUser(userProfile);

    return userProfile;
  }

  /**
   * Make authenticated request to Audius API
   */
  private static async makeAuthenticatedRequest(endpoint: string, options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: any;
    params?: Record<string, string>;
  } = {}): Promise<any> {
    const token = this.getAuthToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const { data, error } = await supabase.functions.invoke('audius-auth-api', {
      body: {
        endpoint,
        method: options.method || 'GET',
        token,
        body: options.body,
        params: options.params,
      },
    });

    if (error || !data.success) {
      throw new Error(data?.error || error?.message || 'Authenticated request failed');
    }

    return data;
  }

  /**
   * Get current authenticated user profile
   */
  static async getCurrentUser(): Promise<AudiusUserProfile> {
    const data = await this.makeAuthenticatedRequest('/v1/users/me');
    return data.user;
  }

  /**
   * Get user's favorites
   */
  static async getUserFavorites(userId?: string, limit = 20, offset = 0): Promise<AudiusTrack[]> {
    const endpoint = userId ? `/v1/users/${userId}/favorites` : '/v1/users/me/favorites';
    const data = await this.makeAuthenticatedRequest(endpoint, {
      params: { limit: limit.toString(), offset: offset.toString() }
    });
    return data.favorites || [];
  }

  /**
   * Get user's reposts
   */
  static async getUserReposts(userId?: string, limit = 20, offset = 0): Promise<AudiusTrack[]> {
    const endpoint = userId ? `/v1/users/${userId}/reposts` : '/v1/users/me/reposts';
    const data = await this.makeAuthenticatedRequest(endpoint, {
      params: { limit: limit.toString(), offset: offset.toString() }
    });
    return data.reposts || [];
  }

  /**
   * Get user's playlists
   */
  static async getUserPlaylists(userId?: string, limit = 20, offset = 0): Promise<AudiusPlaylist[]> {
    const endpoint = userId ? `/v1/users/${userId}/playlists` : '/v1/users/me/playlists';
    const data = await this.makeAuthenticatedRequest(endpoint, {
      params: { limit: limit.toString(), offset: offset.toString() }
    });
    return data.playlists || [];
  }

  /**
   * Get user's following list
   */
  static async getUserFollowing(userId?: string, limit = 20, offset = 0): Promise<AudiusUser[]> {
    const endpoint = userId ? `/v1/users/${userId}/following` : '/v1/users/me/following';
    const data = await this.makeAuthenticatedRequest(endpoint, {
      params: { limit: limit.toString(), offset: offset.toString() }
    });
    return data.following || [];
  }

  /**
   * Get user's followers
   */
  static async getUserFollowers(userId?: string, limit = 20, offset = 0): Promise<AudiusUser[]> {
    const endpoint = userId ? `/v1/users/${userId}/followers` : '/v1/users/me/followers';
    const data = await this.makeAuthenticatedRequest(endpoint, {
      params: { limit: limit.toString(), offset: offset.toString() }
    });
    return data.followers || [];
  }

  /**
   * Get user's feed (tracks from followed artists)
   */
  static async getUserFeed(limit = 20, offset = 0): Promise<AudiusTrack[]> {
    const data = await this.makeAuthenticatedRequest('/v1/users/me/feed', {
      params: { limit: limit.toString(), offset: offset.toString() }
    });
    return data.feed || [];
  }

  /**
   * Follow a user
   */
  static async followUser(userId: string): Promise<void> {
    await this.makeAuthenticatedRequest(`/v1/users/${userId}/follow`, {
      method: 'POST'
    });
  }

  /**
   * Unfollow a user
   */
  static async unfollowUser(userId: string): Promise<void> {
    await this.makeAuthenticatedRequest(`/v1/users/${userId}/unfollow`, {
      method: 'DELETE'
    });
  }

  /**
   * Favorite a track
   */
  static async favoriteTrack(trackId: string): Promise<void> {
    await this.makeAuthenticatedRequest(`/v1/tracks/${trackId}/favorite`, {
      method: 'POST'
    });
  }

  /**
   * Unfavorite a track
   */
  static async unfavoriteTrack(trackId: string): Promise<void> {
    await this.makeAuthenticatedRequest(`/v1/tracks/${trackId}/unfavorite`, {
      method: 'DELETE'
    });
  }

  /**
   * Repost a track
   */
  static async repostTrack(trackId: string): Promise<void> {
    await this.makeAuthenticatedRequest(`/v1/tracks/${trackId}/repost`, {
      method: 'POST'
    });
  }

  /**
   * Unrepost a track
   */
  static async unrepostTrack(trackId: string): Promise<void> {
    await this.makeAuthenticatedRequest(`/v1/tracks/${trackId}/unrepost`, {
      method: 'DELETE'
    });
  }

  /**
   * Create a new playlist
   */
  static async createPlaylist(data: {
    name: string;
    description?: string;
    is_private?: boolean;
  }): Promise<AudiusPlaylist> {
    const result = await this.makeAuthenticatedRequest('/v1/playlists', {
      method: 'POST',
      body: data
    });
    return result.playlist;
  }

  /**
   * Update a playlist
   */
  static async updatePlaylist(playlistId: string, data: {
    name?: string;
    description?: string;
    is_private?: boolean;
  }): Promise<AudiusPlaylist> {
    const result = await this.makeAuthenticatedRequest(`/v1/playlists/${playlistId}`, {
      method: 'PUT',
      body: data
    });
    return result.playlist;
  }

  /**
   * Add track to playlist
   */
  static async addTrackToPlaylist(playlistId: string, trackId: string): Promise<void> {
    await this.makeAuthenticatedRequest(`/v1/playlists/${playlistId}/tracks`, {
      method: 'POST',
      body: { track_id: trackId }
    });
  }

  /**
   * Remove track from playlist
   */
  static async removeTrackFromPlaylist(playlistId: string, trackId: string): Promise<void> {
    await this.makeAuthenticatedRequest(`/v1/playlists/${playlistId}/tracks/${trackId}`, {
      method: 'DELETE'
    });
  }

  /**
   * Delete a playlist
   */
  static async deletePlaylist(playlistId: string): Promise<void> {
    await this.makeAuthenticatedRequest(`/v1/playlists/${playlistId}`, {
      method: 'DELETE'
    });
  }

  /**
   * Get track details with user's interaction status
   */
  static async getTrackWithUserData(trackId: string): Promise<{
    track: AudiusTrack;
    has_current_user_favorited: boolean;
    has_current_user_reposted: boolean;
  }> {
    const data = await this.makeAuthenticatedRequest(`/v1/tracks/${trackId}`);
    return data;
  }

  /**
   * Check if user follows another user
   */
  static async checkUserFollowing(userId: string): Promise<boolean> {
    try {
      const data = await this.makeAuthenticatedRequest(`/v1/users/${userId}/following_status`);
      return data.is_following || false;
    } catch (error) {
      return false;
    }
  }
}