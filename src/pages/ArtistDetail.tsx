import { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useAudiusUser } from '@/hooks/useAudius';
import { AudiusService } from '@/services/audiusService';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TrackCard from '@/components/TrackCard';
import { Music, Users, Heart, ExternalLink, UserPlus, Crown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ArtistDetail = () => {
  const { artistId } = useParams();
  const { user, userTracks, loading, error } = useAudiusUser(artistId);
  const { toast } = useToast();
  const [following, setFollowing] = useState(false);
  const [fanClubMember, setFanClubMember] = useState(false);

  if (!artistId) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-64 bg-muted rounded-lg"></div>
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="text-center">
          <Music className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Artist Not Found</h1>
          <p className="text-muted-foreground">The artist you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const handleFollow = () => {
    setFollowing(!following);
    toast({
      title: following ? "Unfollowed" : "Following",
      description: `You are now ${following ? 'no longer following' : 'following'} ${user.name}`,
    });
  };

  const handleJoinFanClub = () => {
    setFanClubMember(!fanClubMember);
    toast({
      title: fanClubMember ? "Left Fan Club" : "Joined Fan Club",
      description: `You have ${fanClubMember ? 'left' : 'joined'} ${user.name}'s fan club`,
    });
  };

  return (
    <div className="min-h-screen pt-16">
      {/* Hero Banner */}
      <div className="relative h-64 bg-gradient-aurora">
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="absolute bottom-6 left-6 right-6">
          <div className="flex items-end gap-6">
            <Avatar className="h-32 w-32 border-4 border-white">
              <AvatarImage src={AudiusService.getProfilePictureUrl(user.profile_picture, '480x480')} />
              <AvatarFallback>
                <Music className="h-16 w-16" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-white">
              <h1 className="text-4xl font-bold mb-2">{user.name}</h1>
              <p className="text-lg opacity-90">@{user.handle}</p>
              <div className="flex items-center gap-4 mt-2">
                <span>{user.follower_count?.toLocaleString()} followers</span>
                <span>{user.followee_count?.toLocaleString()} following</span>
                <span>{user.track_count} tracks</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Artist Info & Actions */}
          <Card className="glass-panel border-glass">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  {user.bio && (
                    <p className="text-muted-foreground mb-4">{user.bio}</p>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary">
                      <Music className="h-3 w-3 mr-1" />
                      {user.track_count} Tracks
                    </Badge>
                    <Badge variant="secondary">
                      <Users className="h-3 w-3 mr-1" />
                      {user.follower_count?.toLocaleString()} Followers
                    </Badge>
                    {user.verified && (
                      <Badge variant="outline">Verified</Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={following ? "outline" : "aurora"}
                    onClick={handleFollow}
                  >
                    <UserPlus className="h-4 w-4" />
                    {following ? 'Following' : 'Follow'}
                  </Button>
                  <Button
                    variant={fanClubMember ? "outline" : "glass"}
                    onClick={handleJoinFanClub}
                  >
                    <Crown className="h-4 w-4" />
                    {fanClubMember ? 'Member' : 'Join Fan Club'}
                  </Button>
                  <Button variant="ghost" size="icon">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content Tabs */}
          <Tabs defaultValue="tracks" className="space-y-6">
            <TabsList className="glass-panel">
              <TabsTrigger value="tracks">Tracks</TabsTrigger>
              <TabsTrigger value="albums">Albums</TabsTrigger>
              <TabsTrigger value="playlists">Playlists</TabsTrigger>
              <TabsTrigger value="about">About</TabsTrigger>
            </TabsList>

            <TabsContent value="tracks">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Latest Tracks</h2>
                  <p className="text-muted-foreground">{userTracks.length} tracks</p>
                </div>
                
                {userTracks.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {userTracks.map((track) => (
                      <TrackCard
                        key={track.id}
                        {...AudiusService.convertToTrackCardProps(track)}
                      />
                    ))}
                  </div>
                ) : (
                  <Card className="glass-panel border-glass">
                    <CardContent className="p-12 text-center">
                      <Music className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-xl font-semibold mb-2">No Tracks Yet</h3>
                      <p className="text-muted-foreground">This artist hasn't released any tracks yet.</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="albums">
              <Card className="glass-panel border-glass">
                <CardContent className="p-12 text-center">
                  <Music className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Albums Coming Soon</h3>
                  <p className="text-muted-foreground">Album support will be added in a future update.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="playlists">
              <Card className="glass-panel border-glass">
                <CardContent className="p-12 text-center">
                  <Music className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Playlists Coming Soon</h3>
                  <p className="text-muted-foreground">Playlist support will be added in a future update.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="about">
              <Card className="glass-panel border-glass">
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-3">About {user.name}</h3>
                      <p className="text-muted-foreground">
                        {user.bio || `${user.name} is a talented artist on the Audius platform. Discover their unique sound and connect with their community.`}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 rounded-lg bg-muted/50">
                        <Music className="h-8 w-8 mx-auto text-primary mb-2" />
                        <p className="text-2xl font-bold text-aurora">{user.track_count}</p>
                        <p className="text-sm text-muted-foreground">Tracks Released</p>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-muted/50">
                        <Users className="h-8 w-8 mx-auto text-secondary mb-2" />
                        <p className="text-2xl font-bold text-aurora">{user.follower_count?.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">Followers</p>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-muted/50">
                        <Heart className="h-8 w-8 mx-auto text-accent mb-2" />
                        <p className="text-2xl font-bold text-aurora">{user.playlist_count || 0}</p>
                        <p className="text-sm text-muted-foreground">Playlists</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ArtistDetail;