import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import TrackCard from './TrackCard';
import { TrendingUp, Flame, Crown, Zap } from 'lucide-react';
import track1 from '@/assets/track-1.jpg';
import track2 from '@/assets/track-2.jpg';
import track3 from '@/assets/track-3.jpg';

const DiscoverySection = () => {
  const categories = [
    { icon: Flame, label: 'Trending', active: true },
    { icon: Crown, label: 'Fan Clubs', active: false },
    { icon: Zap, label: 'New Drops', active: false },
    { icon: TrendingUp, label: 'Rising', active: false },
  ];

  const tracks = [
    {
      title: "Neon Dreams",
      artist: "SyntaX",
      artwork: track1,
      duration: "3:24",
      likes: 15420,
      isNft: true,
      price: "2.5 TON"
    },
    {
      title: "Crystal Waves",
      artist: "Echo Luna",
      artwork: track2,
      duration: "4:12",
      likes: 8934,
      isNft: true,
      price: "1.8 TON",
      fanClubOnly: true
    },
    {
      title: "Aurora Pulse",
      artist: "Void Collective",
      artwork: track3,
      duration: "2:58",
      likes: 23187,
      isNft: false
    },
    {
      title: "Synthetic Rain",
      artist: "SyntaX",
      artwork: track1,
      duration: "5:33",
      likes: 12045,
      isNft: true,
      price: "3.2 TON"
    },
    {
      title: "Digital Horizon",
      artist: "Echo Luna",
      artwork: track2,
      duration: "3:47",
      likes: 9876,
      isNft: false,
      fanClubOnly: true
    },
    {
      title: "Quantum Drift",
      artist: "Void Collective",
      artwork: track3,
      duration: "4:05",
      likes: 18432,
      isNft: true,
      price: "1.5 TON"
    }
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
            key={category.label}
            variant={category.active ? "default" : "outline"}
            size="sm"
            className={`glass-button ${
              category.active 
                ? 'bg-primary/20 text-primary border-primary/30' 
                : 'border-glass-border hover:border-primary/30'
            }`}
          >
            <category.icon className="w-4 h-4 mr-2" />
            {category.label}
          </Button>
        ))}
      </div>

      {/* Live Stats Bar */}
      <div className="glass-panel rounded-2xl p-6 mb-12 bg-gradient-to-r from-primary/5 to-secondary/5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
              <span className="text-sm font-medium">Live</span>
            </div>
            <div className="text-sm text-muted-foreground">
              <span className="text-primary font-bold">1,247</span> listeners right now
            </div>
          </div>
          
          <div className="flex items-center space-x-4 text-sm">
            <Badge variant="outline" className="glass-panel bg-primary/10 text-primary border-primary/20">
              <Zap className="w-3 h-3 mr-1" />
              47 NFTs minted today
            </Badge>
            <Badge variant="outline" className="glass-panel bg-secondary/10 text-secondary border-secondary/20">
              <Crown className="w-3 h-3 mr-1" />
              12 events live
            </Badge>
          </div>
        </div>
      </div>

      {/* Tracks Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {tracks.map((track, index) => (
          <TrackCard
            key={`${track.title}-${index}`}
            {...track}
          />
        ))}
      </div>

      {/* Load More */}
      <div className="text-center">
        <Button 
          size="lg" 
          variant="outline" 
          className="glass-button border-glass-border px-8 py-3"
        >
          Load More Tracks
        </Button>
      </div>
    </section>
  );
};

export default DiscoverySection;