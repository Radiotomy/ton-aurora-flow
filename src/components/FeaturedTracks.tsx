import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import TrackCard from '@/components/TrackCard';
import { TrackCardProps } from '@/components/TrackCard';
import { AudiusService } from '@/services/audiusService';
import { Skeleton } from '@/components/ui/skeleton';

export const FeaturedTracks = () => {
  const navigate = useNavigate();
  const [tracks, setTracks] = useState<TrackCardProps[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTracks = async () => {
      try {
        const { tracks: audiusTracks } = await AudiusService.getTrendingTracks('all', 6);
        // Convert tracks without fake NFT/price assignments - these come from real Audius data
        const formattedTracks = audiusTracks.map((track) => ({
          ...AudiusService.convertToTrackCardProps(track),
          // Only show NFT features when track is actually minted on-chain
          canMintNFT: true, // All tracks can potentially be minted
          isNft: false, // Will be true only when actually minted
          price: undefined, // Only show price when listed
          fanClubOnly: false, // Only true when artist configures it
        }));
        setTracks(formattedTracks);
      } catch (error) {
        console.error('Failed to fetch trending tracks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTracks();
  }, []);

  return (
    <section className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <div className="text-center flex-1">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-1 sm:mb-2">
            Featured Tracks
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Handpicked tracks from top artists
          </p>
        </div>
        <Button 
          variant="outline"
          onClick={() => navigate('/discover')}
          className="hidden sm:flex aurora-hover"
        >
          Explore More
        </Button>
      </div>

      {/* Mobile: Horizontal Scroll, Desktop: Grid */}
      <div className="sm:hidden -mx-4 px-4">
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-4">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-40 space-y-3">
                <Skeleton className="aspect-square rounded-2xl" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))
          ) : (
            tracks.map((track) => (
              <div key={track.id} className="flex-shrink-0 w-40">
                <TrackCard {...track} />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Desktop Grid */}
      <div className="hidden sm:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-square rounded-2xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))
        ) : (
          tracks.map((track) => (
            <TrackCard key={track.id} {...track} />
          ))
        )}
      </div>

      <div className="text-center mt-6 sm:hidden">
        <Button 
          variant="outline"
          onClick={() => navigate('/discover')}
          className="aurora-hover w-full max-w-xs h-11"
        >
          Explore More Tracks
        </Button>
      </div>
    </section>
  );
};