import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { useWalletStore } from '@/stores/walletStore';
import { supabase } from '@/integrations/supabase/client';
import { AudiusService } from '@/services/audiusService';
import {
  DollarSign,
  TrendingUp,
  Users,
  Music,
  Heart,
  Download,
  Calendar,
  Target,
  Sparkles,
  BarChart3,
  PieChart,
  Clock
} from 'lucide-react';

interface RevenueData {
  totalEarnings: number;
  monthlyGrowth: number;
  nftsSold: number;
  totalTips: number;
  fanClubMembers: number;
  topTracks: Array<{
    id: string;
    title: string;
    earnings: number;
    sales: number;
  }>;
  revenueBySource: Array<{
    source: string;
    amount: number;
    percentage: number;
  }>;
  monthlyData: Array<{
    month: string;
    earnings: number;
    nfts: number;
    tips: number;
  }>;
}

export const CreatorRevenueDashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { isConnected } = useWalletStore();
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  useEffect(() => {
    const fetchRevenueData = async () => {
      if (!isAuthenticated) return;

      setLoading(true);
      try {
        // Get user profile to link with transactions
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('auth_user_id', user?.id)
          .single();

        if (!profile) return;

        // Calculate date range
        const now = new Date();
        let startDate: Date;
        switch (selectedPeriod) {
          case '7d':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case '30d':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case '90d':
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
          default:
            startDate = new Date('2020-01-01');
        }

        // Fetch revenue data
        const { data: transactions } = await supabase
          .from('transactions')
          .select('*')
          .eq('to_profile_id', profile.id)
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: false });

        // Fetch NFT collections data
        const { data: collections } = await supabase
          .from('track_collections')
          .select('*')
          .eq('profile_id', profile.id)
          .gte('collected_at', startDate.toISOString());

        // Fetch fan club memberships
        const { data: memberships } = await supabase
          .from('fan_club_memberships')
          .select('*')
          .gte('created_at', startDate.toISOString());

        // Process data
        const totalEarnings = transactions?.reduce((sum, tx) => sum + (tx.amount_ton || 0), 0) || 0;
        const nftEarnings = transactions?.filter(tx => tx.transaction_type === 'nft_mint')
          .reduce((sum, tx) => sum + (tx.amount_ton || 0), 0) || 0;
        const tipEarnings = transactions?.filter(tx => tx.transaction_type === 'tip')
          .reduce((sum, tx) => sum + (tx.amount_ton || 0), 0) || 0;

        // Calculate growth from transaction history
        const currentDate = new Date();
        const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, currentDate.getDate());
        const thisMonthEarnings = transactions?.filter(tx => 
          new Date(tx.created_at) >= lastMonth && tx.to_profile_id === profile.id
        ).reduce((sum, tx) => sum + (tx.amount_ton || 0), 0) || 0;
        
        const previousMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 2, currentDate.getDate());
        const lastMonthEarnings = transactions?.filter(tx => 
          new Date(tx.created_at) >= previousMonth && 
          new Date(tx.created_at) < lastMonth && 
          tx.to_profile_id === profile.id
        ).reduce((sum, tx) => sum + (tx.amount_ton || 0), 0) || 0;
        
        const monthlyGrowth = lastMonthEarnings > 0 
          ? ((thisMonthEarnings - lastMonthEarnings) / lastMonthEarnings) * 100 
          : 0;

        // Get top tracks from collections (group by track_id)
        const trackRevenue = collections?.reduce((acc, collection) => {
          const trackId = collection.track_id;
          if (!acc[trackId]) {
            acc[trackId] = {
              id: trackId,
              title: `Track ${trackId}`,
              earnings: 0,
              sales: 0
            };
          }
          acc[trackId].earnings += collection.purchase_price || 0;
          acc[trackId].sales += 1;
          return acc;
        }, {} as Record<string, any>) || {};

        const topTracks = Object.values(trackRevenue)
          .sort((a: any, b: any) => b.earnings - a.earnings)
          .slice(0, 5);

        // Revenue by source
        const revenueBySource = [
          { source: 'NFT Sales', amount: nftEarnings, percentage: (nftEarnings / totalEarnings) * 100 },
          { source: 'Tips', amount: tipEarnings, percentage: (tipEarnings / totalEarnings) * 100 },
          { source: 'Fan Clubs', amount: totalEarnings - nftEarnings - tipEarnings, percentage: ((totalEarnings - nftEarnings - tipEarnings) / totalEarnings) * 100 }
        ].filter(item => item.amount > 0);

        // Monthly data (mock for visualization)
        const monthlyData = Array.from({ length: 6 }, (_, i) => ({
          month: new Date(now.getTime() - i * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short' }),
          earnings: Math.random() * 100,
          nfts: Math.floor(Math.random() * 20),
          tips: Math.random() * 50
        })).reverse();

        setRevenueData({
          totalEarnings,
          monthlyGrowth,
          nftsSold: collections?.length || 0,
          totalTips: transactions?.filter(tx => tx.transaction_type === 'tip').length || 0,
          fanClubMembers: memberships?.length || 0,
          topTracks,
          revenueBySource,
          monthlyData
        });
      } catch (error) {
        console.error('Error fetching revenue data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRevenueData();
  }, [isAuthenticated, user, selectedPeriod]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <Card className="glass-panel max-w-md">
          <CardContent className="p-8 text-center">
            <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Authentication Required</h3>
            <p className="text-muted-foreground mb-4">
              Connect your wallet to view your creator revenue dashboard
            </p>
            <Button variant="aurora" className="w-full">
              Connect Wallet
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading || !revenueData) {
    return (
      <div className="min-h-screen pt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="glass-panel">
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded w-1/4 mb-4" />
                  <div className="h-8 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-aurora mb-2">
                Creator Revenue Dashboard
              </h1>
              <p className="text-muted-foreground text-lg">
                Track your Audius × TON earnings and fan engagement
              </p>
            </div>
            
            <div className="flex gap-2">
              {(['7d', '30d', '90d', 'all'] as const).map((period) => (
                <Button
                  key={period}
                  variant={selectedPeriod === period ? "aurora" : "outline"}
                  size="sm"
                  onClick={() => setSelectedPeriod(period)}
                >
                  {period === 'all' ? 'All Time' : period}
                </Button>
              ))}
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="glass-panel border-glass">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Earnings</p>
                    <p className="text-3xl font-bold text-aurora">
                      {revenueData.totalEarnings.toFixed(2)} TON
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <TrendingUp className="h-4 w-4 text-success" />
                      <span className="text-sm text-success">+{revenueData.monthlyGrowth.toFixed(1)}%</span>
                    </div>
                  </div>
                  <DollarSign className="h-8 w-8 text-aurora" />
                </div>
              </CardContent>
            </Card>

            <Card className="glass-panel border-glass">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">NFTs Sold</p>
                    <p className="text-3xl font-bold text-aurora">{revenueData.nftsSold}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {(revenueData.nftsSold / Math.max(1, revenueData.monthlyData.length)).toFixed(1)}/month avg
                    </p>
                  </div>
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card className="glass-panel border-glass">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Tips Received</p>
                    <p className="text-3xl font-bold text-aurora">{revenueData.totalTips}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      From {revenueData.fanClubMembers} supporters
                    </p>
                  </div>
                  <Heart className="h-8 w-8 text-secondary" />
                </div>
              </CardContent>
            </Card>

            <Card className="glass-panel border-glass">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Fan Club Members</p>
                    <p className="text-3xl font-bold text-aurora">{revenueData.fanClubMembers}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Users className="h-4 w-4 text-accent" />
                      <span className="text-sm text-accent">Active community</span>
                    </div>
                  </div>
                  <Users className="h-8 w-8 text-accent" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Revenue Sources */}
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Revenue Sources
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {revenueData.revenueBySource.map((source, index) => (
                    <div key={source.source}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">{source.source}</span>
                        <span className="text-sm text-aurora">{source.amount.toFixed(2)} TON</span>
                      </div>
                      <Progress 
                        value={source.percentage} 
                        className="h-2"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {source.percentage.toFixed(1)}% of total revenue
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Performing Tracks */}
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Music className="h-5 w-5" />
                  Top Earning Tracks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {revenueData.topTracks.length > 0 ? (
                    revenueData.topTracks.map((track, index) => (
                      <div key={track.id} className="flex items-center justify-between p-3 rounded-lg glass-panel-hover">
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary">#{index + 1}</Badge>
                          <div>
                            <p className="font-medium">{track.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {track.sales} sales
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-aurora">{track.earnings.toFixed(2)} TON</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Music className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-50" />
                      <p className="text-muted-foreground">No track sales yet</p>
                      <p className="text-sm text-muted-foreground">Start minting NFTs to see earnings here</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Goals & Projections */}
          <Card className="glass-panel mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Revenue Goals & Projections
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-aurora mb-2">
                    {(revenueData.totalEarnings * 1.5).toFixed(0)} TON
                  </div>
                  <p className="text-sm text-muted-foreground">Monthly Goal</p>
                  <Progress 
                    value={(revenueData.totalEarnings / (revenueData.totalEarnings * 1.5)) * 100} 
                    className="mt-2"
                  />
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">
                    {Math.floor(revenueData.nftsSold * 2.3)}
                  </div>
                  <p className="text-sm text-muted-foreground">NFT Target</p>
                  <Progress 
                    value={(revenueData.nftsSold / (revenueData.nftsSold * 2.3)) * 100} 
                    className="mt-2"
                  />
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-secondary mb-2">
                    {Math.floor(revenueData.fanClubMembers * 1.8)}
                  </div>
                  <p className="text-sm text-muted-foreground">Fan Goal</p>
                  <Progress 
                    value={(revenueData.fanClubMembers / (revenueData.fanClubMembers * 1.8)) * 100} 
                    className="mt-2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Items */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="glass-panel">
              <CardContent className="p-6 text-center">
                <Sparkles className="h-12 w-12 mx-auto text-aurora mb-4" />
                <h3 className="font-semibold mb-2">Mint New NFTs</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Convert your Audius tracks into collectible NFTs
                </p>
                <Button variant="aurora" className="w-full">
                  Browse Tracks
                </Button>
              </CardContent>
            </Card>

            <Card className="glass-panel">
              <CardContent className="p-6 text-center">
                <Users className="h-12 w-12 mx-auto text-primary mb-4" />
                <h3 className="font-semibold mb-2">Grow Fan Club</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create exclusive content and engage with supporters
                </p>
                <Button variant="outline" className="w-full">
                  Manage Fan Club
                </Button>
              </CardContent>
            </Card>

            <Card className="glass-panel">
              <CardContent className="p-6 text-center">
                <BarChart3 className="h-12 w-12 mx-auto text-secondary mb-4" />
                <h3 className="font-semibold mb-2">Analytics Export</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Download detailed revenue reports
                </p>
                <Button variant="outline" className="w-full gap-2">
                  <Download className="h-4 w-4" />
                  Export Data
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};