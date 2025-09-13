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

      const balance = tokenBalance?.balance || 0;

      return {
        balance: Number(balance),
        staked: 0, // Will implement when new tables are available
        earned: 0, // Will implement when new tables are available
        locked: 0
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
   * Award $AUDIO tokens for platform activities (using transactions table for now)
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

      // Record as a transaction for now
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          to_profile_id: profileId,
          amount_ton: 0,
          audio_amount: amount,
          transaction_type: 'reward',
          status: 'completed',
          transaction_hash: `reward_${Date.now()}`,
          token_type: 'AUDIO',
          metadata: { reason, ...metadata }
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        profileId: data.to_profile_id!,
        amount: Number(data.audio_amount || 0),
        reason,
        trackId: metadata?.trackId,
        artistId: metadata?.artistId,
        metadata,
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
   * Stake $AUDIO tokens (placeholder - will implement with proper tables)
   */
  static async stakeAudioTokens(
    profileId: string,
    amount: number,
    duration: number = 30 // days
  ): Promise<AudioTokenStaking> {
    console.log('Staking feature will be implemented when new tables are available');
    
    // Return placeholder data for now
    return {
      id: `stake_${Date.now()}`,
      profileId,
      amount,
      duration,
      apy: duration >= 365 ? 15 : duration >= 180 ? 12 : duration >= 90 ? 8 : 5,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active'
    };
  }

  /**
   * Get user's staking positions (placeholder)
   */
  static async getStakingPositions(profileId: string): Promise<AudioTokenStaking[]> {
    console.log('Staking positions will be implemented when new tables are available');
    return [];
  }

  /**
   * Withdraw staked tokens (placeholder)
   */
  static async withdrawStake(profileId: string, stakeId: string): Promise<void> {
    console.log('Stake withdrawal will be implemented when new tables are available');
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
