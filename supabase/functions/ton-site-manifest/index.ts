import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

interface TonSiteManifest {
  url: string;
  name: string;
  description: string;
  iconUrl: string;
  backgroundColor: string;
  themeColor: string;
  tonSite: {
    bagId?: string;
    proxyUrl: string;
    fallbackUrls: string[];
  };
}

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
                   'https://082eb0ee-579e-46a8-a35f-2d335fe4e344.sandbox.lovable.dev';
    
    // Determine if this is a TON domain request
    const isTonDomain = origin.includes('.ton') || url.searchParams.get('ton') === 'true';
    
    console.log('TON Site manifest request:', { origin, isTonDomain });
    
    const manifest: TonSiteManifest = {
      url: origin,
      name: "AudioTon - Web3 Music Platform",
      description: "Stream, discover, and collect music on the TON blockchain. Connect your TON wallet to access exclusive tracks, mint NFTs, and join fan clubs.",
      iconUrl: `${origin}/favicon.ico`,
      backgroundColor: "#0A0A0B",
      themeColor: "#8B5CF6",
      tonSite: {
        // In production, this would be the actual TON Storage bag ID
        bagId: isTonDomain ? "32902580153715398944" : undefined,
        proxyUrl: origin,
        fallbackUrls: [
          "https://082eb0ee-579e-46a8-a35f-2d335fe4e344.lovableproject.com",
          "https://audioton.lovable.app"
        ]
      }
    };

    console.log('Generated TON Site manifest:', manifest);

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