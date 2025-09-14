import { useState, useEffect } from 'react';
import { SocialService, TrackComment, UserFavorite } from '@/services/socialService';
import { useAuth } from './useAuth';

export const useSocial = () => {
  const { profile } = useAuth();

  // Follow functionality
  const useFollowStatus = (userId: string) => {
    const [isFollowing, setIsFollowing] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
      if (profile && userId) {
        SocialService.isFollowing(userId).then(setIsFollowing);
      }
    }, [profile, userId]);

    const toggleFollow = async () => {
      if (!profile) return false;
      
      setLoading(true);
      try {
        const result = isFollowing 
          ? await SocialService.unfollowUser(userId)
          : await SocialService.followUser(userId);
        
        if (result !== undefined) {
          setIsFollowing(!isFollowing);
        }
        return result;
      } finally {
        setLoading(false);
      }
    };

    return { isFollowing, toggleFollow, loading };
  };

  // Favorites functionality
  const useFavoriteStatus = (trackId: string) => {
    const [isFavorited, setIsFavorited] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
      if (profile && trackId) {
        SocialService.isFavorited(trackId).then(setIsFavorited);
      }
    }, [profile, trackId]);

    const toggleFavorite = async (artistId: string) => {
      if (!profile) return false;
      
      setLoading(true);
      try {
        const result = await SocialService.toggleFavorite(trackId, artistId);
        setIsFavorited(result);
        return result;
      } catch (error) {
        console.error('Error in useSocial toggleFavorite:', error);
        return false;
      } finally {
        setLoading(false);
      }
    };

    return { isFavorited, toggleFavorite, loading };
  };

  // User favorites
  const useUserFavorites = (profileId?: string) => {
    const [favorites, setFavorites] = useState<UserFavorite[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchFavorites = async () => {
      setLoading(true);
      try {
        const data = await SocialService.getUserFavorites(profileId);
        setFavorites(data);
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      fetchFavorites();
    }, [profileId]);

    return { favorites, loading, refetch: fetchFavorites };
  };

  // Comments functionality
  const useTrackComments = (trackId: string) => {
    const [comments, setComments] = useState<TrackComment[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchComments = async () => {
      if (!trackId) return;
      
      setLoading(true);
      try {
        const data = await SocialService.getTrackComments(trackId);
        setComments(data);
      } finally {
        setLoading(false);
      }
    };

    const addComment = async (comment: string, artistId: string, replyToId?: string) => {
      const success = await SocialService.addComment(trackId, artistId, comment, replyToId);
      if (success) {
        await fetchComments(); // Refresh comments
      }
      return success;
    };

    const updateComment = async (commentId: string, newComment: string) => {
      const success = await SocialService.updateComment(commentId, newComment);
      if (success) {
        await fetchComments(); // Refresh comments
      }
      return success;
    };

    const deleteComment = async (commentId: string) => {
      const success = await SocialService.deleteComment(commentId);
      if (success) {
        await fetchComments(); // Refresh comments
      }
      return success;
    };

    useEffect(() => {
      fetchComments();
    }, [trackId]);

    return { 
      comments, 
      loading, 
      addComment, 
      updateComment, 
      deleteComment, 
      refetch: fetchComments 
    };
  };

  // AI Recommendations functionality
  const useAIRecommendations = () => {
    const [recommendations, setRecommendations] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const generateRecommendations = async (count: number = 5, genres: string[] = [], moods: string[] = []) => {
      if (!profile) return [];

      setLoading(true);
      try {
        const data = await SocialService.generateAIRecommendations(profile.id, count, genres, moods);
        setRecommendations(data);
        return data;
      } finally {
        setLoading(false);
      }
    };

    const fetchExistingRecommendations = async () => {
      if (!profile) return;

      setLoading(true);
      try {
        const data = await SocialService.getUserRecommendations(profile.id);
        setRecommendations(data);
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      if (profile) {
        fetchExistingRecommendations();
      }
    }, [profile]);

    return { 
      recommendations, 
      loading, 
      generateRecommendations, 
      refetch: fetchExistingRecommendations 
    };
  };

  return {
    useFollowStatus,
    useFavoriteStatus,
    useUserFavorites,
    useTrackComments,
    useAIRecommendations
  };
};