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
    // Get the origin from query parameter first, then fallback to headers
    const url = new URL(req.url);
    const origin = url.searchParams.get('origin') || 
                   req.headers.get('origin') || 
                   req.headers.get('referer')?.replace(/\/$/, '') || 
                   'https://082eb0ee-579e-46a8-a35f-2d335fe4e344.lovableproject.com';
    
    const isTonDomain = url.searchParams.get('ton') === 'true' || origin.includes('.ton');
    
    console.log('TON Site manifest request:', { origin, isTonDomain });
    console.log('Query params:', Object.fromEntries(url.searchParams.entries()));
    
    // For TON Sites, we may need to use different URLs or handle .ton domains
    const baseUrl = isTonDomain && origin.includes('.ton') ? origin : origin;
    
    const manifest = {
      url: baseUrl,
      name: "AudioTon - Web3 Music Platform",
      iconUrl: `${baseUrl}/favicon.ico`,
      termsOfUseUrl: `${baseUrl}/terms`,
      privacyPolicyUrl: `${baseUrl}/privacy`
    };

    console.log('Generated TON Site manifest:', manifest);

    return new Response(
      JSON.stringify(manifest, null, 2),
      { 
        headers: {
          ...corsHeaders,
          'Cache-Control': 'no-cache' // Don't cache to ensure fresh URLs
        }
      }
    );
  } catch (error) {
    console.error('Error generating TON Site manifest:', error);
    
    return new Response(
      JSON.stringify({ error: 'Failed to generate TON Site manifest' }),
      { 
        status: 500,
        headers: corsHeaders
      }
    );
  }
});