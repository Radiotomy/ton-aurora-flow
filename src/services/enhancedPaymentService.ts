import { supabase } from "@/integrations/supabase/client";
import { UnifiedPaymentService, TokenType, PaymentContext, TokenBalance } from './unifiedPaymentService';

export interface PaymentRecommendation {
  recommendedToken: TokenType;
  reason: string;
  savings?: number;
  alternativeOptions: {
    token: TokenType;
    cost: number;
    fees: number;
    reason: string;
  }[];
}

export interface CrossTokenReward {
  tonAmount: number;
  audioAmount: number;
  multiplier: number;
  bonusType: 'activity' | 'loyalty' | 'volume' | 'staking';
}

export interface DynamicPricing {
  baseAmount: number;
  dynamicFee: number;
  loyaltyDiscount: number;
  volumeBonus: number;
  finalAmount: number;
}

export class EnhancedPaymentService extends UnifiedPaymentService {
  
  /**
   * Get intelligent payment recommendation with savings analysis
   */
  static async getPaymentRecommendation(
    profileId: string,
    context: PaymentContext,
    userBalances: TokenBalance[]
  ): Promise<PaymentRecommendation> {
    try {
      // Get current conversion rates
      const tonToAudioRate = await this.getConversionRate('TON', 'AUDIO');
      const audioToTonRate = await this.getConversionRate('AUDIO', 'TON');
      
      // Get user's payment history for better recommendations
      const { data: paymentHistory } = await supabase
        .from('transactions')
        .select('token_type, transaction_type, amount_ton, audio_amount, created_at')
        .eq('from_profile_id', profileId)
        .order('created_at', { ascending: false })
        .limit(50);

      // Calculate dynamic fees for each token
      const tonFees = await this.calculateDynamicFees(profileId, 'TON', context);
      const audioFees = await this.calculateDynamicFees(profileId, 'AUDIO', context);
      
      const tonBalance = userBalances.find(b => b.token === 'TON')?.balance || 0;
      const audioBalance = userBalances.find(b => b.token === 'AUDIO')?.balance || 0;
      
      // Smart recommendation logic
      let recommendedToken: TokenType = 'TON';
      let reason = 'Default recommendation';
      let savings = 0;
      
      // Factor 1: Content type preference
      if (context.contentType === 'audius_track' && audioBalance >= context.amount) {
        recommendedToken = 'AUDIO';
        reason = 'Audius native content - earn bonus rewards with $AUDIO';
      } else if (context.contentType === 'audioton_nft' && tonBalance >= context.amount) {
        recommendedToken = 'TON';
        reason = 'AudioTon NFTs get better rates with TON';
      }
      
      // Factor 2: Fee optimization
      const tonTotalCost = context.amount + tonFees.dynamicFee;
      const audioTotalCost = context.amount + audioFees.dynamicFee;
      
      if (audioTotalCost < tonTotalCost && audioBalance >= audioTotalCost) {
        recommendedToken = 'AUDIO';
        savings = tonTotalCost - audioTotalCost;
        reason = `Save ${savings.toFixed(4)} tokens in fees`;
      } else if (tonTotalCost < audioTotalCost && tonBalance >= tonTotalCost) {
        recommendedToken = 'TON';
        savings = audioTotalCost - tonTotalCost;
        reason = `Save ${savings.toFixed(4)} tokens in fees`;
      }
      
      // Factor 3: Loyalty discounts
      if (tonFees.loyaltyDiscount > audioFees.loyaltyDiscount) {
        recommendedToken = 'TON';
        reason = `${(tonFees.loyaltyDiscount * 100).toFixed(1)}% loyalty discount with TON`;
      } else if (audioFees.loyaltyDiscount > tonFees.loyaltyDiscount) {
        recommendedToken = 'AUDIO';
        reason = `${(audioFees.loyaltyDiscount * 100).toFixed(1)}% loyalty discount with $AUDIO`;
      }
      
      // Factor 4: Balance optimization
      if (tonBalance < context.amount && audioBalance >= context.amount) {
        recommendedToken = 'AUDIO';
        reason = 'Insufficient TON balance';
      } else if (audioBalance < context.amount && tonBalance >= context.amount) {
        recommendedToken = 'TON';
        reason = 'Insufficient $AUDIO balance';
      }
      
      // Generate alternative options
      const alternativeOptions = [
        {
          token: 'TON' as TokenType,
          cost: tonTotalCost,
          fees: tonFees.dynamicFee,
          reason: tonBalance >= tonTotalCost ? 
            `${tonFees.loyaltyDiscount > 0 ? 'Loyalty discount available' : 'Standard rate'}` :
            'Insufficient balance'
        },
        {
          token: 'AUDIO' as TokenType,
          cost: audioTotalCost,
          fees: audioFees.dynamicFee,
          reason: audioBalance >= audioTotalCost ? 
            `${audioFees.loyaltyDiscount > 0 ? 'Loyalty discount available' : 'Standard rate'}` :
            'Insufficient balance'
        }
      ].filter(option => option.token !== recommendedToken);
      
      return {
        recommendedToken,
        reason,
        savings,
        alternativeOptions
      };
      
    } catch (error) {
      console.error('Error getting payment recommendation:', error);
      return {
        recommendedToken: 'TON',
        reason: 'Default fallback',
        alternativeOptions: []
      };
    }
  }
  
  /**
   * Calculate dynamic fees based on user activity and loyalty
   */
  static async calculateDynamicFees(
    profileId: string,
    tokenType: TokenType,
    context: PaymentContext
  ): Promise<DynamicPricing> {
    try {
      const baseAmount = context.amount;
      let baseFeeRate = 0.02; // 2% base fee
      
      // Get user's activity metrics
      const { data: userStats } = await supabase
        .from('user_activity_stats')
        .select('total_transactions, total_volume, loyalty_tier, last_active')
        .eq('profile_id', profileId)
        .single();
      
      // Loyalty tier discounts
      let loyaltyDiscount = 0;
      if (userStats?.loyalty_tier) {
        switch (userStats.loyalty_tier) {
          case 'bronze': loyaltyDiscount = 0.05; break; // 5% off
          case 'silver': loyaltyDiscount = 0.10; break; // 10% off
          case 'gold': loyaltyDiscount = 0.15; break; // 15% off
          case 'platinum': loyaltyDiscount = 0.20; break; // 20% off
        }
      }
      
      // Volume-based discounts
      let volumeBonus = 0;
      const totalVolume = userStats?.total_volume || 0;
      if (totalVolume > 1000) volumeBonus = 0.05; // 5% off for high volume
      if (totalVolume > 5000) volumeBonus = 0.10; // 10% off for very high volume
      
      // Content-specific adjustments
      if (context.contentType === 'tip') {
        baseFeeRate = 0.01; // Lower fees for tips
      } else if (context.contentType === 'audius_track' && tokenType === 'AUDIO') {
        baseFeeRate = 0.015; // Discount for native content
      }
      
      // Calculate final fee
      const adjustedFeeRate = baseFeeRate * (1 - loyaltyDiscount - volumeBonus);
      const dynamicFee = baseAmount * Math.max(adjustedFeeRate, 0.005); // Minimum 0.5% fee
      
      return {
        baseAmount,
        dynamicFee,
        loyaltyDiscount,
        volumeBonus,
        finalAmount: baseAmount + dynamicFee
      };
      
    } catch (error) {
      console.error('Error calculating dynamic fees:', error);
      return {
        baseAmount: context.amount,
        dynamicFee: context.amount * 0.02,
        loyaltyDiscount: 0,
        volumeBonus: 0,
        finalAmount: context.amount * 1.02
      };
    }
  }
  
  /**
   * Calculate cross-token rewards for activities
   */
  static async calculateCrossTokenRewards(
    profileId: string,
    activity: 'listen' | 'tip' | 'purchase' | 'social',
    amount: number
  ): Promise<CrossTokenReward> {
    try {
      // Get user's staking status
      const { data: stakingInfo } = await supabase
        .from('audio_token_balances')
        .select('staked_amount')
        .eq('profile_id', profileId)
        .single();
      
      const stakedAmount = stakingInfo?.staked_amount || 0;
      let multiplier = 1.0;
      
      // Staking multipliers
      if (stakedAmount > 100) multiplier = 1.2; // 20% bonus
      if (stakedAmount > 500) multiplier = 1.5; // 50% bonus
      if (stakedAmount > 1000) multiplier = 2.0; // 100% bonus
      
      // Base reward rates
      let tonRewardRate = 0;
      let audioRewardRate = 0;
      let bonusType: CrossTokenReward['bonusType'] = 'activity';
      
      switch (activity) {
        case 'listen':
          audioRewardRate = 0.001; // 0.1% of track value in $AUDIO
          tonRewardRate = 0.0005; // 0.05% in TON
          bonusType = 'activity';
          break;
        case 'tip':
          audioRewardRate = 0.02; // 2% cashback in $AUDIO
          tonRewardRate = 0.01; // 1% cashback in TON
          bonusType = 'loyalty';
          break;
        case 'purchase':
          audioRewardRate = 0.03; // 3% cashback in $AUDIO
          tonRewardRate = 0.015; // 1.5% cashback in TON
          bonusType = 'volume';
          break;
        case 'social':
          audioRewardRate = 0.005; // Social engagement bonus
          tonRewardRate = 0.0025;
          bonusType = 'activity';
          break;
      }
      
      // Apply staking multiplier
      if (stakedAmount > 0) {
        bonusType = 'staking';
      }
      
      return {
        tonAmount: amount * tonRewardRate * multiplier,
        audioAmount: amount * audioRewardRate * multiplier,
        multiplier,
        bonusType
      };
      
    } catch (error) {
      console.error('Error calculating cross-token rewards:', error);
      return {
        tonAmount: 0,
        audioAmount: 0,
        multiplier: 1,
        bonusType: 'activity'
      };
    }
  }
  
  /**
   * Process payment with enhanced features
   */
  static async processEnhancedPayment(
    profileId: string,
    context: PaymentContext,
    userBalances: TokenBalance[],
    useRecommendation = true
  ) {
    try {
      // Get smart recommendation
      const recommendation = await this.getPaymentRecommendation(profileId, context, userBalances);
      const tokenToUse = useRecommendation ? recommendation.recommendedToken : context.currency as TokenType || 'TON';
      
      // Calculate dynamic pricing
      const pricing = await this.calculateDynamicFees(profileId, tokenToUse, context);
      
      // Process the payment
      const paymentResult = await this.processPayment({
        profileId,
        context: {
          ...context,
          amount: pricing.finalAmount
        },
        preferredToken: tokenToUse
      });
      
      if (paymentResult.success) {
        // Calculate and distribute cross-token rewards
        const rewards = await this.calculateCrossTokenRewards(
          profileId,
          context.contentType === 'tip' ? 'tip' : 'purchase',
          context.amount
        );
        
        // Award rewards
        if (rewards.tonAmount > 0) {
          await this.updateTokenBalance(profileId, 'TON', rewards.tonAmount);
        }
        if (rewards.audioAmount > 0) {
          await this.updateTokenBalance(profileId, 'AUDIO', rewards.audioAmount);
        }
        
        // Record enhanced transaction
        await supabase.from('enhanced_transactions').insert({
          profile_id: profileId,
          original_amount: context.amount,
          final_amount: pricing.finalAmount,
          fees_saved: pricing.loyaltyDiscount + pricing.volumeBonus,
          ton_rewards: rewards.tonAmount,
          audio_rewards: rewards.audioAmount,
          multiplier: rewards.multiplier,
          token_used: tokenToUse,
          transaction_type: context.contentType,
          recommendation_followed: useRecommendation
        });
      }
      
      return {
        ...paymentResult,
        recommendation,
        pricing,
        rewards: paymentResult.success ? rewards : null
      };
      
    } catch (error) {
      console.error('Error processing enhanced payment:', error);
      throw error;
    }
  }
}