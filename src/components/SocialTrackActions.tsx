import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, UserPlus, UserMinus, Repeat2 } from 'lucide-react';
import { Button } from './ui/button';
import { useAudiusAuth, useAudiusSocialFeatures } from '@/hooks/useAudiusAuth';
import { AudiusAuthService } from '@/services/audiusAuthService';
import { cn } from '@/lib/utils';

interface SocialTrackActionsProps {
  trackId: string;
  artistId: string;
  className?: string;
  showFollowButton?: boolean;
  showRepostButton?: boolean;
  onCommentClick?: () => void;
}

export const SocialTrackActions: React.FC<SocialTrackActionsProps> = ({
  trackId,
  artistId,
  className,
  showFollowButton = false,
  showRepostButton = true,
  onCommentClick
}) => {
  const { user, isAuthenticated } = useAudiusAuth();
  const { loading, favoriteTrack, unfavoriteTrack, followUser, unfollowUser, repostTrack, unrepostTrack } = useAudiusSocialFeatures();
  
  const [trackData, setTrackData] = useState<{
    has_current_user_favorited: boolean;
    has_current_user_reposted: boolean;
  } | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    const fetchTrackData = async () => {
      if (!isAuthenticated || !trackId) return;
      
      try {
        setDataLoading(true);
        const data = await AudiusAuthService.getTrackWithUserData(trackId);
        setTrackData(data);
        
        if (showFollowButton && artistId) {
          const followStatus = await AudiusAuthService.checkUserFollowing(artistId);
          setIsFollowing(followStatus);
        }
      } catch (error) {
        console.error('Failed to fetch track data:', error);
      } finally {
        setDataLoading(false);
      }
    };

    fetchTrackData();
  }, [isAuthenticated, trackId, artistId, showFollowButton]);

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated || !trackData) return;
    
    try {
      if (trackData.has_current_user_favorited) {
        await unfavoriteTrack(trackId);
        setTrackData({ ...trackData, has_current_user_favorited: false });
      } else {
        await favoriteTrack(trackId);
        setTrackData({ ...trackData, has_current_user_favorited: true });
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const handleFollowClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated || !artistId) return;
    
    try {
      if (isFollowing) {
        await unfollowUser(artistId);
        setIsFollowing(false);
      } else {
        await followUser(artistId);
        setIsFollowing(true);
      }
    } catch (error) {
      console.error('Failed to toggle follow:', error);
    }
  };

  const handleRepostClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated || !trackData) return;
    
    try {
      if (trackData.has_current_user_reposted) {
        await unrepostTrack(trackId);
        setTrackData({ ...trackData, has_current_user_reposted: false });
      } else {
        await repostTrack(trackId);
        setTrackData({ ...trackData, has_current_user_reposted: true });
      }
    } catch (error) {
      console.error('Failed to toggle repost:', error);
    }
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

  if (!isAuthenticated) {
    return null; // Don't show social actions if not logged in to Audius
  }

  if (dataLoading) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="w-8 h-8 bg-muted animate-pulse rounded" />
        <div className="w-8 h-8 bg-muted animate-pulse rounded" />
        <div className="w-8 h-8 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Favorite Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleFavoriteClick}
        disabled={loading}
        className={cn(
          "flex items-center gap-1 transition-all duration-200",
          trackData?.has_current_user_favorited && "text-red-500 hover:text-red-600"
        )}
      >
        <Heart 
          className={cn(
            "h-4 w-4 transition-all duration-200",
            trackData?.has_current_user_favorited && "fill-current"
          )} 
        />
        <span className="sr-only">
          {trackData?.has_current_user_favorited ? 'Remove from favorites' : 'Add to favorites'}
        </span>
      </Button>

      {/* Repost Button */}
      {showRepostButton && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRepostClick}
          disabled={loading}
          className={cn(
            "flex items-center gap-1 transition-all duration-200",
            trackData?.has_current_user_reposted && "text-green-500 hover:text-green-600"
          )}
        >
          <Repeat2 
            className={cn(
              "h-4 w-4 transition-all duration-200",
              trackData?.has_current_user_reposted && "text-green-500"
            )} 
          />
          <span className="sr-only">
            {trackData?.has_current_user_reposted ? 'Remove repost' : 'Repost track'}
          </span>
        </Button>
      )}

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
      {showFollowButton && artistId !== user?.id && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleFollowClick}
          disabled={loading}
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