import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Transaction validation schema
const transactionParamsSchema = z.object({
  artistId: z.string().min(1, { message: "Artist ID is required" }),
  artistWalletAddress: z.string().regex(/^[UEk][Qf][a-zA-Z0-9_-]{46}$/, { message: "Invalid TON wallet address format" }),
  amount: z.number().positive().max(10000, { message: "Amount exceeds maximum allowed" }),
  transactionType: z.enum(['tip', 'nft_purchase', 'fan_club_membership', 'event_ticket'], { message: "Invalid transaction type" }),
  metadata: z.record(z.any()).optional(),
});

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
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
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication token" }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      );
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabaseService
      .from('profiles')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: "User profile not found" }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404 
        }
      );
    }

    // Parse and validate input
    const rawBody = await req.json();
    const validationResult = transactionParamsSchema.safeParse(rawBody);
    
    if (!validationResult.success) {
      console.error('Transaction validation failed:', validationResult.error);
      return new Response(
        JSON.stringify({ 
          error: "Invalid transaction parameters",
          details: validationResult.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    const { artistId, artistWalletAddress, amount, transactionType, metadata } = validationResult.data;

    // Additional business logic validation
    const validationErrors: string[] = [];

    // Check transaction amount ranges based on type
    if (transactionType === 'tip' && amount > 1000) {
      validationErrors.push("Tip amount exceeds maximum of 1000 TON");
    } else if (transactionType === 'nft_purchase' && amount > 5000) {
      validationErrors.push("NFT purchase amount exceeds maximum of 5000 TON");
    } else if (transactionType === 'fan_club_membership' && amount > 100) {
      validationErrors.push("Fan club membership amount exceeds maximum of 100 TON");
    } else if (transactionType === 'event_ticket' && amount > 500) {
      validationErrors.push("Event ticket amount exceeds maximum of 500 TON");
    }

    // Verify minimum amounts
    if (amount < 0.01) {
      validationErrors.push("Amount must be at least 0.01 TON");
    }

    if (validationErrors.length > 0) {
      return new Response(
        JSON.stringify({ 
          error: "Validation failed",
          details: validationErrors
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    // Rate limiting check for transaction validation (20 requests per 5 minutes)
    const { data: rateLimitCheck, error: rateLimitError } = await supabaseService
      .rpc('secure_rate_limit_check', {
        operation_type: 'transaction_validation',
        max_operations: 20,
        time_window: '00:05:00'
      });

    if (rateLimitError) {
      console.error('Rate limit check error:', rateLimitError);
    } else if (!rateLimitCheck) {
      console.warn(`Rate limit exceeded for profile ${profile.id}`);
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 429 
        }
      );
    }

    // Log validation attempt for audit trail
    await supabaseService
      .from('security_audit_log')
      .insert({
        user_id: user.id,
        action_type: 'transaction_validation',
        table_name: 'transactions',
        metadata: {
          artist_id: artistId,
          amount,
          transaction_type: transactionType,
          timestamp: new Date().toISOString()
        }
      });

    console.log(`Transaction validation successful for user ${user.id}: ${transactionType} of ${amount} TON to artist ${artistId}`);

    // Return validated parameters
    return new Response(
      JSON.stringify({
        success: true,
        validated: true,
        artistId,
        artistWalletAddress,
        amount,
        transactionType,
        metadata,
        message: "Transaction parameters validated successfully"
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in validate-transaction-params function:', error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
