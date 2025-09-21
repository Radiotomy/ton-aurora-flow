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
    // Mainnet-ready: Smart contract integration for secure payments
  }

  async sendTip(
    senderWallet: any, // TON Connect wallet
    request: TipRequest
  ): Promise<PaymentResult> {
    try {
      const amount = toNano(request.amount);
      
      // Import smart contract utilities
      const { SmartContractHelper } = await import('@/utils/smartContracts');
      
      // Calculate platform fee (1% of tip amount)
      const tipAmount = parseFloat(request.amount);
      const platformFee = tipAmount * 0.01;
      const netAmount = tipAmount - platformFee;
      
      // Create smart contract payload for tips
      const payload = SmartContractHelper.createTipPayload({
        artistId: request.recipientAddress,
        amount: netAmount,
        message: request.message || 'AudioTon tip',
        sender: senderWallet.account.address
      });

      // Route through payment processor contract for fee handling
      const paymentProcessor = SmartContractHelper.getContractAddress('PAYMENT_PROCESSOR');
      
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 300, // 5 minutes
        messages: [
          {
            address: paymentProcessor, // Route through smart contract
            amount: amount.toString(),
            payload: payload
          },
        ],
      };

      // Send transaction via TON Connect
      const result = await senderWallet.sendTransaction(transaction);
      
      // Record transaction in database
      await this.recordTransaction({
        transactionHash: result.boc,
        transactionType: 'tip',
        amountTon: request.amount,
        recipientAddress: request.recipientAddress,
        metadata: {
          message: request.message,
          platformFee: platformFee,
          netAmount: netAmount,
          contractAddress: paymentProcessor
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
      
      // Import smart contract utilities
      const { SmartContractHelper } = await import('@/utils/smartContracts');
      
      // Calculate platform fee based on payment type
      const paymentAmount = parseFloat(request.amount);
      const platformFee = request.paymentType === 'nft_purchase' ? paymentAmount * 0.025 : paymentAmount * 0.02; // 2.5% for NFTs, 2% for memberships
      const netAmount = paymentAmount - platformFee;

      let contractAddress: string;
      let payload: string;

      if (request.paymentType === 'nft_purchase') {
        // Route through NFT Collection contract
        contractAddress = SmartContractHelper.getContractAddress('NFT_COLLECTION');
        payload = SmartContractHelper.createNFTMintPayload({
          trackId: request.itemId || '',
          tier: 'Standard Edition',
          quantity: 1,
          recipient: senderWallet.account.address,
          metadata: SmartContractHelper.createNFTMetadata(
            request.itemId || '',
            'Standard Edition',
            'Track NFT',
            'AudioTon Artist'
          )
        });
      } else if (request.paymentType === 'fan_club_membership') {
        // Route through Fan Club contract
        contractAddress = SmartContractHelper.getContractAddress('FAN_CLUB');
        payload = SmartContractHelper.createFanClubJoinPayload({
          artistId: request.recipientAddress,
          tier: 'Standard',
          duration: 1, // 1 month
          recipient: senderWallet.account.address
        });
      } else {
        // Default to payment processor
        contractAddress = SmartContractHelper.getContractAddress('PAYMENT_PROCESSOR');
        payload = btoa(JSON.stringify({
          type: request.paymentType,
          itemId: request.itemId || '',
          timestamp: Date.now()
        }));
      }

      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 300,
        messages: [
          {
            address: contractAddress, // Route through appropriate smart contract
            amount: amount.toString(),
            payload: payload
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
          platformFee: platformFee,
          netAmount: netAmount,
          contractAddress: contractAddress
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

  async estimateGasFee(
    fromAddress?: string,
    toAddress?: string,
    amount?: string,
    operationType: string = 'transfer'
  ): Promise<string> {
    // Use Chainstack for real-time fee estimation
    if (fromAddress && toAddress && amount) {
      try {
        const response = await fetch('https://cpjjaglmqvcwpzrdoyul.supabase.co/functions/v1/ton-fee-estimation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwamphZ2xtcXZjd3B6cmRveXVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NjQ5OTQsImV4cCI6MjA3MTE0MDk5NH0.FlRvJf4wVnQ96gaJJdli0AIcPQ0DmBU0yGiU0sudZeU`
          },
          body: JSON.stringify({
            fromAddress,
            toAddress,
            amount: toNano(amount).toString(),
            operationType
          })
        });

        const data = await response.json();
        
        if (response.ok && !data.fallback) {
          return data.formattedRecommended;
        }
      } catch (error) {
        console.warn('Chainstack fee estimation failed, using fallback:', error);
      }
    }
    
    // Fallback fees based on operation type
    const fallbackFees = {
      'transfer': '0.05',
      'nft_mint': '0.2',
      'nft_transfer': '0.1',
      'fan_club': '0.15',
      'tip': '0.03'
    };
    
    return fallbackFees[operationType] || '0.05';
  }
}

export const tonPaymentService = new TonPaymentService();