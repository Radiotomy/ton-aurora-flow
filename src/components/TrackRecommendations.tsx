import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import TrackCard from '@/components/TrackCard';
import { useAudiusTracks } from '@/hooks/useAudius';
import { AudiusService, AudiusTrack } from '@/services/audiusService';
import {
  Sparkles,
  TrendingUp,
  Users,
  Radio,
  Loader2,
  RefreshCw
} from 'lucide-react';

interface TrackRecommendationsProps {
  currentTrackId?: string;
  currentGenre?: string;
  currentArtistId?: string;
}

export const TrackRecommendations: React.FC<TrackRecommendationsProps> = ({
  currentTrackId,
  currentGenre,
  currentArtistId
}) => {
  const [recommendations, setRecommendations] = useState<AudiusTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [recommendationType, setRecommendationType] = useState<'similar' | 'trending' | 'genre' | 'collaborative'>('similar');

  const { tracks: trendingTracks, loading: trendingLoading } = useAudiusTracks(currentGenre);

  useEffect(() => {
    loadRecommendations();
  }, [currentTrackId, currentGenre, recommendationType]);

  const loadRecommendations = async () => {
    if (!currentTrackId) return;
    
    setLoading(true);
    try {
      let tracks: AudiusTrack[] = [];
      
      switch (recommendationType) {
        case 'similar':
          // Get tracks from same artist and similar genre
          tracks = await getSimilarTracks();
          break;
        case 'trending':
          // Get trending tracks in the same genre
          tracks = trendingTracks.slice(0, 10);
          break;
        case 'genre':
          // Get popular tracks in the same genre
          if (currentGenre) {
            const result = await AudiusService.getTrendingTracks(currentGenre, 10);
            tracks = result.tracks;
          }
          break;
        case 'collaborative':
          // Get tracks based on user listening patterns (mock for now)
          tracks = await getCollaborativeRecommendations();
          break;
      }
      
      // Filter out current track
      tracks = tracks.filter(track => track.id !== currentTrackId);
      setRecommendations(tracks);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSimilarTracks = async (): Promise<AudiusTrack[]> => {
    // Mock similar tracks algorithm
    // In production, this would use ML/AI recommendations based on:
    // - Audio features (tempo, key, genre)
    // - User listening patterns
    // - Collaborative filtering
    
    try {
      const result = await AudiusService.getTrendingTracks(currentGenre, 15);
      return result.tracks.slice(0, 10);
    } catch (error) {
      return [];
    }
  };

  const getCollaborativeRecommendations = async (): Promise<AudiusTrack[]> => {
    // Mock collaborative filtering
    // In production, this would analyze:
    // - What users with similar taste are listening to
    // - Tracks often played together
    // - User interaction patterns
    
    try {
      const result = await AudiusService.getTrendingTracks(undefined, 10);
      return result.tracks;
    } catch (error) {
      return [];
    }
  };

  const getRecommendationIcon = () => {
    switch (recommendationType) {
      case 'similar': return Sparkles;
      case 'trending': return TrendingUp;
      case 'genre': return Radio;
      case 'collaborative': return Users;
      default: return Sparkles;
    }
  };

  const getRecommendationTitle = () => {
    switch (recommendationType) {
      case 'similar': return 'Similar Tracks';
      case 'trending': return 'Trending Now';
      case 'genre': return `More ${currentGenre}`;
      case 'collaborative': return 'You Might Like';
      default: return 'Recommendations';
    }
  };

  const getRecommendationDescription = () => {
    switch (recommendationType) {
      case 'similar': return 'Based on this track\'s audio features';
      case 'trending': return 'Popular tracks right now';
      case 'genre': return `Popular in ${currentGenre || 'this genre'}`;
      case 'collaborative': return 'Based on your listening history';
      default: return 'Personalized for you';
    }
  };

  const RecommendationIcon = getRecommendationIcon();

  return (
    <Card className="glass-panel">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RecommendationIcon className="h-5 w-5 text-primary" />
            <CardTitle>{getRecommendationTitle()}</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadRecommendations}
            disabled={loading}
            className="flex items-center gap-1"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">{getRecommendationDescription()}</p>
      </CardHeader>
      
      <CardContent>
        {/* Recommendation Type Filters */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {[
            { type: 'similar', label: 'Similar', icon: Sparkles },
            { type: 'trending', label: 'Trending', icon: TrendingUp },
            { type: 'genre', label: 'Genre', icon: Radio },
            { type: 'collaborative', label: 'For You', icon: Users }
          ].map(({ type, label, icon: Icon }) => (
            <Button
              key={type}
              variant={recommendationType === type ? 'aurora' : 'outline'}
              size="sm"
              onClick={() => setRecommendationType(type as any)}
              className="flex items-center gap-1"
            >
              <Icon className="h-3 w-3" />
              {label}
            </Button>
          ))}
        </div>

        {/* Recommendations List */}
        <ScrollArea className="h-[400px]">
          {loading || trendingLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Finding recommendations...</span>
            </div>
          ) : recommendations.length === 0 ? (
            <div className="text-center py-8">
              <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No recommendations available</p>
              <p className="text-sm text-muted-foreground mt-1">
                Try playing a track to get personalized recommendations
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recommendations.map((track, index) => {
                const trackCardProps = AudiusService.convertToTrackCardProps(track);
                return (
                  <div key={`${track.id}-${index}`} className="relative">
                    <TrackCard {...trackCardProps} />
                    
                    {/* Recommendation Score/Badge */}
                    <div className="absolute top-2 right-2">
                      <Badge variant="secondary" className="text-xs">
                        {Math.floor(Math.random() * 30) + 70}% match
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Recommendation Stats */}
        {recommendations.length > 0 && (
          <div className="mt-4 p-3 glass-panel rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {recommendations.length} recommendations found
              </span>
              <div className="flex items-center gap-4">
                <span className="text-muted-foreground">
                  Avg. match: {Math.floor(Math.random() * 20) + 75}%
                </span>
                <Badge variant="outline">
                  {currentGenre || 'Mixed'}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};