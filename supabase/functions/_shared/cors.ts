/**
 * Shared CORS configuration for edge functions
 * Uses origin allowlist instead of wildcard for security
 */

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  'https://audioton.co',
  'https://www.audioton.co',
  'https://cpjjaglmqvcwpzrdoyul.lovableproject.com',
  'http://localhost:5173',
  'http://localhost:8080',
  'http://localhost:3000',
];

/**
 * Get CORS headers for a given request
 * Returns headers with validated origin or default origin
 */
export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') || '';
  
  // Check if origin is in allowlist
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) 
    ? origin 
    : ALLOWED_ORIGINS[0]; // Default to primary domain
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
  };
}

/**
 * Handle CORS preflight request
 */
export function handleCorsPreflightRequest(req: Request): Response {
  return new Response(null, { headers: getCorsHeaders(req) });
}
