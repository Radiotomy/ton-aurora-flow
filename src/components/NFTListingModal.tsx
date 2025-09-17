import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { useWeb3 } from '@/hooks/useWeb3';
import { useToast } from '@/hooks/use-toast';
import { NFTMarketplaceService } from '@/services/nftMarketplaceService';
import { supabase } from '@/integrations/supabase/client';
import { 
  Tag, 
  DollarSign, 
  Calendar, 
  Info,
  Music,
  Star,
  TrendingUp
} from 'lucide-react';

interface UserAsset {
  id: string;
  asset_type: string;
  contract_address: string | null;
  token_id: string | null;
  metadata: any;
  created_at: string;
}

interface NFTListingModalProps {
  open: boolean;
  onClose: () => void;
  onListingCreated: () => void;
  preselectedNFT?: UserAsset | null;
}

export const NFTListingModal: React.FC<NFTListingModalProps> = ({
  open,
  onClose,
  onListingCreated,
  preselectedNFT
}) => {
  const { profile } = useWeb3();
  const { toast } = useToast();
  
  const [userNFTs, setUserNFTs] = useState<UserAsset[]>([]);
  const [selectedNFT, setSelectedNFT] = useState<string>('');
  const [price, setPrice] = useState('1.0');
  const [currency, setCurrency] = useState<'TON' | 'AUDIO'>('TON');
  const [royaltyPercentage, setRoyaltyPercentage] = useState([2.5]);
  const [duration, setDuration] = useState('30');
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && profile?.id) {
      loadUserNFTs();
    }
  }, [open, profile?.id]);

  useEffect(() => {
    if (preselectedNFT) {
      setSelectedNFT(preselectedNFT.id);
    }
  }, [preselectedNFT]);

  const loadUserNFTs = async () => {
    if (!profile?.id) return;
    
    try {
      setLoading(true);
      
      // Get user's NFTs that aren't currently listed
      const { data: assets, error: assetsError } = await supabase
        .from('user_assets')
        .select('*')
        .eq('profile_id', profile.id)
        .eq('asset_type', 'nft');

      if (assetsError) throw assetsError;

      // Filter out already listed NFTs
      const { data: activeListings, error: listingsError } = await supabase
        .from('nft_marketplace')
        .select('nft_id')
        .eq('seller_profile_id', profile.id)
        .eq('status', 'active');

      if (listingsError) throw listingsError;

      const listedNFTIds = new Set(activeListings?.map(l => l.nft_id) || []);
      const availableNFTs = assets?.filter(nft => !listedNFTIds.has(nft.id)) || [];
      
      setUserNFTs(availableNFTs);

    } catch (error) {
      console.error('Error loading user NFTs:', error);
      toast({
        title: "Error",
        description: "Failed to load your NFTs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedNFTData = userNFTs.find(nft => nft.id === selectedNFT);

  const handleListNFT = async () => {
    if (!profile?.id || !selectedNFT) {
      toast({
        title: "Error",
        description: "Please select an NFT to list",
        variant: "destructive",
      });
      return;
    }

    const priceNum = parseFloat(price);
    if (priceNum <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid price",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);

      // Get NFT metadata for listing
      const nftData = userNFTs.find(nft => nft.id === selectedNFT);
      const metadata = {
        trackId: nftData?.metadata?.trackId,
        artistId: nftData?.metadata?.artistId,
        trackTitle: nftData?.metadata?.trackTitle,
        artistName: nftData?.metadata?.artistName,
        artworkUrl: nftData?.metadata?.artworkUrl,
        tier: nftData?.metadata?.tier
      };

      const listing = await NFTMarketplaceService.listNFT(
        profile.id,
        selectedNFT,
        priceNum,
        currency,
        royaltyPercentage[0],
        metadata
      );

      toast({
        title: "NFT Listed Successfully",
        description: `Your NFT is now listed for ${priceNum} ${currency}`,
      });

      onListingCreated();
      onClose();
      resetForm();

    } catch (error) {
      console.error('Error listing NFT:', error);
      toast({
        title: "Listing Failed",
        description: error instanceof Error ? error.message : "Failed to list NFT",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setSelectedNFT('');
    setPrice('1.0');
    setCurrency('TON');
    setRoyaltyPercentage([2.5]);
    setDuration('30');
  };

  const calculateFees = () => {
    const priceNum = parseFloat(price) || 0;
    const marketplaceFee = priceNum * 0.025; // 2.5%
    const royaltyFee = priceNum * (royaltyPercentage[0] / 100);
    const sellerReceives = priceNum - marketplaceFee - royaltyFee;
    
    return {
      marketplaceFee,
      royaltyFee,
      sellerReceives
    };
  };

  const fees = calculateFees();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass-panel max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            List NFT for Sale
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* NFT Selection */}
          <div className="space-y-4">
            <Label>Select NFT to List</Label>
            {loading ? (
              <div className="animate-pulse">
                <div className="h-10 bg-muted rounded" />
              </div>
            ) : userNFTs.length > 0 ? (
              <Select value={selectedNFT} onValueChange={setSelectedNFT}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an NFT from your collection" />
                </SelectTrigger>
                <SelectContent>
                  {userNFTs.map((nft) => (
                    <SelectItem key={nft.id} value={nft.id}>
                      <div className="flex items-center gap-3">
                        <img
                          src={nft.metadata?.artworkUrl || ''}
                          alt={nft.metadata?.trackTitle || 'NFT'}
                          className="w-8 h-8 rounded object-cover"
                        />
                        <div>
                          <p className="font-medium">
                            {nft.metadata?.trackTitle || 'Untitled NFT'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {nft.metadata?.artistName || 'Unknown Artist'}
                          </p>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Card className="border-dashed">
                <CardContent className="p-6 text-center">
                  <Music className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                  <p className="text-muted-foreground">
                    No NFTs available to list. All your NFTs may already be listed or you don't own any NFTs yet.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Selected NFT Preview */}
          {selectedNFTData && (
            <Card className="glass-panel border-glass">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <img
                    src={selectedNFTData.metadata?.artworkUrl || ''}
                    alt={selectedNFTData.metadata?.trackTitle || 'NFT'}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold">
                      {selectedNFTData.metadata?.trackTitle || 'Untitled NFT'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedNFTData.metadata?.artistName || 'Unknown Artist'}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">
                        {selectedNFTData.metadata?.tier || 'Bronze'} Tier
                      </Badge>
                      <Badge variant="secondary">
                        <Music className="h-3 w-3 mr-1" />
                        NFT
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Listing Price</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="price"
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="1.0"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={currency} onValueChange={(value: 'TON' | 'AUDIO') => setCurrency(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TON">TON</SelectItem>
                  <SelectItem value="AUDIO">AUDIO</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Royalty Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Royalty Percentage</Label>
              <span className="text-sm font-medium">{royaltyPercentage[0]}%</span>
            </div>
            <Slider
              value={royaltyPercentage}
              onValueChange={setRoyaltyPercentage}
              max={10}
              min={0}
              step={0.5}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Royalty paid to the original artist on secondary sales
            </p>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label>Listing Duration (Days)</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="14">14 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="60">60 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Fee Breakdown */}
          {parseFloat(price) > 0 && (
            <Card className="glass-panel border-glass">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <Info className="h-4 w-4" />
                    <h4 className="font-medium">Fee Breakdown</h4>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Listing Price</span>
                      <span className="font-medium">{price} {currency}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Marketplace Fee (2.5%)</span>
                      <span>-{fees.marketplaceFee.toFixed(3)} {currency}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Artist Royalty ({royaltyPercentage[0]}%)</span>
                      <span>-{fees.royaltyFee.toFixed(3)} {currency}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between font-medium">
                      <span>You Receive</span>
                      <span className="text-success">{fees.sellerReceives.toFixed(3)} {currency}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleListNFT}
              className="flex-1 gap-2"
              disabled={!selectedNFT || isProcessing || parseFloat(price) <= 0}
            >
              <Tag className="h-4 w-4" />
              {isProcessing ? 'Listing...' : `List for ${price} ${currency}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};