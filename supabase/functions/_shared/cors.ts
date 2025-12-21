/**
 * Shared CORS configuration for edge functions
 * Uses origin allowlist with support for Lovable preview subdomains
 */

// Check if origin is allowed
export function isAllowedOrigin(origin: string): boolean {
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

/**
 * Get CORS headers for a given request
 * Returns headers with validated origin or default origin
 */
export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') || '';
  const allowedOrigin = isAllowedOrigin(origin) ? origin : 'https://audioton.co';
  
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
