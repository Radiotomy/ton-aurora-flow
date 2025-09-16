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
        const formattedTracks = audiusTracks.map((track, index) => ({
          ...AudiusService.convertToTrackCardProps(track),
          canMintNFT: index % 2 === 0, // Every other track can be minted
          isNft: index % 3 === 0, // Every third track is already NFT
          price: index % 3 === 0 ? Math.random() * 3 + 1 : undefined,
          fanClubOnly: index === 3, // One track is fan club only
        }));
        setTracks(formattedTracks);
      } catch (error) {
        console.error('Failed to fetch trending tracks:', error);
        // Fallback to placeholder if needed
      } finally {
        setLoading(false);
      }
    };

    fetchTracks();
  }, []);

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="text-center flex-1">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Featured Tracks
          </h2>
          <p className="text-muted-foreground">
            Handpicked tracks from top artists on AudioTon
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

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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

      <div className="text-center mt-8 sm:hidden">
        <Button 
          variant="outline"
          onClick={() => navigate('/discover')}
          className="aurora-hover"
        >
          Explore More Tracks
        </Button>
      </div>
    </section>
  );
};