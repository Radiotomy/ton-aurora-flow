import { supabase } from '@/integrations/supabase/client';

export interface AudioTokenBalance {
  balance: number;
  staked_balance?: number;
  total_earnings: number;
  pending_rewards: number;
}

export interface AudioReward {
  id: string;
  type: 'listen' | 'upload' | 'playlist' | 'social' | 'milestone';
  amount: number;
  metadata: Record<string, any>;
  earned_at: string;
  claimed_at?: string;
}

export interface AudioGovernanceProposal {
  id: string;
  title: string;
  description: string;
  type: 'protocol' | 'feature' | 'treasury';
  voting_power_required: number;
  total_votes: number;
  status: 'active' | 'passed' | 'rejected';
  created_at: string;
  expires_at: string;
}

export class AudioTokenService {
  /**
   * Get user's $AUDIO token balance
   */
  static async getAudioBalance(profileId: string): Promise<AudioTokenBalance> {
    try {
      const { data, error } = await supabase
        .from('token_balances')
        .select('balance')
        .eq('profile_id', profileId)
        .eq('token_type', 'AUDIO')
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        throw error;
      }

      // Fetch additional $AUDIO data via edge function
      const { data: audioData, error: audioError } = await supabase.functions.invoke('audio-token-balance', {
        body: { profileId }
      });

      const balance = data?.balance || 0;
      const audioBalance = audioData || {};

      return {
        balance: Number(balance),
        staked_balance: audioBalance.staked_balance || 0,
        total_earnings: audioBalance.total_earnings || 0,
        pending_rewards: audioBalance.pending_rewards || 0,
      };
    } catch (error) {
      console.error('Error fetching $AUDIO balance:', error);
      return {
        balance: 0,
        total_earnings: 0,
        pending_rewards: 0,
      };
    }
  }

  /**
   * Update $AUDIO balance
   */
  static async updateAudioBalance(profileId: string, amount: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('token_balances')
        .upsert({
          profile_id: profileId,
          token_type: 'AUDIO',
          balance: amount,
          last_updated: new Date().toISOString(),
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating $AUDIO balance:', error);
      throw error;
    }
  }

  /**
   * Get user's $AUDIO earning history
   */
  static async getAudioRewards(profileId: string, limit = 20): Promise<AudioReward[]> {
    try {
      const { data, error } = await supabase.functions.invoke('audio-rewards-history', {
        body: { profileId, limit }
      });

      if (error || !data.success) {
        throw new Error(data?.error || error?.message || 'Failed to fetch rewards');
      }

      return data.rewards || [];
    } catch (error) {
      console.error('Error fetching $AUDIO rewards:', error);
      return [];
    }
  }

  /**
   * Claim pending $AUDIO rewards
   */
  static async claimAudioRewards(profileId: string, rewardIds: string[]): Promise<{ claimed: number }> {
    try {
      const { data, error } = await supabase.functions.invoke('audio-claim-rewards', {
        body: { profileId, rewardIds }
      });

      if (error || !data.success) {
        throw new Error(data?.error || error?.message || 'Failed to claim rewards');
      }

      return { claimed: data.claimed_amount || 0 };
    } catch (error) {
      console.error('Error claiming $AUDIO rewards:', error);
      throw error;
    }
  }

  /**
   * Stake $AUDIO tokens for enhanced features
   */
  static async stakeAudioTokens(profileId: string, amount: number): Promise<void> {
    try {
      const { data, error } = await supabase.functions.invoke('audio-stake-tokens', {
        body: { profileId, amount }
      });

      if (error || !data.success) {
        throw new Error(data?.error || error?.message || 'Failed to stake tokens');
      }
    } catch (error) {
      console.error('Error staking $AUDIO tokens:', error);
      throw error;
    }
  }

  /**
   * Unstake $AUDIO tokens
   */
  static async unstakeAudioTokens(profileId: string, amount: number): Promise<void> {
    try {
      const { data, error } = await supabase.functions.invoke('audio-unstake-tokens', {
        body: { profileId, amount }
      });

      if (error || !data.success) {
        throw new Error(data?.error || error?.message || 'Failed to unstake tokens');
      }
    } catch (error) {
      console.error('Error unstaking $AUDIO tokens:', error);
      throw error;
    }
  }

  /**
   * Get active governance proposals
   */
  static async getGovernanceProposals(limit = 10): Promise<AudioGovernanceProposal[]> {
    try {
      const { data, error } = await supabase.functions.invoke('audio-governance-proposals', {
        body: { limit }
      });

      if (error || !data.success) {
        throw new Error(data?.error || error?.message || 'Failed to fetch proposals');
      }

      return data.proposals || [];
    } catch (error) {
      console.error('Error fetching governance proposals:', error);
      return [];
    }
  }

  /**
   * Vote on governance proposal
   */
  static async voteOnProposal(
    profileId: string,
    proposalId: string,
    vote: 'yes' | 'no',
    votingPower: number
  ): Promise<void> {
    try {
      const { data, error } = await supabase.functions.invoke('audio-governance-vote', {
        body: { profileId, proposalId, vote, votingPower }
      });

      if (error || !data.success) {
        throw new Error(data?.error || error?.message || 'Failed to submit vote');
      }
    } catch (error) {
      console.error('Error voting on proposal:', error);
      throw error;
    }
  }

  /**
   * Calculate listening rewards based on engagement
   */
  static calculateListeningReward(
    duration: number,
    trackRarity: number = 1,
    userStake: number = 0
  ): number {
    // Base reward calculation (similar to Audius protocol)
    const baseReward = Math.min(duration / 30, 10); // Max 10 $AUDIO per track
    const rarityMultiplier = trackRarity;
    const stakeBonus = Math.min(userStake / 1000, 2); // Up to 2x bonus for staking

    return baseReward * rarityMultiplier * (1 + stakeBonus);
  }

  /**
   * Calculate artist rewards for uploads and engagement
   */
  static calculateArtistReward(
    plays: number,
    favorites: number,
    reposts: number,
    trackAge: number
  ): number {
    const playReward = plays * 0.1;
    const engagementReward = (favorites + reposts) * 0.5;
    const freshnessBonus = Math.max(1 - (trackAge / 30), 0.1); // Bonus for new tracks

    return (playReward + engagementReward) * freshnessBonus;
  }
}