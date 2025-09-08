import { useState, useEffect } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { useAudiusTrack } from '@/hooks/useAudius';
import { useTrackInteractions } from '@/hooks/useTrackInteractions';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { AudiusService } from '@/services/audiusService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Pause, 
  Heart, 
  Share2, 
  Download, 
  Music, 
  Clock, 
  Users,
  ExternalLink,
  ShoppingCart,
  TrendingUp
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SocialTrackActions } from '@/components/SocialTrackActions';
import { TrackComments } from '@/components/TrackComments';

const TrackDetail = () => {
  const { trackId } = useParams();
  const { track, loading, error } = useAudiusTrack(trackId);
  const { playTrack, likeTrack, collectTrack, shareTrack } = useTrackInteractions();
  const { currentTrack, isPlaying, playTrack: audioPlay, pauseTrack } = useAudioPlayer();
  const { toast } = useToast();
  
  const [liked, setLiked] = useState(false);
  const [collected, setCollected] = useState(false);

  if (!trackId) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-80 bg-muted rounded-lg"></div>
            <div className="h-8 bg-muted rounded w-2/3"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !track) {
    return (
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="text-center">
          <Music className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Track Not Found</h1>
          <p className="text-muted-foreground">The track you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const isCurrentTrack = currentTrack?.id === track.id;
  const isCurrentlyPlaying = isCurrentTrack && isPlaying;

  const handlePlayPause = () => {
    if (isCurrentTrack) {
      if (isPlaying) {
        pauseTrack();
      } else {
        audioPlay({
          id: track.id,
          title: track.title,
          artist: track.user.name,
          artwork: AudiusService.getArtworkUrl(track.artwork, '480x480'),
          streamUrl: AudiusService.getStreamUrl(track.id),
          duration: track.duration
        });
      }
    } else {
      audioPlay({
        id: track.id,
        title: track.title,
        artist: track.user.name,
        artwork: AudiusService.getArtworkUrl(track.artwork, '480x480'),
        streamUrl: AudiusService.getStreamUrl(track.id),
        duration: track.duration
      });
    }
    playTrack(track.id, track.user.id);
  };

  const handleLike = () => {
    setLiked(!liked);
    likeTrack(track.id, track.user.id);
  };

  const handleCollect = () => {
    if (!collected) {
      collectTrack(track.id, 'example-contract', 0.5);
      setCollected(true);
    }
  };

  const handleShare = () => {
    shareTrack(track.id);
  };

  return (
    <div className="min-h-screen pt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Main Track Card */}
          <Card className="glass-panel border-glass overflow-hidden">
            <div className="relative">
              {/* Track Artwork */}
              <div className="aspect-video relative overflow-hidden">
                <img
                  src={AudiusService.getArtworkUrl(track.artwork, '1000x1000')}
                  alt={track.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                
                {/* Play Button Overlay */}
                <Button
                  onClick={handlePlayPause}
                  size="lg"
                  variant="aurora"
                  className="absolute bottom-6 left-6 h-16 w-16 rounded-full"
                >
                  {isCurrentlyPlaying ? (
                    <Pause className="h-8 w-8" />
                  ) : (
                    <Play className="h-8 w-8 ml-1" />
                  )}
                </Button>

                {/* Track Stats */}
                <div className="absolute bottom-6 right-6 flex items-center gap-4 text-white">
                  <div className="flex items-center gap-1">
                    <Play className="h-4 w-4" />
                    <span className="text-sm">{track.play_count?.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className="h-4 w-4" />
                    <span className="text-sm">{track.favorite_count?.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Track Info */}
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-aurora mb-2">{track.title}</h1>
                    <Link 
                      to={`/artist/${track.user.id}`}
                      className="flex items-center gap-3 mb-4 hover:opacity-80 transition-opacity"
                    >
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={AudiusService.getProfilePictureUrl(track.user.profile_picture, '150x150')} />
                        <AvatarFallback>
                          <Music className="h-6 w-6" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{track.user.name}</p>
                        <p className="text-sm text-muted-foreground">@{track.user.handle}</p>
                      </div>
                    </Link>

                    <div className="flex items-center gap-2 flex-wrap mb-4">
                      {track.genre && (
                        <Badge variant="secondary">{track.genre}</Badge>
                      )}
                      <Badge variant="outline">
                        <Clock className="h-3 w-3 mr-1" />
                        {AudiusService.formatDuration(track.duration)}
                      </Badge>
                      {track.created_at && (
                        <Badge variant="outline">
                          {new Date(track.created_at).getFullYear()}
                        </Badge>
                      )}
                    </div>

                    {track.description && (
                      <p className="text-muted-foreground">{track.description}</p>
                    )}
                  </div>
                </div>

                {/* Social Actions */}
                <div className="flex items-center justify-between">
                  <SocialTrackActions 
                    trackId={track.id}
                    artistId={track.user.id}
                    showFollowButton={true}
                    className="flex items-center gap-3"
                  />
                  
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={handleCollect}
                      variant={collected ? "aurora" : "glass"}
                      size="sm"
                      disabled={collected}
                    >
                      <ShoppingCart className="h-4 w-4" />
                      {collected ? 'Collected' : 'Collect NFT'}
                    </Button>
                    
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                    
                    <Button variant="ghost" size="icon">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </div>
          </Card>

          {/* Track Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="glass-panel border-glass">
              <CardContent className="p-6 text-center">
                <Play className="h-8 w-8 mx-auto text-primary mb-2" />
                <p className="text-2xl font-bold text-aurora">{track.play_count?.toLocaleString() || 0}</p>
                <p className="text-sm text-muted-foreground">Total Plays</p>
              </CardContent>
            </Card>

            <Card className="glass-panel border-glass">
              <CardContent className="p-6 text-center">
                <Heart className="h-8 w-8 mx-auto text-secondary mb-2" />
                <p className="text-2xl font-bold text-aurora">{track.favorite_count?.toLocaleString() || 0}</p>
                <p className="text-sm text-muted-foreground">Favorites</p>
              </CardContent>
            </Card>

            <Card className="glass-panel border-glass">
              <CardContent className="p-6 text-center">
                <Users className="h-8 w-8 mx-auto text-accent mb-2" />
                <p className="text-2xl font-bold text-aurora">{track.repost_count?.toLocaleString() || 0}</p>
                <p className="text-sm text-muted-foreground">Reposts</p>
              </CardContent>
            </Card>
          </div>

          {/* Additional Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass-panel border-glass">
              <CardHeader>
                <CardTitle>Track Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration</span>
                    <span>{AudiusService.formatDuration(track.duration)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Genre</span>
                    <span>{track.genre || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Release Date</span>
                    <span>
                      {track.created_at 
                        ? new Date(track.created_at).toLocaleDateString()
                        : 'Unknown'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Track ID</span>
                    <span className="text-sm font-mono">{track.id}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-panel border-glass">
              <CardHeader>
                <CardTitle>Artist Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Followers</span>
                    <span>N/A</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Tracks</span>
                    <span>N/A</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Verified</span>
                    <span>N/A</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Location</span>
                    <span>N/A</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Comments Section */}
          <TrackComments trackId={track.id} artistId={track.user.id} />
        </div>
      </div>
    </div>
  );
};

export default TrackDetail;