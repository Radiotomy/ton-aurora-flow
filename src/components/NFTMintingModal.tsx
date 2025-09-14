import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, Crown, Diamond } from 'lucide-react';
import { NFTService, NFTMintRequest } from '@/services/nftService';
import { useWeb3 } from '@/hooks/useWeb3';
import { toast } from 'sonner';

interface NFTMintingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track?: {
    id: string;
    title: string;
    artist: string;
    artwork_url?: string;
  };
}

export const NFTMintingModal = ({ open, onOpenChange, track }: NFTMintingModalProps) => {
  const { sendTransaction, isConnected, walletAddress } = useWeb3();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    tier: 'basic' as 'basic' | 'premium' | 'exclusive',
    name: '',
    description: '',
    customPrice: '',
  });

  const tierConfig = {
    basic: {
      icon: Sparkles,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10',
      borderColor: 'border-blue-400/20',
      price: '0.1',
      features: ['Standard artwork', 'Basic metadata', 'Resellable'],
    },
    premium: {
      icon: Crown,
      color: 'text-purple-400',
      bgColor: 'bg-purple-400/10',
      borderColor: 'border-purple-400/20',
      price: '0.5',
      features: ['Enhanced artwork', 'Rich metadata', 'Artist signature', 'Resellable'],
    },
    exclusive: {
      icon: Diamond,
      color: 'text-amber-400',
      bgColor: 'bg-amber-400/10',
      borderColor: 'border-amber-400/20',
      price: '2.0',
      features: ['Exclusive artwork', 'Full metadata suite', 'Artist signature', 'Royalties included', 'Limited edition'],
    },
  };

  const handleMint = useCallback(async () => {
    if (!isConnected || !sendTransaction || !track || !walletAddress) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!formData.name.trim()) {
      toast.error('Please enter an NFT name');
      return;
    }

    setIsLoading(true);

    try {
      const mintRequest: NFTMintRequest = {
        trackId: track.id,
        artistId: track.artist.toLowerCase().replace(/\s+/g, '-'),
        tier: formData.tier,
        metadata: {
          name: formData.name.trim(),
          description: formData.description.trim() || `${formData.tier} edition NFT for "${track.title}" by ${track.artist}`,
          image: track.artwork_url || '/placeholder.svg',
          attributes: [
            { trait_type: 'Track', value: track.title },
            { trait_type: 'Artist', value: track.artist },
            { trait_type: 'Tier', value: formData.tier },
            { trait_type: 'Edition Type', value: tierConfig[formData.tier].features.join(', ') },
          ],
        },
        price: formData.customPrice || undefined,
      };

      const result = await NFTService.mintTrackNFT(sendTransaction, walletAddress, mintRequest);

      if (result.success) {
        toast.success('NFT minted successfully!');
        onOpenChange(false);
        
        // Reset form
        setFormData({
          tier: 'basic',
          name: '',
          description: '',
          customPrice: '',
        });
      } else {
        toast.error(result.error || 'Failed to mint NFT');
      }
    } catch (error: any) {
      console.error('Mint error:', error);
      toast.error(error.message || 'Failed to mint NFT');
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, sendTransaction, walletAddress, track, formData, onOpenChange]);

  if (!track) return null;

  const selectedTier = tierConfig[formData.tier];
  const TierIcon = selectedTier.icon;
  const finalPrice = formData.customPrice || selectedTier.price;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card/95 backdrop-blur-xl border-primary/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Mint Track NFT
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Track Info */}
          <div className="space-y-4">
            <Card className={`${selectedTier.bgColor} ${selectedTier.borderColor} border-2`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground">Track Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <img
                    src={track.artwork_url || '/placeholder.svg'}
                    alt={track.title}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div>
                    <h3 className="font-semibold">{track.title}</h3>
                    <p className="text-sm text-muted-foreground">{track.artist}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* NFT Details Form */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="nft-name">NFT Name *</Label>
                <Input
                  id="nft-name"
                  placeholder={`${track.title} - ${formData.tier} Edition`}
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="nft-description">Description</Label>
                <Textarea
                  id="nft-description"
                  placeholder="Optional description for your NFT..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Tier Selection & Pricing */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="tier-select">NFT Tier</Label>
              <Select
                value={formData.tier}
                onValueChange={(value: 'basic' | 'premium' | 'exclusive') => 
                  setFormData(prev => ({ ...prev, tier: value }))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(tierConfig).map(([tier, config]) => {
                    const Icon = config.icon;
                    return (
                      <SelectItem key={tier} value={tier}>
                        <div className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${config.color}`} />
                          <span className="capitalize">{tier}</span>
                          <Badge variant="outline" className="ml-2">
                            {config.price} TON
                          </Badge>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Tier Features */}
            <Card className={`${selectedTier.bgColor} ${selectedTier.borderColor} border`}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <TierIcon className={`w-4 h-4 ${selectedTier.color}`} />
                  {formData.tier.charAt(0).toUpperCase() + formData.tier.slice(1)} Edition
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-lg font-bold">{finalPrice} TON</div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {selectedTier.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-primary rounded-full" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Custom Price */}
            <div>
              <Label htmlFor="custom-price">Custom Price (optional)</Label>
              <Input
                id="custom-price"
                type="number"
                step="0.01"
                placeholder={`Default: ${selectedTier.price} TON`}
                value={formData.customPrice}
                onChange={(e) => setFormData(prev => ({ ...prev, customPrice: e.target.value }))}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty to use tier default
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-4 border-t border-border/50">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          
          <Button
            onClick={handleMint}
            disabled={!isConnected || isLoading || !formData.name.trim()}
            className="min-w-[120px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Minting...
              </>
            ) : (
              <>
                <TierIcon className="w-4 h-4 mr-2" />
                Mint NFT
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};