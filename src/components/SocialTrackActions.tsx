import React from 'react';
import { Heart, MessageCircle, Share2, UserPlus, UserMinus } from 'lucide-react';
import { Button } from './ui/button';
import { useSocial } from '@/hooks/useSocial';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface SocialTrackActionsProps {
  trackId: string;
  artistId: string;
  className?: string;
  showFollowButton?: boolean;
  onCommentClick?: () => void;
}

export const SocialTrackActions: React.FC<SocialTrackActionsProps> = ({
  trackId,
  artistId,
  className,
  showFollowButton = false,
  onCommentClick
}) => {
  const { profile } = useAuth();
  const { useFavoriteStatus, useFollowStatus } = useSocial();
  
  const { isFavorited, toggleFavorite, loading: favoriteLoading } = useFavoriteStatus(trackId);
  const { isFollowing, toggleFollow, loading: followLoading } = useFollowStatus(artistId);

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!profile) return;
    await toggleFavorite(artistId);
  };

  const handleFollowClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!profile) return;
    await toggleFollow();
  };

  const handleCommentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCommentClick?.();
  };

  const handleShareClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Check out this track',
          url: window.location.href
        });
      } catch (err) {
        // User cancelled or share failed
      }
    } else {
      // Fallback to clipboard
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  if (!profile) {
    return null; // Don't show social actions if not logged in
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Favorite Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleFavoriteClick}
        disabled={favoriteLoading}
        className={cn(
          "flex items-center gap-1 transition-all duration-200",
          isFavorited && "text-red-500 hover:text-red-600"
        )}
      >
        <Heart 
          className={cn(
            "h-4 w-4 transition-all duration-200",
            isFavorited && "fill-current"
          )} 
        />
        <span className="sr-only">
          {isFavorited ? 'Remove from favorites' : 'Add to favorites'}
        </span>
      </Button>

      {/* Comment Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCommentClick}
        className="flex items-center gap-1 hover:text-primary"
      >
        <MessageCircle className="h-4 w-4" />
        <span className="sr-only">Comments</span>
      </Button>

      {/* Follow Button (optional) */}
      {showFollowButton && artistId !== profile.id && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleFollowClick}
          disabled={followLoading}
          className={cn(
            "flex items-center gap-1 transition-all duration-200",
            isFollowing && "text-primary"
          )}
        >
          {isFollowing ? (
            <UserMinus className="h-4 w-4" />
          ) : (
            <UserPlus className="h-4 w-4" />
          )}
          <span className="sr-only">
            {isFollowing ? 'Unfollow artist' : 'Follow artist'}
          </span>
        </Button>
      )}

      {/* Share Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleShareClick}
        className="flex items-center gap-1 hover:text-primary"
      >
        <Share2 className="h-4 w-4" />
        <span className="sr-only">Share track</span>
      </Button>
    </div>
  );
};