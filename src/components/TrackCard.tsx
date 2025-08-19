import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTrackInteractions } from '@/hooks/useTrackInteractions';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { 
  Play, 
  Heart, 
  Share2, 
  Zap,
  Users,
  Gem,
  Loader2,
  ShoppingCart
} from 'lucide-react';

interface TrackCardProps {
  id: string;
  title: string;
  artist: string;
  artwork: string;
  duration: string;
  likes: number;
  isNft?: boolean;
  price?: number;
  fanClubOnly?: boolean;
  streamUrl?: string;
  permalink?: string;
}

const TrackCard = ({ 
  id,
  title, 
  artist, 
  artwork, 
  duration, 
  likes, 
  isNft = false, 
  price,
  fanClubOnly = false,
  streamUrl = '',
  permalink = ''
}: TrackCardProps) => {
  const { likeTrack, collectTrack, shareTrack, isConnected } = useTrackInteractions();
  const { playTrack, currentTrack, isPlaying } = useAudioPlayer();
  const [isCollecting, setIsCollecting] = React.useState(false);

  const trackData = {
    id,
    title,
    artist,
    artwork,
    streamUrl,
    duration: parseInt(duration.split(':')[0]) * 60 + parseInt(duration.split(':')[1])
  };

  const isCurrentTrack = currentTrack?.id === id;
  const isTrackPlaying = isCurrentTrack && isPlaying;

  const handlePlay = async () => {
    await playTrack(trackData);
  };

  const handleLike = async () => {
    await likeTrack(id, artist.toLowerCase().replace(/\s+/g, '-'));
  };

  const handleCollect = async () => {
    if (!isNft || !price) return;
    setIsCollecting(true);
    await collectTrack(id, `nft-contract-${id}`, price);
    setIsCollecting(false);
  };

  const handleShare = async () => {
    await shareTrack(id);
  };
  return (
    <div className="glass-panel rounded-2xl overflow-hidden group hover:scale-[1.02] transition-all duration-300">
      {/* Artwork */}
      <div className="relative aspect-square overflow-hidden">
        <img 
          src={artwork} 
          alt={`${title} by ${artist}`}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
            <Button 
              size="sm" 
              className="glass-button bg-primary/20 hover:bg-primary/30"
              onClick={handlePlay}
            >
              {isTrackPlaying ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </Button>
            <div className="flex items-center space-x-2">
              <Button 
                size="sm" 
                variant="ghost" 
                className="text-white hover:text-primary"
                onClick={handleLike}
              >
                <Heart className="w-4 h-4" />
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                className="text-white hover:text-primary"
                onClick={handleShare}
              >
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Status Badges */}
        <div className="absolute top-3 left-3 flex flex-col space-y-2">
          {isNft && (
            <Badge variant="secondary" className="glass-panel bg-accent/20 text-accent-foreground">
              <Gem className="w-3 h-3 mr-1" />
              NFT
            </Badge>
          )}
          {fanClubOnly && (
            <Badge variant="secondary" className="glass-panel bg-secondary/20 text-secondary-foreground">
              <Users className="w-3 h-3 mr-1" />
              Fan Club
            </Badge>
          )}
        </div>
        
        {/* Price Badge */}
        {price && (
          <div className="absolute top-3 right-3">
            <Badge variant="outline" className="glass-panel bg-background/20 text-foreground">
              <Zap className="w-3 h-3 mr-1" />
              {price} TON
            </Badge>
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-foreground text-sm line-clamp-1 group-hover:text-aurora transition-colors">
            {title}
          </h3>
          <p className="text-muted-foreground text-xs">{artist}</p>
        </div>
        
        {/* ... keep existing code */}
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center space-x-4">
            <span>{duration}</span>
            <div className="flex items-center space-x-1">
              <Heart className="w-3 h-3" />
              <span>{likes.toLocaleString()}</span>
            </div>
          </div>
          
          {isNft && price && (
            <Button 
              size="sm" 
              variant="aurora" 
              className="text-xs px-3 py-1 h-7"
              onClick={handleCollect}
              disabled={isCollecting || !isConnected}
            >
              {isCollecting ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                  Collecting...
                </>
              ) : (
                <>
                  <ShoppingCart className="w-3 h-3 mr-1" />
                  Collect
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrackCard;