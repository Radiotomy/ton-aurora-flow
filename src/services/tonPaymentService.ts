import { Address, toNano, fromNano, Cell } from '@ton/core';
import { TonClient } from '@ton/ton';
import { PaymentContract } from '@/contracts/PaymentContract';
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
  private client: TonClient;
  private contract: PaymentContract | null = null;
  
  // Testnet contract address - will be deployed during Phase 1
  private readonly TESTNET_CONTRACT_ADDRESS = 'EQD0vdSA_NedR9uvbgN9EikRX-suesDxGeFg69XQMavfLqIw';
  
  constructor() {
    // Initialize TON client for testnet
    this.client = new TonClient({
      endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
      apiKey: '8c9c0d8c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a'
    });
  }

  async initializeContract(): Promise<void> {
    if (!this.contract) {
      const address = Address.parse(this.TESTNET_CONTRACT_ADDRESS);
      this.contract = PaymentContract.createFromAddress(address);
    }
  }

  async sendTip(
    senderWallet: any, // TON Connect wallet
    request: TipRequest
  ): Promise<PaymentResult> {
    try {
      await this.initializeContract();
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const recipientAddress = Address.parse(request.recipientAddress);
      const amount = toNano(request.amount);

      // Create transaction
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 300, // 5 minutes
        messages: [
          {
            address: this.contract.address.toString(),
            amount: amount.toString(),
            payload: this.createTipPayload(recipientAddress, request.message).toBoc().toString('base64'),
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
      await this.initializeContract();
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const recipientAddress = Address.parse(request.recipientAddress);
      const amount = toNano(request.amount);

      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 300,
        messages: [
          {
            address: this.contract.address.toString(),
            amount: amount.toString(),
            payload: this.createPaymentPayload(
              recipientAddress,
              request.paymentType,
              request.itemId
            ).toBoc().toString('base64'),
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

  private createTipPayload(recipient: Address, message?: string): Cell {
    const cell = new Cell();
    // This would contain the actual cell construction logic
    // For now, returning empty cell as placeholder
    return cell;
  }

  private createPaymentPayload(
    recipient: Address,
    paymentType: string,
    itemId?: string
  ): Cell {
    const cell = new Cell();
    // This would contain the actual cell construction logic
    return cell;
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