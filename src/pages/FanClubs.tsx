import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FanClubCard } from '@/components/FanClubCard';
import { useAuth } from '@/hooks/useAuth';
import { 
  Users, 
  Search, 
  Crown, 
  Star, 
  Music,
  TrendingUp,
  Heart,
  Zap
} from 'lucide-react';

const FanClubs = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { isAuthenticated } = useAuth();

  // Mock data - replace with real data from API
  const featuredClubs = [
    {
      artistId: '1',
      artistName: 'Cosmic Beats',
      artistAvatar: '/placeholder.svg',
      memberCount: 12500,
      isJoined: true,
      membershipTier: 'gold' as const,
      expiresAt: '2024-12-31',
      fanClubStats: {
        totalMembers: 12500,
        monthlyListeners: 8900,
        exclusiveContent: 12
      },
      membershipTiers: [
        { name: 'bronze', price: 5, duration: 30, benefits: ['Exclusive tracks', 'Community access'] },
        { name: 'silver', price: 15, duration: 30, benefits: ['Early releases', 'Voice chat access', 'NFT discounts'] },
        { name: 'gold', price: 25, duration: 30, benefits: ['VIP events', 'Direct artist chat', 'Free NFTs'] },
        { name: 'platinum', price: 50, duration: 30, benefits: ['1-on-1 sessions', 'Custom content', 'Producer credits'] }
      ]
    },
    {
      artistId: '2',
      artistName: 'Aurora Waves',
      artistAvatar: '/placeholder.svg',
      memberCount: 8200,
      isJoined: false,
      fanClubStats: {
        totalMembers: 8200,
        monthlyListeners: 6100,
        exclusiveContent: 8
      },
      membershipTiers: [
        { name: 'bronze', price: 3, duration: 30, benefits: ['Exclusive tracks', 'Community access'] },
        { name: 'silver', price: 10, duration: 30, benefits: ['Early releases', 'Voice chat access'] },
        { name: 'gold', price: 20, duration: 30, benefits: ['VIP events', 'Direct artist chat'] }
      ]
    },
    {
      artistId: '3',
      artistName: 'Neon Dreams',
      artistAvatar: '/placeholder.svg',
      memberCount: 15800,
      isJoined: false,
      fanClubStats: {
        totalMembers: 15800,
        monthlyListeners: 11200,
        exclusiveContent: 18
      },
      membershipTiers: [
        { name: 'bronze', price: 4, duration: 30, benefits: ['Exclusive tracks', 'Community access'] },
        { name: 'silver', price: 12, duration: 30, benefits: ['Early releases', 'Voice chat access'] },
        { name: 'gold', price: 22, duration: 30, benefits: ['VIP events', 'Direct artist chat'] },
        { name: 'platinum', price: 45, duration: 30, benefits: ['1-on-1 sessions', 'Custom content'] }
      ]
    }
  ];

  const trendingClubs = [
    { name: 'Bass Collective', members: 9800, growth: '+23%' },
    { name: 'Melodic Minds', members: 7500, growth: '+18%' },
    { name: 'Rhythm Raiders', members: 5200, growth: '+31%' },
    { name: 'Synth Society', members: 12100, growth: '+15%' }
  ];

  const myMemberships = featuredClubs.filter(club => club.isJoined);

  return (
    <div className="min-h-screen pt-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-aurora bg-clip-text text-transparent">
            Fan Clubs
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Join exclusive communities, support your favorite artists, and unlock premium content through fan club memberships.
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search fan clubs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 glass-input"
          />
        </div>

        <Tabs defaultValue="discover" className="space-y-6">
          <TabsList className="glass-panel">
            <TabsTrigger value="discover" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Discover
            </TabsTrigger>
            {isAuthenticated && (
              <TabsTrigger value="my-clubs" className="flex items-center gap-2">
                <Heart className="w-4 h-4" />
                My Clubs ({myMemberships.length})
              </TabsTrigger>
            )}
            <TabsTrigger value="trending" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Trending
            </TabsTrigger>
          </TabsList>

          <TabsContent value="discover" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Users className="w-8 h-8 text-aurora" />
                    <div>
                      <p className="text-2xl font-bold">156</p>
                      <p className="text-sm text-muted-foreground">Active Clubs</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Crown className="w-8 h-8 text-yellow-400" />
                    <div>
                      <p className="text-2xl font-bold">23.5K</p>
                      <p className="text-sm text-muted-foreground">Members</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Music className="w-8 h-8 text-purple-400" />
                    <div>
                      <p className="text-2xl font-bold">892</p>
                      <p className="text-sm text-muted-foreground">Exclusive Tracks</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-8 h-8 text-cyan-400" />
                    <div>
                      <p className="text-2xl font-bold">45</p>
                      <p className="text-sm text-muted-foreground">Live Events</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Featured Fan Clubs */}
            <div>
              <h2 className="text-2xl font-bold mb-6">Featured Fan Clubs</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {featuredClubs.map((club) => (
                  <FanClubCard 
                    key={club.artistId}
                    artistId={club.artistId}
                    artistName={club.artistName}
                    artistAvatar={club.artistAvatar}
                    membership={club.isJoined ? {
                      tier: club.membershipTier || 'bronze',
                      expiresAt: club.expiresAt || '',
                      nftTokenId: 'nft_123'
                    } : undefined}
                    stats={club.fanClubStats}
                    tiers={club.membershipTiers}
                  />
                ))}
              </div>
            </div>
          </TabsContent>

          {isAuthenticated && (
            <TabsContent value="my-clubs" className="space-y-6">
              {myMemberships.length > 0 ? (
                  <div>
                    <h2 className="text-2xl font-bold mb-6">My Fan Club Memberships</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                      {myMemberships.map((club) => (
                        <FanClubCard 
                          key={club.artistId}
                          artistId={club.artistId}
                          artistName={club.artistName}
                          artistAvatar={club.artistAvatar}
                          membership={club.isJoined ? {
                            tier: club.membershipTier || 'bronze',
                            expiresAt: club.expiresAt || '',
                            nftTokenId: 'nft_123'
                          } : undefined}
                          stats={club.fanClubStats}
                          tiers={club.membershipTiers}
                        />
                      ))}
                    </div>
                  </div>
              ) : (
                <Card className="glass-card">
                  <CardContent className="p-12 text-center">
                    <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Fan Club Memberships Yet</h3>
                    <p className="text-muted-foreground mb-6">
                      Join fan clubs to support your favorite artists and unlock exclusive content.
                    </p>
                    <Button onClick={() => {
                      const discoverTab = document.querySelector('[value="discover"]') as HTMLElement;
                      discoverTab?.click();
                    }}>
                      Discover Fan Clubs
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          )}

          <TabsContent value="trending" className="space-y-6">
            <h2 className="text-2xl font-bold mb-6">Trending Fan Clubs</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {trendingClubs.map((club, index) => (
                <Card key={index} className="glass-card">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-aurora/20 rounded-full">
                          <span className="text-sm font-bold text-aurora">#{index + 1}</span>
                        </div>
                        <div>
                          <h3 className="font-semibold">{club.name}</h3>
                          <p className="text-sm text-muted-foreground">{club.members.toLocaleString()} members</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                        {club.growth}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default FanClubs;