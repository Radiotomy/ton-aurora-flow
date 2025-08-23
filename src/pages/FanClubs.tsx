import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FanClubCard } from '@/components/FanClubCard';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
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
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userMemberships, setUserMemberships] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadInitialData();
  }, [user]);

  const loadInitialData = async () => {
    setIsLoading(true);
    if (isAuthenticated && user) {
      await Promise.all([
        loadUserProfile(),
        loadUserMemberships()
      ]);
    }
    setIsLoading(false);
  };

  const loadUserProfile = async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('auth_user_id', user?.id)
        .maybeSingle();
      
      setUserProfile(profile);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const loadUserMemberships = async () => {
    if (!userProfile?.id) return;
    
    try {
      const { data: memberships } = await supabase
        .from('fan_club_memberships')
        .select('*')
        .eq('profile_id', userProfile.id);
      
      setUserMemberships(memberships || []);
    } catch (error) {
      console.error('Error loading memberships:', error);
    }
  };

  // Enhanced mock data with real-world artist examples
  const featuredClubs = [
    {
      artistId: 'deadmau5',
      artistName: 'deadmau5',
      artistAvatar: 'https://i1.sndcdn.com/avatars-000297218003-dgd8go-t500x500.jpg',
      memberCount: 45200,
      isJoined: userMemberships.some(m => m.artist_id === 'deadmau5'),
      membershipTier: userMemberships.find(m => m.artist_id === 'deadmau5')?.membership_tier || 'bronze',
      expiresAt: userMemberships.find(m => m.artist_id === 'deadmau5')?.expires_at || '2024-12-31',
      fanClubStats: {
        totalMembers: 45200,
        monthlyListeners: 2800000,
        exclusiveContent: 24
      },
      membershipTiers: [
        { 
          name: 'bronze', 
          price: 8, 
          duration: 30, 
          benefits: [
            'Exclusive unreleased tracks',
            'Community Discord access',
            'Monthly livestream access'
          ]
        },
        { 
          name: 'silver', 
          price: 20, 
          duration: 30, 
          benefits: [
            'All Bronze benefits',
            'Early album releases (24h before public)',
            'Behind-the-scenes content',
            '20% discount on merchandise'
          ]
        },
        { 
          name: 'gold', 
          price: 45, 
          duration: 30, 
          benefits: [
            'All Silver benefits',
            'VIP meet & greet access',
            'Exclusive NFT airdrops',
            'Direct messaging with artist',
            'Free limited edition merchandise'
          ]
        },
        { 
          name: 'platinum', 
          price: 100, 
          duration: 30, 
          benefits: [
            'All Gold benefits',
            '1-on-1 virtual sessions (monthly)',
            'Custom track requests',
            'Producer credit opportunities',
            'VIP concert seating'
          ]
        }
      ]
    },
    {
      artistId: 'madeon',
      artistName: 'Madeon',
      artistAvatar: 'https://i1.sndcdn.com/avatars-000317503261-u7ll86-t500x500.jpg',
      memberCount: 28600,
      isJoined: userMemberships.some(m => m.artist_id === 'madeon'),
      membershipTier: userMemberships.find(m => m.artist_id === 'madeon')?.membership_tier || 'bronze',
      expiresAt: userMemberships.find(m => m.artist_id === 'madeon')?.expires_at || '2024-12-31',
      fanClubStats: {
        totalMembers: 28600,
        monthlyListeners: 1950000,
        exclusiveContent: 18
      },
      membershipTiers: [
        { 
          name: 'bronze', 
          price: 6, 
          duration: 30, 
          benefits: [
            'Exclusive demo tracks',
            'Fan community access',
            'Monthly Q&A sessions'
          ]
        },
        { 
          name: 'silver', 
          price: 18, 
          duration: 30, 
          benefits: [
            'All Bronze benefits',
            'Remix stems access',
            'Live performance recordings',
            'Merchandise discounts'
          ]
        },
        { 
          name: 'gold', 
          price: 40, 
          duration: 30, 
          benefits: [
            'All Silver benefits',
            'Production tutorials',
            'Exclusive live events',
            'Signed merchandise',
            'Artist collaboration opportunities'
          ]
        }
      ]
    },
    {
      artistId: 'flume',
      artistName: 'Flume',
      artistAvatar: 'https://i1.sndcdn.com/avatars-000547945158-pd8sjd-t500x500.jpg',
      memberCount: 67800,
      isJoined: userMemberships.some(m => m.artist_id === 'flume'),
      membershipTier: userMemberships.find(m => m.artist_id === 'flume')?.membership_tier || 'bronze',
      expiresAt: userMemberships.find(m => m.artist_id === 'flume')?.expires_at || '2024-12-31',
      fanClubStats: {
        totalMembers: 67800,
        monthlyListeners: 4200000,
        exclusiveContent: 31
      },
      membershipTiers: [
        { 
          name: 'bronze', 
          price: 10, 
          duration: 30, 
          benefits: [
            'Unreleased track previews',
            'Exclusive interviews',
            'Fan community Discord'
          ]
        },
        { 
          name: 'silver', 
          price: 25, 
          duration: 30, 
          benefits: [
            'All Bronze benefits',
            'Studio session recordings',
            'Remix contest access',
            'Virtual soundcheck access'
          ]
        },
        { 
          name: 'gold', 
          price: 55, 
          duration: 30, 
          benefits: [
            'All Silver benefits',
            'Private livestream sessions',
            'Exclusive vinyl releases',
            'Meet & greet opportunities',
            'Custom sample packs'
          ]
        },
        { 
          name: 'platinum', 
          price: 120, 
          duration: 30, 
          benefits: [
            'All Gold benefits',
            'Studio visit opportunities',
            'Collaborative track features',
            'Festival backstage access',
            'Limited edition art pieces'
          ]
        }
      ]
    }
  ];

  const trendingClubs = [
    { name: 'deadmau5 Collective', members: 45200, growth: '+23%' },
    { name: 'Madeon Universe', members: 28600, growth: '+18%' },
    { name: 'Flume Society', members: 67800, growth: '+31%' },
    { name: 'Porter Robinson Fans', members: 38900, growth: '+15%' },
    { name: 'ODESZA Community', members: 52100, growth: '+27%' },
    { name: 'Skrillex Squad', members: 89300, growth: '+12%' }
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
                       <p className="text-2xl font-bold">{featuredClubs.length}</p>
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
                       <p className="text-2xl font-bold">{featuredClubs.reduce((sum, club) => sum + club.memberCount, 0).toLocaleString()}</p>
                       <p className="text-sm text-muted-foreground">Total Members</p>
                     </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Music className="w-8 h-8 text-purple-400" />
                     <div>
                       <p className="text-2xl font-bold">{featuredClubs.reduce((sum, club) => sum + club.fanClubStats.exclusiveContent, 0)}</p>
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
                       <p className="text-2xl font-bold">{userMemberships.length}</p>
                       <p className="text-sm text-muted-foreground">Your Memberships</p>
                     </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Featured Fan Clubs */}
            <div>
              <h2 className="text-2xl font-bold mb-6">Featured Fan Clubs</h2>
               <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                 {isLoading ? (
                   Array(3).fill(0).map((_, index) => (
                     <Card key={index} className="glass-panel animate-pulse">
                       <div className="p-6 space-y-4">
                         <div className="flex items-center gap-4">
                           <div className="w-16 h-16 bg-muted rounded-full"></div>
                           <div className="flex-1 space-y-2">
                             <div className="h-4 bg-muted rounded"></div>
                             <div className="h-3 bg-muted rounded w-2/3"></div>
                           </div>
                         </div>
                         <div className="grid grid-cols-3 gap-4">
                           {Array(3).fill(0).map((_, i) => (
                             <div key={i} className="text-center space-y-1">
                               <div className="h-6 bg-muted rounded"></div>
                               <div className="h-3 bg-muted rounded"></div>
                             </div>
                           ))}
                         </div>
                       </div>
                     </Card>
                   ))
                 ) : (
                   featuredClubs.map((club) => (
                     <FanClubCard 
                       key={club.artistId}
                       artistId={club.artistId}
                       artistName={club.artistName}
                       artistAvatar={club.artistAvatar}
                       membership={club.isJoined ? {
                         tier: club.membershipTier || 'bronze',
                         expiresAt: club.expiresAt || '',
                         nftTokenId: userMemberships.find(m => m.artist_id === club.artistId)?.nft_token_id
                       } : undefined}
                       stats={club.fanClubStats}
                       tiers={club.membershipTiers}
                       onMembershipChange={loadUserMemberships}
                     />
                   ))
                 )}
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
                             nftTokenId: userMemberships.find(m => m.artist_id === club.artistId)?.nft_token_id
                           } : undefined}
                           stats={club.fanClubStats}
                           tiers={club.membershipTiers}
                           onMembershipChange={loadUserMemberships}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {trendingClubs.map((club, index) => (
                <Card key={index} className="glass-card hover:glass-panel-hover cursor-pointer transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-aurora/20 rounded-full">
                          <span className="text-lg font-bold text-aurora">#{index + 1}</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{club.name}</h3>
                          <p className="text-sm text-muted-foreground">{club.members.toLocaleString()} members</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                        {club.growth}
                      </Badge>
                      <Button variant="outline" size="sm">
                        View Club
                      </Button>
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