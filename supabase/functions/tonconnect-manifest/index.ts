import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the origin from the request or use a fallback
    const origin = req.headers.get('origin') || 'https://id-preview--082eb0ee-579e-46a8-a35f-2d335fe4e344.lovable.app';
    
    const manifest = {
      url: origin,
      name: "AudioTon - Web3 Music Platform",
      iconUrl: `${origin}/favicon.ico`,
      termsOfUseUrl: `${origin}/terms`,
      privacyPolicyUrl: `${origin}/privacy`
    };

    console.log('Generated TON Connect manifest:', manifest);

    return new Response(
      JSON.stringify(manifest, null, 2),
      { 
        headers: {
          ...corsHeaders,
          'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
        }
      }
    );
  } catch (error) {
    console.error('Error generating manifest:', error);
    
    return new Response(
      JSON.stringify({ error: 'Failed to generate manifest' }),
      { 
        status: 500,
        headers: corsHeaders
      }
    );
  }
});