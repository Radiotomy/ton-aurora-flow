import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface UserConnection {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface UserFavorite {
  id: string;
  profile_id: string;
  track_id: string;
  artist_id: string;
  created_at: string;
}

export interface TrackComment {
  id: string;
  profile_id: string;
  track_id: string;
  artist_id: string;
  comment: string;
  created_at: string;
  updated_at: string;
  reply_to_id?: string;
  is_deleted: boolean;
  profile?: {
    display_name: string;
    avatar_url?: string;
  };
}

export class SocialService {
  // Follow/Unfollow functionality
  static async followUser(followingId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (!profile) {
        toast({
          title: "Error",
          description: "Please log in to follow users",
          variant: "destructive",
        });
        return false;
      }

      const { error } = await supabase
        .from('user_connections')
        .insert({
          follower_id: profile.id,
          following_id: followingId
        });

      if (error) {
        console.error('Error following user:', error);
        toast({
          title: "Error",
          description: "Failed to follow user",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Success",
        description: "Now following user!",
      });
      return true;
    } catch (error) {
      console.error('Error in followUser:', error);
      return false;
    }
  }

  static async unfollowUser(followingId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (!profile) return false;

      const { error } = await supabase
        .from('user_connections')
        .delete()
        .eq('follower_id', profile.id)
        .eq('following_id', followingId);

      if (error) {
        console.error('Error unfollowing user:', error);
        return false;
      }

      toast({
        title: "Success",
        description: "Unfollowed user",
      });
      return true;
    } catch (error) {
      console.error('Error in unfollowUser:', error);
      return false;
    }
  }

  static async isFollowing(followingId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (!profile) return false;

      const { data } = await supabase
        .from('user_connections')
        .select('id')
        .eq('follower_id', profile.id)
        .eq('following_id', followingId)
        .single();

      return !!data;
    } catch (error) {
      console.error('Error checking follow status:', error);
      return false;
    }
  }

  // Favorites functionality
  static async toggleFavorite(trackId: string, artistId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (!profile) {
        toast({
          title: "Error",
          description: "Please log in to favorite tracks",
          variant: "destructive",
        });
        return false;
      }

      // Check if already favorited
      const { data: existing } = await supabase
        .from('user_favorites')
        .select('id')
        .eq('profile_id', profile.id)
        .eq('track_id', trackId)
        .maybeSingle();

      if (existing) {
        // Remove from favorites
        const { error } = await supabase
          .from('user_favorites')
          .delete()
          .eq('id', existing.id);

        if (error) {
          console.error('Error removing favorite:', error);
          return false;
        }

        toast({
          title: "Removed from favorites",
          description: "Track removed from your favorites",
        });
        return false; // Not favorited anymore
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('user_favorites')
          .insert({
            profile_id: profile.id,
            track_id: trackId,
            artist_id: artistId
          });

        if (error) {
          console.error('Error adding favorite:', error);
          return false;
        }

        toast({
          title: "Added to favorites",
          description: "Track added to your favorites",
        });
        return true; // Now favorited
      }
    } catch (error) {
      console.error('Error in toggleFavorite:', error);
      return false;
    }
  }

  static async isFavorited(trackId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (!profile) return false;

      const { data } = await supabase
        .from('user_favorites')
        .select('id')
        .eq('profile_id', profile.id)
        .eq('track_id', trackId)
        .maybeSingle();

      return !!data;
    } catch (error) {
      console.error('Error checking favorite status:', error);
      return false;
    }
  }

  static async getUserFavorites(profileId?: string): Promise<UserFavorite[]> {
    try {
      let query = supabase.from('user_favorites').select('*');
      
      if (profileId) {
        query = query.eq('profile_id', profileId);
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('auth_user_id', user.id)
          .single();

        if (!profile) return [];
        query = query.eq('profile_id', profile.id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching favorites:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserFavorites:', error);
      return [];
    }
  }

  // Comments functionality
  static async addComment(trackId: string, artistId: string, comment: string, replyToId?: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (!profile) {
        toast({
          title: "Error",
          description: "Please log in to comment",
          variant: "destructive",
        });
        return false;
      }

      const { error } = await supabase
        .from('track_comments')
        .insert({
          profile_id: profile.id,
          track_id: trackId,
          artist_id: artistId,
          comment: comment.trim(),
          reply_to_id: replyToId
        });

      if (error) {
        console.error('Error adding comment:', error);
        toast({
          title: "Error",
          description: "Failed to add comment",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Comment added",
        description: "Your comment has been posted",
      });
      return true;
    } catch (error) {
      console.error('Error in addComment:', error);
      return false;
    }
  }

  static async getTrackComments(trackId: string): Promise<TrackComment[]> {
    try {
      const { data, error } = await supabase
        .from('track_comments')
        .select('*')
        .eq('track_id', trackId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching comments:', error);
        return [];
      }

      // Get profile data separately to avoid relation issues
      const profileIds = [...new Set(data?.map(comment => comment.profile_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', profileIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return (data || []).map(comment => ({
        ...comment,
        profile: profileMap.get(comment.profile_id) || { display_name: 'Unknown User' }
      }));
    } catch (error) {
      console.error('Error in getTrackComments:', error);
      return [];
    }
  }

  static async updateComment(commentId: string, newComment: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('track_comments')
        .update({ 
          comment: newComment.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId);

      if (error) {
        console.error('Error updating comment:', error);
        return false;
      }

      toast({
        title: "Comment updated",
        description: "Your comment has been updated",
      });
      return true;
    } catch (error) {
      console.error('Error in updateComment:', error);
      return false;
    }
  }

  static async deleteComment(commentId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('track_comments')
        .update({ 
          is_deleted: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId);

      if (error) {
        console.error('Error deleting comment:', error);
        return false;
      }

      toast({
        title: "Comment deleted",
        description: "Your comment has been deleted",
      });
      return true;
    } catch (error) {
      console.error('Error in deleteComment:', error);
      return false;
    }
  }

  // AI Recommendations
  static async generateAIRecommendations(profileId: string, count: number = 5, genres: string[] = [], moods: string[] = []): Promise<any[]> {
    try {
      console.log(`Generating AI recommendations for profile: ${profileId}, count: ${count}`);
      
      const { data, error } = await supabase.functions.invoke('ai-recommendations', {
        body: {
          profileId,
          count,
          genres,
          moods
        }
      });

      if (error) {
        console.error('Error generating AI recommendations:', error);
        throw new Error(`Failed to generate recommendations: ${error.message}`);
      }

      if (!data || !data.success) {
        console.error('AI recommendations API returned error:', data?.error || 'Unknown error');
        throw new Error(data?.error || 'Failed to generate recommendations');
      }

      console.log(`Successfully generated ${data.recommendations?.length || 0} AI recommendations`);
      return data?.recommendations || [];
    } catch (error) {
      console.error('Error in generateAIRecommendations:', error);
      throw error; // Re-throw to let the UI handle the error
    }
  }

  static async getUserRecommendations(profileId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('user_recommendations')
        .select('*')
        .eq('profile_id', profileId)
        .gt('expires_at', new Date().toISOString())
        .order('score', { ascending: false });

      if (error) {
        console.error('Error fetching recommendations:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserRecommendations:', error);
      return [];
    }
  }
}