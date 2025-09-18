import React, { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { useWalletStore } from '@/stores/walletStore';
import { useToast } from '@/hooks/use-toast';
import { 
  Play, 
  Heart, 
  Share2, 
  ShoppingCart, 
  Music, 
  Clock, 
  Star,
  Eye,
  Info,
  TrendingUp
} from 'lucide-react';

interface NFTCardProps {
  id: string;
  title: string;
  artist: string;
  artistId: string;
  artistAvatar: string;
  price: number;
  currency: 'TON' | 'USD' | 'AUDIO';
  artwork: string;
  genre: string;
  duration: string;
  likes: number;
  views: number;
  listedDate: string;
  isVerified: boolean;
  isExclusive: boolean;
  royalty: number;
  description: string;
  onPurchase?: (id: string) => void;
  className?: string;
}

export const NFTCard: React.FC<NFTCardProps> = ({
  id,
  title,
  artist,
  artistId,
  artistAvatar,
  price,
  currency,
  artwork,
  genre,
  duration,
  likes,
  views,
  listedDate,
  isVerified,
  isExclusive,
  royalty,
  description,
  onPurchase,
  className = ''
}) => {
  const { isAuthenticated } = useAuth();
  const { isConnected } = useWalletStore();
  const { toast } = useToast();
  const [isLiked, setIsLiked] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const handleLike = () => {
    if (!isAuthenticated && !isConnected) {
      toast({
        title: "Authentication Required",
        description: "Please sign in or connect your wallet to like NFTs",
        variant: "destructive",
      });
      return;
    }
    
    setIsLiked(!isLiked);
    toast({
      title: isLiked ? "Removed from favorites" : "Added to favorites",
      description: `${title} by ${artist}`,
    });
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/marketplace/nft/${id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${title} by ${artist}`,
          text: description,
          url: shareUrl,
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link Copied",
        description: "NFT link copied to clipboard",
      });
    }
  };

  const handlePurchase = async () => {
    if (!isAuthenticated && !isConnected) {
      toast({
        title: "Authentication Required",
        description: "Please sign in or connect your wallet to purchase NFTs",
        variant: "destructive",
      });
      return;
    }

    setIsPurchasing(true);
    try {
      if (onPurchase) {
        await onPurchase(id);
      }
      
      toast({
        title: "Purchase Initiated",
        description: `Purchasing ${title} for ${price} ${currency}`,
      });
    } catch (error) {
      toast({
        title: "Purchase Failed",
        description: "There was an error processing your purchase",
        variant: "destructive",
      });
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <Card className={`glass-panel border-glass hover:scale-[1.02] transition-all duration-300 group ${className}`}>
      <div className="relative">
        {/* Artwork */}
        <div className="aspect-square overflow-hidden rounded-t-lg">
          <img
            src={artwork}
            alt={`${title} by ${artist}`}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            loading="lazy"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(title)}&background=6366f1&color=fff&size=400`;
            }}
          />
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
              <Button size="sm" variant="aurora" className="gap-2">
                <Play className="h-3 w-3" />
                Preview
              </Button>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="text-white hover:text-primary"
                  onClick={handleLike}
                >
                  <Heart className={`h-4 w-4 ${isLiked ? 'fill-current text-red-500' : ''}`} />
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="text-white hover:text-primary"
                  onClick={handleShare}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="text-white hover:text-primary"
                    >
                      <Info className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="glass-panel">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Music className="h-5 w-5" />
                        NFT Details
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={artistAvatar} />
                          <AvatarFallback>
                            <Music className="h-6 w-6" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold">{title}</h3>
                          <p className="text-sm text-muted-foreground">by {artist}</p>
                        </div>
                      </div>
                      
                      <p className="text-sm">{description}</p>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Price:</span>
                          <p className="font-medium">{price} {currency}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Royalty:</span>
                          <p className="font-medium">{royalty}%</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Duration:</span>
                          <p className="font-medium">{duration}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Genre:</span>
                          <p className="font-medium">{genre}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Views:</span>
                          <p className="font-medium">{views.toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Listed:</span>
                          <p className="font-medium">{new Date(listedDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>

        {/* Status Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {isExclusive && (
            <Badge variant="secondary" className="bg-accent/20 text-accent">
              <Star className="h-3 w-3 mr-1" />
              Exclusive
            </Badge>
          )}
          {isVerified && (
            <Badge variant="secondary" className="bg-primary/20 text-primary">
              ✓ Verified
            </Badge>
          )}
        </div>

        {/* Price Badge */}
        <div className="absolute top-3 right-3">
          <Badge variant="outline" className="glass-panel bg-background/20 text-foreground font-bold">
            {price} {currency}
          </Badge>
        </div>
      </div>

      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Title and Artist */}
          <div>
            <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-aurora transition-colors">
              {title}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <Avatar className="h-5 w-5">
                <AvatarImage src={artistAvatar} />
                <AvatarFallback>
                  <Music className="h-3 w-3" />
                </AvatarFallback>
              </Avatar>
              <p className="text-sm text-muted-foreground">{artist}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {duration}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="h-3 w-3" />
                {likes}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {views}
              </span>
            </div>
            <Badge variant="outline" className="text-xs">
              {genre}
            </Badge>
          </div>

          {/* Purchase Button */}
          <Button
            onClick={handlePurchase}
            className="w-full gap-2"
            disabled={!isConnected && !isAuthenticated || isPurchasing}
          >
            <ShoppingCart className="h-4 w-4" />
            {isPurchasing ? 'Processing...' : `Buy for ${price} ${currency}`}
          </Button>

          {(!isConnected && !isAuthenticated) && (
            <p className="text-xs text-muted-foreground text-center">
              Connect wallet or sign in to purchase
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};