import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Audius SDK configuration
const AUDIUS_API_KEY = Deno.env.get('AudioTon');
const AUDIUS_API_SECRET = Deno.env.get('AudioTon_Secret');

// Audius API endpoints
const AUDIUS_DISCOVERY_HOST = 'https://discoveryprovider.audius.co';

interface AudiusTrack {
  id: string;
  title: string;
  user: {
    id: string;
    name: string;
    handle: string;
    profile_picture?: {
      '150x150'?: string;
      '480x480'?: string;
      '1000x1000'?: string;
    };
  };
  artwork?: {
    '150x150'?: string;
    '480x480'?: string;
    '1000x1000'?: string;
  };
  genre: string;
  duration: number;
  play_count: number;
  favorite_count: number;
  repost_count: number;
  created_at: string;
  permalink: string;
}

interface AudiusUser {
  id: string;
  name: string;
  handle: string;
  bio?: string;
  location?: string;
  profile_picture?: {
    '150x150'?: string;
    '480x480'?: string;
    '1000x1000'?: string;
  };
  follower_count: number;
  followee_count: number;
  track_count: number;
  playlist_count: number;
}

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
      const errorText = await response.text();
      console.error(`Audius API error: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Audius API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`Audius API response data:`, JSON.stringify(data, null, 2));
    
    return data;
  } catch (error) {
    console.error(`Error in makeAudiusRequest:`, error);
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname;
    const searchParams = url.searchParams;

    console.log(`Audius API request: ${req.method} ${path}`);

    switch (path) {
      case '/trending-tracks': {
        const genre = searchParams.get('genre') || undefined;
        const limit = parseInt(searchParams.get('limit') || '20');

        const params: Record<string, string> = { limit: limit.toString() };
        if (genre && genre !== 'all') {
          params.genre = genre;
        }

        const data = await makeAudiusRequest('/v1/tracks/trending', params);
        
        return new Response(JSON.stringify({ 
          tracks: data.data || [],
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
        // Handle track and user detail endpoints
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
          // Get track stream URL
          const streamUrl = `${AUDIUS_DISCOVERY_HOST}/v1/tracks/${trackId}/stream`;
          
          return new Response(JSON.stringify({ 
            streamUrl,
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
    console.error('Error in audius-api function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});