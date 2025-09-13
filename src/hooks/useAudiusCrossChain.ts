import { useState, useCallback } from 'react';
import { useWeb3 } from '@/hooks/useWeb3';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { SmartContractHelper } from '@/utils/smartContracts';
import { AudiusTrack, AudiusUser } from '@/services/audiusService';

interface TipAudiusArtistParams {
  artistId: string;
  artistHandle: string;
  amount: number;
  message?: string;
  trackId?: string;
}

interface CreateFanClubMembershipParams {
  artistId: string;
  tier: 'basic' | 'premium' | 'exclusive';
  duration: number; // in months
}

interface ListeningReward {
  trackId: string;
  artistId: string;
  duration: number; // seconds listened
  rewardAmount: number;
}

export const useAudiusCrossChain = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { isConnected, sendTransaction, walletAddress } = useWeb3();
  const { toast } = useToast();

  /**
   * Tip an Audius artist directly via TON blockchain
   */
  const tipAudiusArtist = useCallback(async ({
    artistId,
    artistHandle,
    amount,
    message,
    trackId
  }: TipAudiusArtistParams) => {
    if (!isConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to send tips.",
        variant: "destructive",
      });
      return false;
    }

    setIsProcessing(true);
    try {
      // Check if artist has a TON wallet linked
      const { data: artistProfile } = await (supabase as any)
        .from('profiles')
        .select('wallet_address, display_name')
        .eq('audius_user_id', artistId)
        .maybeSingle();

      const recipientAddress = artistProfile?.wallet_address || SmartContractHelper.CONTRACTS.PAYMENT_PROCESSOR;

      // Create tip transaction
      const tipPayload = SmartContractHelper.createTipPayload({
        artistId,
        trackId,
        amount,
        message: message || `Tip from AudioTon fan`,
        sender: walletAddress!
      });

      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 300,
        messages: [{
          address: recipientAddress,
          amount: SmartContractHelper.convertTonToNano(amount).toString(),
          payload: tipPayload
        }]
      };

      const result = await sendTransaction(transaction);

      // Record the tip in our database
      const { error: dbError } = await supabase.from('transactions').insert({
        transaction_hash: result.boc,
        transaction_type: 'audius_artist_tip',
        amount_ton: amount,
        status: 'completed',
        metadata: {
          artist_id: artistId,
          artist_handle: artistHandle,
          track_id: trackId,
          message,
          platform: 'audius'
        }
      });

      if (dbError) {
        console.error('Database error:', dbError);
      }

      toast({
        title: "🎵 Tip Sent Successfully!",
        description: `${amount} TON sent to @${artistHandle} on Audius`,
      });

      return true;
    } catch (error) {
      console.error('Tip failed:', error);
      toast({
        title: "Tip Failed",
        description: "There was an error sending your tip. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [isConnected, sendTransaction, toast]);

  /**
   * Create a fan club membership for an Audius artist
   */
  const createFanClubMembership = useCallback(async ({
    artistId,
    tier,
    duration
  }: CreateFanClubMembershipParams) => {
    if (!isConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to join fan clubs.",
        variant: "destructive",
      });
      return false;
    }

    setIsProcessing(true);
    try {
      const prices = { basic: 5, premium: 15, exclusive: 50 };
      const price = prices[tier] * duration;

      // Create fan club membership transaction
      const membershipPayload = SmartContractHelper.createFanClubJoinPayload({
        artistId,
        tier,
        duration,
        recipient: walletAddress!
      });

      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 300,
        messages: [{
          address: SmartContractHelper.CONTRACTS.FAN_CLUB,
          amount: SmartContractHelper.convertTonToNano(price).toString(),
          payload: membershipPayload
        }]
      };

      const result = await sendTransaction(transaction);

      // Record membership in database
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + duration);

      const { error: membershipError } = await supabase.from('fan_club_memberships').insert({
        artist_id: artistId,
        membership_tier: tier,
        expires_at: expiresAt.toISOString(),
        nft_token_id: result.boc
      });

      if (membershipError) {
        console.error('Membership database error:', membershipError);
      }

      // Record transaction
      const { error: txError } = await supabase.from('transactions').insert({
        transaction_hash: result.boc,
        transaction_type: 'fan_club_membership',
        amount_ton: price,
        status: 'completed',
        metadata: {
          artist_id: artistId,
          tier,
          duration_months: duration,
          expires_at: expiresAt.toISOString()
        }
      });

      if (txError) {
        console.error('Transaction database error:', txError);
      }

      toast({
        title: "🎉 Fan Club Membership Created!",
        description: `Welcome to the ${tier} tier! Membership valid for ${duration} months.`,
      });

      return true;
    } catch (error) {
      console.error('Fan club membership failed:', error);
      toast({
        title: "Membership Failed",
        description: "There was an error creating your membership. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [isConnected, sendTransaction, walletAddress, toast]);

  /**
   * Reward users for listening to Audius tracks
   */
  const claimListeningReward = useCallback(async ({
    trackId,
    artistId,
    duration,
    rewardAmount
  }: ListeningReward) => {
    if (!isConnected) return false;

    setIsProcessing(true);
    try {
      // Minimum listening time to qualify for rewards (30 seconds)
      if (duration < 30) {
        toast({
          title: "Listen Longer",
          description: "Listen for at least 30 seconds to earn rewards!",
        });
        return false;
      }

      // Check if user already claimed reward for this track today
      const today = new Date().toISOString().split('T')[0];
      const { data: existingReward } = await supabase
        .from('listening_history')
        .select('id')
        .eq('track_id', trackId)
        .gte('played_at', `${today}T00:00:00.000Z`)
        .single();

      if (existingReward) {
        toast({
          title: "Already Rewarded",
          description: "You've already earned rewards for this track today!",
        });
        return false;
      }

      // Calculate reward based on listening duration
      const baseReward = 0.001; // Base reward in TON
      const finalReward = Math.min(baseReward * (duration / 60), 0.01); // Max 0.01 TON per track

      // Create reward transaction from rewards pool
      const rewardPayload = SmartContractHelper.createTipPayload({
        artistId: walletAddress!,
        amount: finalReward,
        message: `Listening reward for ${trackId}`,
        sender: 'rewards-pool'
      });

      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 300,
        messages: [{
          address: SmartContractHelper.CONTRACTS.REWARD_DISTRIBUTOR,
          amount: SmartContractHelper.convertTonToNano(finalReward).toString(),
          payload: rewardPayload
        }]
      };

      const result = await sendTransaction(transaction);

      // Record listening history and reward
      const { error: historyError } = await supabase.from('listening_history').insert({
        track_id: trackId,
        artist_id: artistId,
        duration_played: duration,
        tip_amount: finalReward
      });

      if (historyError) {
        console.error('History error:', historyError);
      }

      toast({
        title: "🎵 Listening Reward Earned!",
        description: `+${finalReward.toFixed(4)} TON for listening to this track`,
      });

      return true;
    } catch (error) {
      console.error('Listening reward failed:', error);
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [isConnected, sendTransaction, walletAddress, toast]);

  /**
   * Get user's Audius listening stats and TON earnings
   */
  const getListeningStats = useCallback(async () => {
    try {
      const { data: listeningHistory } = await supabase
        .from('listening_history')
        .select('*')
        .order('played_at', { ascending: false })
        .limit(100);

      const totalListeningTime = listeningHistory?.reduce((sum, record) => 
        sum + (record.duration_played || 0), 0) || 0;
      
      const totalRewards = listeningHistory?.reduce((sum, record) => 
        sum + (record.tip_amount || 0), 0) || 0;

      const uniqueTracks = new Set(listeningHistory?.map(record => record.track_id) || []).size;
      const uniqueArtists = new Set(listeningHistory?.map(record => record.artist_id) || []).size;

      return {
        totalListeningTime,
        totalRewards,
        uniqueTracks,
        uniqueArtists,
        recentListening: listeningHistory?.slice(0, 10) || []
      };
    } catch (error) {
      console.error('Error fetching listening stats:', error);
      return {
        totalListeningTime: 0,
        totalRewards: 0,
        uniqueTracks: 0,
        uniqueArtists: 0,
        recentListening: []
      };
    }
  }, []);

  return {
    tipAudiusArtist,
    createFanClubMembership,
    claimListeningReward,
    getListeningStats,
    isProcessing
  };
};