// TON address validation helper
const isValidAddress = (address: string): boolean => {
  // Basic TON address validation (simplified)
  return address.length >= 48 && (address.startsWith('EQ') || address.startsWith('UQ'));
};

// Smart contract addresses (these would be deployed contracts in production)
export const CONTRACTS = {
  NFT_COLLECTION: 'EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t',
  FAN_CLUB: 'EQBvW8Z5huBkMJYdnfAEM5JqTNkuWX3diqYENkWsIL0XggGG',
  PAYMENT_PROCESSOR: 'EQDk2VTvn04SUKJrW7rXahzdF8_Qi6utb0wj1OaBRbH-Ovch',
  REWARD_DISTRIBUTOR: 'EQC5vfkGas_SBp85WVqm_xo4lKelOhv3rPAO6ILdgD2lNvY_'
};

// NFT Mint Parameters
export interface NFTMintParams {
  trackId: string;
  tier: string;
  quantity: number;
  recipient: string;
  metadata: {
    name: string;
    description: string;
    image: string;
    attributes: Array<{
      trait_type: string;
      value: string | number;
    }>;
  };
}

// Fan Club Join Parameters
export interface FanClubJoinParams {
  artistId: string;
  tier: string;
  duration: number; // in months
  recipient: string;
}

// Tip Parameters
export interface TipParams {
  artistId: string;
  trackId?: string;
  amount: number;
  message?: string;
  sender: string;
}

// Smart Contract Helper Functions
export class SmartContractHelper {
  
  /**
   * Create NFT mint transaction payload
   */
  static createNFTMintPayload(params: NFTMintParams): string {
    const payload = {
      method: 'mint_nft',
      params: {
        track_id: params.trackId,
        tier: params.tier,
        quantity: params.quantity,
        recipient: params.recipient,
        metadata: params.metadata
      }
    };
    return btoa(JSON.stringify(payload));
  }

  /**
   * Create fan club join transaction payload
   */
  static createFanClubJoinPayload(params: FanClubJoinParams): string {
    const payload = {
      method: 'join_fan_club',
      params: {
        artist_id: params.artistId,
        tier: params.tier,
        duration: params.duration,
        recipient: params.recipient
      }
    };
    return btoa(JSON.stringify(payload));
  }

  /**
   * Create tip transaction payload
   */
  static createTipPayload(params: TipParams): string {
    const payload = {
      method: 'send_tip',
      params: {
        artist_id: params.artistId,
        track_id: params.trackId,
        amount: params.amount,
        message: params.message,
        sender: params.sender
      }
    };
    return btoa(JSON.stringify(payload));
  }

  /**
   * Calculate transaction fees
   */
  static calculateTransactionFee(amount: number): number {
    // Base fee of 0.01 TON + 1% of transaction amount
    return 0.01 + (amount * 0.01);
  }

  /**
   * Validate TON address
   */
  static isValidTONAddress(address: string): boolean {
    return isValidAddress(address);
  }

  /**
   * Convert TON to nanoTON
   */
  static tonToNano(ton: number): string {
    return (ton * 1e9).toString();
  }

  /**
   * Convert nanoTON to TON
   */
  static nanoToTon(nano: string): number {
    return parseInt(nano) / 1e9;
  }

  /**
   * Generate NFT metadata
   */
  static generateNFTMetadata(trackId: string, tier: string, trackTitle: string, artistName: string) {
    const tierAttributes = {
      'Standard Edition': { rarity: 'Common', utility: 'Basic' },
      'Deluxe Edition': { rarity: 'Rare', utility: 'Enhanced' },
      'Genesis Edition': { rarity: 'Legendary', utility: 'Premium' }
    };

    const tierData = tierAttributes[tier as keyof typeof tierAttributes] || tierAttributes['Standard Edition'];

    return {
      name: `${trackTitle} - ${tier}`,
      description: `Exclusive ${tier} NFT for "${trackTitle}" by ${artistName}. Own a piece of music history on the TON blockchain.`,
      image: `https://cpjjaglmqvcwpzrdoyul.supabase.co/storage/v1/object/public/nft-artwork/${trackId}-${tier.toLowerCase().replace(' ', '-')}.jpg`,
      attributes: [
        { trait_type: 'Artist', value: artistName },
        { trait_type: 'Track', value: trackTitle },
        { trait_type: 'Edition', value: tier },
        { trait_type: 'Rarity', value: tierData.rarity },
        { trait_type: 'Utility', value: tierData.utility },
        { trait_type: 'Blockchain', value: 'TON' },
        { trait_type: 'Platform', value: 'AudioTon' }
      ]
    };
  }

  /**
   * Get contract address by type
   */
  static getContractAddress(contractType: keyof typeof CONTRACTS): string {
    return CONTRACTS[contractType];
  }

  /**
   * Create transaction message
   */
  static createTransactionMessage(
    to: string, 
    amount: number, 
    payload?: string
  ) {
    return {
      address: to,
      amount: this.tonToNano(amount),
      payload: payload || ''
    };
  }

  /**
   * Create complete transaction object
   */
  static createTransaction(
    messages: Array<{ address: string; amount: number; payload?: string }>,
    validFor: number = 60 // seconds
  ) {
    return {
      validUntil: Math.floor(Date.now() / 1000) + validFor,
      messages: messages.map(msg => this.createTransactionMessage(msg.address, msg.amount, msg.payload))
    };
  }
}

// Export utility functions for convenience
export const {
  createNFTMintPayload,
  createFanClubJoinPayload,
  createTipPayload,
  calculateTransactionFee,
  isValidTONAddress,
  tonToNano,
  nanoToTon,
  generateNFTMetadata,
  getContractAddress,
  createTransactionMessage,
  createTransaction
} = SmartContractHelper;