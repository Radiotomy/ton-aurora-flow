import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Sparkles, RefreshCw, Music, TrendingUp } from 'lucide-react';
import { useSocial } from '@/hooks/useSocial';
import { useAuth } from '@/hooks/useAuth';
import TrackCard from './TrackCard';
import { LoadingSpinner } from './LoadingStates';

interface AIRecommendationsProps {
  className?: string;
  maxItems?: number;
}

export const AIRecommendations: React.FC<AIRecommendationsProps> = ({
  className,
  maxItems = 5
}) => {
  const { profile } = useAuth();
  const { useAIRecommendations } = useSocial();
  const { recommendations, loading, generateRecommendations, refetch } = useAIRecommendations();
  
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateRecommendations = async () => {
    setIsGenerating(true);
    try {
      await generateRecommendations(maxItems);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefresh = async () => {
    await refetch();
  };

  if (!profile) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <Music className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Sign in to get personalized AI music recommendations</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Recommendations
          </CardTitle>
          <div className="flex gap-2">
            {recommendations.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            )}
            <Button
              variant="default"
              size="sm"
              onClick={handleGenerateRecommendations}
              disabled={isGenerating || loading}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Generate
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading && recommendations.length === 0 ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-muted rounded-lg mb-2" />
                <div className="h-16 bg-muted/50 rounded-lg" />
              </div>
            ))}
          </div>
        ) : recommendations.length === 0 ? (
          <div className="text-center py-8">
            <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground mb-4">
              No recommendations yet. Generate personalized AI recommendations based on your listening history.
            </p>
            <Button onClick={handleGenerateRecommendations} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Get AI Recommendations
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {recommendations.slice(0, maxItems).map((rec, index) => (
              <div key={`${rec.track_id}-${index}`} className="space-y-2">
                {rec.metadata?.track_data && (
                   <TrackCard
                     id={rec.track_id}
                     title={rec.metadata.track_data.title}
                     artist={rec.metadata.track_data.artist}
                     artwork={rec.metadata.track_data.artwork?.['480x480'] || ''}
                     duration="0:00" // Duration not available in recommendations
                     likes={0}
                     streamUrl=""
                     permalink=""
                   />
                )}
                {rec.metadata?.reason && (
                  <div className="bg-muted/50 rounded-lg p-3 text-sm">
                    <div className="flex items-start gap-2">
                      <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <div className="space-y-2 flex-1">
                        <p className="text-muted-foreground">{rec.metadata.reason}</p>
                        <div className="flex flex-wrap gap-1">
                          {rec.metadata.ai_genres?.map((genre: string) => (
                            <Badge key={genre} variant="secondary" className="text-xs">
                              {genre}
                            </Badge>
                          ))}
                          {rec.metadata.ai_moods?.map((mood: string) => (
                            <Badge key={mood} variant="outline" className="text-xs">
                              {mood}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">Confidence:</span>
                          <div className="flex-1 bg-muted rounded-full h-1.5 max-w-20">
                            <div 
                              className="bg-primary h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${(rec.score || 0.5) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {Math.round((rec.score || 0.5) * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};