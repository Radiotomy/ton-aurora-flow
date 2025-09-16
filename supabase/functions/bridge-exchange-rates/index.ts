import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Simulate exchange rates (would integrate with real price feeds)
    const rates = {
      'AUDIO-ETH': 1.0,
      'AUDIO-SOL': 1.0, 
      'AUDIO-TON': 1.0,
      'TON-AUDIO': 1.0,
      'ETH-TON': 2400.0, // Example rate
      'SOL-TON': 120.0,  // Example rate
    };

    return Response.json({
      success: true,
      rates
    }, { headers: corsHeaders });
    
  } catch (error) {
    console.error('Error:', error);
    
    return Response.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { headers: corsHeaders, status: 500 });
  }
});