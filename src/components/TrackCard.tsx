import React, { useState, memo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTrackInteractions } from '@/hooks/useTrackInteractions';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { useWeb3 } from '@/hooks/useWeb3';
import { SocialTrackActions } from './SocialTrackActions';
import { NFTMintModal } from './NFTMintModal';
import { TipModal } from './TipModal';
import { MiniEQVisualizer } from './MiniEQVisualizer';
import { MiniVolumeControl } from './MiniVolumeControl';
import { 
  Play, 
  Heart, 
  Share2, 
  Zap,
  Users,
  Gem,
  Loader2,
  ShoppingCart,
  Sparkles,
  MoreHorizontal,
  Coins
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
  artistId?: string;
  artistAvatar?: string;
  artistWallet?: string;
}

const TrackCard = memo(({ 
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
  permalink = '',
  artistId = '',
  artistAvatar = '',
  artistWallet = ''
}: TrackCardProps) => {
  const { likeTrack, collectTrack, shareTrack, isConnected } = useTrackInteractions();
  const { playTrack, currentTrack, isPlaying } = useAudioPlayer();
  const { connectWallet } = useWeb3();
  const [isCollecting, setIsCollecting] = useState(false);
  const [showNFTModal, setShowNFTModal] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);

  const trackData = {
    id,
    title,
    artist,
    artwork,
    streamUrl,
    duration: parseInt(duration.split(':')[0]) * 60 + parseInt(duration.split(':')[1])
  };

  const artistData = {
    id: artistId,
    name: artist,
    avatar: artistAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(artist)}&background=6366f1&color=fff`,
    walletAddress: artistWallet
  };

  const isCurrentTrack = currentTrack?.id === id;
  const isTrackPlaying = isCurrentTrack && isPlaying;

  const handlePlay = useCallback(async () => {
    await playTrack(trackData);
  }, [playTrack, trackData]);

  const handleLike = useCallback(async () => {
    await likeTrack(id, artistId || artist.toLowerCase().replace(/\s+/g, '-'));
  }, [likeTrack, id, artistId, artist]);

  const handleCollect = useCallback(async () => {
    if (!isNft || !price) return;
    setIsCollecting(true);
    try {
      await collectTrack(id, `nft-contract-${id}`, price);
    } finally {
      setIsCollecting(false);
    }
  }, [isNft, price, collectTrack, id]);

  const handleShare = useCallback(async () => {
    await shareTrack(id);
  }, [shareTrack, id]);

  const handleMintNFT = useCallback(() => {
    if (!isConnected) {
      connectWallet();
      return;
    }
    setShowNFTModal(true);
  }, [isConnected, connectWallet]);

  const handleTipArtist = useCallback(() => {
    if (!isConnected) {
      connectWallet();
      return;
    }
    setShowTipModal(true);
  }, [isConnected, connectWallet]);

  return (
    <>
      <div className={`glass-panel rounded-2xl overflow-hidden group transition-all duration-300 ${
        isCurrentTrack 
          ? 'scale-[1.05] ring-2 ring-primary/50 shadow-lg shadow-primary/20 hover:scale-[1.06]' 
          : 'hover:scale-[1.02]'
      }`}>
        {/* Artwork */}
        <div className="relative aspect-square overflow-hidden bg-muted/20">
          <img 
            src={artwork} 
            alt={`${title} by ${artist}`}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(title)}&background=6366f1&color=fff&size=400`;
            }}
          />
          
          {/* Overlay */}
          <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity duration-300 ${
            isCurrentTrack ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          } pointer-events-none`}>
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-auto">
              <Button 
                size="sm" 
                className={`glass-button transition-all duration-200 ${
                  isCurrentTrack 
                    ? 'bg-primary/40 hover:bg-primary/50 ring-1 ring-primary/30' 
                    : 'bg-primary/20 hover:bg-primary/30'
                }`}
                onClick={handlePlay}
              >
                {isTrackPlaying ? (
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </Button>
              <div className="flex items-center space-x-2">
                {/* EQ Visualizer - shows when track is playing */}
                {isTrackPlaying && (
                  <div className="flex items-center gap-1">
                    <MiniEQVisualizer isPlaying={isTrackPlaying} size="sm" />
                    <MiniVolumeControl />
                  </div>
                )}
                <SocialTrackActions 
                  trackId={id}
                  artistId={artistId || artist.toLowerCase().replace(/\s+/g, '-')}
                  className="flex items-center space-x-1"
                  showFollowButton={false}
                />
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

      {/* Modals */}
      <NFTMintModal 
        open={showNFTModal}
        onClose={() => setShowNFTModal(false)}
        track={trackData}
      />
      
      <TipModal 
        open={showTipModal}
        onClose={() => setShowTipModal(false)}
        artist={artistData}
        track={{ id, title }}
      />
    </>
  );
});

TrackCard.displayName = 'TrackCard';

export default TrackCard;