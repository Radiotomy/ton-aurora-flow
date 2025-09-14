import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useRealMarketplaceStats } from '@/hooks/useRealMarketplaceStats';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Music, 
  Crown,
  Star,
  Activity,
  Loader2
} from 'lucide-react';

interface MarketplaceStats {
  totalVolume: number;
  totalSales: number;
  activeListings: number;
  averagePrice: number;
  topGenres: Array<{ name: string; percentage: number; sales: number }>;
  topArtists: Array<{ 
    id: string; 
    name: string; 
    avatar: string; 
    sales: number; 
    volume: number; 
    isVerified: boolean 
  }>;
  recentSales: Array<{
    id: string;
    title: string;
    artist: string;
    price: number;
    currency: string;
    timestamp: string;
  }>;
  priceHistory: Array<{ date: string; avgPrice: number }>;
}

interface MarketplaceAnalyticsProps {
  className?: string;
}

export const MarketplaceAnalytics: React.FC<MarketplaceAnalyticsProps> = ({ 
  className = '' 
}) => {
  const stats = useRealMarketplaceStats();

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {stats.loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading marketplace data...</span>
        </div>
      )}
      
      {stats.error && (
        <Card className="glass-panel border-destructive/50">
          <CardContent className="p-4">
            <p className="text-destructive text-sm">Error loading marketplace data: {stats.error}</p>
          </CardContent>
        </Card>
      )}

      {!stats.loading && !stats.error && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-panel border-glass">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Volume</p>
                <p className="text-2xl font-bold text-aurora">{stats.totalVolume.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">TON</p>
              </div>
              <DollarSign className="h-8 w-8 text-primary opacity-70" />
            </div>
            <div className="flex items-center mt-2 text-xs">
              <TrendingUp className="h-3 w-3 text-success mr-1" />
              <span className="text-success">+12.5%</span>
              <span className="text-muted-foreground ml-1">vs last week</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel border-glass">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Sales</p>
                <p className="text-2xl font-bold text-aurora">{stats.totalSales}</p>
              </div>
              <Activity className="h-8 w-8 text-secondary opacity-70" />
            </div>
            <div className="flex items-center mt-2 text-xs">
              <TrendingUp className="h-3 w-3 text-success mr-1" />
              <span className="text-success">+8.2%</span>
              <span className="text-muted-foreground ml-1">vs last week</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel border-glass">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Listings</p>
                <p className="text-2xl font-bold text-aurora">{stats.activeListings}</p>
              </div>
              <Music className="h-8 w-8 text-accent opacity-70" />
            </div>
            <div className="flex items-center mt-2 text-xs">
              <TrendingDown className="h-3 w-3 text-destructive mr-1" />
              <span className="text-destructive">-3.1%</span>
              <span className="text-muted-foreground ml-1">vs last week</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel border-glass">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Price</p>
                <p className="text-2xl font-bold text-aurora">{stats.averagePrice}</p>
                <p className="text-xs text-muted-foreground">TON</p>
              </div>
              <Star className="h-8 w-8 text-warning opacity-70" />
            </div>
            <div className="flex items-center mt-2 text-xs">
              <TrendingUp className="h-3 w-3 text-success mr-1" />
              <span className="text-success">+5.7%</span>
              <span className="text-muted-foreground ml-1">vs last week</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="genres" className="space-y-4">
        <TabsList className="glass-panel">
          <TabsTrigger value="genres">Top Genres</TabsTrigger>
          <TabsTrigger value="artists">Top Artists</TabsTrigger>
          <TabsTrigger value="sales">Recent Sales</TabsTrigger>
        </TabsList>

        <TabsContent value="genres">
          <Card className="glass-panel border-glass">
            <CardHeader>
              <CardTitle>Genre Distribution</CardTitle>
              <CardDescription>
                Most popular genres in the marketplace
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.topGenres.map((genre, index) => (
                  <div key={genre.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          #{index + 1}
                        </Badge>
                        <span className="font-medium">{genre.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{genre.percentage}%</p>
                        <p className="text-xs text-muted-foreground">{genre.sales} sales</p>
                      </div>
                    </div>
                    <Progress value={genre.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="artists">
          <Card className="glass-panel border-glass">
            <CardHeader>
              <CardTitle>Top Performing Artists</CardTitle>
              <CardDescription>
                Artists with highest sales volume
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.topArtists.map((artist, index) => (
                  <div key={artist.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/20">
                    <div className="flex items-center gap-2">
                      <Badge variant={index === 0 ? "default" : "outline"} className="text-xs">
                        {index === 0 ? <Crown className="h-3 w-3 mr-1" /> : `#${index + 1}`}
                      </Badge>
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={artist.avatar} />
                        <AvatarFallback>
                          <Music className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{artist.name}</p>
                        {artist.isVerified && (
                          <Badge variant="secondary" className="text-xs bg-primary/20 text-primary">
                            ✓
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {artist.sales} sales • {artist.volume.toFixed(1)} TON
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales">
          <Card className="glass-panel border-glass">
            <CardHeader>
              <CardTitle>Recent Sales</CardTitle>
              <CardDescription>
                Latest NFT transactions on the marketplace
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.recentSales.map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                    <div>
                      <p className="font-medium text-sm">{sale.title}</p>
                      <p className="text-xs text-muted-foreground">by {sale.artist}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">
                        {sale.price} {sale.currency}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatTimeAgo(sale.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
        </>
      )}
    </div>
  );
};