import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Heart, Music } from 'lucide-react';
import { useSocial } from '@/hooks/useSocial';
import { useAuth } from '@/hooks/useAuth';
import TrackCard from './TrackCard';

interface UserFavoritesProps {
  profileId?: string;
  className?: string;
  maxItems?: number;
}

export const UserFavorites: React.FC<UserFavoritesProps> = ({
  profileId,
  className,
  maxItems = 10
}) => {
  const { profile } = useAuth();
  const { useUserFavorites } = useSocial();
  const { favorites, loading } = useUserFavorites(profileId);

  if (!profile && !profileId) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Sign in to view favorite tracks</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-red-500" />
          Favorite Tracks
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-muted rounded-lg" />
              </div>
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-8">
            <Music className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">
              No favorite tracks yet. Start exploring and heart the tracks you love!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {favorites.slice(0, maxItems).map((favorite) => (
              <div key={favorite.id} className="border rounded-lg p-3">
                <p className="text-sm text-muted-foreground mb-2">
                  Favorited on {new Date(favorite.created_at).toLocaleDateString()}
                </p>
                <div className="text-xs text-muted-foreground">
                  Track ID: {favorite.track_id}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};