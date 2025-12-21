import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Check if origin is allowed
function isAllowedOrigin(origin: string): boolean {
  if (!origin) return true; // Allow requests without origin (server-to-server)
  
  // Allowed exact origins
  const exactOrigins = [
    'https://audioton.co',
    'https://www.audioton.co',
    'http://localhost:5173',
    'http://localhost:8080',
    'http://localhost:3000',
  ];
  
  if (exactOrigins.includes(origin)) return true;
  
  // Allow all Lovable preview subdomains
  if (origin.endsWith('.lovableproject.com') || origin.endsWith('.lovable.app')) {
    return true;
  }
  
  return false;
}

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') || '';
  const allowedOrigin = isAllowedOrigin(origin) ? origin : 'https://audioton.co';
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
  };
}

// Initialize Audius SDK configuration
const AUDIUS_API_KEY = Deno.env.get('AudioTon');

// Audius API endpoints
const AUDIUS_DISCOVERY_HOST = 'https://discoveryprovider.audius.co';

async function makeAudiusRequest(endpoint: string, params: Record<string, string> = {}) {
  const url = new URL(`${AUDIUS_DISCOVERY_HOST}${endpoint}`);
  
  // Add API key if available
  if (AUDIUS_API_KEY) {
    params.app_name = AUDIUS_API_KEY;
  }
  
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  console.log(`Making Audius API request to: ${url.toString()}`);

  try {
    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'AudioTon/1.0',
      },
    });

    console.log(`Audius API response status: ${response.status}`);

    if (!response.ok) {
      console.error(`Audius API error: ${response.status} ${response.statusText}`);
      throw new Error(`Audius API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error in makeAudiusRequest:`, error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    let path = url.pathname.replace('/audius-api', ''); // Remove function name prefix
    const searchParams = url.searchParams;

    // Handle POST requests with JSON body
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        if (body.path) {
          path = body.path;
          console.log(`Audius API request: POST ${path}`);
          
          // Handle stream URL requests
          const streamMatch = path.match(/^stream-url\/(.+)$/);
          if (streamMatch) {
            const trackId = streamMatch[1];
            const streamUrl = `${AUDIUS_DISCOVERY_HOST}/v1/tracks/${trackId}/stream?app_name=${AUDIUS_API_KEY}`;
            
            console.log(`Providing stream URL for track ${trackId}`);
            
            return new Response(JSON.stringify({ 
              streamUrl,
              trackId,
              success: true 
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }
      } catch (e) {
        console.error('Error parsing POST body');
      }
    }

    console.log(`Audius API request: ${req.method} ${path}`);

    switch (path) {
      case '/trending-tracks': {
        const genre = searchParams.get('genre') || undefined;
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = parseInt(searchParams.get('offset') || '0');
        const time = searchParams.get('time') || 'week';
        const sortMethod = searchParams.get('sort_method') || undefined;

        const params: Record<string, string> = { 
          limit: limit.toString(),
          offset: offset.toString()
        };
        
        if (genre && genre !== 'all') {
          params.genre = genre;
        }
        
        if (time && time !== 'week') {
          params.time = time;
        }
        
        if (sortMethod) {
          params.sort_method = sortMethod;
        }

        const data = await makeAudiusRequest('/v1/tracks/trending', params);
        
        return new Response(JSON.stringify({ 
          tracks: data.data || [],
          hasMore: (data.data || []).length === limit,
          offset: offset,
          limit: limit,
          success: true 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case '/search-tracks': {
        const query = searchParams.get('query');
        const limit = parseInt(searchParams.get('limit') || '20');

        if (!query) {
          return new Response(JSON.stringify({ 
            tracks: [],
            success: true 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const data = await makeAudiusRequest('/v1/tracks/search', {
          query,
          limit: limit.toString(),
        });

        return new Response(JSON.stringify({ 
          tracks: data.data || [],
          success: true 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case '/search-users': {
        const query = searchParams.get('query');
        const limit = parseInt(searchParams.get('limit') || '20');

        if (!query) {
          return new Response(JSON.stringify({ 
            users: [],
            success: true 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const data = await makeAudiusRequest('/v1/users/search', {
          query,
          limit: limit.toString(),
        });

        return new Response(JSON.stringify({ 
          users: data.data || [],
          success: true 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default: {
        const trackMatch = path.match(/^\/track\/(.+)$/);
        const userMatch = path.match(/^\/user\/(.+)$/);
        const streamMatch = path.match(/^\/stream-url\/(.+)$/);
        const userTracksMatch = path.match(/^\/user\/(.+)\/tracks$/);

        if (trackMatch) {
          const trackId = trackMatch[1];
          const data = await makeAudiusRequest(`/v1/tracks/${trackId}`);
          
          return new Response(JSON.stringify({ 
            track: data.data,
            success: true 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (userMatch && !userTracksMatch) {
          const userId = userMatch[1];
          const data = await makeAudiusRequest(`/v1/users/${userId}`);
          
          return new Response(JSON.stringify({ 
            user: data.data,
            success: true 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (userTracksMatch) {
          const userId = userTracksMatch[1];
          const limit = parseInt(searchParams.get('limit') || '20');
          
          const data = await makeAudiusRequest(`/v1/users/${userId}/tracks`, {
            limit: limit.toString(),
          });
          
          return new Response(JSON.stringify({ 
            tracks: data.data || [],
            success: true 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (streamMatch) {
          const trackId = streamMatch[1];
          const streamUrl = `${AUDIUS_DISCOVERY_HOST}/v1/tracks/${trackId}/stream?app_name=${AUDIUS_API_KEY}`;
          
          console.log(`Providing stream URL for track ${trackId}`);
          
          return new Response(JSON.stringify({ 
            streamUrl,
            trackId,
            success: true 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ 
          error: 'Endpoint not found',
          success: false 
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }
  } catch (error) {
    const corsHeaders = getCorsHeaders(req);
    console.error('Error in audius-api function');
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
