import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import TrackCard from '@/components/TrackCard';
import { useAudiusTracks } from '@/hooks/useAudius';
import { AudiusService } from '@/services/audiusService';
import { 
  Filter, 
  TrendingUp, 
  Clock, 
  Zap,
  Users,
  Radio,
  Loader2
} from 'lucide-react';

const DiscoverySection = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const { tracks, loading, error, refreshTracks } = useAudiusTracks(activeCategory);

  const categories = [
    { id: 'all', label: 'Trending', icon: TrendingUp },
    { id: 'electronic', label: 'Electronic', icon: Zap },
    { id: 'hip-hop/rap', label: 'Hip-Hop', icon: Radio },
    { id: 'rock', label: 'Rock', icon: Users },
    { id: 'pop', label: 'Pop', icon: Clock },
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="text-center mb-12">
        <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
          Discover <span className="text-aurora">New Music</span>
        </h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Explore trending tracks, exclusive NFT drops, and token-gated content from your favorite artists.
        </p>
      </div>

        {/* Category Filters */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={activeCategory === category.id ? 'aurora' : 'glass'}
              size="sm"
              onClick={() => setActiveCategory(category.id)}
              className="px-4 py-2"
            >
              <category.icon className="w-4 h-4 mr-2" />
              {category.label}
            </Button>
          ))}
        </div>

        {/* Live Stats Bar */}
        <div className="glass-panel rounded-2xl p-4 mb-8">
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span className="text-muted-foreground">Live Audius Data</span>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-accent" />
              <span className="text-muted-foreground">{tracks.length} tracks loaded</span>
            </div>
            <div className="flex items-center space-x-2">
              <Radio className="w-4 h-4 text-secondary" />
              <span className="text-muted-foreground">Real-time streaming</span>
            </div>
          </div>
        </div>

        {/* Tracks Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading tracks from Audius...</span>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">Failed to load tracks</p>
            <Button onClick={refreshTracks} variant="outline">
              Try Again
            </Button>
          </div>
        ) : tracks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
            {tracks.map((track) => {
              const trackProps = AudiusService.convertToTrackCardProps(track);
              return (
                <TrackCard
                  key={track.id}
                  {...trackProps}
                />
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No tracks found for this genre</p>
          </div>
        )}

        {/* Load More */}
        <div className="text-center">
          <Button 
            variant="glass" 
            size="lg" 
            className="px-8"
            onClick={refreshTracks}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 w-5 animate-spin mr-2" />
                Loading...
              </>
            ) : (
              <>
                <Filter className="w-5 h-5 mr-2" />
                Refresh Tracks
              </>
            )}
          </Button>
        </div>
    </section>
  );
};

export default DiscoverySection;