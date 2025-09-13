import { supabase } from '@/integrations/supabase/client';

export interface AudioTokenBalance {
  balance: number;
  staked: number;
  earned: number;
  locked: number;
}

export interface AudioTokenReward {
  id: string;
  profileId: string;
  amount: number;
  reason: string;
  trackId?: string;
  artistId?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface AudioTokenStaking {
  id: string;
  profileId: string;
  amount: number;
  duration: number; // in days
  apy: number; // annual percentage yield
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'withdrawn';
}

export interface TokenConversion {
  fromToken: 'AUDIO' | 'TON';
  toToken: 'AUDIO' | 'TON';
  fromAmount: number;
  toAmount: number;
  rate: number;
  fee: number;
  slippage?: number;
}

export class AudioTokenService {
  /**
   * Get user's $AUDIO token balance
   */
  static async getAudioBalance(profileId: string): Promise<AudioTokenBalance> {
    try {
      const { data: tokenBalance } = await supabase
        .from('token_balances')
        .select('balance')
        .eq('profile_id', profileId)
        .eq('token_type', 'AUDIO')
        .maybeSingle();

      const { data: stakingData } = await supabase
        .from('audio_token_staking')
        .select('amount, status')
        .eq('profile_id', profileId)
        .eq('status', 'active');

      const { data: rewardsData } = await supabase
        .from('audio_token_rewards')
        .select('amount')
        .eq('profile_id', profileId);

      const balance = tokenBalance?.balance || 0;
      const staked = stakingData?.reduce((sum, stake) => sum + Number(stake.amount), 0) || 0;
      const earned = rewardsData?.reduce((sum, reward) => sum + Number(reward.amount), 0) || 0;

      return {
        balance: Number(balance),
        staked,
        earned,
        locked: 0 // TODO: Calculate locked tokens
      };
    } catch (error) {
      console.error('Error fetching AUDIO balance:', error);
      return { balance: 0, staked: 0, earned: 0, locked: 0 };
    }
  }

  /**
   * Update user's $AUDIO token balance
   */
  static async updateAudioBalance(profileId: string, amount: number): Promise<void> {
    try {
      await supabase
        .from('token_balances')
        .upsert({
          profile_id: profileId,
          token_type: 'AUDIO',
          balance: amount,
          last_updated: new Date().toISOString()
        }, {
          onConflict: 'profile_id,token_type'
        });
    } catch (error) {
      console.error('Error updating AUDIO balance:', error);
      throw new Error('Failed to update AUDIO balance');
    }
  }

  /**
   * Add $AUDIO token balance
   */
  static async addAudioBalance(profileId: string, amount: number): Promise<void> {
    try {
      const currentBalance = await this.getAudioBalance(profileId);
      const newBalance = currentBalance.balance + amount;
      await this.updateAudioBalance(profileId, newBalance);
    } catch (error) {
      console.error('Error adding AUDIO balance:', error);
      throw new Error('Failed to add AUDIO balance');
    }
  }

  /**
   * Subtract $AUDIO token balance
   */
  static async subtractAudioBalance(profileId: string, amount: number): Promise<void> {
    try {
      const currentBalance = await this.getAudioBalance(profileId);
      if (currentBalance.balance < amount) {
        throw new Error('Insufficient AUDIO balance');
      }
      const newBalance = currentBalance.balance - amount;
      await this.updateAudioBalance(profileId, newBalance);
    } catch (error) {
      console.error('Error subtracting AUDIO balance:', error);
      throw new Error('Failed to subtract AUDIO balance');
    }
  }

  /**
   * Award $AUDIO tokens for platform activities
   */
  static async awardTokens(
    profileId: string,
    amount: number,
    reason: string,
    metadata?: Record<string, any>
  ): Promise<AudioTokenReward> {
    try {
      // Add to balance
      await this.addAudioBalance(profileId, amount);

      // Record the reward
      const { data, error } = await supabase
        .from('audio_token_rewards')
        .insert({
          profile_id: profileId,
          amount,
          reason,
          metadata,
          track_id: metadata?.trackId,
          artist_id: metadata?.artistId
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        profileId: data.profile_id,
        amount: Number(data.amount),
        reason: data.reason,
        trackId: data.track_id,
        artistId: data.artist_id,
        metadata: data.metadata,
        createdAt: data.created_at
      };
    } catch (error) {
      console.error('Error awarding AUDIO tokens:', error);
      throw new Error('Failed to award AUDIO tokens');
    }
  }

  /**
   * Get current $AUDIO to TON conversion rate
   */
  static async getConversionRate(fromToken: 'AUDIO' | 'TON', toToken: 'AUDIO' | 'TON'): Promise<number> {
    try {
      const { data } = await supabase
        .from('token_conversion_rates')
        .select('rate')
        .eq('from_token', fromToken)
        .eq('to_token', toToken)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      return Number(data?.rate || (fromToken === toToken ? 1 : 0.01)); // Default rate
    } catch (error) {
      console.error('Error fetching conversion rate:', error);
      return fromToken === toToken ? 1 : 0.01; // Fallback rate
    }
  }

  /**
   * Convert between $AUDIO and TON tokens
   */
  static async convertTokens(
    profileId: string,
    fromToken: 'AUDIO' | 'TON',
    toToken: 'AUDIO' | 'TON',
    amount: number
  ): Promise<TokenConversion> {
    try {
      const rate = await this.getConversionRate(fromToken, toToken);
      const fee = amount * 0.01; // 1% conversion fee
      const toAmount = (amount - fee) * rate;

      // Execute the conversion
      if (fromToken === 'AUDIO') {
        await this.subtractAudioBalance(profileId, amount);
      } else {
        // Subtract TON balance (implement TON balance service)
        await this.subtractTonBalance(profileId, amount);
      }

      if (toToken === 'AUDIO') {
        await this.addAudioBalance(profileId, toAmount);
      } else {
        // Add TON balance
        await this.addTonBalance(profileId, toAmount);
      }

      // Record the conversion transaction
      await supabase
        .from('cross_token_transactions')
        .insert({
          profile_id: profileId,
          from_token: fromToken,
          to_token: toToken,
          from_amount: amount,
          to_amount: toAmount,
          conversion_rate: rate,
          fees: fee,
          status: 'completed'
        });

      return {
        fromToken,
        toToken,
        fromAmount: amount,
        toAmount,
        rate,
        fee
      };
    } catch (error) {
      console.error('Error converting tokens:', error);
      throw new Error('Failed to convert tokens');
    }
  }

  /**
   * Stake $AUDIO tokens
   */
  static async stakeAudioTokens(
    profileId: string,
    amount: number,
    duration: number = 30 // days
  ): Promise<AudioTokenStaking> {
    try {
      // Check balance
      const balance = await this.getAudioBalance(profileId);
      if (balance.balance < amount) {
        throw new Error('Insufficient AUDIO balance for staking');
      }

      // Subtract from balance
      await this.subtractAudioBalance(profileId, amount);

      // Calculate APY based on duration (longer = higher APY)
      const apy = duration >= 365 ? 15 : duration >= 180 ? 12 : duration >= 90 ? 8 : 5;

      const startDate = new Date().toISOString();
      const endDate = new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('audio_token_staking')
        .insert({
          profile_id: profileId,
          amount,
          duration,
          apy,
          start_date: startDate,
          end_date: endDate,
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        profileId: data.profile_id,
        amount: Number(data.amount),
        duration: data.duration,
        apy: data.apy,
        startDate: data.start_date,
        endDate: data.end_date,
        status: data.status
      };
    } catch (error) {
      console.error('Error staking AUDIO tokens:', error);
      throw new Error('Failed to stake AUDIO tokens');
    }
  }

  /**
   * Get user's staking positions
   */
  static async getStakingPositions(profileId: string): Promise<AudioTokenStaking[]> {
    try {
      const { data, error } = await supabase
        .from('audio_token_staking')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(item => ({
        id: item.id,
        profileId: item.profile_id,
        amount: Number(item.amount),
        duration: item.duration,
        apy: item.apy,
        startDate: item.start_date,
        endDate: item.end_date,
        status: item.status
      }));
    } catch (error) {
      console.error('Error fetching staking positions:', error);
      return [];
    }
  }

  /**
   * Withdraw staked tokens (if matured)
   */
  static async withdrawStake(profileId: string, stakeId: string): Promise<void> {
    try {
      const { data: stake } = await supabase
        .from('audio_token_staking')
        .select('*')
        .eq('id', stakeId)
        .eq('profile_id', profileId)
        .single();

      if (!stake) {
        throw new Error('Staking position not found');
      }

      const endDate = new Date(stake.end_date);
      const now = new Date();

      if (now < endDate) {
        throw new Error('Staking period has not ended yet');
      }

      // Calculate rewards
      const stakingDays = Math.floor((now.getTime() - new Date(stake.start_date).getTime()) / (1000 * 60 * 60 * 24));
      const rewards = (Number(stake.amount) * stake.apy / 100 / 365) * stakingDays;
      const totalAmount = Number(stake.amount) + rewards;

      // Add back to balance with rewards
      await this.addAudioBalance(profileId, totalAmount);

      // Update staking status
      await supabase
        .from('audio_token_staking')
        .update({ status: 'withdrawn' })
        .eq('id', stakeId);

      // Record rewards
      await this.awardTokens(
        profileId,
        rewards,
        'staking_rewards',
        { stakeId, stakingDays, apy: stake.apy }
      );
    } catch (error) {
      console.error('Error withdrawing stake:', error);
      throw new Error('Failed to withdraw stake');
    }
  }

  // Helper methods for TON balance (to be implemented in TON service)
  private static async subtractTonBalance(profileId: string, amount: number): Promise<void> {
    // TODO: Implement TON balance subtraction
    console.log('TON balance subtraction not yet implemented');
  }

  private static async addTonBalance(profileId: string, amount: number): Promise<void> {
    // TODO: Implement TON balance addition
    console.log('TON balance addition not yet implemented');
  }
}