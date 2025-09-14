import React, { useState, memo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTrackInteractions } from '@/hooks/useTrackInteractions';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { useWeb3 } from '@/hooks/useWeb3';
import { useSocial } from '@/hooks/useSocial';
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

export interface TrackCardProps {
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
  canMintNFT?: boolean;
  onPlay?: () => void;
  onLike?: () => void;
  onCollect?: () => void;
  onAction?: (trackId: string, action: 'mint' | 'tip' | 'collect') => void;
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
  artistWallet = '',
  canMintNFT = false,
  onPlay,
  onLike,
  onCollect,
  onAction
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

  // Favorites state for this track
  const { useFavoriteStatus } = useSocial();
  const { isFavorited, toggleFavorite, loading: favLoading } = useFavoriteStatus(id);

  const handlePlay = useCallback(async () => {
    if (onPlay) {
      onPlay();
    } else {
      await playTrack(trackData);
    }
  }, [onPlay, playTrack, trackData]);

  const handleLike = useCallback(async () => {
    if (onLike) {
      onLike();
    } else {
      await toggleFavorite(artistId || artist.toLowerCase().replace(/\s+/g, '-'));
    }
  }, [onLike, toggleFavorite, id, artistId, artist]);

  const handleCollect = useCallback(async () => {
    if (!isNft || !price) return;
    setIsCollecting(true);
    try {
      if (onCollect) {
        onCollect();
      } else {
        await collectTrack(id, `nft-contract-${id}`, price);
      }
    } finally {
      setIsCollecting(false);
    }
  }, [isNft, price, onCollect, collectTrack, id]);

  const handleShare = useCallback(async () => {
    await shareTrack(id);
  }, [shareTrack, id]);

  const handleMintNFT = useCallback(() => {
    if (!isConnected) {
      connectWallet();
      return;
    }
    if (onAction) {
      onAction(id, 'mint');
    } else {
      setShowNFTModal(true);
    }
  }, [isConnected, connectWallet, onAction, id]);

  const handleTipArtist = useCallback(() => {
    if (!isConnected) {
      connectWallet();
      return;
    }
    if (onAction) {
      onAction(id, 'tip');
    } else {
      setShowTipModal(true);
    }
  }, [isConnected, connectWallet, onAction, id]);

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
            <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent transition-all duration-500 ${
            isCurrentTrack ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          } pointer-events-none`}>
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-auto">
              <Button 
                size="sm" 
                className={`glass-button h-10 w-10 rounded-full transition-all duration-300 hover:scale-110 shadow-lg ${
                  isCurrentTrack 
                    ? 'bg-primary/60 hover:bg-primary/70 ring-2 ring-primary/50 shadow-primary/30' 
                    : 'bg-primary/30 hover:bg-primary/50 ring-1 ring-primary/20'
                }`}
                onClick={handlePlay}
              >
                {isTrackPlaying ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                ) : (
                  <Play className="w-4 h-4 ml-0.5" fill="currentColor" />
                )}
              </Button>
              
              <div className="flex items-center gap-2">
                {/* EQ Visualizer - shows when track is playing */}
                {isTrackPlaying && (
                  <div className="flex items-center gap-2 animate-fade-in">
                    <MiniEQVisualizer isPlaying={isTrackPlaying} size="sm" />
                    <MiniVolumeControl />
                  </div>
                )}
                
                {/* Action buttons */}
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleLike}
                    disabled={favLoading}
                    className={`h-8 w-8 rounded-full backdrop-blur-md bg-background/30 hover:bg-background/50 border border-white/20 hover:border-primary/40 hover:scale-110 transition-all duration-200 ${isFavorited ? 'text-primary' : 'text-white'} hover:text-primary`}
                    title="Like track"
                  >
                    <Heart className="w-4 h-4" />
                  </Button>
                  
                  {canMintNFT && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleMintNFT}
                      className="h-8 w-8 rounded-full backdrop-blur-md bg-gradient-to-r from-primary/30 to-accent/30 hover:from-primary/50 hover:to-accent/50 border border-primary/20 hover:border-primary/40 hover:scale-110 transition-all duration-200 text-white shadow-lg hover:shadow-primary/20"
                      title="Mint NFT"
                    >
                      <Sparkles className="w-4 h-4" />
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleTipArtist}
                    className="h-8 w-8 rounded-full backdrop-blur-md bg-background/30 hover:bg-background/50 border border-white/20 hover:border-accent/40 hover:scale-110 transition-all duration-200 text-white hover:text-accent"
                    title="Tip Artist"
                  >
                    <Coins className="w-4 h-4" />
                  </Button>
                </div>
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