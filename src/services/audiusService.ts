// Mock Audius service for demo purposes
// In production, this would integrate with the real Audius API

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

// Mock data for demonstration
const mockTracks: AudiusTrack[] = [
  {
    id: '1',
    title: 'Cosmic Dreams',
    user: { id: 'u1', name: 'Luna Waves', handle: 'lunawaves' },
    genre: 'electronic',
    duration: 204,
    favorite_count: 12500,
    play_count: 45600,
    permalink: '/lunawaves/cosmic-dreams',
  },
  {
    id: '2', 
    title: 'Digital Sunrise',
    user: { id: 'u2', name: 'Echo Chamber', handle: 'echochamber' },
    genre: 'electronic',
    duration: 252,
    favorite_count: 8900,
    play_count: 23400,
    permalink: '/echochamber/digital-sunrise',
  },
  {
    id: '3',
    title: 'Neon Nights',
    user: { id: 'u3', name: 'Synth Master', handle: 'synthmaster' },
    genre: 'electronic',
    duration: 235,
    favorite_count: 15600,
    play_count: 67800,
    permalink: '/synthmaster/neon-nights',
  },
  {
    id: '4',
    title: 'Quantum Beats',
    user: { id: 'u4', name: 'Future Bass', handle: 'futurebass' },
    genre: 'hip-hop/rap',
    duration: 189,
    favorite_count: 22300,
    play_count: 89500,
    permalink: '/futurebass/quantum-beats',
  },
  {
    id: '5',
    title: 'Rock Revolution',
    user: { id: 'u5', name: 'Thunder Strike', handle: 'thunderstrike' },
    genre: 'rock',
    duration: 278,
    favorite_count: 18700,
    play_count: 56200,
    permalink: '/thunderstrike/rock-revolution',
  },
  {
    id: '6',
    title: 'Pop Paradise',
    user: { id: 'u6', name: 'Melody Maker', handle: 'melodymaker' },
    genre: 'pop',
    duration: 215,
    favorite_count: 31200,
    play_count: 98700,
    permalink: '/melodymaker/pop-paradise',
  },
  {
    id: '7',
    title: 'Web3 Anthem',
    user: { id: 'u7', name: 'Crypto Collective', handle: 'cryptocollective' },
    genre: 'electronic',
    duration: 213,
    favorite_count: 28900,
    play_count: 76400,
    permalink: '/cryptocollective/web3-anthem',
  },
  {
    id: '8',
    title: 'Blockchain Blues',
    user: { id: 'u8', name: 'Decentralized Band', handle: 'decentband' },
    genre: 'rock',
    duration: 268,
    favorite_count: 9800,
    play_count: 34500,
    permalink: '/decentband/blockchain-blues',
  },
];

export class AudiusService {
  /**
   * Get trending tracks
   */
  static async getTrendingTracks(genre?: string, limit = 20): Promise<AudiusTrack[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    let filteredTracks = mockTracks;
    
    if (genre && genre !== 'all') {
      filteredTracks = mockTracks.filter(track => track.genre === genre);
    }
    
    return filteredTracks.slice(0, limit);
  }

  /**
   * Search tracks
   */
  static async searchTracks(query: string, limit = 20): Promise<AudiusTrack[]> {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const filteredTracks = mockTracks.filter(track => 
      track.title.toLowerCase().includes(query.toLowerCase()) ||
      track.user.name.toLowerCase().includes(query.toLowerCase())
    );
    
    return filteredTracks.slice(0, limit);
  }

  /**
   * Get track by ID
   */
  static async getTrack(trackId: string): Promise<AudiusTrack | null> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return mockTracks.find(track => track.id === trackId) || null;
  }

  /**
   * Get tracks by user
   */
  static async getUserTracks(userId: string, limit = 20): Promise<AudiusTrack[]> {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const userTracks = mockTracks.filter(track => track.user.id === userId);
    return userTracks.slice(0, limit);
  }

  /**
   * Get user profile
   */
  static async getUser(userId: string): Promise<AudiusUser | null> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const track = mockTracks.find(t => t.user.id === userId);
    if (!track) return null;
    
    return {
      ...track.user,
      follower_count: Math.floor(Math.random() * 10000),
      followee_count: Math.floor(Math.random() * 1000),
      track_count: mockTracks.filter(t => t.user.id === userId).length,
      playlist_count: Math.floor(Math.random() * 50),
      verified: Math.random() > 0.7,
    };
  }

  /**
   * Search users
   */
  static async searchUsers(query: string, limit = 20): Promise<AudiusUser[]> {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const uniqueUsers = Array.from(new Set(mockTracks.map(t => t.user.id)))
      .map(id => mockTracks.find(t => t.user.id === id)?.user)
      .filter(Boolean) as AudiusUser[];
    
    const filteredUsers = uniqueUsers.filter(user =>
      user.name.toLowerCase().includes(query.toLowerCase()) ||
      user.handle.toLowerCase().includes(query.toLowerCase())
    );
    
    return filteredUsers.slice(0, limit);
  }

  /**
   * Stream track URL
   */
  static getStreamUrl(trackId: string): string {
    return `https://audius-discovery-1.altego.net/v1/tracks/${trackId}/stream`;
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
      streamUrl: this.getStreamUrl(track.id),
      permalink: track.permalink || '',
      // Web3 enhancements (would be determined by additional logic)
      isNft: Math.random() > 0.7, // Placeholder: 30% chance
      price: Math.random() > 0.8 ? Number((Math.random() * 5).toFixed(1)) : undefined, // 20% chance of being purchasable
      fanClubOnly: Math.random() > 0.9, // 10% chance of being fan club only
    };
  }

  /**
   * Get genres list
   */
  static getGenres(): string[] {
    return [
      'all',
      'electronic',
      'rock', 
      'metal',
      'alternative',
      'hip-hop/rap',
      'experimental',
      'punk',
      'folk',
      'pop',
      'ambient',
      'soundtrack',
      'world',
      'jazz',
      'acoustic',
      'funk',
      'r&b/soul',
      'devotional',
      'classical',
      'reggae',
      'podcasts',
      'country',
      'spoken word',
      'comedy',
      'blues',
      'kids',
      'audiobooks',
      'latin',
    ];
  }
}