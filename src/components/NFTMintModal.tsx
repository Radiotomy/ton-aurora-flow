import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useWeb3 } from '@/hooks/useWeb3';
import { useToast } from '@/hooks/use-toast';
import { Music, Sparkles, Coins, Clock } from 'lucide-react';

interface NFTMintModalProps {
  open: boolean;
  onClose: () => void;
  track: {
    id: string;
    title: string;
    artist: string;
    artwork: string;
    duration: number;
  };
}

interface MintTier {
  name: string;
  price: number;
  supply: number;
  features: string[];
  rarity: 'common' | 'rare' | 'legendary';
}

const mintTiers: MintTier[] = [
  {
    name: 'Standard Edition',
    price: 0.5,
    supply: 1000,
    features: ['High-quality audio', 'Digital artwork', 'Ownership certificate'],
    rarity: 'common'
  },
  {
    name: 'Deluxe Edition',
    price: 2.0,
    supply: 100,
    features: ['Lossless audio', 'Exclusive artwork', 'Artist signature', 'Behind-the-scenes content'],
    rarity: 'rare'
  },
  {
    name: 'Genesis Edition',
    price: 10.0,
    supply: 10,
    features: ['Studio masters', 'Animated artwork', 'Personal message', 'VIP fan club access', 'Future royalties'],
    rarity: 'legendary'
  }
];

const getRarityColor = (rarity: string) => {
  switch (rarity) {
    case 'common': return 'bg-secondary';
    case 'rare': return 'bg-primary';
    case 'legendary': return 'bg-aurora';
    default: return 'bg-secondary';
  }
};

export const NFTMintModal: React.FC<NFTMintModalProps> = ({ open, onClose, track }) => {
  const [selectedTier, setSelectedTier] = useState<MintTier>(mintTiers[0]);
  const [quantity, setQuantity] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const { isConnected, sendTransaction, connectWallet } = useWeb3();
  const { toast } = useToast();

  const totalPrice = selectedTier.price * quantity;

  const handleMint = async () => {
    if (!isConnected) {
      await connectWallet();
      return;
    }

    setIsProcessing(true);
    try {
      // Smart contract interaction for NFT minting
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 60,
        messages: [{
          address: 'EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t', // NFT contract address
          amount: (totalPrice * 1e9).toString(), // Convert TON to nanoTON
          payload: btoa(JSON.stringify({
            method: 'mint_nft',
            params: {
              track_id: track.id,
              tier: selectedTier.name,
              quantity: quantity,
              recipient: 'user_wallet_address' // Will be filled by wallet
            }
          }))
        }]
      };

      await sendTransaction(transaction);
      
      toast({
        title: "NFT Minted Successfully! 🎉",
        description: `${quantity}x ${selectedTier.name} for "${track.title}" minted`,
      });
      
      onClose();
    } catch (error) {
      console.error('Minting failed:', error);
      toast({
        title: "Minting Failed",
        description: "Please try again or check your wallet connection.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Mint Music NFT
          </DialogTitle>
        </DialogHeader>

        {/* Track Preview */}
        <Card className="glass-panel p-4">
          <div className="flex items-center gap-4">
            <img 
              src={track.artwork} 
              alt={track.title}
              className="w-16 h-16 rounded-lg object-cover"
            />
            <div className="flex-1">
              <h3 className="font-semibold">{track.title}</h3>
              <p className="text-muted-foreground">{track.artist}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Clock className="h-3 w-3" />
                {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
              </div>
            </div>
          </div>
        </Card>

        {/* Mint Tiers */}
        <div className="space-y-4">
          <h3 className="font-semibold">Choose Edition</h3>
          <div className="grid gap-3">
            {mintTiers.map((tier) => (
              <Card 
                key={tier.name}
                className={`cursor-pointer transition-all ${
                  selectedTier.name === tier.name 
                    ? 'ring-2 ring-primary glass-panel-active' 
                    : 'glass-panel hover:glass-panel-hover'
                }`}
                onClick={() => setSelectedTier(tier)}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <h4 className="font-semibold">{tier.name}</h4>
                      <Badge className={getRarityColor(tier.rarity)}>
                        {tier.rarity.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">{tier.price} TON</div>
                      <div className="text-sm text-muted-foreground">{tier.supply} available</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {tier.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <Music className="h-3 w-3 text-primary flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Quantity Selection */}
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity</Label>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
            >
              -
            </Button>
            <Input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-20 text-center"
              min="1"
              max="10"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuantity(Math.min(10, quantity + 1))}
              disabled={quantity >= 10}
            >
              +
            </Button>
          </div>
        </div>

        <Separator />

        {/* Price Summary */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span>Price per NFT:</span>
            <span className="font-medium">{selectedTier.price} TON</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Quantity:</span>
            <span className="font-medium">{quantity}</span>
          </div>
          <Separator />
          <div className="flex justify-between items-center text-lg font-bold">
            <span>Total:</span>
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-primary" />
              <span>{totalPrice} TON</span>
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
            {isProcessing ? 'Processing...' : isConnected ? 'Mint NFT' : 'Connect Wallet'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};