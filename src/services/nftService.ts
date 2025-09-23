import { Address, beginCell, Cell, toNano } from '@ton/core';
import { NFTCollectionContract } from '@/contracts/NFTCollectionContract';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface NFTMintRequest {
  trackId: string;
  artistId: string;
  tier: 'basic' | 'premium' | 'exclusive';
  metadata: {
    name: string;
    description: string;
    image: string;
    attributes: Array<{
      trait_type: string;
      value: string;
    }>;
  };
  price?: string; // in TON
}

export interface NFTMintResult {
  success: boolean;
  transactionHash?: string;
  nftAddress?: string;
  error?: string;
}

export class NFTService {
  private static readonly COLLECTION_ADDRESS = "UQA0R3MPBOMHSG4k-5InampRDttwV4kuzWhWdT6boZ6gP296"; // REAL DEPLOYED MAINNET ADDRESS

  static async mintTrackNFT(
    sendTransaction: (transaction: any, options?: any) => Promise<any>,
    walletAddress: string,
    request: NFTMintRequest
  ): Promise<NFTMintResult> {
    try {
      if (!walletAddress) {
        throw new Error('Wallet address not available');
      }

      // Create NFT metadata cell
      const metadata = this.createNFTMetadata(request.metadata);
      const collectionAddress = Address.parse(this.COLLECTION_ADDRESS);
      const collection = NFTCollectionContract.createFromAddress(collectionAddress);

      // Get next item index from collection
      const nextIndex = await this.getNextItemIndex();
      
      // Calculate mint price based on tier
      const mintPrice = this.calculateMintPrice(request.tier, request.price);
      
      // Create mint transaction
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 300, // 5 minutes
        messages: [
          {
            address: this.COLLECTION_ADDRESS,
            amount: mintPrice,
            payload: beginCell()
              .storeUint(1, 32) // mint opcode
              .storeUint(0, 64) // query_id
              .storeUint(nextIndex, 64) // item_index
              .storeCoins(toNano('0.02')) // item_value (for NFT initialization)
              .storeRef(
                beginCell()
                  .storeAddress(Address.parse(walletAddress))
                  .storeRef(metadata)
                  .endCell()
              )
              .endCell()
              .toBoc()
              .toString('base64'),
          },
        ],
      };

      // Send transaction
      const result = await sendTransaction(transaction, {
        showToast: false, // We handle toasts manually
        toastTitle: "Minting NFT...",
        toastDescription: "Please confirm in your wallet"
      });
      
      // Record the NFT mint in database
      await this.recordNFTMint({
        transactionHash: result.boc,
        trackId: request.trackId,
        artistId: request.artistId,
        tier: request.tier,
        itemIndex: nextIndex,
        metadata: request.metadata,
        walletAddress,
      });

      toast.success('NFT minted successfully!');
      
      return {
        success: true,
        transactionHash: result.boc,
        nftAddress: await this.calculateNFTAddress(nextIndex),
      };

    } catch (error: any) {
      console.error('NFT minting failed:', error);
      toast.error(error.message || 'Failed to mint NFT');
      
      return {
        success: false,
        error: error.message || 'Failed to mint NFT',
      };
    }
  }

  private static createNFTMetadata(metadata: NFTMintRequest['metadata']): Cell {
    // Create NFT metadata following TEP-64 standard
    const metadataDict = beginCell();
    
    // Store name
    metadataDict.storeRef(beginCell().storeStringTail(metadata.name).endCell());
    
    // Store description  
    metadataDict.storeRef(beginCell().storeStringTail(metadata.description).endCell());
    
    // Store image URL
    metadataDict.storeRef(beginCell().storeStringTail(metadata.image).endCell());
    
    // Store attributes as JSON string
    const attributesJson = JSON.stringify(metadata.attributes);
    metadataDict.storeRef(beginCell().storeStringTail(attributesJson).endCell());
    
    return metadataDict.endCell();
  }

  private static calculateMintPrice(tier: string, customPrice?: string): string {
    if (customPrice) {
      return toNano(customPrice).toString();
    }
    
    const basePrices = {
      basic: '0.1',
      premium: '0.5', 
      exclusive: '2.0',
    };
    
    const price = basePrices[tier as keyof typeof basePrices] || '0.1';
    return toNano(price).toString();
  }

  private static async getNextItemIndex(): Promise<number> {
    // For now, use a simple counter. In production, this should query the collection contract
    const { data: lastMint } = await supabase
      .from('user_assets')
      .select('token_id')
      .eq('asset_type', 'nft')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (lastMint && lastMint.length > 0) {
      return parseInt(lastMint[0].token_id) + 1;
    }
    
    return 0;
  }

  private static async calculateNFTAddress(itemIndex: number): Promise<string> {
    // This should calculate the actual NFT address based on collection address and index
    // For now, return a placeholder
    return `${this.COLLECTION_ADDRESS}_${itemIndex}`;
  }

  private static async recordNFTMint(params: {
    transactionHash: string;
    trackId: string;
    artistId: string;
    tier: string;
    itemIndex: number;
    metadata: any;
    walletAddress: string;
  }) {
    try {
      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('wallet_address', params.walletAddress)
        .single();

      if (!profile) {
        console.warn('Profile not found for wallet:', params.walletAddress);
        return;
      }

      // Record NFT as user asset
      await supabase.from('user_assets').insert({
        profile_id: profile.id,
        asset_type: 'nft',
        contract_address: this.COLLECTION_ADDRESS,
        token_id: params.itemIndex.toString(),
        metadata: {
          ...params.metadata,
          trackId: params.trackId,
          artistId: params.artistId,
          tier: params.tier,
          transactionHash: params.transactionHash,
        },
      });

      // Record track collection
      const mintPrice = this.calculateMintPrice(params.tier);
      const priceInTon = parseFloat(mintPrice) / 1_000_000_000; // Convert nanoTON to TON
      
      await supabase.from('track_collections').insert({
        profile_id: profile.id,
        track_id: params.trackId,
        purchase_price: priceInTon,
        nft_contract_address: this.COLLECTION_ADDRESS,
        nft_token_id: params.itemIndex.toString(),
      });

    } catch (error) {
      console.error('Failed to record NFT mint:', error);
    }
  }

  static async getUserNFTs(limit = 50): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('user_assets')
        .select(`
          *,
          profiles!inner(display_name, avatar_url)
        `)
        .eq('asset_type', 'nft')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch user NFTs:', error);
      return [];
    }
  }

  static async getTrackNFTs(trackId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('user_assets')
        .select(`
          *,
          profiles!inner(display_name, avatar_url, wallet_address)
        `)
        .eq('asset_type', 'nft')
        .contains('metadata', { trackId })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch track NFTs:', error);
      return [];
    }
  }
}