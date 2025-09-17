import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NFTCard } from '@/components/NFTCard';
import { NFTListingModal } from '@/components/NFTListingModal';
import { useWeb3 } from '@/hooks/useWeb3';
import { useToast } from '@/hooks/use-toast';
import { NFTMarketplaceService, NFTListing } from '@/services/nftMarketplaceService';
import { supabase } from '@/integrations/supabase/client';
import { 
  Wallet, 
  TrendingUp, 
  Tag, 
  Grid3X3,
  Music,
  Star,
  DollarSign,
  Eye,
  Plus
} from 'lucide-react';

interface UserAsset {
  id: string;
  asset_type: string;
  contract_address: string | null;
  token_id: string | null;
  metadata: any;
  created_at: string;
}

export const UserNFTCollection: React.FC = () => {
  const { profile, isConnected } = useWeb3();
  const { toast } = useToast();
  
  const [ownedNFTs, setOwnedNFTs] = useState<UserAsset[]>([]);
  const [listedNFTs, setListedNFTs] = useState<NFTListing[]>([]);
  const [soldNFTs, setSoldNFTs] = useState<NFTListing[]>([]);
  const [purchasedNFTs, setPurchasedNFTs] = useState<NFTListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNFT, setSelectedNFT] = useState<UserAsset | null>(null);
  const [showListingModal, setShowListingModal] = useState(false);

  const [stats, setStats] = useState({
    totalOwned: 0,
    totalValue: 0,
    totalEarned: 0,
    activeListings: 0
  });

  useEffect(() => {
    if (profile?.id) {
      loadUserCollection();
    }
  }, [profile?.id]);

  const loadUserCollection = async () => {
    if (!profile?.id) return;
    
    try {
      setLoading(true);
      
      // Load owned NFTs
      const { data: assets, error: assetsError } = await supabase
        .from('user_assets')
        .select('*')
        .eq('profile_id', profile.id)
        .eq('asset_type', 'nft');

      if (assetsError) throw assetsError;
      setOwnedNFTs(assets || []);

      // Load user's listings (selling)
      const listings = await NFTMarketplaceService.getUserListings(profile.id);
      const activeListed = listings.filter(l => l.status === 'active');
      const sold = listings.filter(l => l.status === 'sold');
      
      setListedNFTs(activeListed);
      setSoldNFTs(sold);

      // Load user's purchases
      const purchases = await NFTMarketplaceService.getUserPurchases(profile.id);
      setPurchasedNFTs(purchases);

      // Calculate stats
      const totalValue = activeListed.reduce((sum, listing) => sum + listing.listingPrice, 0);
      const totalEarned = sold.reduce((sum, listing) => sum + listing.listingPrice, 0);
      
      setStats({
        totalOwned: assets?.length || 0,
        totalValue,
        totalEarned,
        activeListings: activeListed.length
      });

    } catch (error) {
      console.error('Error loading user collection:', error);
      toast({
        title: "Error",
        description: "Failed to load your NFT collection",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleListNFT = (nft: UserAsset) => {
    setSelectedNFT(nft);
    setShowListingModal(true);
  };

  const handleCancelListing = async (listingId: string) => {
    if (!profile?.id) return;

    try {
      const success = await NFTMarketplaceService.cancelListing(profile.id, listingId);
      
      if (success) {
        toast({
          title: "Listing Cancelled",
          description: "Your NFT listing has been cancelled",
        });
        await loadUserCollection();
      } else {
        toast({
          title: "Error",
          description: "Failed to cancel listing",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel listing",
        variant: "destructive",
      });
    }
  };

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <Wallet className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
        <h3 className="text-xl font-semibold mb-2">Connect Your Wallet</h3>
        <p className="text-muted-foreground">Connect your wallet to view your NFT collection</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-panel border-glass">
          <CardContent className="p-4 text-center">
            <Grid3X3 className="h-6 w-6 mx-auto text-primary mb-2" />
            <p className="text-2xl font-bold text-aurora">{stats.totalOwned}</p>
            <p className="text-sm text-muted-foreground">NFTs Owned</p>
          </CardContent>
        </Card>
        <Card className="glass-panel border-glass">
          <CardContent className="p-4 text-center">
            <Tag className="h-6 w-6 mx-auto text-secondary mb-2" />
            <p className="text-2xl font-bold text-aurora">{stats.activeListings}</p>
            <p className="text-sm text-muted-foreground">Active Listings</p>
          </CardContent>
        </Card>
        <Card className="glass-panel border-glass">
          <CardContent className="p-4 text-center">
            <DollarSign className="h-6 w-6 mx-auto text-accent mb-2" />
            <p className="text-2xl font-bold text-aurora">{stats.totalValue.toFixed(1)}</p>
            <p className="text-sm text-muted-foreground">Listed Value (TON)</p>
          </CardContent>
        </Card>
        <Card className="glass-panel border-glass">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-6 w-6 mx-auto text-success mb-2" />
            <p className="text-2xl font-bold text-aurora">{stats.totalEarned.toFixed(1)}</p>
            <p className="text-sm text-muted-foreground">Total Earned (TON)</p>
          </CardContent>
        </Card>
      </div>

      {/* Collection Tabs */}
      <Tabs defaultValue="owned" className="w-full">
        <TabsList className="glass-panel">
          <TabsTrigger value="owned">Owned ({stats.totalOwned})</TabsTrigger>
          <TabsTrigger value="listed">Listed ({stats.activeListings})</TabsTrigger>
          <TabsTrigger value="sold">Sold ({soldNFTs.length})</TabsTrigger>
          <TabsTrigger value="purchased">Purchased ({purchasedNFTs.length})</TabsTrigger>
        </TabsList>

        {/* Owned NFTs */}
        <TabsContent value="owned" className="mt-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="glass-panel animate-pulse">
                  <CardContent className="p-4 space-y-3">
                    <div className="h-48 bg-muted rounded-lg" />
                    <div className="h-4 bg-muted rounded" />
                    <div className="h-3 bg-muted rounded w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : ownedNFTs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {ownedNFTs.map((nft) => (
                <Card key={nft.id} className="glass-panel border-glass group hover:scale-[1.02] transition-all duration-300">
                  <div className="relative">
                    <div className="aspect-square overflow-hidden rounded-t-lg">
                      <img
                        src={nft.metadata?.artworkUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(nft.metadata?.trackTitle || 'NFT')}&background=6366f1&color=fff&size=400`}
                        alt={nft.metadata?.trackTitle || 'NFT'}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                    
                    <div className="absolute top-3 left-3">
                      <Badge variant="secondary" className="bg-primary/20 text-primary">
                        <Music className="h-3 w-3 mr-1" />
                        Owned
                      </Badge>
                    </div>
                  </div>
                  
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-foreground line-clamp-1">
                          {nft.metadata?.trackTitle || 'Untitled NFT'}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {nft.metadata?.artistName || 'Unknown Artist'}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Tier: {nft.metadata?.tier || 'Bronze'}</span>
                        <span>Owned since {new Date(nft.created_at).toLocaleDateString()}</span>
                      </div>
                      
                      <Button
                        onClick={() => handleListNFT(nft)}
                        className="w-full gap-2"
                        variant="outline"
                      >
                        <Tag className="h-4 w-4" />
                        List for Sale
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Music className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No NFTs Owned</h3>
              <p className="text-muted-foreground">Start collecting music NFTs from the marketplace</p>
            </div>
          )}
        </TabsContent>

        {/* Listed NFTs */}
        <TabsContent value="listed" className="mt-6">
          {listedNFTs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {listedNFTs.map((listing) => (
                <Card key={listing.id} className="glass-panel border-glass">
                  <div className="relative">
                    <div className="aspect-square overflow-hidden rounded-t-lg">
                      <img
                        src={listing.metadata?.artworkUrl || ''}
                        alt={listing.metadata?.trackTitle || ''}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="absolute top-3 left-3">
                      <Badge variant="secondary" className="bg-accent/20 text-accent">
                        <Tag className="h-3 w-3 mr-1" />
                        Listed
                      </Badge>
                    </div>
                    
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-background/20 font-bold">
                        {listing.listingPrice} {listing.listingCurrency}
                      </Badge>
                    </div>
                  </div>
                  
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-foreground line-clamp-1">
                          {listing.metadata?.trackTitle || 'Untitled'}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {listing.metadata?.artistName || 'Unknown Artist'}
                        </p>
                      </div>
                      
                      <div className="text-xs text-muted-foreground">
                        Listed {new Date(listing.createdAt).toLocaleDateString()}
                        {listing.expiresAt && (
                          <span className="block">
                            Expires {new Date(listing.expiresAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      
                      <Button
                        onClick={() => handleCancelListing(listing.id)}
                        className="w-full"
                        variant="outline"
                      >
                        Cancel Listing
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Tag className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No Active Listings</h3>
              <p className="text-muted-foreground">List your NFTs for sale to start earning</p>
            </div>
          )}
        </TabsContent>

        {/* Sold NFTs */}
        <TabsContent value="sold" className="mt-6">
          {soldNFTs.length > 0 ? (
            <div className="space-y-4">
              {soldNFTs.map((listing) => (
                <Card key={listing.id} className="glass-panel border-glass">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <img
                          src={listing.metadata?.artworkUrl || ''}
                          alt={listing.metadata?.trackTitle || ''}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <div>
                          <h3 className="font-semibold">{listing.metadata?.trackTitle || 'Untitled'}</h3>
                          <p className="text-sm text-muted-foreground">{listing.metadata?.artistName || 'Unknown Artist'}</p>
                          <p className="text-xs text-muted-foreground">
                            Sold on {listing.soldAt?.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-success">
                          +{listing.listingPrice} {listing.listingCurrency}
                        </p>
                        <p className="text-sm text-muted-foreground">Sold Price</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <DollarSign className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No Sales Yet</h3>
              <p className="text-muted-foreground">Your sold NFTs will appear here</p>
            </div>
          )}
        </TabsContent>

        {/* Purchased NFTs */}
        <TabsContent value="purchased" className="mt-6">
          {purchasedNFTs.length > 0 ? (
            <div className="space-y-4">
              {purchasedNFTs.map((listing) => (
                <Card key={listing.id} className="glass-panel border-glass">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <img
                          src={listing.metadata?.artworkUrl || ''}
                          alt={listing.metadata?.trackTitle || ''}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <div>
                          <h3 className="font-semibold">{listing.metadata?.trackTitle || 'Untitled'}</h3>
                          <p className="text-sm text-muted-foreground">{listing.metadata?.artistName || 'Unknown Artist'}</p>
                          <p className="text-xs text-muted-foreground">
                            Purchased on {listing.soldAt?.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-aurora">
                          {listing.listingPrice} {listing.listingCurrency}
                        </p>
                        <p className="text-sm text-muted-foreground">Purchase Price</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Eye className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No Purchases Yet</h3>
              <p className="text-muted-foreground">NFTs you purchase will appear here</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* NFT Listing Modal */}
      <NFTListingModal
        open={showListingModal}
        onClose={() => {
          setShowListingModal(false);
          setSelectedNFT(null);
        }}
        onListingCreated={loadUserCollection}
        preselectedNFT={selectedNFT}
      />
    </div>
  );
};