import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Star, Play, Users, TrendingUp } from 'lucide-react';

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

const featuredArtists: FeaturedArtist[] = [
  {
    id: '1',
    name: 'Luna Waves',
    avatar: '/placeholder.svg',
    followers: 125000,
    genre: 'Electronic',
    isVerified: true,
    topTrack: 'Digital Dreams',
    monthlyListeners: 45000,
  },
  {
    id: '2',
    name: 'Cosmic Drift',
    avatar: '/placeholder.svg',
    followers: 89000,
    genre: 'Ambient',
    isVerified: true,
    topTrack: 'Stellar Journey',
    monthlyListeners: 32000,
  },
  {
    id: '3',
    name: 'Bass Horizon',
    avatar: '/placeholder.svg',
    followers: 156000,
    genre: 'Dubstep',
    isVerified: true,
    topTrack: 'Gravity Drop',
    monthlyListeners: 67000,
  },
  {
    id: '4',
    name: 'Retro Pulse',
    avatar: '/placeholder.svg',
    followers: 78000,
    genre: 'Synthwave',
    isVerified: false,
    topTrack: 'Neon Lights',
    monthlyListeners: 28000,
  },
];

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
        {featuredArtists.map((artist) => (
          <Card 
            key={artist.id} 
            className="group glass-panel hover:bg-glass-hover transition-all duration-300 cursor-pointer border-glass-border"
            onClick={() => navigate(`/artist/${artist.id}`)}
          >
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center space-y-4">
                {/* Artist Avatar */}
                <div className="relative">
                  <Avatar className="w-20 h-20 ring-2 ring-aurora/20 group-hover:ring-aurora/40 transition-all duration-300">
                    <AvatarImage src={artist.avatar} alt={artist.name} />
                    <AvatarFallback className="bg-aurora/10 text-aurora font-semibold text-lg">
                      {artist.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  {artist.isVerified && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-aurora rounded-full flex items-center justify-center">
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
        ))}
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