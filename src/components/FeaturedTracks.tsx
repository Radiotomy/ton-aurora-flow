import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import TrackCard from '@/components/TrackCard';
import { TrackCardProps } from '@/components/TrackCard';
import track1Image from '@/assets/track-1.jpg';
import track2Image from '@/assets/track-2.jpg';
import track3Image from '@/assets/track-3.jpg';
import heroAuroraImage from '@/assets/hero-aurora.jpg';

const featuredTracks: TrackCardProps[] = [
  {
    id: 'featured-1',
    title: 'Digital Dreams',
    artist: 'Luna Waves',
    artwork: track1Image,
    duration: '3:45',
    likes: 12500,
    isNft: true,
    price: 2.5,
    streamUrl: 'https://example.com/stream/1',
    artistId: 'luna-waves',
    canMintNFT: true,
  },
  {
    id: 'featured-2',
    title: 'Stellar Journey',
    artist: 'Cosmic Drift',
    artwork: track2Image,
    duration: '4:22',
    likes: 8900,
    streamUrl: 'https://example.com/stream/2',
    artistId: 'cosmic-drift',
    canMintNFT: true,
  },
  {
    id: 'featured-3',
    title: 'Gravity Drop',
    artist: 'Bass Horizon',
    artwork: track3Image,
    duration: '3:18',
    likes: 15600,
    isNft: true,
    price: 1.8,
    streamUrl: 'https://example.com/stream/3',
    artistId: 'bass-horizon',
    canMintNFT: true,
  },
  {
    id: 'featured-4',
    title: 'Neon Lights',
    artist: 'Retro Pulse',
    artwork: heroAuroraImage,
    duration: '3:56',
    likes: 6700,
    streamUrl: 'https://example.com/stream/4',
    artistId: 'retro-pulse',
    fanClubOnly: true,
  },
  {
    id: 'featured-5',
    title: 'Electric Night',
    artist: 'Neon Dreams',
    artwork: track1Image,
    duration: '4:12',
    likes: 9800,
    isNft: true,
    price: 3.2,
    streamUrl: 'https://example.com/stream/5',
    artistId: 'neon-dreams',
    canMintNFT: true,
  },
  {
    id: 'featured-6',
    title: 'Cosmic Dance',
    artist: 'Starfield',
    artwork: track2Image,
    duration: '3:33',
    likes: 7200,
    streamUrl: 'https://example.com/stream/6',
    artistId: 'starfield',
  },
];

export const FeaturedTracks = () => {
  const navigate = useNavigate();

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
        {featuredTracks.map((track) => (
          <TrackCard key={track.id} {...track} />
        ))}
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