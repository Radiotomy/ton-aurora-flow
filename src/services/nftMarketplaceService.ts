import { supabase } from '@/integrations/supabase/client';
import { SmartContractHelper } from '@/utils/smartContracts';
import { TonPaymentService } from './tonPaymentService';

export interface NFTListing {
  id: string;
  nftId: string;
  sellerProfileId: string;
  listingPrice: number;
  listingCurrency: 'TON' | 'AUDIO';
  status: 'active' | 'sold' | 'cancelled' | 'expired';
  royaltyPercentage: number;
  createdAt: Date;
  expiresAt?: Date;
  soldAt?: Date;
  buyerProfileId?: string;
  metadata?: {
    trackId?: string;
    artistId?: string;
    trackTitle?: string;
    artistName?: string;
    artworkUrl?: string;
  };
}

export interface NFTSaleResult {
  success: boolean;
  transactionId?: string;
  error?: string;
  listingId?: string;
}

export interface MarketplaceStats {
  totalListings: number;
  totalVolume: number;
  averagePrice: number;
  topCollections: Array<{
    artistId: string;
    artistName: string;
    volume: number;
    listings: number;
  }>;
}

export class NFTMarketplaceService {
  private static readonly MARKETPLACE_FEE_PERCENTAGE = 0.025; // 2.5%
  private static readonly MAX_ROYALTY_PERCENTAGE = 10; // 10%
  private static readonly LISTING_DURATION_DAYS = 30;

  /**
   * List an NFT for sale
   */
  static async listNFT(
    sellerProfileId: string,
    nftId: string,
    price: number,
    currency: 'TON' | 'AUDIO' = 'TON',
    royaltyPercentage: number = 2.5,
    metadata?: NFTListing['metadata']
  ): Promise<NFTListing> {
    if (price <= 0) {
      throw new Error('Listing price must be greater than 0');
    }

    if (royaltyPercentage < 0 || royaltyPercentage > this.MAX_ROYALTY_PERCENTAGE) {
      throw new Error(`Royalty percentage must be between 0 and ${this.MAX_ROYALTY_PERCENTAGE}%`);
    }

    // Check if NFT exists and is owned by the seller
    const { data: nftData, error: nftError } = await supabase
      .from('user_assets')
      .select('*')
      .eq('id', nftId)
      .eq('profile_id', sellerProfileId)
      .single();

    if (nftError || !nftData) {
      throw new Error('NFT not found or not owned by seller');
    }

    // Check if NFT is already listed
    const { data: existingListing } = await supabase
      .from('nft_marketplace')
      .select('id')
      .eq('nft_id', nftId)
      .eq('status', 'active')
      .single();

    if (existingListing) {
      throw new Error('NFT is already listed for sale');
    }

    // Create marketplace listing
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.LISTING_DURATION_DAYS);

    const { data: listing, error } = await supabase
      .from('nft_marketplace')
      .insert({
        nft_id: nftId,
        seller_profile_id: sellerProfileId,
        listing_price: price,
        listing_currency: currency,
        royalty_percentage: royaltyPercentage,
        expires_at: expiresAt.toISOString(),
        status: 'active'
      })
      .select()
      .single();

    if (error || !listing) {
      throw new Error('Failed to create marketplace listing');
    }

    return this.formatListing({ ...listing, metadata });
  }

  /**
   * Purchase an NFT from the marketplace
   */
  static async purchaseNFT(
    buyerProfileId: string,
    listingId: string
  ): Promise<NFTSaleResult> {
    // Get listing details
    const { data: listing, error: listingError } = await supabase
      .from('nft_marketplace')
      .select(`
        *,
        seller:profiles!seller_profile_id(display_name, wallet_address),
        nft:user_assets!nft_id(*)
      `)
      .eq('id', listingId)
      .eq('status', 'active')
      .single();

    if (listingError || !listing) {
      throw new Error('Listing not found or no longer active');
    }

    // Check if listing has expired
    if (listing.expires_at && new Date(listing.expires_at) < new Date()) {
      await supabase
        .from('nft_marketplace')
        .update({ status: 'expired' })
        .eq('id', listingId);
      throw new Error('Listing has expired');
    }

    // Prevent self-purchase
    if (listing.seller_profile_id === buyerProfileId) {
      throw new Error('Cannot purchase your own NFT');
    }

    try {
      // Calculate fees
      const price = parseFloat(listing.listing_price.toString());
      const marketplaceFee = price * this.MARKETPLACE_FEE_PERCENTAGE;
      const royaltyFee = price * (parseFloat(listing.royalty_percentage.toString()) / 100);
      const sellerAmount = price - marketplaceFee - royaltyFee;

      // Process payment
      const paymentResult = await TonPaymentService.sendPayment({
        recipientAddress: listing.seller.wallet_address,
        amount: price,
        paymentType: 'nft_purchase',
        itemId: listing.nft_id
      });

      if (!paymentResult.success) {
        throw new Error(paymentResult.error || 'Payment failed');
      }

      // Transfer NFT ownership
      await supabase
        .from('user_assets')
        .update({ profile_id: buyerProfileId })
        .eq('id', listing.nft_id);

      // Update listing status
      await supabase
        .from('nft_marketplace')
        .update({
          status: 'sold',
          buyer_profile_id: buyerProfileId,
          sold_at: new Date().toISOString()
        })
        .eq('id', listingId);

      // Distribute payments
      await this.distributePayments(
        listing.seller_profile_id,
        buyerProfileId,
        listing.nft.metadata?.artistId,
        price,
        marketplaceFee,
        royaltyFee,
        sellerAmount,
        listing.listing_currency
      );

      return {
        success: true,
        transactionId: paymentResult.transactionHash,
        listingId
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Purchase failed',
        listingId
      };
    }
  }

  /**
   * Cancel an NFT listing
   */
  static async cancelListing(
    sellerProfileId: string,
    listingId: string
  ): Promise<boolean> {
    const { error } = await supabase
      .from('nft_marketplace')
      .update({ status: 'cancelled' })
      .eq('id', listingId)
      .eq('seller_profile_id', sellerProfileId)
      .eq('status', 'active');

    return !error;
  }

  /**
   * Get active marketplace listings
   */
  static async getActiveListings(
    limit: number = 50,
    offset: number = 0,
    filterBy?: {
      artistId?: string;
      minPrice?: number;
      maxPrice?: number;
      currency?: 'TON' | 'AUDIO';
    }
  ): Promise<NFTListing[]> {
    let query = supabase
      .from('nft_marketplace')
      .select(`
        *,
        seller:profiles!seller_profile_id(display_name, avatar_url),
        nft:user_assets!nft_id(metadata, asset_type)
      `)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (filterBy) {
      if (filterBy.minPrice) {
        query = query.gte('listing_price', filterBy.minPrice);
      }
      if (filterBy.maxPrice) {
        query = query.lte('listing_price', filterBy.maxPrice);
      }
      if (filterBy.currency) {
        query = query.eq('listing_currency', filterBy.currency);
      }
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data?.map(this.formatListing) || [];
  }

  /**
   * Get user's listings (selling)
   */
  static async getUserListings(
    profileId: string,
    status?: NFTListing['status']
  ): Promise<NFTListing[]> {
    let query = supabase
      .from('nft_marketplace')
      .select(`
        *,
        nft:user_assets!nft_id(metadata, asset_type)
      `)
      .eq('seller_profile_id', profileId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data?.map(this.formatListing) || [];
  }

  /**
   * Get user's purchases
   */
  static async getUserPurchases(profileId: string): Promise<NFTListing[]> {
    const { data, error } = await supabase
      .from('nft_marketplace')
      .select(`
        *,
        seller:profiles!seller_profile_id(display_name, avatar_url),
        nft:user_assets!nft_id(metadata, asset_type)
      `)
      .eq('buyer_profile_id', profileId)
      .eq('status', 'sold')
      .order('sold_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data?.map(this.formatListing) || [];
  }

  /**
   * Get marketplace statistics
   */
  static async getMarketplaceStats(): Promise<MarketplaceStats> {
    const { data: listings, error } = await supabase
      .from('nft_marketplace')
      .select(`
        listing_price,
        listing_currency,
        status,
        nft:user_assets!nft_id(metadata)
      `);

    if (error) {
      throw error;
    }

    const activeListings = listings?.filter(l => l.status === 'active') || [];
    const soldListings = listings?.filter(l => l.status === 'sold') || [];

    const totalVolume = soldListings.reduce((sum, listing) => {
      return sum + parseFloat(listing.listing_price.toString());
    }, 0);

    const averagePrice = soldListings.length > 0 
      ? totalVolume / soldListings.length 
      : 0;

    // Group by artist for top collections
    const artistStats = new Map();
    soldListings.forEach(listing => {
      const artistId = listing.nft?.metadata?.artistId;
      const artistName = listing.nft?.metadata?.artistName;
      if (artistId) {
        const current = artistStats.get(artistId) || {
          artistId,
          artistName: artistName || 'Unknown',
          volume: 0,
          listings: 0
        };
        current.volume += parseFloat(listing.listing_price.toString());
        current.listings += 1;
        artistStats.set(artistId, current);
      }
    });

    const topCollections = Array.from(artistStats.values())
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 10);

    return {
      totalListings: activeListings.length,
      totalVolume,
      averagePrice,
      topCollections
    };
  }

  /**
   * Distribute payments after NFT sale
   */
  private static async distributePayments(
    sellerProfileId: string,
    buyerProfileId: string,
    artistId: string | undefined,
    totalPrice: number,
    marketplaceFee: number,
    royaltyFee: number,
    sellerAmount: number,
    currency: 'TON' | 'AUDIO'
  ): Promise<void> {
    // Record transactions
    const transactions = [
      {
        from_profile_id: buyerProfileId,
        to_profile_id: sellerProfileId,
        amount_ton: currency === 'TON' ? sellerAmount : 0,
        audio_amount: currency === 'AUDIO' ? sellerAmount : 0,
        transaction_type: 'nft_sale',
        status: 'completed',
        token_type: currency,
        transaction_hash: `marketplace_${Date.now()}_seller`,
        metadata: { type: 'seller_payment', listingPrice: totalPrice }
      }
    ];

    // Add royalty payment if there's an artist and royalty fee
    if (artistId && royaltyFee > 0) {
      const { data: artistProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', artistId)
        .single();

      if (artistProfile) {
        transactions.push({
          from_profile_id: buyerProfileId,
          to_profile_id: artistProfile.id,
          amount_ton: currency === 'TON' ? royaltyFee : 0,
          audio_amount: currency === 'AUDIO' ? royaltyFee : 0,
          transaction_type: 'royalty_payment',
          status: 'completed',
          token_type: currency,
          transaction_hash: `marketplace_${Date.now()}_royalty`,
          metadata: { type: 'royalty_payment', percentage: royaltyFee / totalPrice * 100 }
        });
      }
    }

    // Insert all transactions
    await supabase
      .from('transactions')
      .insert(transactions);
  }

  /**
   * Format raw listing data
   */
  private static formatListing(listing: any): NFTListing {
    return {
      id: listing.id,
      nftId: listing.nft_id,
      sellerProfileId: listing.seller_profile_id,
      listingPrice: parseFloat(listing.listing_price.toString()),
      listingCurrency: listing.listing_currency,
      status: listing.status,
      royaltyPercentage: parseFloat(listing.royalty_percentage.toString()),
      createdAt: new Date(listing.created_at),
      expiresAt: listing.expires_at ? new Date(listing.expires_at) : undefined,
      soldAt: listing.sold_at ? new Date(listing.sold_at) : undefined,
      buyerProfileId: listing.buyer_profile_id || undefined,
      metadata: listing.metadata || listing.nft?.metadata
    };
  }
}