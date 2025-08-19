import { useAuth } from '@/hooks/useAuth';
import { useWalletStore } from '@/stores/walletStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Music, Users, Heart, Trophy, Wallet, Settings } from 'lucide-react';
import { Navigate } from 'react-router-dom';

const Dashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const { profile, assets, fanClubMemberships, isConnected, tonBalance } = useWalletStore();

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  const stats = [
    { label: 'Tracks Collected', value: assets.filter(a => a.asset_type === 'nft').length, icon: Music },
    { label: 'Fan Clubs', value: fanClubMemberships.length, icon: Users },
    { label: 'Reputation', value: profile?.reputation_score || 0, icon: Trophy },
    { label: 'TON Balance', value: tonBalance.toFixed(2), icon: Wallet },
  ];

  return (
    <div className="container mx-auto px-4 py-8 pt-24">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Profile Header */}
        <Card className="glass-panel border-glass">
          <CardContent className="p-6">
            <div className="flex items-center gap-6">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback>
                  <Music className="h-8 w-8" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-aurora">
                  {profile?.display_name || user?.email?.split('@')[0] || 'Anonymous'}
                </h1>
                <p className="text-muted-foreground">
                  {profile?.bio || 'Welcome to AudioTon! Complete your profile to get started.'}
                </p>
                <div className="flex items-center gap-4 mt-3">
                  {profile?.ton_dns_name && (
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      {profile.ton_dns_name}
                    </Badge>
                  )}
                  {isConnected ? (
                    <Badge variant="secondary" className="bg-success/10 text-success">
                      Wallet Connected
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      Wallet Not Connected
                    </Badge>
                  )}
                </div>
              </div>
              <Button variant="glass" size="sm">
                <Settings className="h-4 w-4" />
                Edit Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card key={index} className="glass-panel border-glass">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold text-aurora">{stat.value}</p>
                  </div>
                  <stat.icon className="h-8 w-8 text-primary opacity-70" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="glass-panel">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="collection">My Collection</TabsTrigger>
            <TabsTrigger value="fanclubs">Fan Clubs</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glass-panel border-glass">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Your latest interactions on AudioTon</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Heart className="h-4 w-4 text-primary" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Liked "Ethereal Sounds"</p>
                        <p className="text-xs text-muted-foreground">2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Music className="h-4 w-4 text-secondary" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Collected "Digital Dreams" NFT</p>
                        <p className="text-xs text-muted-foreground">1 day ago</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Users className="h-4 w-4 text-accent" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Joined Aurora Artists Fan Club</p>
                        <p className="text-xs text-muted-foreground">3 days ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-panel border-glass">
                <CardHeader>
                  <CardTitle>Progress</CardTitle>
                  <CardDescription>Your journey on AudioTon</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Profile Completion</span>
                        <span>75%</span>
                      </div>
                      <Progress value={75} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Collection Progress</span>
                        <span>40%</span>
                      </div>
                      <Progress value={40} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Community Engagement</span>
                        <span>60%</span>
                      </div>
                      <Progress value={60} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="collection">
            <Card className="glass-panel border-glass">
              <CardHeader>
                <CardTitle>My Collection</CardTitle>
                <CardDescription>Your collected tracks and NFTs</CardDescription>
              </CardHeader>
              <CardContent>
                {assets.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {assets.map((asset) => (
                      <div key={asset.id} className="p-4 rounded-lg bg-muted/50 border">
                        <div className="aspect-square bg-gradient-aurora rounded-lg mb-3"></div>
                        <p className="font-medium">{asset.metadata?.title || 'Unknown Track'}</p>
                        <p className="text-sm text-muted-foreground">
                          {asset.asset_type.toUpperCase()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Music className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No items in your collection yet</p>
                    <p className="text-sm text-muted-foreground">Start collecting tracks to build your music library</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fanclubs">
            <Card className="glass-panel border-glass">
              <CardHeader>
                <CardTitle>Fan Club Memberships</CardTitle>
                <CardDescription>Your active fan club memberships</CardDescription>
              </CardHeader>
              <CardContent>
                {fanClubMemberships.length > 0 ? (
                  <div className="space-y-4">
                    {fanClubMemberships.map((membership) => (
                      <div key={membership.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border">
                        <div>
                          <p className="font-medium">Artist ID: {membership.artist_id}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="capitalize">
                              {membership.membership_tier}
                            </Badge>
                            {membership.expires_at && (
                              <span className="text-sm text-muted-foreground">
                                Expires: {new Date(membership.expires_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No fan club memberships yet</p>
                    <p className="text-sm text-muted-foreground">Join fan clubs to connect with your favorite artists</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <Card className="glass-panel border-glass">
              <CardHeader>
                <CardTitle>Activity History</CardTitle>
                <CardDescription>Your complete activity timeline</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Activity tracking coming soon</p>
                  <p className="text-sm text-muted-foreground">We'll show your complete history here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;