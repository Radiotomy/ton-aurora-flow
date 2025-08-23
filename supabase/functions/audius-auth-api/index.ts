import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Audius API endpoints
const AUDIUS_API_BASE = 'https://discoveryprovider.audius.co';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { endpoint, method = 'GET', token, body, params } = await req.json();

    if (!token) {
      throw new Error('Authentication token is required');
    }

    if (!endpoint) {
      throw new Error('API endpoint is required');
    }

    // Construct URL with parameters
    const url = new URL(`${AUDIUS_API_BASE}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value as string);
      });
    }

    // Prepare request options
    const requestOptions: RequestInit = {
      method: method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'User-Agent': 'AudioTon/1.0',
      },
    };

    // Add body for POST/PUT requests
    if (body && (method === 'POST' || method === 'PUT')) {
      requestOptions.headers!['Content-Type'] = 'application/json';
      requestOptions.body = JSON.stringify(body);
    }

    console.log(`Making authenticated Audius API request: ${method} ${url.toString()}`);

    // Make the request to Audius API
    const response = await fetch(url.toString(), requestOptions);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Audius API error: ${response.status} ${response.statusText}`, errorText);
      
      // Handle specific error cases
      if (response.status === 401) {
        throw new Error('Authentication failed - token may be expired');
      }
      
      throw new Error(`Audius API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Audius authenticated API response received');

    // Handle different response formats based on endpoint
    let responseData = data;

    // Normalize response format
    if (data.data) {
      responseData = data.data;
    }

    // For endpoints that return arrays directly
    const endpointMapping: Record<string, string> = {
      '/favorites': 'favorites',
      '/reposts': 'reposts', 
      '/playlists': 'playlists',
      '/following': 'following',
      '/followers': 'followers',
      '/feed': 'feed',
      '/tracks': 'tracks'
    };

    // Check if endpoint matches any pattern and wrap in appropriate key
    const matchedKey = Object.keys(endpointMapping).find(key => endpoint.includes(key));
    if (matchedKey && Array.isArray(responseData)) {
      const dataKey = endpointMapping[matchedKey];
      responseData = { [dataKey]: responseData };
    }

    // For single item endpoints
    if (endpoint.includes('/users/me') && !endpoint.includes('/')) {
      responseData = { user: responseData };
    }

    return new Response(JSON.stringify({
      ...responseData,
      success: true,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Audius authenticated API error:', error);
    
    return new Response(JSON.stringify({
      error: error.message,
      success: false,
    }), {
      status: error.message.includes('Authentication failed') ? 401 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});