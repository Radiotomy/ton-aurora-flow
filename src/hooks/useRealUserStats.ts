import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWeb3 } from './useWeb3';

interface RealUserStats {
  // Basic stats
  tracksCollected: number;
  fanClubMemberships: number;
  reputationScore: number;
  tonBalance: number;
  audioBalance: number;
  
  // Activity stats
  totalListeningHours: number;
  totalEarned: number;
  totalSpent: number;
  artistsSupported: number;
  favoritesCount: number;
  commentsCount: number;
  
  // Progress metrics
  profileCompletion: number;
  collectionProgress: number;
  communityEngagement: number;
  
  // Recent activity
  recentActivity: Array<{
    id: string;
    type: 'like' | 'collect' | 'join' | 'tip' | 'comment';
    description: string;
    timestamp: string;
    metadata?: any;
  }>;
  
  // Loading state
  loading: boolean;
  error: string | null;
}

export const useRealUserStats = (): RealUserStats => {
  const { profile } = useWeb3();
  const [stats, setStats] = useState<RealUserStats>({
    tracksCollected: 0,
    fanClubMemberships: 0,
    reputationScore: 0,
    tonBalance: 0,
    audioBalance: 0,
    totalListeningHours: 0,
    totalEarned: 0,
    totalSpent: 0,
    artistsSupported: 0,
    favoritesCount: 0,
    commentsCount: 0,
    profileCompletion: 0,
    collectionProgress: 0,
    communityEngagement: 0,
    recentActivity: [],
    loading: true,
    error: null
  });

  useEffect(() => {
    if (!profile?.id) {
      setStats(prev => ({ ...prev, loading: false }));
      return;
    }

    const fetchStats = async () => {
      try {
        setStats(prev => ({ ...prev, loading: true, error: null }));

        // Parallel queries for better performance
        const [
          collectionsResult,
          fanClubsResult,
          balancesResult,
          listeningResult,
          transactionsResult,
          favoritesResult,
          commentsResult,
          tipsResult
        ] = await Promise.all([
          // Track collections
          supabase
            .from('track_collections')
            .select('*')
            .eq('profile_id', profile.id),
          
          // Fan club memberships
          supabase
            .from('fan_club_memberships')
            .select('*')
            .eq('profile_id', profile.id),
          
          // Token balances
          supabase
            .from('token_balances')
            .select('*')
            .eq('profile_id', profile.id),
          
          // Listening history for hours calculation
          supabase
            .from('listening_history')
            .select('duration_played')
            .eq('profile_id', profile.id),
          
          // Transactions for earnings/spending
          supabase
            .from('transactions')
            .select('amount_ton, transaction_type, from_profile_id, to_profile_id')
            .or(`from_profile_id.eq.${profile.id},to_profile_id.eq.${profile.id}`),
          
          // User favorites
          supabase
            .from('user_favorites')
            .select('*')
            .eq('profile_id', profile.id),
          
          // Comments count
          supabase
            .from('track_comments')
            .select('id')
            .eq('profile_id', profile.id)
            .eq('is_deleted', false),
          
          // Tips sent (for artists supported)
          supabase
            .from('transactions')
            .select('to_profile_id')
            .eq('from_profile_id', profile.id)
            .eq('transaction_type', 'tip')
        ]);

        // Calculate stats from results
        const collections = collectionsResult.data || [];
        const fanClubs = fanClubsResult.data || [];
        const balances = balancesResult.data || [];
        const listeningHistory = listeningResult.data || [];
        const transactions = transactionsResult.data || [];
        const favorites = favoritesResult.data || [];
        const comments = commentsResult.data || [];
        const tips = tipsResult.data || [];

        // Calculate listening hours (duration_played in seconds)
        const totalSeconds = listeningHistory.reduce((sum, session) => 
          sum + (session.duration_played || 0), 0
        );
        const totalListeningHours = Math.floor(totalSeconds / 3600);

        // Calculate earnings and spending
        const earned = transactions
          .filter(t => t.to_profile_id === profile.id)
          .reduce((sum, t) => sum + parseFloat(String(t.amount_ton || 0)), 0);
        
        const spent = transactions
          .filter(t => t.from_profile_id === profile.id)
          .reduce((sum, t) => sum + parseFloat(String(t.amount_ton || 0)), 0);

        // Get token balances
        const tonBalance = parseFloat(String(balances.find(b => b.token_type === 'TON')?.balance || 0));
        const audioBalance = parseFloat(String(balances.find(b => b.token_type === 'AUDIO')?.balance || 0));

        // Calculate unique artists supported
        const uniqueArtists = new Set(tips.map(t => t.to_profile_id));

        // Calculate profile completion
        const profileFields = [
          profile.display_name,
          profile.bio,
          profile.avatar_url,
          profile.wallet_address
        ];
        const completedFields = profileFields.filter(field => field && field.trim() !== '').length;
        const profileCompletion = (completedFields / profileFields.length) * 100;

        // Collection progress (arbitrary metric based on collections vs reputation)
        const collectionProgress = Math.min((collections.length / 10) * 100, 100);

        // Community engagement (based on comments, favorites, fan clubs)
        const engagementScore = comments.length + favorites.length + (fanClubs.length * 2);
        const communityEngagement = Math.min((engagementScore / 20) * 100, 100);

        // Get recent activity (last 10 transactions + favorites + comments)
        const recentTransactions = await supabase
          .from('transactions')
          .select('*')
          .or(`from_profile_id.eq.${profile.id},to_profile_id.eq.${profile.id}`)
          .order('created_at', { ascending: false })
          .limit(5);

        const recentFavorites = await supabase
          .from('user_favorites')
          .select('*')
          .eq('profile_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(3);

        const recentCollections = await supabase
          .from('track_collections')
          .select('*')
          .eq('profile_id', profile.id)
          .order('collected_at', { ascending: false })
          .limit(3);

        // Build recent activity array
        const recentActivity: Array<{
          id: string;
          type: 'like' | 'collect' | 'join' | 'tip' | 'comment';
          description: string;
          timestamp: string;
          metadata?: any;
        }> = [];

        // Add recent collections
        recentCollections.data?.forEach(collection => {
          recentActivity.push({
            id: collection.id,
            type: 'collect',
            description: `Collected track NFT`,
            timestamp: collection.collected_at,
            metadata: { trackId: collection.track_id }
          });
        });

        // Add recent favorites
        recentFavorites.data?.forEach(favorite => {
          recentActivity.push({
            id: favorite.id,
            type: 'like',
            description: `Liked a track`,
            timestamp: favorite.created_at,
            metadata: { trackId: favorite.track_id }
          });
        });

        // Add recent tips
        recentTransactions.data?.forEach(transaction => {
          if (transaction.transaction_type === 'tip' && transaction.from_profile_id === profile.id) {
            recentActivity.push({
              id: transaction.id,
              type: 'tip',
              description: `Sent ${transaction.amount_ton} TON tip`,
              timestamp: transaction.created_at,
              metadata: { amount: transaction.amount_ton }
            });
          }
        });

        // Sort by timestamp and take most recent
        recentActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        setStats({
          tracksCollected: collections.length,
          fanClubMemberships: fanClubs.length,
          reputationScore: profile.reputation_score || 0,
          tonBalance: parseFloat(String(tonBalance)),
          audioBalance: parseFloat(String(audioBalance)),
          totalListeningHours,
          totalEarned: earned,
          totalSpent: spent,
          artistsSupported: uniqueArtists.size,
          favoritesCount: favorites.length,
          commentsCount: comments.length,
          profileCompletion: Math.round(profileCompletion),
          collectionProgress: Math.round(collectionProgress),
          communityEngagement: Math.round(communityEngagement),
          recentActivity: recentActivity.slice(0, 10),
          loading: false,
          error: null
        });

      } catch (error) {
        console.error('Error fetching user stats:', error);
        setStats(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to load stats'
        }));
      }
    };

    fetchStats();
  }, [profile?.id]);

  return stats;
};