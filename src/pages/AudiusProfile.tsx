import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  Music, 
  Users, 
  Heart, 
  Play, 
  ExternalLink, 
  UserPlus, 
  UserMinus,
  Loader2,
  ArrowLeft,
  Verified
} from 'lucide-react';
import { useAudiusAuth, useAudiusSocialFeatures, useAudiusUserData } from '@/hooks/useAudiusAuth';
import { AudiusService } from '@/services/audiusService';
import { AudiusAuthService } from '@/services/audiusAuthService';
import TrackCard from '@/components/TrackCard';
import { SocialTrackActions } from '@/components/SocialTrackActions';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const AudiusProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { isAuthenticated, user: currentUser } = useAudiusAuth();
  const { loading: socialLoading, followUser, unfollowUser } = useAudiusSocialFeatures();
  const { favorites, reposts, playlists, followers, following, loading: dataLoading } = useAudiusUserData(userId);
  
  const [profileUser, setProfileUser] = useState<any>(null);
  const [userTracks, setUserTracks] = useState<any[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch user profile
        const user = await AudiusService.getUser(userId);
        if (!user) {
          setError('User not found');
          return;
        }
        
        setProfileUser(user);
        
        // Fetch user's tracks
        const tracks = await AudiusService.getUserTracks(userId, 20);
        setUserTracks(tracks);
        
        // Check if current user follows this user
        if (isAuthenticated && currentUser && userId !== currentUser.id) {
          try {
            const followStatus = await AudiusAuthService.checkUserFollowing(userId);
            setIsFollowing(followStatus || false);
          } catch (error) {
            console.error('Failed to check follow status:', error);
          }
        }
        
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId, isAuthenticated, currentUser]);

  const handleFollowToggle = async () => {
    if (!isAuthenticated || !userId) return;
    
    try {
      if (isFollowing) {
        await unfollowUser(userId);
        setIsFollowing(false);
        toast({
          title: "Unfollowed",
          description: `You're no longer following ${profileUser?.name}`,
        });
      } else {
        await followUser(userId);
        setIsFollowing(true);
        toast({
          title: "Following",
          description: `You're now following ${profileUser?.name}`,
        });
      }
    } catch (error) {
      console.error('Failed to toggle follow:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !profileUser) {
    return (
      <div className="min-h-screen pt-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <Card className="text-center p-8">
            <CardContent>
              <Music className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">User Not Found</h2>
              <p className="text-muted-foreground mb-4">
                {error || 'The user you are looking for does not exist.'}
              </p>
              <Button asChild variant="outline">
                <Link to="/">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === userId;
  const profilePictureUrl = AudiusService.getProfilePictureUrl(profileUser.profile_picture);

  return (
    <div className="min-h-screen pt-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Back Button */}
        <Button variant="ghost" asChild className="mb-4">
          <Link to="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Discover
          </Link>
        </Button>

        {/* Profile Header */}
        <Card className="glass-card">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <Avatar className="w-32 h-32">
                <AvatarImage src={profilePictureUrl} alt={profileUser.name} />
                <AvatarFallback className="text-2xl">
                  {profileUser.name?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-3xl font-bold">{profileUser.name}</h1>
                    {profileUser.is_verified && (
                      <Verified className="w-6 h-6 text-primary" />
                    )}
                  </div>
                  <p className="text-xl text-muted-foreground">@{profileUser.handle}</p>
                  {profileUser.bio && (
                    <p className="text-muted-foreground mt-2">{profileUser.bio}</p>
                  )}
                </div>

                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{profileUser.follower_count?.toLocaleString() || 0}</span>
                    <span className="text-muted-foreground">followers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Music className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{profileUser.track_count?.toLocaleString() || 0}</span>
                    <span className="text-muted-foreground">tracks</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{profileUser.playlist_count?.toLocaleString() || 0}</span>
                    <span className="text-muted-foreground">playlists</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  {!isOwnProfile && isAuthenticated && (
                    <Button
                      onClick={handleFollowToggle}
                      disabled={socialLoading}
                      variant={isFollowing ? "outline" : "default"}
                      className="gap-2"
                    >
                      {isFollowing ? (
                        <>
                          <UserMinus className="w-4 h-4" />
                          Unfollow
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4" />
                          Follow
                        </>
                      )}
                    </Button>
                  )}
                  
                  {profileUser.website && (
                    <Button variant="outline" asChild>
                      <a href={profileUser.website} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Website
                      </a>
                    </Button>
                  )}
                  
                  <Button variant="outline" asChild>
                    <a 
                      href={`https://audius.co/${profileUser.handle}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View on Audius
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Tabs */}
        <Tabs defaultValue="tracks" className="space-y-6">
          <TabsList className="glass-panel">
            <TabsTrigger value="tracks" className="flex items-center gap-2">
              <Music className="w-4 h-4" />
              Tracks ({userTracks.length})
            </TabsTrigger>
            <TabsTrigger value="playlists" className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Playlists ({playlists.length})
            </TabsTrigger>
            <TabsTrigger value="reposts" className="flex items-center gap-2">
              <Play className="w-4 h-4" />
              Reposts ({reposts.length})
            </TabsTrigger>
            {isOwnProfile && (
              <TabsTrigger value="favorites" className="flex items-center gap-2">
                <Heart className="w-4 h-4" />
                Favorites ({favorites.length})
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="tracks" className="space-y-4">
            {userTracks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userTracks.map((track) => (
                  <div key={track.id} className="space-y-2">
                    <TrackCard
                      {...AudiusService.convertToTrackCardProps(track)}
                      className="glass-card"
                    />
                    <SocialTrackActions
                      trackId={track.id}
                      artistId={profileUser.id}
                      showFollowButton={false}
                      showRepostButton={true}
                      className="justify-center"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <Card className="text-center p-8">
                <CardContent>
                  <Music className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No tracks yet</h3>
                  <p className="text-muted-foreground">
                    {isOwnProfile 
                      ? "Upload your first track to get started!" 
                      : `${profileUser.name} hasn't uploaded any tracks yet.`
                    }
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="playlists" className="space-y-4">
            {playlists.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {playlists.map((playlist) => (
                  <Card key={playlist.id} className="glass-card">
                    <CardContent className="p-4">
                      <div className="aspect-square bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg mb-4 flex items-center justify-center">
                        <Music className="w-8 h-8 text-primary" />
                      </div>
                      <h3 className="font-semibold mb-1">{playlist.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {playlist.track_count} tracks
                      </p>
                      {playlist.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {playlist.description}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="text-center p-8">
                <CardContent>
                  <Heart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No playlists yet</h3>
                  <p className="text-muted-foreground">
                    {isOwnProfile 
                      ? "Create your first playlist!" 
                      : `${profileUser.name} hasn't created any playlists yet.`
                    }
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="reposts" className="space-y-4">
            {reposts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reposts.map((track) => (
                  <div key={`repost-${track.id}`} className="space-y-2">
                    <TrackCard
                      {...AudiusService.convertToTrackCardProps(track)}
                      className="glass-card"
                    />
                    <div className="flex items-center gap-2 text-sm text-muted-foreground px-2">
                      <Play className="w-3 h-3" />
                      Reposted by {profileUser.name}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Card className="text-center p-8">
                <CardContent>
                  <Play className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No reposts yet</h3>
                  <p className="text-muted-foreground">
                    {isOwnProfile 
                      ? "Repost tracks you love to share them with your followers!" 
                      : `${profileUser.name} hasn't reposted any tracks yet.`
                    }
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {isOwnProfile && (
            <TabsContent value="favorites" className="space-y-4">
              {favorites.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {favorites.map((track) => (
                    <div key={`favorite-${track.id}`} className="space-y-2">
                      <TrackCard
                        {...AudiusService.convertToTrackCardProps(track)}
                        className="glass-card"
                      />
                      <div className="flex items-center gap-2 text-sm text-muted-foreground px-2">
                        <Heart className="w-3 h-3 fill-current text-red-500" />
                        Favorited
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Card className="text-center p-8">
                  <CardContent>
                    <Heart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No favorites yet</h3>
                    <p className="text-muted-foreground">
                      Favorite tracks to see them here!
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default AudiusProfile;