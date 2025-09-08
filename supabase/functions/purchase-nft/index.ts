import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PurchaseRequest {
  nftId: string;
  price: number;
  currency: string;
  artistId: string;
  walletAddress?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase clients
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get authenticated user
    const authHeader = req.headers.get("Authorization");
    let user = null;
    let profile = null;

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data } = await supabaseClient.auth.getUser(token);
      user = data.user;

      if (user) {
        const { data: profileData } = await supabaseService
          .from('profiles')
          .select('*')
          .eq('auth_user_id', user.id)
          .single();
        profile = profileData;
      }
    }

    const { nftId, price, currency, artistId, walletAddress }: PurchaseRequest = await req.json();

    if (!nftId || !price || !currency) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: nftId, price, currency" }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    // Check if user is authenticated or has wallet
    if (!user && !walletAddress) {
      return new Response(
        JSON.stringify({ error: "User must be authenticated or provide wallet address" }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      );
    }

    console.log(`Processing NFT purchase: ${nftId} for ${price} ${currency}`);

    // Create NFT collection record
    const collectionData: any = {
      track_id: nftId,
      purchase_price: price,
      collected_at: new Date().toISOString(),
      nft_contract_address: `nft-contract-${nftId}`,
      nft_token_id: `token-${Date.now()}`
    };

    if (profile) {
      collectionData.profile_id = profile.id;
    }

    const { data: collection, error: collectionError } = await supabaseService
      .from('track_collections')
      .insert(collectionData)
      .select()
      .single();

    if (collectionError) {
      console.error('Error creating collection record:', collectionError);
      return new Response(
        JSON.stringify({ error: "Failed to create collection record" }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

    // Create transaction record for payment tracking
    const transactionData: any = {
      transaction_hash: `tx-${Date.now()}`,
      transaction_type: 'nft_purchase',
      amount_ton: currency === 'TON' ? price : 0,
      audio_amount: currency === 'AUDIO' ? price : 0,
      token_type: currency,
      status: 'completed',
      metadata: {
        nft_id: nftId,
        collection_id: collection.id,
        artist_id: artistId
      }
    };

    if (profile) {
      transactionData.from_profile_id = profile.id;
    }

    const { error: transactionError } = await supabaseService
      .from('transactions')
      .insert(transactionData);

    if (transactionError) {
      console.error('Error creating transaction record:', transactionError);
      // Don't fail the whole operation for transaction logging
    }

    // Update user reputation if authenticated
    if (profile) {
      const { error: reputationError } = await supabaseService
        .from('profiles')
        .update({ 
          reputation_score: (profile.reputation_score || 0) + 10 
        })
        .eq('id', profile.id);

      if (reputationError) {
        console.error('Error updating reputation:', reputationError);
      }
    }

    // TODO: Integrate with actual TON blockchain for real NFT transfer
    // This would involve:
    // 1. Creating the NFT contract transaction
    // 2. Transferring ownership on-chain
    // 3. Updating the NFT metadata
    // 4. Handling payment processing

    console.log(`NFT purchase completed successfully: ${collection.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        collection: collection,
        message: "NFT purchased successfully!"
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in purchase-nft function:', error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});