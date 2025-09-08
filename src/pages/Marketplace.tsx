import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { NFTCard } from '@/components/NFTCard';
import { MarketplaceAnalytics } from '@/components/MarketplaceAnalytics';
import { useAuth } from '@/hooks/useAuth';
import { useWalletStore } from '@/stores/walletStore';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Search, 
  Filter, 
  ShoppingCart, 
  Heart, 
  Music, 
  TrendingUp, 
  Clock, 
  DollarSign,
  Users,
  Star,
  Play,
  Eye
} from 'lucide-react';

interface NFTListing {
  id: string;
  title: string;
  artist: string;
  artistId: string;
  artistAvatar: string;
  price: number;
  currency: 'TON' | 'USD';
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
}

const Marketplace = () => {
  const { isAuthenticated } = useAuth();
  const { isConnected } = useWalletStore();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 100]);
  const [sortBy, setSortBy] = useState('trending');
  const [showFilters, setShowFilters] = useState(false);
  const [listings, setListings] = useState<NFTListing[]>([]);
  const [loading, setLoading] = useState(false);

  // Mock data for demonstration
  useEffect(() => {
    const mockListings: NFTListing[] = [
      {
        id: '1',
        title: 'Digital Dreams',
        artist: 'Aurora Digital',
        artistId: 'aurora-digital',
        artistAvatar: 'https://ui-avatars.com/api/?name=Aurora+Digital&background=6366f1&color=fff',
        price: 5.5,
        currency: 'TON',
        artwork: '/src/assets/track-1.jpg',
        genre: 'Electronic',
        duration: '3:42',
        likes: 234,
        views: 1250,
        listedDate: '2024-01-15',
        isVerified: true,
        isExclusive: true,
        royalty: 10,
        description: 'An ethereal journey through digital soundscapes'
      },
      {
        id: '2',
        title: 'Neon Nights',
        artist: 'CyberSynth',
        artistId: 'cybersynth',
        artistAvatar: 'https://ui-avatars.com/api/?name=CyberSynth&background=8b5cf6&color=fff',
        price: 8.0,
        currency: 'TON',
        artwork: '/src/assets/track-2.jpg',
        genre: 'Synthwave',
        duration: '4:15',
        likes: 456,
        views: 2100,
        listedDate: '2024-01-14',
        isVerified: true,
        isExclusive: false,
        royalty: 15,
        description: 'Retro-futuristic vibes for the digital age'
      },
      {
        id: '3',
        title: 'Cosmic Drift',
        artist: 'Stellar Sounds',
        artistId: 'stellar-sounds',
        artistAvatar: 'https://ui-avatars.com/api/?name=Stellar+Sounds&background=f59e0b&color=fff',
        price: 12.5,
        currency: 'TON',
        artwork: '/src/assets/track-3.jpg',
        genre: 'Ambient',
        duration: '6:28',
        likes: 189,
        views: 890,
        listedDate: '2024-01-13',
        isVerified: false,
        isExclusive: true,
        royalty: 20,
        description: 'Float through space with this ambient masterpiece'
      }
    ];
    setListings(mockListings);
  }, []);

  const filteredListings = listings.filter(listing => {
    const matchesSearch = listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         listing.artist.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = selectedGenre === 'all' || listing.genre.toLowerCase() === selectedGenre;
    const matchesPrice = listing.price >= priceRange[0] && listing.price <= priceRange[1];
    
    return matchesSearch && matchesGenre && matchesPrice;
  });

  const sortedListings = [...filteredListings].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'newest':
        return new Date(b.listedDate).getTime() - new Date(a.listedDate).getTime();
      case 'likes':
        return b.likes - a.likes;
      default: // trending
        return b.views - a.views;
    }
  });

  const genres = ['all', 'electronic', 'synthwave', 'ambient', 'house', 'techno', 'pop'];

  const handlePurchase = async (listingId: string) => {
    const listing = listings.find(l => l.id === listingId);
    if (!listing) return;

    try {
      const { data, error } = await supabase.functions.invoke('purchase-nft', {
        body: {
          nftId: listing.id,
          price: listing.price,
          currency: listing.currency,
          artistId: listing.artistId
        }
      });

      if (error) throw error;

      toast({
        title: "Purchase Successful!",
        description: `You've successfully purchased "${listing.title}" by ${listing.artist}`,
      });

      // Remove from listings (simulate sold)
      setListings(prev => prev.filter(l => l.id !== listingId));
      
    } catch (error) {
      console.error('Purchase error:', error);
      toast({
        title: "Purchase Failed",
        description: "There was an error processing your purchase. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen pt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-aurora mb-2">NFT Marketplace</h1>
            <p className="text-muted-foreground text-lg">
              Discover and collect exclusive music NFTs from top artists
            </p>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="glass-panel border-glass">
              <CardContent className="p-4 text-center">
                <Music className="h-6 w-6 mx-auto text-primary mb-2" />
                <p className="text-2xl font-bold text-aurora">{listings.length}</p>
                <p className="text-sm text-muted-foreground">NFTs Listed</p>
              </CardContent>
            </Card>
            <Card className="glass-panel border-glass">
              <CardContent className="p-4 text-center">
                <Users className="h-6 w-6 mx-auto text-secondary mb-2" />
                <p className="text-2xl font-bold text-aurora">156</p>
                <p className="text-sm text-muted-foreground">Artists</p>
              </CardContent>
            </Card>
            <Card className="glass-panel border-glass">
              <CardContent className="p-4 text-center">
                <DollarSign className="h-6 w-6 mx-auto text-accent mb-2" />
                <p className="text-2xl font-bold text-aurora">24.5</p>
                <p className="text-sm text-muted-foreground">Vol. (TON)</p>
              </CardContent>
            </Card>
            <Card className="glass-panel border-glass">
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-6 w-6 mx-auto text-success mb-2" />
                <p className="text-2xl font-bold text-aurora">+12%</p>
                <p className="text-sm text-muted-foreground">24h Change</p>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <Card className="glass-panel border-glass mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search NFTs, artists, or collections..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <div className="flex items-center gap-4">
                  <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Genre" />
                    </SelectTrigger>
                    <SelectContent>
                      {genres.map((genre) => (
                        <SelectItem key={genre} value={genre}>
                          {genre === 'all' ? 'All Genres' : genre.charAt(0).toUpperCase() + genre.slice(1)}
                        </SelectItem>
                      ))
                      }
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trending">Trending</SelectItem>
                      <SelectItem value="newest">Newest</SelectItem>
                      <SelectItem value="price-low">Price: Low to High</SelectItem>
                      <SelectItem value="price-high">Price: High to Low</SelectItem>
                      <SelectItem value="likes">Most Liked</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                    className="gap-2"
                  >
                    <Filter className="h-4 w-4" />
                    Filters
                  </Button>
                </div>
              </div>

              {/* Advanced Filters */}
              {showFilters && (
                <div className="mt-6 pt-6 border-t border-glass-border">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Price Range (TON): {priceRange[0]} - {priceRange[1]}
                      </label>
                      <Slider
                        value={priceRange}
                        onValueChange={setPriceRange}
                        max={100}
                        step={1}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Marketplace Tabs */}
          <div className="mb-8">
            <MarketplaceAnalytics />
          </div>

          <Tabs defaultValue="all" className="mb-8">
            <TabsList className="glass-panel">
              <TabsTrigger value="all">All NFTs</TabsTrigger>
              <TabsTrigger value="trending">Trending</TabsTrigger>
              <TabsTrigger value="new">New Releases</TabsTrigger>
              <TabsTrigger value="exclusive">Exclusive</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              {/* NFT Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {sortedListings.map((listing) => (
                  <NFTCard
                    key={listing.id}
                    id={listing.id}
                    title={listing.title}
                    artist={listing.artist}
                    artistId={listing.artistId}
                    artistAvatar={listing.artistAvatar}
                    price={listing.price}
                    currency={listing.currency}
                    artwork={listing.artwork}
                    genre={listing.genre}
                    duration={listing.duration}
                    likes={listing.likes}
                    views={listing.views}
                    listedDate={listing.listedDate}
                    isVerified={listing.isVerified}
                    isExclusive={listing.isExclusive}
                    royalty={listing.royalty}
                    description={listing.description}
                    onPurchase={handlePurchase}
                  />
                ))}
              </div>

              {sortedListings.length === 0 && (
                <div className="text-center py-12">
                  <Music className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                  <h3 className="text-xl font-semibold mb-2">No NFTs Found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your search criteria or filters
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Other tab contents would follow similar patterns */}
            <TabsContent value="trending">
              <div className="text-center py-12">
                <TrendingUp className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">Trending NFTs</h3>
                <p className="text-muted-foreground">Coming soon...</p>
              </div>
            </TabsContent>

            <TabsContent value="new">
              <div className="text-center py-12">
                <Clock className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">New Releases</h3>
                <p className="text-muted-foreground">Coming soon...</p>
              </div>
            </TabsContent>

            <TabsContent value="exclusive">
              <div className="text-center py-12">
                <Star className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">Exclusive NFTs</h3>
                <p className="text-muted-foreground">Coming soon...</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Marketplace;
