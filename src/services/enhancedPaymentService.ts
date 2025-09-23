import { supabase } from '@/integrations/supabase/client';

export interface PaymentRecommendation {
  recommendedToken: 'TON' | 'AUDIO';
  reason: string;
  expectedSavings: number;
  confidence: number;
}

export interface CrossTokenReward {
  tonAmount: number;
  audioAmount: number;
  multiplier: number;
  bonusType: 'activity' | 'loyalty' | 'staking' | 'volume';
}

export interface ActivityStats {
  dailyTransactions: number;
  weeklyVolume: number;
  loyaltyTier: 'bronze' | 'silver' | 'gold' | 'platinum';
  streakDays: number;
}

export class EnhancedPaymentService {
  
  /**
   * Get intelligent payment recommendations based on user activity
   */
  static async getPaymentRecommendation(
    profileId: string,
    amount: number,
    transactionType: string
  ): Promise<PaymentRecommendation> {
    try {
      // Get recent transaction history from existing tables
      const { data: transactions } = await supabase
        .from('transactions')
        .select('token_type, amount_ton, created_at')
        .eq('from_profile_id', profileId)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .limit(50);

      // Get current token balances
      const { data: tonBalance } = await supabase
        .from('token_balances')
        .select('balance')
        .eq('profile_id', profileId)
        .eq('token_type', 'TON')
        .single();

      const { data: audioBalance } = await supabase
        .from('audio_token_balances')
        .select('balance')
        .eq('profile_id', profileId)
        .single();

      const tonBal = Number(tonBalance?.balance || 0);
      const audioBal = Number(audioBalance?.balance || 0);

      // Simple recommendation logic
      let recommendedToken: 'TON' | 'AUDIO' = 'TON';
      let reason = 'Default choice for TON network transactions';
      let expectedSavings = 0;
      let confidence = 0.7;

      // Prefer AUDIO for small transactions if user has enough balance
      if (amount < 10 && audioBal >= amount) {
        recommendedToken = 'AUDIO';
        reason = 'Lower fees for small transactions with AUDIO';
        expectedSavings = amount * 0.1; // Estimated 10% savings
        confidence = 0.8;
      }

      // Prefer TON for large transactions
      if (amount > 50) {
        recommendedToken = 'TON';
        reason = 'Better liquidity and stability for large transactions';
        confidence = 0.9;
      }

      // Check if user has sufficient balance
      const hasBalance = recommendedToken === 'TON' ? tonBal >= amount : audioBal >= amount;
      if (!hasBalance) {
        recommendedToken = recommendedToken === 'TON' ? 'AUDIO' : 'TON';
        reason = `Insufficient ${recommendedToken === 'TON' ? 'AUDIO' : 'TON'} balance, switching to ${recommendedToken}`;
        confidence = 0.6;
      }

      return {
        recommendedToken,
        reason,
        expectedSavings,
        confidence
      };

    } catch (error) {
      console.error('Error getting payment recommendation:', error);
      return {
        recommendedToken: 'TON',
        reason: 'Default recommendation due to error',
        expectedSavings: 0,
        confidence: 0.5
      };
    }
  }

  /**
   * Calculate dynamic fees based on network conditions and user activity
   */
  static async calculateDynamicFees(
    amount: number,
    tokenType: 'TON' | 'AUDIO',
    profileId: string
  ): Promise<number> {
    try {
      // Get user activity for loyalty discounts
      const { data: transactions } = await supabase
        .from('transactions')
        .select('id')
        .eq('from_profile_id', profileId)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      const monthlyTransactions = transactions?.length || 0;
      
      // Base fee rates
      const baseFeeRate = tokenType === 'TON' ? 0.005 : 0.003; // 0.5% for TON, 0.3% for AUDIO
      
      // Volume discount
      let discount = 0;
      if (monthlyTransactions > 100) discount = 0.5; // 50% discount for high volume
      else if (monthlyTransactions > 50) discount = 0.3; // 30% discount
      else if (monthlyTransactions > 20) discount = 0.1; // 10% discount

      const finalFeeRate = baseFeeRate * (1 - discount);
      return Math.max(amount * finalFeeRate, 0.001); // Minimum fee of 0.001

    } catch (error) {
      console.error('Error calculating dynamic fees:', error);
      const baseFeeRate = tokenType === 'TON' ? 0.005 : 0.003;
      return amount * baseFeeRate;
    }
  }

  /**
   * Calculate cross-token rewards for activities
   */
  static async calculateCrossTokenRewards(
    profileId: string,
    activityType: string,
    baseAmount: number
  ): Promise<CrossTokenReward> {
    try {
      // Get user activity stats from existing tables
      const { data: audioRewards } = await supabase
        .from('audio_rewards_history')
        .select('amount, created_at')
        .eq('profile_id', profileId)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      const recentActivity = audioRewards?.length || 0;
      
      // Calculate multiplier based on recent activity
      let multiplier = 1.0;
      if (recentActivity > 50) multiplier = 2.0;
      else if (recentActivity > 20) multiplier = 1.5;
      else if (recentActivity > 10) multiplier = 1.2;

      // Determine bonus type
      let bonusType: CrossTokenReward['bonusType'] = 'activity';
      if (recentActivity > 30) bonusType = 'loyalty';
      if (baseAmount > 100) bonusType = 'volume';

      // Calculate rewards
      const audioAmount = baseAmount * 0.1 * multiplier; // 10% in AUDIO
      const tonAmount = baseAmount * 0.05 * multiplier;  // 5% in TON

      return {
        tonAmount,
        audioAmount,
        multiplier,
        bonusType
      };

    } catch (error) {
      console.error('Error calculating cross-token rewards:', error);
      return {
        tonAmount: baseAmount * 0.05,
        audioAmount: baseAmount * 0.1,
        multiplier: 1.0,
        bonusType: 'activity'
      };
    }
  }

  /**
   * Get user activity statistics
   */
  static async getUserActivityStats(profileId: string): Promise<ActivityStats> {
    try {
      // Get transaction data from existing tables
      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount_ton, created_at')
        .eq('from_profile_id', profileId)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      const dailyTransactions = transactions?.filter(t => 
        new Date(t.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
      ).length || 0;

      const weeklyVolume = transactions?.reduce((sum, t) => sum + Number(t.amount_ton || 0), 0) || 0;

      // Calculate loyalty tier based on activity
      let loyaltyTier: ActivityStats['loyaltyTier'] = 'bronze';
      if (weeklyVolume > 1000) loyaltyTier = 'platinum';
      else if (weeklyVolume > 500) loyaltyTier = 'gold';
      else if (weeklyVolume > 100) loyaltyTier = 'silver';

      // Calculate streak (simplified - based on consecutive days with activity)
      const streakDays = Math.min(dailyTransactions, 7);

      return {
        dailyTransactions,
        weeklyVolume,
        loyaltyTier,
        streakDays
      };

    } catch (error) {
      console.error('Error getting user activity stats:', error);
      return {
        dailyTransactions: 0,
        weeklyVolume: 0,
        loyaltyTier: 'bronze',
        streakDays: 0
      };
    }
  }

  /**
   * Process enhanced payment with rewards
   */
  static async processEnhancedPayment(
    fromProfileId: string,
    toProfileId: string,
    amount: number,
    tokenType: 'TON' | 'AUDIO',
    transactionType: string
  ): Promise<{ success: boolean; transactionId?: string; rewards?: CrossTokenReward }> {
    try {
      // Calculate fees
      const fees = await this.calculateDynamicFees(amount, tokenType, fromProfileId);
      
      // Create transaction record
      const { data: transaction, error } = await supabase
        .from('transactions')
        .insert({
          from_profile_id: fromProfileId,
          to_profile_id: toProfileId,
          amount_ton: tokenType === 'TON' ? amount : 0,
          audio_amount: tokenType === 'AUDIO' ? amount : 0,
          fee_ton: fees,
          transaction_type: transactionType,
          token_type: tokenType,
          transaction_hash: `enhanced_${Date.now()}`,
          status: 'completed'
        })
        .select()
        .single();

      if (error) throw error;

      // Calculate and award rewards
      const rewards = await this.calculateCrossTokenRewards(fromProfileId, transactionType, amount);
      
      // Award AUDIO rewards
      if (rewards.audioAmount > 0) {
        await supabase.from('audio_rewards_history').insert({
          profile_id: fromProfileId,
          reward_type: transactionType,
          amount: rewards.audioAmount,
          source: 'enhanced_payment'
        });
      }

      return {
        success: true,
        transactionId: transaction.id,
        rewards
      };

    } catch (error) {
      console.error('Error processing enhanced payment:', error);
      return {
        success: false
      };
    }
  }
}