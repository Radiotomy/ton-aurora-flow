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
  Loader2,
  Calendar,
  Music,
  Plus
} from 'lucide-react';

const DiscoverySection = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeTimeRange, setActiveTimeRange] = useState<'week' | 'month' | 'allTime'>('week');
  const { tracks, loading, loadingMore, error, hasMore, refreshTracks, loadMoreTracks } = useAudiusTracks(activeCategory, activeTimeRange);

  const genres = AudiusService.getGenres().slice(0, 8); // Show first 8 genres
  const timeRanges = AudiusService.getTimeRanges();

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

      {/* Time Range Filters */}
      <div className="flex justify-center gap-2 mb-6">
        {timeRanges.map((timeRange) => (
          <Button
            key={timeRange.id}
            variant={activeTimeRange === timeRange.id ? 'aurora' : 'outline'}
            size="sm"
            onClick={() => setActiveTimeRange(timeRange.id)}
            className="px-3 py-1"
          >
            <Calendar className="w-3 h-3 mr-1" />
            {timeRange.label}
          </Button>
        ))}
      </div>

      {/* Genre Filters */}
      <div className="flex flex-wrap justify-center gap-3 mb-12">
        {genres.map((genre) => (
          <Button
            key={genre.id}
            variant={activeCategory === genre.id ? 'aurora' : 'glass'}
            size="sm"
            onClick={() => setActiveCategory(genre.id)}
            className="px-4 py-2"
          >
            <Music className="w-4 h-4 mr-2" />
            {genre.label}
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
            <span className="text-muted-foreground">
              {activeTimeRange === 'week' ? 'This Week' : activeTimeRange === 'month' ? 'This Month' : 'All Time'} • 
              {activeCategory === 'all' ? 'All Genres' : genres.find(g => g.id === activeCategory)?.label}
            </span>
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

        {/* Load More and Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {hasMore && (
            <Button 
              variant="aurora" 
              size="lg" 
              className="px-8"
              onClick={loadMoreTracks}
              disabled={loadingMore}
            >
              {loadingMore ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Loading More...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5 mr-2" />
                  Load More Tracks
                </>
              )}
            </Button>
          )}
          
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
                Refreshing...
              </>
            ) : (
              <>
                <Filter className="w-5 h-5 mr-2" />
                Refresh
              </>
            )}
          </Button>
        </div>
    </section>
  );
};

export default DiscoverySection;