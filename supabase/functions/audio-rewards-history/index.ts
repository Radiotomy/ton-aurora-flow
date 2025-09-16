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
    const { profileId, limit = 20 } = await req.json();
    
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

    // Simulated rewards data (would integrate with Audius protocol)
    const rewards = Array.from({ length: Math.min(limit, 10) }, (_, i) => ({
      id: `reward_${i}_${Date.now()}`,
      type: ['listen', 'upload', 'playlist', 'social', 'milestone'][Math.floor(Math.random() * 5)],
      amount: Math.random() * 10,
      metadata: {
        track_id: `track_${i}`,
        action: 'listening_reward'
      },
      earned_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      claimed_at: Math.random() > 0.5 ? new Date().toISOString() : undefined
    }));

    return Response.json({
      success: true,
      rewards
    }, { headers: corsHeaders });
    
  } catch (error) {
    console.error('Error:', error);
    
    return Response.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { headers: corsHeaders, status: 500 });
  }
});