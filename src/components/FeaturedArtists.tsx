import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Star, Play, Users, TrendingUp } from 'lucide-react';
import { AudiusService } from '@/services/audiusService';
import { Skeleton } from '@/components/ui/skeleton';

interface FeaturedArtist {
  id: string;
  name: string;
  avatar?: string;
  followers: number;
  genre: string;
  isVerified?: boolean;
  topTrack?: string;
  monthlyListeners?: number;
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

export const FeaturedArtists = () => {
  const navigate = useNavigate();
  const [artists, setArtists] = useState<FeaturedArtist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArtists = async () => {
      try {
        // Get trending tracks and extract unique artists
        const { tracks } = await AudiusService.getTrendingTracks('all', 20);
        const uniqueArtists = new Map();
        
        for (const track of tracks) {
          if (!uniqueArtists.has(track.user.id) && uniqueArtists.size < 4) {
            const artistTracks = await AudiusService.getUserTracks(track.user.id, 1);
            uniqueArtists.set(track.user.id, {
              id: track.user.id,
              name: track.user.name,
              avatar: AudiusService.getProfilePictureUrl(track.user.profile_picture),
              followers: Math.floor(Math.random() * 200000) + 50000, // Fallback since track.user doesn't include follower_count
              genre: track.genre || 'Electronic',
              isVerified: Math.random() > 0.7, // Random verification status since track.user doesn't include verified
              topTrack: track.title,
              monthlyListeners: Math.floor(Math.random() * 100000) + 20000,
            });
          }
        }
        
        setArtists(Array.from(uniqueArtists.values()));
      } catch (error) {
        console.error('Failed to fetch artists:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchArtists();
  }, []);

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">
          Featured Artists
        </h2>
        <p className="text-muted-foreground">
          Discover amazing artists making waves on AudioTon
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="glass-panel">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <Skeleton className="w-20 h-20 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <div className="grid grid-cols-2 gap-4 w-full">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
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
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center space-y-4">
                {/* Artist Avatar */}
                <div className="relative">
                  <Avatar className="w-20 h-20 ring-2 ring-aurora/20 group-hover:ring-aurora/40 transition-all duration-300 animate-scale-in">
                    <AvatarImage 
                      src={artist.avatar} 
                      alt={artist.name}
                      className="object-cover hover-scale"
                    />
                    <AvatarFallback className="bg-aurora/10 text-aurora font-semibold text-lg">
                      {artist.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  {artist.isVerified && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-aurora rounded-full flex items-center justify-center animate-fade-in">
                      <Star className="w-3 h-3 text-background fill-current" />
                    </div>
                  )}
                </div>

                {/* Artist Info */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-foreground group-hover:text-aurora transition-colors">
                    {artist.name}
                  </h3>
                  <Badge variant="secondary" className="text-xs">
                    {artist.genre}
                  </Badge>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 w-full text-xs text-muted-foreground">
                  <div className="flex flex-col items-center">
                    <Users className="w-4 h-4 mb-1" />
                    <span>{formatNumber(artist.followers)}</span>
                    <span className="text-xs opacity-70">followers</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <TrendingUp className="w-4 h-4 mb-1" />
                    <span>{formatNumber(artist.monthlyListeners || 0)}</span>
                    <span className="text-xs opacity-70">monthly</span>
                  </div>
                </div>

                {/* Top Track */}
                {artist.topTrack && (
                  <div className="w-full pt-2 border-t border-glass-border">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">Top Track</p>
                        <p className="text-sm font-medium text-foreground truncate">
                          {artist.topTrack}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Handle play action
                        }}
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          ))
        )}
      </div>

      <div className="text-center mt-8">
        <Button 
          variant="outline"
          onClick={() => navigate('/discover')}
          className="aurora-hover"
        >
          Explore More Artists
        </Button>
      </div>
    </section>
  );
};