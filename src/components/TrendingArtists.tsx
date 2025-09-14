import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Play, Heart } from 'lucide-react';

interface TrendingArtist {
  id: string;
  name: string;
  avatar?: string;
  genre: string;
  rank: number;
  changeDirection: 'up' | 'down' | 'same';
  changeAmount: number;
  currentTrack?: string;
}

const trendingArtists: TrendingArtist[] = [
  {
    id: '1',
    name: 'Neon Dreams',
    avatar: '/src/assets/track-1.jpg',
    genre: 'Synthpop',
    rank: 1,
    changeDirection: 'up',
    changeAmount: 3,
    currentTrack: 'Electric Night',
  },
  {
    id: '2',
    name: 'Deep Current',
    avatar: '/src/assets/track-2.jpg',
    genre: 'Tech House',
    rank: 2,
    changeDirection: 'up',
    changeAmount: 1,
    currentTrack: 'Underground Flow',
  },
  {
    id: '3',
    name: 'Aurora Fields',
    avatar: '/src/assets/track-3.jpg',
    genre: 'Ambient',
    rank: 3,
    changeDirection: 'same',
    changeAmount: 0,
    currentTrack: 'Morning Light',
  },
  {
    id: '4',
    name: 'Pulse Wave',
    avatar: '/src/assets/hero-aurora.jpg',
    genre: 'Drum & Bass',
    rank: 4,
    changeDirection: 'up',
    changeAmount: 2,
    currentTrack: 'Frequency',
  },
  {
    id: '5',
    name: 'Starfield',
    avatar: '/src/assets/track-1.jpg',
    genre: 'Space Disco',
    rank: 5,
    changeDirection: 'down',
    changeAmount: 1,
    currentTrack: 'Cosmic Dance',
  },
];

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
        {trendingArtists.map((artist) => (
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
                    onClick={(e) => {
                      e.stopPropagation();
                      // Handle play action
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
        ))}
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