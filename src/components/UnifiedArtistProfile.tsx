import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { 
  Music, 
  Users, 
  Heart, 
  Play, 
  ExternalLink, 
  UserPlus, 
  UserMinus,
  Crown,
  Globe,
  Sparkles,
  Verified,
  MapPin,
  Calendar,
  Award,
  User
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAudiusAuth, useAudiusSocialFeatures } from '@/hooks/useAudiusAuth';
import { AudiusService } from '@/services/audiusService';
import { supabase } from '@/integrations/supabase/client';
import TrackCard from '@/components/TrackCard';
import { SocialTrackActions } from '@/components/SocialTrackActions';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface UnifiedArtistProfileProps {
  artistId: string;
  artistType: 'audius' | 'platform' | 'hybrid';
  className?: string;
}

interface ArtistProfile {
  // Common fields
  id: string;
  name: string;
  handle?: string;
  bio: string;
  avatarUrl?: string;
  location?: string;
  website?: string;
  genres: string[];
  socialLinks: {
    instagram?: string;
    twitter?: string;
    youtube?: string;
    spotify?: string;
    soundcloud?: string;
  };
  
  // Stats
  followerCount: number;
  trackCount: number;
  playlistCount: number;
  
  // Verification & roles
  isVerified: boolean;
  isAudiusVerified?: boolean;
  roles: string[];
  
  // Platform-specific
  audiusData?: {
    userId: string;
    handle: string;
    profilePicture?: any;
    isVerified: boolean;
    followerCount: number;
    trackCount: number;
  };
  
  platformData?: {
    profileId: string;
    realName?: string;
    experienceLevel: string;
    joinedDate: string;
    reputation: number;
  };
  
  // Tracks
  tracks: any[];
  playlists: any[];
}

export const UnifiedArtistProfile: React.FC<UnifiedArtistProfileProps> = ({
  artistId,
  artistType,
  className
}) => {
  const { profile: currentUserProfile } = useAuth();
  const { isAuthenticated: isAudiusAuthenticated, user: currentAudiusUser } = useAudiusAuth();
  const { loading: socialLoading, followUser, unfollowUser } = useAudiusSocialFeatures();
  
  const [artistProfile, setArtistProfile] = useState<ArtistProfile | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    const fetchArtistProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let profile: ArtistProfile | null = null;
        
        if (artistType === 'audius' || artistType === 'hybrid') {
          // Fetch Audius data
          const audiusUser = await AudiusService.getUser(artistId);
          if (audiusUser) {
            const audiusTracks = await AudiusService.getUserTracks(artistId, 20);
            
            profile = {
              id: artistId,
              name: audiusUser.name,
              handle: audiusUser.handle,
              bio: audiusUser.bio || '',
              avatarUrl: AudiusService.getProfilePictureUrl(audiusUser.profile_picture),
              location: audiusUser.location,
              website: undefined, // Not available in AudiusUser type
              genres: [], // Extract from tracks or bio
              socialLinks: {},
              followerCount: audiusUser.follower_count || 0,
              trackCount: audiusUser.track_count || 0,
              playlistCount: audiusUser.playlist_count || 0,
              isVerified: audiusUser.verified || false,
              isAudiusVerified: audiusUser.verified || false,
              roles: ['audius_artist'],
              audiusData: {
                userId: audiusUser.id,
                handle: audiusUser.handle,
                profilePicture: audiusUser.profile_picture,
                isVerified: audiusUser.verified || false,
                followerCount: audiusUser.follower_count || 0,
                trackCount: audiusUser.track_count || 0,
              },
              tracks: audiusTracks,
              playlists: [], // Would fetch playlists separately
            };
          }
        }
        
        if (artistType === 'platform' || artistType === 'hybrid') {
          // Fetch AudioTon platform data
          const { data: platformProfile, error: profileError } = await supabase
            .from('profiles')
            .select(`
              *,
              user_roles!inner (role)
            `)
            .eq('id', artistId)
            .single();

          if (profileError) {
            console.error('Error fetching platform profile:', profileError);
          } else if (platformProfile) {
            // Get artist application data separately
            const { data: applicationData } = await supabase
              .from('artist_applications')
              .select('*')
              .eq('profile_id', artistId)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            const application = applicationData;
            const portfolio = application?.platform_portfolio as any || {};
            
            // If this is a hybrid profile, merge with existing Audius data
            if (profile && artistType === 'hybrid') {
              profile.platformData = {
                profileId: platformProfile.id,
                realName: portfolio.real_name,
                experienceLevel: portfolio.experience_level || 'beginner',
                joinedDate: platformProfile.created_at,
                reputation: platformProfile.reputation_score || 0,
              };
              profile.roles = [...profile.roles, ...(Array.isArray(platformProfile.user_roles) ? platformProfile.user_roles.map((r: any) => r.role) : [])];
              if (portfolio.bio) profile.bio = portfolio.bio;
              if (portfolio.location) profile.location = portfolio.location;
              if (portfolio.website) profile.website = portfolio.website;
              if (portfolio.genres) profile.genres = portfolio.genres;
              if (portfolio.social_links) {
                profile.socialLinks = { ...profile.socialLinks, ...portfolio.social_links };
              }
            } else {
              // Create platform-only profile
              profile = {
                id: platformProfile.id,
                name: portfolio.stage_name || platformProfile.display_name || 'Unknown Artist',
                bio: portfolio.bio || platformProfile.bio || '',
                avatarUrl: platformProfile.avatar_url,
                location: portfolio.location,
                website: portfolio.website,
                genres: portfolio.genres || [],
                socialLinks: portfolio.social_links || {},
                followerCount: 0, // Would need to calculate from connections
                trackCount: 0, // Would need to count uploaded tracks
                playlistCount: 0, // Would need to count playlists
                isVerified: Array.isArray(platformProfile.user_roles) ? platformProfile.user_roles.some((r: any) => 
                  ['verified_platform_artist', 'verified_audius_artist'].includes(r.role)
                ) : false,
                roles: Array.isArray(platformProfile.user_roles) ? platformProfile.user_roles.map((r: any) => r.role) : [],
                platformData: {
                  profileId: platformProfile.id,
                  realName: portfolio.real_name,
                  experienceLevel: portfolio.experience_level || 'beginner',
                  joinedDate: platformProfile.created_at,
                  reputation: platformProfile.reputation_score || 0,
                },
                tracks: [], // Would fetch uploaded tracks
                playlists: [], // Would fetch created playlists
              };
            }
          }
        }
        
        if (!profile) {
          setError('Artist profile not found');
          return;
        }
        
        setArtistProfile(profile);
        
        // Check if current user follows this artist
        if (isAudiusAuthenticated && currentAudiusUser && artistId !== currentAudiusUser.id && profile.audiusData) {
          try {
            // Would check follow status via Audius API
            setIsFollowing(false); // Placeholder
          } catch (error) {
            console.error('Failed to check follow status:', error);
          }
        }
        
      } catch (error) {
        console.error('Failed to fetch artist profile:', error);
        setError('Failed to load artist profile');
      } finally {
        setLoading(false);
      }
    };

    fetchArtistProfile();
  }, [artistId, artistType, isAudiusAuthenticated, currentAudiusUser]);

  const handleFollowToggle = async () => {
    if (!isAudiusAuthenticated || !artistProfile?.audiusData) return;
    
    try {
      if (isFollowing) {
        await unfollowUser(artistProfile.audiusData.userId);
        setIsFollowing(false);
        toast({
          title: "Unfollowed",
          description: `You're no longer following ${artistProfile.name}`,
        });
      } else {
        await followUser(artistProfile.audiusData.userId);
        setIsFollowing(true);
        toast({
          title: "Following",
          description: `You're now following ${artistProfile.name}`,
        });
      }
    } catch (error) {
      console.error('Failed to toggle follow:', error);
    }
  };

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center h-64", className)}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !artistProfile) {
    return (
      <Card className={cn("text-center p-8", className)}>
        <CardContent>
          <Music className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Artist Not Found</h2>
          <p className="text-muted-foreground">
            {error || 'The artist profile could not be loaded.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const isOwnProfile = currentUserProfile?.id === artistId || currentAudiusUser?.id === artistId;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Profile Header */}
      <Card className="glass-card">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <Avatar className="w-32 h-32">
              <AvatarImage src={artistProfile.avatarUrl} alt={artistProfile.name} />
              <AvatarFallback className="text-2xl">
                {artistProfile.name?.charAt(0)?.toUpperCase() || 'A'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-3xl font-bold">{artistProfile.name}</h1>
                  
                  {artistProfile.isAudiusVerified && (
                    <Badge variant="secondary" className="gap-1">
                      <Globe className="w-3 h-3" />
                      Audius
                    </Badge>
                  )}
                  
                  {artistProfile.roles.includes('verified_platform_artist') && (
                    <Badge variant="default" className="gap-1">
                      <Verified className="w-3 h-3" />
                      Verified
                    </Badge>
                  )}
                  
                  {artistProfile.roles.includes('verified_audius_artist') && (
                    <Badge variant="default" className="gap-1">
                      <Crown className="w-3 h-3" />
                      Pro Artist
                    </Badge>
                  )}
                </div>
                
                {artistProfile.handle && (
                  <p className="text-xl text-muted-foreground">@{artistProfile.handle}</p>
                )}
                
                {artistProfile.bio && (
                  <p className="text-muted-foreground mt-2">{artistProfile.bio}</p>
                )}
              </div>

              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{artistProfile.followerCount.toLocaleString()}</span>
                  <span className="text-muted-foreground">followers</span>
                </div>
                <div className="flex items-center gap-2">
                  <Music className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{artistProfile.trackCount.toLocaleString()}</span>
                  <span className="text-muted-foreground">tracks</span>
                </div>
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{artistProfile.playlistCount.toLocaleString()}</span>
                  <span className="text-muted-foreground">playlists</span>
                </div>
                {artistProfile.platformData?.reputation && (
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{artistProfile.platformData.reputation}</span>
                    <span className="text-muted-foreground">reputation</span>
                  </div>
                )}
              </div>

              {/* Additional Info */}
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {artistProfile.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {artistProfile.location}
                  </div>
                )}
                {artistProfile.platformData?.joinedDate && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Joined {new Date(artistProfile.platformData.joinedDate).toLocaleDateString()}
                  </div>
                )}
              </div>

              {/* Genres */}
              {artistProfile.genres.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {artistProfile.genres.map((genre) => (
                    <Badge key={genre} variant="outline" className="text-xs">
                      {genre}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex gap-3">
                {!isOwnProfile && isAudiusAuthenticated && artistProfile.audiusData && (
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
                
                {artistProfile.website && (
                  <Button variant="outline" asChild>
                    <a href={artistProfile.website} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Website
                    </a>
                  </Button>
                )}
                
                {artistProfile.audiusData && (
                  <Button variant="outline" asChild>
                    <a 
                      href={`https://audius.co/${artistProfile.audiusData.handle}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <Globe className="w-4 h-4 mr-2" />
                      View on Audius
                    </a>
                  </Button>
                )}
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
            Tracks ({artistProfile.tracks.length})
          </TabsTrigger>
          <TabsTrigger value="playlists" className="flex items-center gap-2">
            <Heart className="w-4 h-4" />
            Playlists ({artistProfile.playlists.length})
          </TabsTrigger>
          <TabsTrigger value="about" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            About
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tracks" className="space-y-4">
          {artistProfile.tracks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {artistProfile.tracks.map((track) => (
                <div key={track.id} className="space-y-2">
                  <div className="glass-card">
                    <TrackCard
                      {...AudiusService.convertToTrackCardProps(track)}
                    />
                  </div>
                  <SocialTrackActions
                    trackId={track.id}
                    artistId={artistProfile.id}
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
                    : `${artistProfile.name} hasn't uploaded any tracks yet.`
                  }
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="playlists" className="space-y-4">
          <Card className="text-center p-8">
            <CardContent>
              <Heart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No playlists yet</h3>
              <p className="text-muted-foreground">
                {isOwnProfile 
                  ? "Create your first playlist!" 
                  : `${artistProfile.name} hasn't created any playlists yet.`
                }
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="about" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Artist Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {artistProfile.platformData?.realName && (
                  <div>
                    <Label className="text-muted-foreground">Real Name</Label>
                    <p className="font-medium">{artistProfile.platformData.realName}</p>
                  </div>
                )}
                
                {artistProfile.platformData?.experienceLevel && (
                  <div>
                    <Label className="text-muted-foreground">Experience Level</Label>
                    <p className="font-medium capitalize">{artistProfile.platformData.experienceLevel}</p>
                  </div>
                )}
                
                <div>
                  <Label className="text-muted-foreground">Artist Type</Label>
                  <div className="flex gap-2 mt-1">
                    {artistProfile.audiusData && (
                      <Badge variant="secondary" className="gap-1">
                        <Globe className="w-3 h-3" />
                        Audius Artist
                      </Badge>
                    )}
                    {artistProfile.platformData && (
                      <Badge variant="secondary" className="gap-1">
                        <Sparkles className="w-3 h-3" />
                        AudioTon Artist
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Social Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(artistProfile.socialLinks).map(([platform, handle]) => 
                  handle ? (
                    <div key={platform} className="flex items-center justify-between">
                      <span className="capitalize text-muted-foreground">{platform}</span>
                      <span className="font-medium">{handle}</span>
                    </div>
                  ) : null
                )}
                {Object.keys(artistProfile.socialLinks).length === 0 && (
                  <p className="text-muted-foreground text-center py-4">
                    No social links added yet
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};