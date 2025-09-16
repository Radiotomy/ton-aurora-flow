import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { profileId } = await req.json();
    
    if (!profileId) {
      return Response.json({ 
        success: false, 
        error: 'Profile ID required' 
      }, { headers: corsHeaders, status: 400 });
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get token balance
    const { data: balance } = await supabaseClient
      .from('token_balances')
      .select('balance')
      .eq('profile_id', profileId)
      .eq('token_type', 'AUDIO')
      .single();

    // Calculate rewards and staking (simulated for now)
    const audioBalance = {
      balance: balance?.balance || 0,
      staked_balance: Math.floor(Math.random() * 1000), // Simulated
      total_earnings: Math.floor(Math.random() * 5000),
      pending_rewards: Math.floor(Math.random() * 100),
    };

    return Response.json({
      success: true,
      ...audioBalance
    }, { headers: corsHeaders });
    
  } catch (error) {
    console.error('Error:', error);
    
    return Response.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { headers: corsHeaders, status: 500 });
  }
});