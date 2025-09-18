import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NFTMarketplaceService, MarketplaceStats } from '@/services/nftMarketplaceService';
import { supabase } from '@/integrations/supabase/client';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Activity,
  BarChart3,
  PieChart,
  Music,
  Star,
  Clock,
  Target
} from 'lucide-react';

interface VolumeData {
  date: string;
  volume: number;
  sales: number;
}

interface TopArtist {
  id: string;
  name: string;
  avatar: string;
  volume: number;
  sales: number;
  averagePrice: number;
}

interface PriceRange {
  range: string;
  count: number;
  percentage: number;
}

export const MarketplaceAnalytics: React.FC = () => {
  const [marketplaceStats, setMarketplaceStats] = useState<MarketplaceStats | null>(null);
  const [volumeData, setVolumeData] = useState<VolumeData[]>([]);
  const [topArtists, setTopArtists] = useState<TopArtist[]>([]);
  const [priceRanges, setPriceRanges] = useState<PriceRange[]>([]);
  const [loading, setLoading] = useState(true);

  const [detailedStats, setDetailedStats] = useState({
    totalListings: 0,
    activeListings: 0,
    totalSales: 0,
    totalVolume: 0,
    averagePrice: 0,
    uniqueCollectors: 0,
    uniqueSellers: 0,
    floorPrice: 0,
    topSale: 0,
    volumeChange24h: 0
  });

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Load marketplace stats
      const stats = await NFTMarketplaceService.getMarketplaceStats();
      setMarketplaceStats(stats);

      // Load detailed analytics from database
      await loadDetailedAnalytics();
      await loadVolumeData();
      await loadTopArtists();
      await loadPriceDistribution();

    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDetailedAnalytics = async () => {
    try {
      // Get all marketplace data
      const { data: listings, error } = await supabase
        .from('nft_marketplace')
        .select(`
          *,
          seller:profiles!seller_profile_id(display_name),
          buyer:profiles!buyer_profile_id(display_name)
        `);

      if (error) throw error;

      const activeListings = listings?.filter(l => l.status === 'active') || [];
      const soldListings = listings?.filter(l => l.status === 'sold') || [];
      
      const totalVolume = soldListings.reduce((sum, l) => sum + parseFloat(l.listing_price.toString()), 0);
      const averagePrice = soldListings.length > 0 ? totalVolume / soldListings.length : 0;
      
      const uniqueCollectors = new Set(soldListings.map(l => l.buyer_profile_id).filter(Boolean)).size;
      const uniqueSellers = new Set(soldListings.map(l => l.seller_profile_id)).size;
      
      const prices = activeListings.map(l => parseFloat(l.listing_price.toString())).sort((a, b) => a - b);
      const floorPrice = prices.length > 0 ? prices[0] : 0;
      const topSale = soldListings.length > 0 
        ? Math.max(...soldListings.map(l => parseFloat(l.listing_price.toString())))
        : 0;

      // Calculate 24h volume change (simplified)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const recent24h = soldListings.filter(l => 
        l.sold_at && new Date(l.sold_at) > yesterday
      );
      const volume24h = recent24h.reduce((sum, l) => sum + parseFloat(l.listing_price.toString()), 0);
      const volumeChange24h = totalVolume > 0 ? ((volume24h / totalVolume) * 100) : 0;

      setDetailedStats({
        totalListings: listings?.length || 0,
        activeListings: activeListings.length,
        totalSales: soldListings.length,
        totalVolume,
        averagePrice,
        uniqueCollectors,
        uniqueSellers,
        floorPrice,
        topSale,
        volumeChange24h
      });

    } catch (error) {
      console.error('Error loading detailed analytics:', error);
    }
  };

  const loadVolumeData = async () => {
    try {
      const { data: soldListings, error } = await supabase
        .from('nft_marketplace')
        .select('listing_price, sold_at')
        .eq('status', 'sold')
        .order('sold_at', { ascending: true });

      if (error) throw error;

      // Group by date
      const volumeByDate: Record<string, { volume: number; sales: number }> = {};
      
      soldListings?.forEach(listing => {
        if (listing.sold_at) {
          const date = new Date(listing.sold_at).toISOString().split('T')[0];
          if (!volumeByDate[date]) {
            volumeByDate[date] = { volume: 0, sales: 0 };
          }
          volumeByDate[date].volume += parseFloat(listing.listing_price.toString());
          volumeByDate[date].sales += 1;
        }
      });

      const volumeData = Object.entries(volumeByDate)
        .map(([date, data]) => ({
          date,
          volume: data.volume,
          sales: data.sales
        }))
        .slice(-30); // Last 30 days

      setVolumeData(volumeData);

    } catch (error) {
      console.error('Error loading volume data:', error);
    }
  };

  const loadTopArtists = async () => {
    try {
      // Mock data for now until database schema is properly set up
      const mockArtistStats = {
        'Zedd': { volume: 125.5, sales: 15, prices: [8.5, 12.0, 15.5, 10.0, 9.5, 11.0, 7.5, 13.0, 8.0, 10.5, 12.5, 9.0, 11.5, 14.0, 10.0] },
        'Skrillex': { volume: 98.3, sales: 12, prices: [9.0, 11.5, 8.0, 7.5, 10.0, 12.0, 8.5, 9.5, 11.0, 10.5, 8.0, 9.0] },
        'Deadmau5': { volume: 87.2, sales: 10, prices: [10.0, 8.5, 9.0, 11.0, 7.5, 9.5, 8.0, 10.5, 12.0, 11.5] },
        'Porter Robinson': { volume: 76.8, sales: 8, prices: [12.0, 9.5, 8.0, 10.0, 11.5, 8.5, 9.0, 8.0] },
        'Flume': { volume: 65.4, sales: 7, prices: [11.0, 8.5, 9.0, 10.5, 7.5, 9.5, 10.0] }
      };

      const topArtists = Object.entries(mockArtistStats)
        .map(([name, stats]) => ({
          id: name.toLowerCase().replace(/\s+/g, '-'),
          name,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff`,
          volume: stats.volume,
          sales: stats.sales,
          averagePrice: stats.volume / stats.sales
        }))
        .sort((a, b) => b.volume - a.volume)
        .slice(0, 10);

      setTopArtists(topArtists);

    } catch (error) {
      console.error('Error loading top artists:', error);
    }
  };

  const loadPriceDistribution = async () => {
    try {
      const { data: activeListings, error } = await supabase
        .from('nft_marketplace')
        .select('listing_price')
        .eq('status', 'active');

      if (error) throw error;

      const prices = activeListings?.map(l => parseFloat(l.listing_price.toString())) || [];
      const total = prices.length;

      if (total === 0) {
        setPriceRanges([]);
        return;
      }

      const ranges = [
        { range: '< 1 TON', min: 0, max: 1 },
        { range: '1-5 TON', min: 1, max: 5 },
        { range: '5-10 TON', min: 5, max: 10 },
        { range: '10-25 TON', min: 10, max: 25 },
        { range: '> 25 TON', min: 25, max: Infinity }
      ];

      const distribution = ranges.map(range => {
        const count = prices.filter(price => 
          price >= range.min && (range.max === Infinity ? true : price < range.max)
        ).length;
        
        return {
          range: range.range,
          count,
          percentage: (count / total) * 100
        };
      });

      setPriceRanges(distribution);

    } catch (error) {
      console.error('Error loading price distribution:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="glass-panel animate-pulse">
              <CardContent className="p-4">
                <div className="h-16 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-panel border-glass">
          <CardContent className="p-4 text-center">
            <DollarSign className="h-6 w-6 mx-auto text-primary mb-2" />
            <p className="text-2xl font-bold text-aurora">{detailedStats.totalVolume.toFixed(1)}</p>
            <p className="text-sm text-muted-foreground">Total Volume (TON)</p>
            {detailedStats.volumeChange24h !== 0 && (
              <Badge variant={detailedStats.volumeChange24h > 0 ? "default" : "destructive"} className="mt-1">
                {detailedStats.volumeChange24h > 0 ? '+' : ''}{detailedStats.volumeChange24h.toFixed(1)}%
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card className="glass-panel border-glass">
          <CardContent className="p-4 text-center">
            <Activity className="h-6 w-6 mx-auto text-secondary mb-2" />
            <p className="text-2xl font-bold text-aurora">{detailedStats.totalSales}</p>
            <p className="text-sm text-muted-foreground">Total Sales</p>
          </CardContent>
        </Card>

        <Card className="glass-panel border-glass">
          <CardContent className="p-4 text-center">
            <Target className="h-6 w-6 mx-auto text-accent mb-2" />
            <p className="text-2xl font-bold text-aurora">{detailedStats.averagePrice.toFixed(1)}</p>
            <p className="text-sm text-muted-foreground">Average Price (TON)</p>
          </CardContent>
        </Card>

        <Card className="glass-panel border-glass">
          <CardContent className="p-4 text-center">
            <Users className="h-6 w-6 mx-auto text-success mb-2" />
            <p className="text-2xl font-bold text-aurora">{detailedStats.uniqueCollectors}</p>
            <p className="text-sm text-muted-foreground">Unique Collectors</p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="glass-panel border-glass">
          <CardContent className="p-4 text-center">
            <Music className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
            <p className="text-lg font-bold">{detailedStats.activeListings}</p>
            <p className="text-xs text-muted-foreground">Active Listings</p>
          </CardContent>
        </Card>

        <Card className="glass-panel border-glass">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
            <p className="text-lg font-bold">{detailedStats.floorPrice.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">Floor Price (TON)</p>
          </CardContent>
        </Card>

        <Card className="glass-panel border-glass">
          <CardContent className="p-4 text-center">
            <Star className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
            <p className="text-lg font-bold">{detailedStats.topSale.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">Highest Sale (TON)</p>
          </CardContent>
        </Card>

        <Card className="glass-panel border-glass">
          <CardContent className="p-4 text-center">
            <Users className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
            <p className="text-lg font-bold">{detailedStats.uniqueSellers}</p>
            <p className="text-xs text-muted-foreground">Active Sellers</p>
          </CardContent>
        </Card>

        <Card className="glass-panel border-glass">
          <CardContent className="p-4 text-center">
            <BarChart3 className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
            <p className="text-lg font-bold">{detailedStats.totalListings}</p>
            <p className="text-xs text-muted-foreground">Total Listings</p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="artists" className="w-full">
        <TabsList className="glass-panel">
          <TabsTrigger value="artists">Top Artists</TabsTrigger>
          <TabsTrigger value="prices">Price Distribution</TabsTrigger>
          <TabsTrigger value="volume">Volume History</TabsTrigger>
        </TabsList>

        {/* Top Artists */}
        <TabsContent value="artists" className="mt-6">
          <Card className="glass-panel border-glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Top Artists by Volume
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topArtists.length > 0 ? (
                <div className="space-y-4">
                  {topArtists.map((artist, index) => (
                    <div key={artist.id} className="flex items-center justify-between p-4 rounded-lg bg-background/20">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary font-bold">
                          #{index + 1}
                        </div>
                        <img
                          src={artist.avatar}
                          alt={artist.name}
                          className="w-10 h-10 rounded-full"
                        />
                        <div>
                          <h3 className="font-semibold">{artist.name}</h3>
                          <p className="text-sm text-muted-foreground">{artist.sales} sales</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-aurora">{artist.volume.toFixed(1)} TON</p>
                        <p className="text-sm text-muted-foreground">
                          Avg: {artist.averagePrice.toFixed(1)} TON
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                  <p className="text-muted-foreground">No sales data available yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Price Distribution */}
        <TabsContent value="prices" className="mt-6">
          <Card className="glass-panel border-glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Price Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {priceRanges.length > 0 ? (
                <div className="space-y-4">
                  {priceRanges.map((range) => (
                    <div key={range.range} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{range.range}</span>
                        <span className="text-sm text-muted-foreground">
                          {range.count} NFTs ({range.percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${range.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <PieChart className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                  <p className="text-muted-foreground">No active listings for price analysis</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Volume History */}
        <TabsContent value="volume" className="mt-6">
          <Card className="glass-panel border-glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Volume History (Last 30 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {volumeData.length > 0 ? (
                <div className="space-y-4">
                  {volumeData.slice(-10).map((data) => (
                    <div key={data.date} className="flex items-center justify-between p-3 rounded-lg bg-background/20">
                      <div>
                        <p className="font-medium">{new Date(data.date).toLocaleDateString()}</p>
                        <p className="text-sm text-muted-foreground">{data.sales} sales</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-aurora">{data.volume.toFixed(2)} TON</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                  <p className="text-muted-foreground">No volume history available yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};