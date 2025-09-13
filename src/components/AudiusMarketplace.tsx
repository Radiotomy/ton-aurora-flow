import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import TrackCard from '@/components/TrackCard';
import { AudiusTrackNFTMinter } from '@/components/AudiusTrackNFTMinter';
import { useAudiusTracks } from '@/hooks/useAudius';
import { useAuth } from '@/hooks/useAuth';
import { useWalletStore } from '@/stores/walletStore';
import { useToast } from '@/hooks/use-toast';
import { AudiusService, AudiusTrack } from '@/services/audiusService';
import { supabase } from '@/integrations/supabase/client';
import { 
  Search, 
  Filter, 
  Music, 
  TrendingUp, 
  Clock, 
  DollarSign,
  Users,
  Sparkles,
  Headphones,
  Heart
} from 'lucide-react';

export const AudiusMarketplace: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { isConnected } = useWalletStore();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [sortBy, setSortBy] = useState('trending');
  const [selectedTrack, setSelectedTrack] = useState<AudiusTrack | null>(null);
  const [showMintModal, setShowMintModal] = useState(false);
  const [marketplaceStats, setMarketplaceStats] = useState({
    totalTracks: 0,
    totalArtists: 0,
    volumeTON: 0,
    change24h: 0
  });

  // Fetch Audius tracks
  const { 
    tracks, 
    loading, 
    loadMoreTracks, 
    hasMore,
    refreshTracks 
  } = useAudiusTracks(selectedGenre === 'all' ? undefined : selectedGenre);

  // Fetch marketplace statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get collection stats from database
        const { data: collectionsData } = await supabase
          .from('track_collections')
          .select('purchase_price, track_id');

        const { data: transactionsData } = await supabase
          .from('transactions')
          .select('amount_ton, created_at')
          .eq('transaction_type', 'nft_mint')
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

        const totalVolume = collectionsData?.reduce((sum, item) => sum + (item.purchase_price || 0), 0) || 0;
        const todayVolume = transactionsData?.reduce((sum, item) => sum + (item.amount_ton || 0), 0) || 0;
        const uniqueTracks = new Set(collectionsData?.map(item => item.track_id) || []).size;

        setMarketplaceStats({
          totalTracks: tracks.length,
          totalArtists: new Set(tracks.map(track => track.user.id)).size,
          volumeTON: totalVolume,
          change24h: todayVolume > 0 ? ((todayVolume / totalVolume) * 100) : 0
        });
      } catch (error) {
        console.error('Error fetching marketplace stats:', error);
      }
    };

    if (tracks.length > 0) {
      fetchStats();
    }
  }, [tracks]);

  // Filter and sort tracks
  const filteredTracks = tracks.filter(track => {
    const matchesSearch = 
      track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.user.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  const sortedTracks = [...filteredTracks].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
      case 'plays':
        return (b.play_count || 0) - (a.play_count || 0);
      case 'likes':
        return (b.favorite_count || 0) - (a.favorite_count || 0);
      default: // trending
        return (b.play_count || 0) - (a.play_count || 0);
    }
  });

  const handleMintNFT = (track: AudiusTrack) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please connect your wallet to mint NFTs.",
        variant: "destructive",
      });
      return;
    }

    setSelectedTrack(track);
    setShowMintModal(true);
  };

  const handleTrackAction = async (trackId: string, action: string) => {
    const track = tracks.find(t => t.id === trackId);
    if (!track) return;

    switch (action) {
      case 'mint':
        handleMintNFT(track);
        break;
      case 'tip':
        toast({
          title: "Tip Artist",
          description: "Tipping feature coming soon!",
        });
        break;
      case 'collect':
        toast({
          title: "Collect Track", 
          description: "Collection feature coming soon!",
        });
        break;
    }
  };

  const genres = AudiusService.getGenres();

  return (
    <div className="min-h-screen pt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-aurora mb-2">
              Audius × TON Marketplace
            </h1>
            <p className="text-muted-foreground text-lg">
              Discover and collect NFTs from your favorite Audius artists. Revenue flows directly to creators via TON blockchain.
            </p>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="glass-panel border-glass">
              <CardContent className="p-4 text-center">
                <Music className="h-6 w-6 mx-auto text-primary mb-2" />
                <p className="text-2xl font-bold text-aurora">{marketplaceStats.totalTracks}</p>
                <p className="text-sm text-muted-foreground">Audius Tracks</p>
              </CardContent>
            </Card>
            <Card className="glass-panel border-glass">
              <CardContent className="p-4 text-center">
                <Users className="h-6 w-6 mx-auto text-secondary mb-2" />
                <p className="text-2xl font-bold text-aurora">{marketplaceStats.totalArtists}</p>
                <p className="text-sm text-muted-foreground">Artists</p>
              </CardContent>
            </Card>
            <Card className="glass-panel border-glass">
              <CardContent className="p-4 text-center">
                <DollarSign className="h-6 w-6 mx-auto text-accent mb-2" />
                <p className="text-2xl font-bold text-aurora">{marketplaceStats.volumeTON.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground">Volume (TON)</p>
              </CardContent>
            </Card>
            <Card className="glass-panel border-glass">
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-6 w-6 mx-auto text-success mb-2" />
                <p className="text-2xl font-bold text-aurora">+{marketplaceStats.change24h.toFixed(1)}%</p>
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
                    placeholder="Search Audius tracks, artists..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <div className="flex items-center gap-4">
                  <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Genre" />
                    </SelectTrigger>
                    <SelectContent>
                      {genres.map((genre) => (
                        <SelectItem key={genre.id} value={genre.id}>
                          {genre.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trending">Trending</SelectItem>
                      <SelectItem value="newest">Newest</SelectItem>
                      <SelectItem value="plays">Most Played</SelectItem>
                      <SelectItem value="likes">Most Liked</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    onClick={refreshTracks}
                    variant="outline"
                    className="gap-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Marketplace Tabs */}
          <Tabs defaultValue="discover" className="mb-8">
            <TabsList className="glass-panel">
              <TabsTrigger value="discover">Discover Audius</TabsTrigger>
              <TabsTrigger value="trending">Trending NFTs</TabsTrigger>
              <TabsTrigger value="new">New Mints</TabsTrigger>
              <TabsTrigger value="exclusive">Exclusive</TabsTrigger>
            </TabsList>

            <TabsContent value="discover" className="mt-6">
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
              ) : (
                <>
                  {/* Audius Tracks Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {sortedTracks.map((track) => (
                      <TrackCard
                        key={track.id}
                        id={track.id}
                        title={track.title}
                        artist={track.user.name}
                        artwork={AudiusService.getArtworkUrl(track.artwork)}
                        duration={AudiusService.formatDuration(track.duration)}
                        likes={track.favorite_count || 0}
                        streamUrl={AudiusService.getStreamUrl(track.id)}
                        isNft={false}
        canMintNFT={true}
                        onAction={handleTrackAction}
                      />
                    ))}
                  </div>

                  {/* Load More Button */}
                  {hasMore && (
                    <div className="text-center mt-8">
                      <Button
                        onClick={loadMoreTracks}
                        variant="outline"
                        className="gap-2"
                        disabled={loading}
                      >
                        <Headphones className="h-4 w-4" />
                        Load More Tracks
                      </Button>
                    </div>
                  )}

                  {sortedTracks.length === 0 && !loading && (
                    <div className="text-center py-12">
                      <Music className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                      <h3 className="text-xl font-semibold mb-2">No Tracks Found</h3>
                      <p className="text-muted-foreground">
                        Try adjusting your search criteria or refresh for new content
                      </p>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            {/* Other tab contents - placeholder for now */}
            <TabsContent value="trending">
              <div className="text-center py-12">
                <TrendingUp className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">Trending NFTs</h3>
                <p className="text-muted-foreground">NFT marketplace features coming soon...</p>
              </div>
            </TabsContent>

            <TabsContent value="new">
              <div className="text-center py-12">
                <Clock className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">New Mints</h3>
                <p className="text-muted-foreground">Recently minted NFTs will appear here...</p>
              </div>
            </TabsContent>

            <TabsContent value="exclusive">
              <div className="text-center py-12">
                <Sparkles className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">Exclusive NFTs</h3>
                <p className="text-muted-foreground">Limited edition and exclusive content...</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* NFT Minting Modal */}
      {selectedTrack && (
        <AudiusTrackNFTMinter
          open={showMintModal}
          onClose={() => {
            setShowMintModal(false);
            setSelectedTrack(null);
          }}
          track={selectedTrack}
        />
      )}
    </div>
  );
};
