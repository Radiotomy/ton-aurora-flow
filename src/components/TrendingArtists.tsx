import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Play, Heart } from 'lucide-react';
import { AudiusService } from '@/services/audiusService';
import { Skeleton } from '@/components/ui/skeleton';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';

interface TrendingArtist {
  id: string;
  name: string;
  avatar?: string;
  genre: string;
  rank: number;
  changeDirection: 'up' | 'down' | 'same';
  changeAmount: number;
  currentTrack?: string;
  currentTrackId?: string;
  currentTrackStreamUrl?: string;
  currentTrackArtwork?: string;
}

const getRankColor = (rank: number) => {
  switch (rank) {
    case 1: return 'text-yellow-400';
    case 2: return 'text-gray-400';
    case 3: return 'text-amber-600';
    default: return 'text-muted-foreground';
  }
};

const getChangeIcon = (direction: string, amount: number) => {
  if (direction === 'same') return null;
  
  return (
    <div className={`flex items-center text-xs ${
      direction === 'up' ? 'text-green-400' : 'text-red-400'
    }`}>
      <TrendingUp 
        className={`w-3 h-3 ${direction === 'down' ? 'rotate-180' : ''}`} 
      />
      <span className="ml-1">+{amount}</span>
    </div>
  );
};

export const TrendingArtists = () => {
  const navigate = useNavigate();
  const { playTrack } = useAudioPlayer();
  const [artists, setArtists] = useState<TrendingArtist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrendingArtists = async () => {
      try {
        const { tracks } = await AudiusService.getTrendingTracks('all', 15);
        const uniqueArtists = new Map();
        
        for (const track of tracks) {
          if (!uniqueArtists.has(track.user.id) && uniqueArtists.size < 5) {
            uniqueArtists.set(track.user.id, {
              id: track.user.id,
              name: track.user.name,
              avatar: AudiusService.getProfilePictureUrl(track.user.profile_picture),
              genre: track.genre || 'Electronic',
              rank: uniqueArtists.size + 1,
              changeDirection: ['up', 'down', 'same'][Math.floor(Math.random() * 3)] as 'up' | 'down' | 'same',
              changeAmount: Math.floor(Math.random() * 5) + 1,
              currentTrack: track.title,
              currentTrackId: track.id,
              currentTrackStreamUrl: track.permalink,
              currentTrackArtwork: AudiusService.getArtworkUrl(track.artwork),
            });
          }
        }
        
        setArtists(Array.from(uniqueArtists.values()));
      } catch (error) {
        console.error('Failed to fetch trending artists:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingArtists();
  }, []);

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Trending Now
          </h2>
          <p className="text-muted-foreground">
            Artists climbing the charts this week
          </p>
        </div>
        <Button 
          variant="outline"
          onClick={() => navigate('/discover')}
          className="hidden sm:flex aurora-hover"
        >
          View All Trends
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="glass-panel">
              <CardContent className="p-4">
                <div className="flex flex-col items-center space-y-3">
                  <div className="flex items-center justify-between w-full">
                    <Skeleton className="h-6 w-8" />
                    <Skeleton className="h-4 w-8" />
                  </div>
                  <Skeleton className="w-16 h-16 rounded-full" />
                  <div className="text-center space-y-1">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          artists.map((artist) => (
            <Card 
              key={artist.id} 
              className="group glass-panel hover:bg-glass-hover transition-all duration-300 cursor-pointer border-glass-border"
              onClick={() => navigate(`/artist/${artist.id}`)}
            >
            <CardContent className="p-4">
              <div className="flex flex-col items-center space-y-3">
                {/* Rank and Change */}
                <div className="flex items-center justify-between w-full">
                  <span className={`text-2xl font-bold ${getRankColor(artist.rank)}`}>
                    #{artist.rank}
                  </span>
                  {getChangeIcon(artist.changeDirection, artist.changeAmount)}
                </div>

                {/* Artist Avatar */}
                <Avatar className="w-16 h-16 ring-2 ring-aurora/20 group-hover:ring-aurora/40 transition-all duration-300 animate-scale-in">
                  <AvatarImage 
                    src={artist.avatar} 
                    alt={artist.name}
                    className="object-cover hover-scale"
                  />
                  <AvatarFallback className="bg-aurora/10 text-aurora font-semibold">
                    {artist.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>

                {/* Artist Info */}
                <div className="text-center space-y-1">
                  <h3 className="font-semibold text-foreground group-hover:text-aurora transition-colors text-sm">
                    {artist.name}
                  </h3>
                  <Badge variant="secondary" className="text-xs">
                    {artist.genre}
                  </Badge>
                </div>

                {/* Current Track */}
                {artist.currentTrack && (
                  <div className="w-full text-center">
                    <p className="text-xs text-muted-foreground mb-1">Now Playing</p>
                    <p className="text-xs font-medium text-foreground truncate">
                      {artist.currentTrack}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="hover:bg-aurora/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (artist.currentTrackId && artist.currentTrack) {
                        playTrack({
                          id: artist.currentTrackId,
                          title: artist.currentTrack,
                          artist: artist.name,
                          artwork: artist.currentTrackArtwork || artist.avatar || '',
                          streamUrl: artist.currentTrackStreamUrl,
                          duration: 180 // Default duration in seconds
                        });
                      }
                    }}
                  >
                    <Play className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Handle like action
                    }}
                  >
                    <Heart className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          ))
        )}
      </div>

      <div className="text-center mt-6 sm:hidden">
        <Button 
          variant="outline"
          onClick={() => navigate('/discover')}
          className="aurora-hover"
        >
          View All Trends
        </Button>
      </div>
    </section>
  );
};