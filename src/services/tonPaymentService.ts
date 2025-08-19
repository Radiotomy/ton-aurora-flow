import { Address, toNano, fromNano } from '@ton/core';
import { supabase } from '@/integrations/supabase/client';

export interface PaymentResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
}

export interface TipRequest {
  recipientAddress: string;
  amount: string; // in TON
  message?: string;
}

export interface PaymentRequest {
  recipientAddress: string;
  amount: string; // in TON
  paymentType: 'nft_purchase' | 'fan_club_membership';
  itemId?: string;
}

export class TonPaymentService {
  
  constructor() {
    // Phase 1: Direct TON transfers, contract integration in Phase 2
  }

  async sendTip(
    senderWallet: any, // TON Connect wallet
    request: TipRequest
  ): Promise<PaymentResult> {
    try {
      const amount = toNano(request.amount);

      // Create transaction for simple TON transfer (Phase 1 implementation)
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 300, // 5 minutes
        messages: [
          {
            address: request.recipientAddress, // Send directly to recipient for Phase 1
            amount: amount.toString(),
            // Simple comment payload for tips
            payload: btoa(unescape(encodeURIComponent(
              JSON.stringify({
                type: 'tip',
                message: request.message || 'AudioTon tip',
                timestamp: Date.now()
              })
            )))
          },
        ],
      };

      // Send transaction via TON Connect
      const result = await senderWallet.sendTransaction(transaction);
      
      // Record transaction in database
      await this.recordTransaction({
        transactionHash: result.boc, // This will be the actual hash after processing
        transactionType: 'tip',
        amountTon: request.amount,
        recipientAddress: request.recipientAddress,
        metadata: {
          message: request.message,
        },
      });

      return {
        success: true,
        transactionHash: result.boc,
      };
    } catch (error) {
      console.error('Tip transaction failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Transaction failed',
      };
    }
  }

  async sendPayment(
    senderWallet: any,
    request: PaymentRequest
  ): Promise<PaymentResult> {
    try {
      const amount = toNano(request.amount);

      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 300,
        messages: [
          {
            address: request.recipientAddress, // Direct payment for Phase 1
            amount: amount.toString(),
            payload: btoa(unescape(encodeURIComponent(
              JSON.stringify({
                type: request.paymentType,
                itemId: request.itemId || '',
                timestamp: Date.now()
              })
            )))
          },
        ],
      };

      const result = await senderWallet.sendTransaction(transaction);
      
      // Record transaction in database
      await this.recordTransaction({
        transactionHash: result.boc,
        transactionType: request.paymentType,
        amountTon: request.amount,
        recipientAddress: request.recipientAddress,
        metadata: {
          itemId: request.itemId,
          paymentType: request.paymentType,
        },
      });

      return {
        success: true,
        transactionHash: result.boc,
      };
    } catch (error) {
      console.error('Payment transaction failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Transaction failed',
      };
    }
  }

  private async recordTransaction(params: {
    transactionHash: string;
    transactionType: string;
    amountTon: string;
    recipientAddress: string;
    metadata?: any;
  }): Promise<void> {
    try {
      // Get current user profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (!profile) {
        throw new Error('User profile not found');
      }

      // Get recipient profile by wallet address
      const { data: recipientProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('wallet_address', params.recipientAddress)
        .single();

      // Record transaction
      const { error } = await supabase
        .from('transactions')
        .insert({
          from_profile_id: profile.id,
          to_profile_id: recipientProfile?.id || null,
          transaction_hash: params.transactionHash,
          transaction_type: params.transactionType,
          amount_ton: parseFloat(params.amountTon),
          fee_ton: 0.01, // Estimated gas fee
          status: 'pending',
          metadata: params.metadata,
        });

      if (error) {
        console.error('Failed to record transaction:', error);
      }
    } catch (error) {
      console.error('Error recording transaction:', error);
    }
  }

  async getTransactionHistory(limit: number = 50): Promise<any[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (!profile) return [];

      const { data: transactions, error } = await supabase
        .from('transactions')
        .select(`
          *,
          from_profile:from_profile_id(display_name, avatar_url),
          to_profile:to_profile_id(display_name, avatar_url)
        `)
        .or(`from_profile_id.eq.${profile.id},to_profile_id.eq.${profile.id}`)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching transactions:', error);
        return [];
      }

      return transactions || [];
    } catch (error) {
      console.error('Error getting transaction history:', error);
      return [];
    }
  }

  formatTonAmount(amount: string): string {
    try {
      return fromNano(amount);
    } catch {
      return amount;
    }
  }

  async estimateGasFee(): Promise<string> {
    // Return estimated gas fee in TON
    return '0.01';
  }
}

export const tonPaymentService = new TonPaymentService();