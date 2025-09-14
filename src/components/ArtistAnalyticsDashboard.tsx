import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Play,
  Heart,
  Repeat2,
  Users,
  TrendingUp,
  Upload,
  Calendar,
  DollarSign,
  Eye,
  Music,
} from 'lucide-react';
import { useAudiusAuth, useAudiusUserData } from '@/hooks/useAudiusAuth';
import { AudiusService } from '@/services/audiusService';
import { cn } from '@/lib/utils';

interface ArtistAnalyticsDashboardProps {
  className?: string;
}

export const ArtistAnalyticsDashboard: React.FC<ArtistAnalyticsDashboardProps> = ({
  className
}) => {
  const { user, isAuthenticated } = useAudiusAuth();
  const { favorites, reposts, followers, playlists, loading } = useAudiusUserData();
  const [tracks, setTracks] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState({
    totalPlays: 0,
    totalFavorites: 0,
    totalReposts: 0,
    totalFollowers: 0,
    monthlyListeners: 0,
    topGenres: [] as { name: string; value: number; color: string }[],
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!isAuthenticated || !user) return;

      try {
        // Fetch user's tracks
        const userTracks = await AudiusService.getUserTracks(user.id);
        setTracks(userTracks);

        // Calculate analytics
        const totalPlays = userTracks.reduce((sum, track) => sum + (track.play_count || 0), 0);
        const totalFavorites = userTracks.reduce((sum, track) => sum + (track.favorite_count || 0), 0);
        const totalReposts = userTracks.reduce((sum, track) => sum + (track.repost_count || 0), 0);

        // Genre analysis
        const genreMap = new Map<string, number>();
        userTracks.forEach(track => {
          if (track.genre) {
            genreMap.set(track.genre, (genreMap.get(track.genre) || 0) + 1);
          }
        });

        const colors = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];
        const topGenres = Array.from(genreMap.entries())
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([name, value], index) => ({
            name,
            value,
            color: colors[index] || '#6b7280'
          }));

        setAnalytics({
          totalPlays,
          totalFavorites,
          totalReposts,
          totalFollowers: user.follower_count || 0,
          monthlyListeners: Math.floor(totalPlays * 0.3), // Estimated
          topGenres,
        });
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      }
    };

    fetchAnalytics();
  }, [isAuthenticated, user]);

  if (!isAuthenticated) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <Music className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Connect to Audius</h3>
            <p className="text-muted-foreground">
              Connect your Audius account to view your artist analytics
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  // Mock data for charts
  const monthlyData = [
    { month: 'Jan', plays: 1200, favorites: 89, reposts: 23 },
    { month: 'Feb', plays: 1890, favorites: 134, reposts: 45 },
    { month: 'Mar', plays: 2100, favorites: 167, reposts: 52 },
    { month: 'Apr', plays: 1800, favorites: 145, reposts: 38 },
    { month: 'May', plays: 2400, favorites: 189, reposts: 67 },
    { month: 'Jun', plays: 2800, favorites: 234, reposts: 89 },
  ];

  const topTracks = tracks
    .sort((a, b) => (b.play_count || 0) - (a.play_count || 0))
    .slice(0, 5);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Plays</p>
                <p className="text-2xl font-bold">{analytics.totalPlays.toLocaleString()}</p>
              </div>
              <Play className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Followers</p>
                <p className="text-2xl font-bold">{analytics.totalFollowers.toLocaleString()}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Favorites</p>
                <p className="text-2xl font-bold">{analytics.totalFavorites.toLocaleString()}</p>
              </div>
              <Heart className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Monthly Listeners</p>
                <p className="text-2xl font-bold">{analytics.monthlyListeners.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tracks">Top Tracks</TabsTrigger>
          <TabsTrigger value="audience">Audience</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="plays" stroke="#8b5cf6" strokeWidth={2} />
                    <Line type="monotone" dataKey="favorites" stroke="#06b6d4" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Genre Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Genre Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics.topGenres.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analytics.topGenres}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        dataKey="value"
                      >
                        {analytics.topGenres.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    No genre data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tracks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Tracks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topTracks.map((track, index) => (
                  <div key={track.id} className="flex items-center gap-4 p-4 rounded-lg border">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <img
                      src={AudiusService.getArtworkUrl(track.artwork)}
                      alt={track.title}
                      className="w-12 h-12 rounded object-cover"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium">{track.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {track.play_count?.toLocaleString() || 0} plays
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Heart className="w-4 h-4" />
                        {track.favorite_count || 0}
                      </div>
                      <div className="flex items-center gap-1">
                        <Repeat2 className="w-4 h-4" />
                        {track.repost_count || 0}
                      </div>
                    </div>
                  </div>
                ))}
                {topTracks.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No tracks found. Upload your first track to see analytics.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audience" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Audience Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="favorites" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Engagement Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Favorite Rate</span>
                    <span className="text-sm text-muted-foreground">
                      {((analytics.totalFavorites / Math.max(analytics.totalPlays, 1)) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <Progress 
                    value={(analytics.totalFavorites / Math.max(analytics.totalPlays, 1)) * 100} 
                    className="h-2"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Repost Rate</span>
                    <span className="text-sm text-muted-foreground">
                      {((analytics.totalReposts / Math.max(analytics.totalPlays, 1)) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <Progress 
                    value={(analytics.totalReposts / Math.max(analytics.totalPlays, 1)) * 100} 
                    className="h-2"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Follower Growth</span>
                    <span className="text-sm text-muted-foreground">+12.5%</span>
                  </div>
                  <Progress value={12.5} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};