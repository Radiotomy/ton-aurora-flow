import { supabase } from "@/integrations/supabase/client";

export type TokenType = 'TON' | 'AUDIO';

export interface PaymentContext {
  contentType: 'audius_track' | 'audioton_nft' | 'fan_club' | 'tip';
  artistId?: string;
  amount: number;
  currency?: string;
}

export interface UnifiedPaymentParams {
  profileId: string;
  context: PaymentContext;
  preferredToken?: TokenType;
  recipientId?: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  tokenUsed: TokenType;
  amount: number;
  error?: string;
}

export interface ConversionResult {
  success: boolean;
  fromAmount: number;
  toAmount: number;
  rate: number;
  fees: number;
  transactionId?: string;
  error?: string;
}

export interface TokenBalance {
  token: TokenType;
  balance: number;
  lastUpdated: Date;
}

export class UnifiedPaymentService {
  
  /**
   * Detects the optimal token for a given payment context
   */
  static async detectOptimalToken(context: PaymentContext, userBalances: TokenBalance[]): Promise<TokenType> {
    // Get user's payment preferences for this action type
    const { data: preferences } = await supabase
      .from('payment_preferences')
      .select('preferred_token, auto_select')
      .eq('action_type', context.contentType)
      .single();

    if (preferences?.auto_select && preferences.preferred_token) {
      // Check if user has sufficient balance for preferred token
      const preferredBalance = userBalances.find(b => b.token === preferences.preferred_token);
      if (preferredBalance && preferredBalance.balance >= context.amount) {
        return preferences.preferred_token as TokenType;
      }
    }

    // Content-based token selection
    switch (context.contentType) {
      case 'audius_track':
        // Prefer $AUDIO for Audius native content
        const audioBalance = userBalances.find(b => b.token === 'AUDIO');
        if (audioBalance && audioBalance.balance >= context.amount) {
          return 'AUDIO';
        }
        return 'TON'; // Fallback to TON
      
      case 'audioton_nft':
      case 'fan_club':
        // AudioTon exclusive features prefer TON
        return 'TON';
      
      case 'tip':
        // For tips, check which token user has more balance in
        const tonBalance = userBalances.find(b => b.token === 'TON')?.balance || 0;
        const audioBalanceAmount = userBalances.find(b => b.token === 'AUDIO')?.balance || 0;
        
        if (tonBalance >= context.amount && audioBalanceAmount >= context.amount) {
          return tonBalance > audioBalanceAmount ? 'TON' : 'AUDIO';
        }
        return tonBalance >= context.amount ? 'TON' : 'AUDIO';
      
      default:
        return 'TON';
    }
  }

  /**
   * Get current conversion rate between tokens
   */
  static async getConversionRate(fromToken: TokenType, toToken: TokenType): Promise<number> {
    if (fromToken === toToken) return 1;

    const { data: rate } = await supabase
      .from('token_conversion_rates')
      .select('rate')
      .eq('from_token', fromToken)
      .eq('to_token', toToken)
      .single();

    return rate?.rate || 0;
  }

  /**
   * Convert tokens between TON and $AUDIO
   */
  static async convertTokens(
    profileId: string,
    amount: number,
    fromToken: TokenType,
    toToken: TokenType
  ): Promise<ConversionResult> {
    if (fromToken === toToken) {
      return {
        success: false,
        fromAmount: amount,
        toAmount: 0,
        rate: 1,
        fees: 0,
        error: 'Cannot convert token to itself'
      };
    }

    try {
      const rate = await this.getConversionRate(fromToken, toToken);
      if (rate === 0) {
        throw new Error(`No conversion rate available for ${fromToken} to ${toToken}`);
      }

      const fees = amount * 0.005; // 0.5% conversion fee
      const toAmount = (amount - fees) * rate;

      // Record the conversion transaction
      const { data: transaction, error } = await supabase
        .from('cross_token_transactions')
        .insert({
          profile_id: profileId,
          from_token: fromToken,
          to_token: toToken,
          from_amount: amount,
          to_amount: toAmount,
          conversion_rate: rate,
          fees,
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Update token balances
      await this.updateTokenBalance(profileId, fromToken, -amount);
      await this.updateTokenBalance(profileId, toToken, toAmount);

      return {
        success: true,
        fromAmount: amount,
        toAmount,
        rate,
        fees,
        transactionId: transaction.id
      };

    } catch (error) {
      return {
        success: false,
        fromAmount: amount,
        toAmount: 0,
        rate: 0,
        fees: 0,
        error: error instanceof Error ? error.message : 'Conversion failed'
      };
    }
  }

  /**
   * Process a unified payment
   */
  static async processPayment(params: UnifiedPaymentParams): Promise<PaymentResult> {
    try {
      // Get user's token balances
      const balances = await this.getTokenBalances(params.profileId);
      
      // Determine optimal token if not specified
      const tokenToUse = params.preferredToken || 
        await this.detectOptimalToken(params.context, balances);

      // Check if user has sufficient balance
      const tokenBalance = balances.find(b => b.token === tokenToUse);
      if (!tokenBalance || tokenBalance.balance < params.context.amount) {
        return {
          success: false,
          tokenUsed: tokenToUse,
          amount: params.context.amount,
          error: `Insufficient ${tokenToUse} balance`
        };
      }

      // Process the payment based on token type
      let transactionResult;
      
      if (tokenToUse === 'TON') {
        transactionResult = await this.processTonPayment(params);
      } else {
        transactionResult = await this.processAudioPayment(params);
      }

      if (transactionResult.success) {
        // Update token balance
        await this.updateTokenBalance(params.profileId, tokenToUse, -params.context.amount);
        
        // Save payment preference for future use
        await this.updatePaymentPreference(
          params.profileId,
          params.context.contentType,
          tokenToUse
        );
      }

      return {
        success: transactionResult.success,
        transactionId: transactionResult.transactionId,
        tokenUsed: tokenToUse,
        amount: params.context.amount,
        error: transactionResult.error
      };

    } catch (error) {
      return {
        success: false,
        tokenUsed: params.preferredToken || 'TON',
        amount: params.context.amount,
        error: error instanceof Error ? error.message : 'Payment failed'
      };
    }
  }

  /**
   * Get user's token balances
   */
  static async getTokenBalances(profileId: string): Promise<TokenBalance[]> {
    const { data: balances, error } = await supabase
      .from('token_balances')
      .select('token_type, balance, last_updated')
      .eq('profile_id', profileId);

    if (error) {
      console.error('Error fetching token balances:', error);
      return [];
    }

    return balances?.map(b => ({
      token: b.token_type as TokenType,
      balance: parseFloat(b.balance.toString()),
      lastUpdated: new Date(b.last_updated)
    })) || [];
  }

  /**
   * Update token balance
   */
  private static async updateTokenBalance(
    profileId: string,
    tokenType: TokenType,
    amountChange: number
  ): Promise<void> {
    // Get current balance
    const { data: currentBalance } = await supabase
      .from('token_balances')
      .select('balance')
      .eq('profile_id', profileId)
      .eq('token_type', tokenType)
      .single();

    const newBalance = (parseFloat(currentBalance?.balance?.toString() || '0')) + amountChange;

    // Upsert the new balance
    await supabase
      .from('token_balances')
      .upsert({
        profile_id: profileId,
        token_type: tokenType,
        balance: newBalance,
        last_updated: new Date().toISOString()
      });
  }

  /**
   * Update user's payment preference
   */
  private static async updatePaymentPreference(
    profileId: string,
    actionType: string,
    preferredToken: TokenType
  ): Promise<void> {
    await supabase
      .from('payment_preferences')
      .upsert({
        profile_id: profileId,
        action_type: actionType,
        preferred_token: preferredToken,
        updated_at: new Date().toISOString()
      });
  }

  /**
   * Process TON payment
   */
  private static async processTonPayment(params: UnifiedPaymentParams) {
    // This would integrate with existing TON payment logic
    // For now, return a mock success
    return {
      success: true,
      transactionId: `ton_${Date.now()}`,
      error: undefined
    };
  }

  /**
   * Process $AUDIO payment
   */
  private static async processAudioPayment(params: UnifiedPaymentParams) {
    // This would integrate with Audius payment APIs
    // For now, return a mock success
    return {
      success: true,
      transactionId: `audio_${Date.now()}`,
      error: undefined
    };
  }
}