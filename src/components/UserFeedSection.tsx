import React, { useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TrackCard from '@/components/TrackCard';
import { PlaylistCard } from '@/components/PlaylistCard';
import { AudiusLoginButton } from '@/components/AudiusLoginButton';
import { Skeleton } from '@/components/ui/skeleton';
import { Music, Heart, RotateCcw, Users, Rss } from 'lucide-react';
import { useAudiusAuth, useAudiusUserData } from '@/hooks/useAudiusAuth';
import { AudiusService } from '@/services/audiusService';

export const UserFeedSection: React.FC = () => {
  const { isAuthenticated, user } = useAudiusAuth();
  const {
    favorites,
    reposts,
    playlists,
    following,
    feed,
    loading,
    fetchFavorites,
    fetchReposts,
    fetchPlaylists,
    fetchFollowing,
    fetchFeed,
  } = useAudiusUserData();

  useEffect(() => {
    if (isAuthenticated) {
      fetchFeed();
    }
  }, [isAuthenticated, fetchFeed]);

  if (!isAuthenticated) {
    return (
      <Card className="mx-4 mb-4">
        <CardHeader className="text-center py-8">
          <Music className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Connect Your Audius Account</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Sign in to see your personalized feed, favorites, and playlists
          </p>
          <AudiusLoginButton />
        </CardHeader>
      </Card>
    );
  }

  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-32" />
      ))}
    </div>
  );

  return (
    <Card className="mx-4 mb-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Your Music Hub</h3>
            <p className="text-sm text-muted-foreground">
              Welcome back, {user?.name}!
            </p>
          </div>
          <AudiusLoginButton />
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="feed" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="feed" className="gap-2">
              <Rss className="w-4 h-4" />
              <span className="hidden sm:inline">Feed</span>
            </TabsTrigger>
            <TabsTrigger value="favorites" className="gap-2">
              <Heart className="w-4 h-4" />
              <span className="hidden sm:inline">Favorites</span>
            </TabsTrigger>
            <TabsTrigger value="playlists" className="gap-2">
              <Music className="w-4 h-4" />
              <span className="hidden sm:inline">Playlists</span>
            </TabsTrigger>
            <TabsTrigger value="reposts" className="gap-2">
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Reposts</span>
            </TabsTrigger>
            <TabsTrigger value="following" className="gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Following</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="feed" className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-medium">Your Feed</h4>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchFeed}
                disabled={loading}
              >
                Refresh
              </Button>
            </div>
            
            {loading ? (
              <LoadingSkeleton />
            ) : feed.length > 0 ? (
              <ScrollArea className="h-96">
                <div className="grid gap-4">
                  {feed.map((track) => {
                    const trackProps = AudiusService.convertToTrackCardProps(track);
                    return (
                      <TrackCard key={track.id} {...trackProps} />
                    );
                  })}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Rss className="w-8 h-8 mx-auto mb-2" />
                <p>Your feed is empty. Follow some artists to see their latest tracks!</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="favorites" className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-medium">Your Favorites</h4>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchFavorites}
                disabled={loading}
              >
                Refresh
              </Button>
            </div>
            
            {loading ? (
              <LoadingSkeleton />
            ) : favorites.length > 0 ? (
              <ScrollArea className="h-96">
                <div className="grid gap-4">
                  {favorites.map((track) => {
                    const trackProps = AudiusService.convertToTrackCardProps(track);
                    return (
                      <TrackCard key={track.id} {...trackProps} />
                    );
                  })}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Heart className="w-8 h-8 mx-auto mb-2" />
                <p>No favorite tracks yet. Start liking tracks to build your collection!</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="playlists" className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-medium">Your Playlists</h4>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchPlaylists}
                disabled={loading}
              >
                Refresh
              </Button>
            </div>
            
            {loading ? (
              <LoadingSkeleton />
            ) : playlists.length > 0 ? (
              <ScrollArea className="h-96">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {playlists.map((playlist) => {
                    // Convert to LocalPlaylist format expected by PlaylistCard
                    const playlistData = {
                      id: playlist.id,
                      name: playlist.name,
                      description: playlist.description || '',
                      tracks: playlist.tracks || [],
                      created_at: new Date(playlist.created_at).getTime(),
                      updated_at: new Date(playlist.updated_at).getTime(),
                      is_public: !playlist.is_private,
                      storage_type: 'audius' as const,
                      creator: playlist.owner.name,
                      artwork: playlist.artwork ? 
                        AudiusService.getArtworkUrl(playlist.artwork) : 
                        undefined
                    };
                    
                    return (
                      <PlaylistCard 
                        key={playlist.id}
                        playlist={playlistData}
                      />
                    );
                  })}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Music className="w-8 h-8 mx-auto mb-2" />
                <p>No playlists yet. Create your first playlist to get started!</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="reposts" className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-medium">Your Reposts</h4>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchReposts}
                disabled={loading}
              >
                Refresh
              </Button>
            </div>
            
            {loading ? (
              <LoadingSkeleton />
            ) : reposts.length > 0 ? (
              <ScrollArea className="h-96">
                <div className="grid gap-4">
                  {reposts.map((track) => {
                    const trackProps = AudiusService.convertToTrackCardProps(track);
                    return (
                      <TrackCard key={track.id} {...trackProps} />
                    );
                  })}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <RotateCcw className="w-8 h-8 mx-auto mb-2" />
                <p>No reposts yet. Repost tracks you love to share them with your followers!</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="following" className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-medium">Artists You Follow</h4>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchFollowing}
                disabled={loading}
              >
                Refresh
              </Button>
            </div>
            
            {loading ? (
              <LoadingSkeleton />
            ) : following.length > 0 ? (
              <ScrollArea className="h-96">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {following.map((artist) => (
                    <Card key={artist.id} className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-muted overflow-hidden">
                          <img
                            src={AudiusService.getProfilePictureUrl(artist.profile_picture)}
                            alt={artist.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = '/placeholder.svg';
                            }}
                          />
                        </div>
                        <div className="flex-1">
                          <h5 className="font-medium">{artist.name}</h5>
                          <p className="text-sm text-muted-foreground">@{artist.handle}</p>
                          {artist.follower_count !== undefined && (
                            <p className="text-xs text-muted-foreground">
                              {artist.follower_count.toLocaleString()} followers
                            </p>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-8 h-8 mx-auto mb-2" />
                <p>Not following anyone yet. Discover and follow your favorite artists!</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};