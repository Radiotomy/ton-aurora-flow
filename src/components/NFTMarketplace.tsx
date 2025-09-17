import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { NFTCard } from '@/components/NFTCard';
import { NFTListingModal } from '@/components/NFTListingModal';
import { MarketplaceAnalytics } from '@/components/MarketplaceAnalytics';
import { UserNFTCollection } from '@/components/UserNFTCollection';
import { useAuth } from '@/hooks/useAuth';
import { useWeb3 } from '@/hooks/useWeb3';
import { useToast } from '@/hooks/use-toast';
import { NFTMarketplaceService, NFTListing } from '@/services/nftMarketplaceService';
import { 
  Search, 
  Filter, 
  TrendingUp, 
  Clock, 
  DollarSign,
  Plus,
  Grid3X3,
  BarChart3,
  Wallet,
  Star,
  Zap
} from 'lucide-react';

export const NFTMarketplace: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { profile, isConnected } = useWeb3();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('marketplace');
  const [searchQuery, setSearchQuery] = useState('');
  const [priceFilter, setPriceFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [currencyFilter, setCurrencyFilter] = useState('all');
  
  const [listings, setListings] = useState<NFTListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showListingModal, setShowListingModal] = useState(false);

  // Load marketplace listings
  useEffect(() => {
    loadMarketplaceListings();
  }, [sortBy, currencyFilter]);

  const loadMarketplaceListings = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      
      if (currencyFilter !== 'all') {
        filters.currency = currencyFilter;
      }
      
      const data = await NFTMarketplaceService.getActiveListings(50, 0, filters);
      setListings(data);
    } catch (error) {
      console.error('Error loading marketplace:', error);
      toast({
        title: "Error",
        description: "Failed to load marketplace listings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort listings
  const filteredListings = listings.filter(listing => {
    const matchesSearch = 
      listing.metadata?.trackTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.metadata?.artistName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPrice = priceFilter === 'all' || 
      (priceFilter === 'low' && listing.listingPrice < 1) ||
      (priceFilter === 'medium' && listing.listingPrice >= 1 && listing.listingPrice < 10) ||
      (priceFilter === 'high' && listing.listingPrice >= 10);
    
    return matchesSearch && matchesPrice;
  });

  const sortedListings = [...filteredListings].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.listingPrice - b.listingPrice;
      case 'price-high':
        return b.listingPrice - a.listingPrice;
      case 'oldest':
        return a.createdAt.getTime() - b.createdAt.getTime();
      default: // newest
        return b.createdAt.getTime() - a.createdAt.getTime();
    }
  });

  const handlePurchaseNFT = async (listingId: string) => {
    if (!profile?.id) {
      toast({
        title: "Authentication Required",
        description: "Please connect your wallet to purchase NFTs",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await NFTMarketplaceService.purchaseNFT(profile.id, listingId);
      
      if (result.success) {
        toast({
          title: "Purchase Successful",
          description: "NFT has been added to your collection",
        });
        await loadMarketplaceListings(); // Refresh listings
      } else {
        toast({
          title: "Purchase Failed",
          description: result.error || "Transaction failed",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Purchase Error",
        description: "Failed to process purchase",
        variant: "destructive",
      });
    }
  };

  const getNFTTier = (price: number): string => {
    if (price >= 50) return 'Platinum';
    if (price >= 20) return 'Gold';
    if (price >= 5) return 'Silver';
    return 'Bronze';
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'Platinum': return <Star className="h-3 w-3" />;
      case 'Gold': return <Zap className="h-3 w-3" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen pt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-aurora mb-2">
              NFT Marketplace
            </h1>
            <p className="text-muted-foreground text-lg">
              Trade music NFTs on the TON blockchain with instant settlements and low fees.
            </p>
          </div>

          {/* Main Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <TabsList className="glass-panel">
              <TabsTrigger value="marketplace" className="gap-2">
                <Grid3X3 className="h-4 w-4" />
                Marketplace
              </TabsTrigger>
              <TabsTrigger value="collection" className="gap-2">
                <Wallet className="h-4 w-4" />
                My Collection
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </TabsTrigger>
            </TabsList>

            {/* Marketplace Tab */}
            <TabsContent value="marketplace" className="mt-6">
              {/* Search and Filters */}
              <Card className="glass-panel border-glass mb-8">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Search NFTs, artists..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <Select value={priceFilter} onValueChange={setPriceFilter}>
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Price Range" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Prices</SelectItem>
                          <SelectItem value="low">< 1 TON</SelectItem>
                          <SelectItem value="medium">1-10 TON</SelectItem>
                          <SelectItem value="high">> 10 TON</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={currencyFilter} onValueChange={setCurrencyFilter}>
                        <SelectTrigger className="w-[120px]">
                          <SelectValue placeholder="Currency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="TON">TON</SelectItem>
                          <SelectItem value="AUDIO">AUDIO</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="newest">Newest</SelectItem>
                          <SelectItem value="oldest">Oldest</SelectItem>
                          <SelectItem value="price-low">Price: Low</SelectItem>
                          <SelectItem value="price-high">Price: High</SelectItem>
                        </SelectContent>
                      </Select>

                      {isConnected && (
                        <Button
                          onClick={() => setShowListingModal(true)}
                          className="gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          List NFT
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* NFT Grid */}
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Card key={i} className="glass-panel animate-pulse">
                      <CardContent className="p-4 space-y-3">
                        <div className="h-48 bg-muted rounded-lg" />
                        <div className="h-4 bg-muted rounded" />
                        <div className="h-3 bg-muted rounded w-2/3" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : sortedListings.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {sortedListings.map((listing) => {
                    const tier = getNFTTier(listing.listingPrice);
                    return (
                      <NFTCard
                        key={listing.id}
                        id={listing.id}
                        title={listing.metadata?.trackTitle || 'Untitled'}
                        artist={listing.metadata?.artistName || 'Unknown Artist'}
                        artistId={listing.metadata?.artistId || ''}
                        artistAvatar={listing.metadata?.artworkUrl || ''}
                        price={listing.listingPrice}
                        currency={listing.listingCurrency}
                        artwork={listing.metadata?.artworkUrl || ''}
                        genre="Electronic" // Would come from metadata
                        duration="3:45" // Would come from metadata
                        likes={0} // Would come from metadata
                        views={0} // Would come from metadata
                        listedDate={listing.createdAt.toISOString()}
                        isVerified={true}
                        isExclusive={tier === 'Platinum' || tier === 'Gold'}
                        royalty={listing.royaltyPercentage}
                        description={`${tier} tier NFT of ${listing.metadata?.trackTitle} by ${listing.metadata?.artistName}`}
                        onPurchase={() => handlePurchaseNFT(listing.id)}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <DollarSign className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                  <h3 className="text-xl font-semibold mb-2">No NFTs Found</h3>
                  <p className="text-muted-foreground">
                    {searchQuery ? 'Try adjusting your search criteria' : 'No NFTs currently listed for sale'}
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Collection Tab */}
            <TabsContent value="collection" className="mt-6">
              <UserNFTCollection />
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="mt-6">
              <MarketplaceAnalytics />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* NFT Listing Modal */}
      <NFTListingModal
        open={showListingModal}
        onClose={() => setShowListingModal(false)}
        onListingCreated={loadMarketplaceListings}
      />
    </div>
  );
};