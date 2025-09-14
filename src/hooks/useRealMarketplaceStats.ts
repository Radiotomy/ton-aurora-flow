import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MarketplaceStats {
  totalVolume: number;
  totalSales: number;
  activeListings: number;
  averagePrice: number;
  topGenres: Array<{ name: string; percentage: number; sales: number }>;
  topArtists: Array<{ 
    id: string; 
    name: string; 
    avatar: string; 
    sales: number; 
    volume: number; 
    isVerified: boolean 
  }>;
  recentSales: Array<{
    id: string;
    title: string;
    artist: string;
    price: number;
    currency: string;
    timestamp: string;
  }>;
  loading: boolean;
  error: string | null;
}

export const useRealMarketplaceStats = (): MarketplaceStats => {
  const [stats, setStats] = useState<MarketplaceStats>({
    totalVolume: 0,
    totalSales: 0,
    activeListings: 0,
    averagePrice: 0,
    topGenres: [],
    topArtists: [],
    recentSales: [],
    loading: true,
    error: null
  });

  useEffect(() => {
    const fetchMarketplaceStats = async () => {
      try {
        setStats(prev => ({ ...prev, loading: true, error: null }));

        // Parallel queries for marketplace data
        const [
          activeListingsResult,
          salesHistoryResult,
          collectionsResult
        ] = await Promise.all([
          // Active marketplace listings
          supabase
            .from('nft_marketplace')
            .select('listing_price, listing_currency')
            .eq('status', 'active'),
          
          // Historical sales (sold listings)
          supabase
            .from('nft_marketplace')
            .select('listing_price, listing_currency, sold_at, nft_id')
            .eq('status', 'sold')
            .not('sold_at', 'is', null),
          
          // Track collections for volume calculation
          supabase
            .from('track_collections')
            .select('purchase_price, collected_at, track_id')
            .not('purchase_price', 'is', null)
        ]);

        const activeListings = activeListingsResult.data || [];
        const salesHistory = salesHistoryResult.data || [];
        const collections = collectionsResult.data || [];

        // Calculate basic stats
        const totalSales = salesHistory.length + collections.length;
        
        // Calculate total volume from both marketplace sales and direct collections
        const marketplaceVolume = salesHistory.reduce((sum, sale) => 
          sum + parseFloat(sale.listing_price?.toString() || '0'), 0
        );
        const collectionsVolume = collections.reduce((sum, collection) => 
          sum + parseFloat(collection.purchase_price?.toString() || '0'), 0
        );
        const totalVolume = marketplaceVolume + collectionsVolume;

        // Calculate average price
        const totalTransactions = salesHistory.length + collections.length;
        const averagePrice = totalTransactions > 0 ? totalVolume / totalTransactions : 0;

        // For now, use placeholder data for complex stats like genres and artists
        // In a real app, this would require additional metadata tables
        const topGenres = [
          { name: 'Electronic', percentage: 40, sales: Math.floor(totalSales * 0.4) },
          { name: 'Ambient', percentage: 25, sales: Math.floor(totalSales * 0.25) },
          { name: 'Synthwave', percentage: 20, sales: Math.floor(totalSales * 0.2) },
          { name: 'House', percentage: 15, sales: Math.floor(totalSales * 0.15) }
        ].filter(genre => genre.sales > 0);

        // Get recent sales (last 10)
        const recentSalesData = await supabase
          .from('nft_marketplace')
          .select(`
            id,
            listing_price,
            listing_currency,
            sold_at,
            nft_id
          `)
          .eq('status', 'sold')
          .not('sold_at', 'is', null)
          .order('sold_at', { ascending: false })
          .limit(10);

        const recentCollectionsData = await supabase
          .from('track_collections')
          .select(`
            id,
            purchase_price,
            collected_at,
            track_id
          `)
          .not('purchase_price', 'is', null)
          .order('collected_at', { ascending: false })
          .limit(10);

        // Combine and format recent sales
        const recentSales: Array<{
          id: string;
          title: string;
          artist: string;
          price: number;
          currency: string;
          timestamp: string;
        }> = [];

        // Add marketplace sales
        recentSalesData.data?.forEach(sale => {
          recentSales.push({
            id: sale.id,
            title: 'Music NFT',
            artist: 'Artist',
            price: parseFloat(sale.listing_price?.toString() || '0'),
            currency: sale.listing_currency || 'TON',
            timestamp: sale.sold_at || new Date().toISOString()
          });
        });

        // Add collection purchases
        recentCollectionsData.data?.forEach(collection => {
          recentSales.push({
            id: collection.id,
            title: 'Track Collection',
            artist: 'Artist',
            price: parseFloat(collection.purchase_price?.toString() || '0'),
            currency: 'TON',
            timestamp: collection.collected_at
          });
        });

        // Sort by timestamp and take most recent
        recentSales.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        // Placeholder top artists (would need proper artist metadata in real app)
        const topArtists = [
          {
            id: '1',
            name: 'Top Artist',
            avatar: 'https://ui-avatars.com/api/?name=Top+Artist&background=6366f1&color=fff',
            sales: Math.floor(totalSales * 0.3),
            volume: totalVolume * 0.3,
            isVerified: true
          },
          {
            id: '2',
            name: 'Second Artist',
            avatar: 'https://ui-avatars.com/api/?name=Second+Artist&background=8b5cf6&color=fff',
            sales: Math.floor(totalSales * 0.2),
            volume: totalVolume * 0.2,
            isVerified: false
          }
        ].filter(artist => artist.sales > 0);

        setStats({
          totalVolume: Math.round(totalVolume * 100) / 100,
          totalSales,
          activeListings: activeListings.length,
          averagePrice: Math.round(averagePrice * 100) / 100,
          topGenres,
          topArtists,
          recentSales: recentSales.slice(0, 10),
          loading: false,
          error: null
        });

      } catch (error) {
        console.error('Error fetching marketplace stats:', error);
        setStats(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to load marketplace stats'
        }));
      }
    };

    fetchMarketplaceStats();
  }, []);

  return stats;
};