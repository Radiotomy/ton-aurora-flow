import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload,
  Music,
  Users,
  TrendingUp,
  DollarSign,
  Settings,
  Play,
  Pause,
  BarChart3,
  Crown,
  Star,
  Palette,
  Zap,
  Calendar,
  Eye,
  Heart,
  Share2
} from 'lucide-react';

const CreatorStudio = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [trackTitle, setTrackTitle] = useState('');
  const [trackDescription, setTrackDescription] = useState('');
  const [trackPrice, setTrackPrice] = useState('');
  const [enableNFT, setEnableNFT] = useState(false);
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  // Mock data - replace with real data from API
  const creatorStats = {
    totalTracks: 12,
    totalEarnings: 245.8,
    fanClubMembers: 1250,
    totalStreams: 48600,
    monthlyGrowth: 23.5
  };

  const recentTracks = [
    {
      id: '1',
      title: 'Aurora Dreams',
      plays: 12500,
      earnings: 45.2,
      status: 'published',
      uploadDate: '2024-01-15'
    },
    {
      id: '2',
      title: 'Neon Nights',
      plays: 8900,
      earnings: 32.8,
      status: 'published',
      uploadDate: '2024-01-10'
    },
    {
      id: '3',
      title: 'Cosmic Voyage',
      plays: 0,
      earnings: 0,
      status: 'draft',
      uploadDate: '2024-01-20'
    }
  ];

  const fanClubTiers = [
    { name: 'Bronze', members: 850, monthlyRevenue: 4250, price: 5 },
    { name: 'Silver', members: 300, monthlyRevenue: 4500, price: 15 },
    { name: 'Gold', members: 100, monthlyRevenue: 2500, price: 25 }
  ];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleTrackUpload = () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to upload tracks.",
        variant: "destructive"
      });
      return;
    }

    if (!selectedFile || !trackTitle) {
      toast({
        title: "Missing Information",
        description: "Please provide a track file and title.",
        variant: "destructive"
      });
      return;
    }

    // Mock upload process
    toast({
      title: "Upload Started",
      description: "Your track is being uploaded and processed.",
    });

    // Reset form
    setSelectedFile(null);
    setTrackTitle('');
    setTrackDescription('');
    setTrackPrice('');
    setEnableNFT(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen pt-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="glass-card">
            <CardContent className="p-12 text-center">
              <Palette className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Creator Studio Access Required</h3>
              <p className="text-muted-foreground mb-6">
                Sign in to access your creator dashboard and start uploading music.
              </p>
              <Button onClick={() => window.location.href = '/auth'}>
                Sign In to Continue
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-aurora bg-clip-text text-transparent">
            Creator Studio
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Upload music, manage your fan clubs, track earnings, and engage with your community.
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="glass-panel">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="tracks" className="flex items-center gap-2">
              <Music className="w-4 h-4" />
              My Tracks
            </TabsTrigger>
            <TabsTrigger value="fan-clubs" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Fan Clubs
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Music className="w-8 h-8 text-aurora" />
                    <div>
                      <p className="text-2xl font-bold">{creatorStats.totalTracks}</p>
                      <p className="text-sm text-muted-foreground">Total Tracks</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-8 h-8 text-green-400" />
                    <div>
                      <p className="text-2xl font-bold">{creatorStats.totalEarnings} TON</p>
                      <p className="text-sm text-muted-foreground">Total Earnings</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Users className="w-8 h-8 text-purple-400" />
                    <div>
                      <p className="text-2xl font-bold">{creatorStats.fanClubMembers.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">Fan Club Members</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Play className="w-8 h-8 text-cyan-400" />
                    <div>
                      <p className="text-2xl font-bold">{creatorStats.totalStreams.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">Total Streams</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Recent Tracks</CardTitle>
                  <CardDescription>Your latest uploaded tracks</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recentTracks.slice(0, 3).map((track) => (
                    <div key={track.id} className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                      <div>
                        <h4 className="font-medium">{track.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {track.plays.toLocaleString()} plays • {track.earnings} TON
                        </p>
                      </div>
                      <Badge variant={track.status === 'published' ? 'default' : 'secondary'}>
                        {track.status}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Fan Club Performance</CardTitle>
                  <CardDescription>Membership tier breakdown</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {fanClubTiers.map((tier) => (
                    <div key={tier.name} className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                      <div className="flex items-center space-x-3">
                        <Crown className="w-5 h-5 text-yellow-400" />
                        <div>
                          <h4 className="font-medium">{tier.name} Tier</h4>
                          <p className="text-sm text-muted-foreground">{tier.members} members</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{tier.monthlyRevenue} TON</p>
                        <p className="text-sm text-muted-foreground">monthly</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="upload" className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Upload New Track</CardTitle>
                <CardDescription>
                  Share your music with the world and enable Web3 features like NFT minting and fan club exclusives.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* File Upload */}
                <div>
                  <Label>Audio File</Label>
                  <div className="mt-2">
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={handleFileUpload}
                      className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-aurora file:text-background hover:file:bg-aurora/80"
                    />
                    {selectedFile && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        Selected: {selectedFile.name}
                      </p>
                    )}
                  </div>
                </div>

                {/* Track Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="track-title">Track Title</Label>
                    <Input
                      id="track-title"
                      value={trackTitle}
                      onChange={(e) => setTrackTitle(e.target.value)}
                      placeholder="Enter track title"
                      className="glass-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="track-price">Price (TON)</Label>
                    <Input
                      id="track-price"
                      value={trackPrice}
                      onChange={(e) => setTrackPrice(e.target.value)}
                      placeholder="0.5"
                      type="number"
                      step="0.1"
                      className="glass-input"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="track-description">Description</Label>
                  <Textarea
                    id="track-description"
                    value={trackDescription}
                    onChange={(e) => setTrackDescription(e.target.value)}
                    placeholder="Describe your track..."
                    className="glass-input"
                  />
                </div>

                {/* NFT Settings */}
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enable-nft"
                    checked={enableNFT}
                    onCheckedChange={setEnableNFT}
                  />
                  <Label htmlFor="enable-nft">Enable NFT Minting</Label>
                </div>

                <Button onClick={handleTrackUpload} className="w-full">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Track
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tracks" className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>My Tracks</CardTitle>
                <CardDescription>Manage your uploaded music library</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentTracks.map((track) => (
                    <div key={track.id} className="flex items-center justify-between p-4 rounded-lg bg-background/50">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-aurora/20 rounded-lg flex items-center justify-center">
                          <Music className="w-6 h-6 text-aurora" />
                        </div>
                        <div>
                          <h4 className="font-medium">{track.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            Uploaded {track.uploadDate}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="font-medium">{track.plays.toLocaleString()} plays</p>
                          <p className="text-sm text-muted-foreground">{track.earnings} TON earned</p>
                        </div>
                        <Badge variant={track.status === 'published' ? 'default' : 'secondary'}>
                          {track.status}
                        </Badge>
                        <Button variant="outline" size="sm">
                          <Settings className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fan-clubs" className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Fan Club Management</CardTitle>
                <CardDescription>Configure your fan club tiers and benefits</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {fanClubTiers.map((tier) => (
                    <div key={tier.name} className="p-4 rounded-lg bg-background/50">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <Crown className="w-6 h-6 text-yellow-400" />
                          <h3 className="text-lg font-semibold">{tier.name} Tier</h3>
                        </div>
                        <Button variant="outline" size="sm">
                          Edit Tier
                        </Button>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Members</p>
                          <p className="font-medium">{tier.members}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Price</p>
                          <p className="font-medium">{tier.price} TON/month</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Monthly Revenue</p>
                          <p className="font-medium">{tier.monthlyRevenue} TON</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Engagement Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total Plays</span>
                    <span className="font-medium">{creatorStats.totalStreams.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Monthly Growth</span>
                    <span className="font-medium text-green-400">+{creatorStats.monthlyGrowth}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Fan Club Members</span>
                    <span className="font-medium">{creatorStats.fanClubMembers.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total Earnings</span>
                    <span className="font-medium">{creatorStats.totalEarnings} TON</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Top Performing Tracks</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recentTracks
                    .filter(track => track.status === 'published')
                    .sort((a, b) => b.plays - a.plays)
                    .map((track, index) => (
                    <div key={track.id} className="flex items-center space-x-3">
                      <span className="text-muted-foreground w-6">#{index + 1}</span>
                      <div className="flex-1">
                        <p className="font-medium">{track.title}</p>
                        <p className="text-sm text-muted-foreground">{track.plays.toLocaleString()} plays</p>
                      </div>
                      <span className="font-medium">{track.earnings} TON</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CreatorStudio;