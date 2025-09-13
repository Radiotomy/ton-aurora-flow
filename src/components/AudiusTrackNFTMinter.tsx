import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { useWeb3 } from '@/hooks/useWeb3';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AudiusTrack } from '@/services/audiusService';
import { SmartContractHelper } from '@/utils/smartContracts';
import { Sparkles, Music, Clock, Users, DollarSign } from 'lucide-react';

interface AudiusTrackNFTMinterProps {
  open: boolean;
  onClose: () => void;
  track: AudiusTrack;
}

interface NFTTier {
  name: string;
  price: number;
  supply: number;
  royalty: number;
  features: string[];
  rarity: 'standard' | 'premium' | 'exclusive';
}

const nftTiers: NFTTier[] = [
  {
    name: 'Standard Edition',
    price: 0.5,
    supply: 1000,
    royalty: 5,
    features: ['High-quality stream', 'Album artwork', 'Ownership proof'],
    rarity: 'standard'
  },
  {
    name: 'Premium Edition',
    price: 2.0,
    supply: 100,
    royalty: 10,
    features: ['Lossless quality', 'Exclusive artwork', 'Artist credits', 'Tip artist directly'],
    rarity: 'premium'
  },
  {
    name: 'Exclusive Edition',
    price: 10.0,
    supply: 10,
    royalty: 20,
    features: ['Studio masters', 'Animated NFT', 'Fan club access', 'Revenue sharing', 'Meet & greet chance'],
    rarity: 'exclusive'
  }
];

export const AudiusTrackNFTMinter: React.FC<AudiusTrackNFTMinterProps> = ({
  open,
  onClose,
  track
}) => {
  const [selectedTier, setSelectedTier] = useState<NFTTier>(nftTiers[0]);
  const [quantity, setQuantity] = useState(1);
  const [royaltyShare, setRoyaltyShare] = useState([selectedTier.royalty]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { isConnected, sendTransaction, connectWallet, address } = useWeb3();
  const { toast } = useToast();

  const totalPrice = selectedTier.price * quantity;
  const artistShare = (totalPrice * royaltyShare[0]) / 100;
  const platformFee = totalPrice * 0.025; // 2.5% platform fee
  const netAmount = totalPrice - platformFee;

  const handleMint = async () => {
    if (!isConnected) {
      await connectWallet();
      return;
    }

    setIsProcessing(true);
    try {
      // Create NFT metadata
      const metadata = SmartContractHelper.generateNFTMetadata({
        trackId: track.id,
        title: track.title,
        artist: track.user.name,
        artistId: track.user.id,
        tier: selectedTier.name,
        artwork: track.artwork?.['1000x1000'] || track.artwork?.['480x480'] || '/placeholder.svg',
        genre: track.genre,
        duration: track.duration,
        royalty: royaltyShare[0],
        features: selectedTier.features
      });

      // Mint NFT transaction
      const mintParams = SmartContractHelper.createNFTMintPayload({
        trackId: track.id,
        tier: selectedTier.name,
        quantity,
        recipient: walletAddress!,
        metadata: {
          name: `${track.title} - ${selectedTier.name}`,
          description: `Exclusive NFT for "${track.title}" by ${track.user.name}`,
          image: track.artwork?.['1000x1000'] || '/placeholder.svg',
          attributes: [
            { trait_type: 'Artist', value: track.user.name },
            { trait_type: 'Tier', value: selectedTier.name },
            { trait_type: 'Genre', value: track.genre },
            { trait_type: 'Duration', value: track.duration },
            { trait_type: 'Royalty', value: royaltyShare[0] }
          ]
        }
      });

      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 300,
        messages: [{
          address: SmartContractHelper.CONTRACTS.NFT_COLLECTION,
          amount: SmartContractHelper.convertTonToNano(totalPrice).toString(),
          payload: mintParams
        }]
      };

      const result = await sendTransaction(transaction);

      // Record NFT creation in database
      const { error: dbError } = await supabase.from('track_collections').insert({
        track_id: track.id,
        nft_contract_address: SmartContractHelper.CONTRACTS.NFT_COLLECTION,
        purchase_price: totalPrice,
        nft_token_id: result.boc || 'pending'
      });

      if (dbError) {
        console.error('Database error:', dbError);
      }

      // Record revenue distribution
      const { error: revenueError } = await supabase.from('transactions').insert({
        transaction_hash: result.boc || 'pending',
        transaction_type: 'nft_mint',
        amount_ton: totalPrice,
        fee_ton: platformFee,
        status: 'completed',
        metadata: {
          track_id: track.id,
          artist_id: track.user.id,
          tier: selectedTier.name,
          quantity,
          royalty_percentage: royaltyShare[0],
          artist_share: artistShare
        }
      });

      if (revenueError) {
        console.error('Revenue tracking error:', revenueError);
      }

      toast({
        title: "🎉 NFT Minted Successfully!",
        description: `${quantity}x ${selectedTier.name} of "${track.title}" minted. Artist receives ${artistShare.toFixed(2)} TON.`,
      });

      onClose();
    } catch (error) {
      console.error('Minting failed:', error);
      toast({
        title: "Minting Failed",
        description: "Please check your wallet connection and try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'standard': return 'bg-secondary text-secondary-foreground';
      case 'premium': return 'bg-primary text-primary-foreground';
      case 'exclusive': return 'bg-aurora text-white';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-6 w-6 text-aurora" />
            Mint Audius Track NFT
          </DialogTitle>
        </DialogHeader>

        {/* Track Preview */}
        <Card className="glass-panel">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <img 
                src={track.artwork?.['480x480'] || '/placeholder.svg'}
                alt={track.title}
                className="w-24 h-24 rounded-xl object-cover ring-2 ring-glass-border"
              />
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-aurora truncate">{track.title}</h3>
                <p className="text-lg text-muted-foreground">{track.user.name}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {track.play_count?.toLocaleString() || 0} plays
                  </div>
                  <Badge variant="secondary">{track.genre}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* NFT Tiers */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Choose Edition</h3>
          <div className="grid gap-4">
            {nftTiers.map((tier) => (
              <Card
                key={tier.name}
                className={`cursor-pointer transition-all ${
                  selectedTier.name === tier.name 
                    ? 'ring-2 ring-aurora glass-panel-active' 
                    : 'glass-panel hover:glass-panel-hover'
                }`}
                onClick={() => {
                  setSelectedTier(tier);
                  setRoyaltyShare([tier.royalty]);
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <h4 className="font-semibold text-lg">{tier.name}</h4>
                      <Badge className={getRarityColor(tier.rarity)}>
                        {tier.rarity.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-aurora">{tier.price} TON</div>
                      <div className="text-sm text-muted-foreground">{tier.supply} max supply</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {tier.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <Music className="h-3 w-3 text-aurora flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Advanced Options */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Advanced Options</h3>
          
          {/* Quantity */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Quantity (max 5)</label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                -
              </Button>
              <span className="w-8 text-center font-medium">{quantity}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuantity(Math.min(5, quantity + 1))}
                disabled={quantity >= 5}
              >
                +
              </Button>
            </div>
          </div>

          {/* Royalty Share */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium">Artist Royalty Share</label>
              <span className="text-sm font-medium text-aurora">{royaltyShare[0]}%</span>
            </div>
            <Slider
              value={royaltyShare}
              onValueChange={setRoyaltyShare}
              max={50}
              min={5}
              step={5}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Higher royalties mean more goes to the artist from each sale
            </p>
          </div>
        </div>

        <Separator />

        {/* Revenue Breakdown */}
        <div className="space-y-3">
          <h4 className="font-semibold">Revenue Breakdown</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Total Price ({quantity}x {selectedTier.price} TON):</span>
              <span className="font-medium">{totalPrice.toFixed(2)} TON</span>
            </div>
            <div className="flex justify-between text-aurora">
              <span>Artist Share ({royaltyShare[0]}%):</span>
              <span className="font-medium">{artistShare.toFixed(2)} TON</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Platform Fee (2.5%):</span>
              <span>{platformFee.toFixed(2)} TON</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>You Pay:</span>
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-aurora" />
                <span>{totalPrice.toFixed(2)} TON</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button 
            onClick={handleMint} 
            disabled={isProcessing}
            className="flex-1"
            variant="aurora"
          >
            {isProcessing ? 'Minting...' : isConnected ? 'Mint NFT' : 'Connect Wallet'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};