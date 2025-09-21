import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { address, isTestnet = false } = await req.json()

    if (!address) {
      throw new Error('Address is required')
    }

    // Chainstack TON API endpoints with path-based authentication
    const primaryEndpoint = isTestnet 
      ? 'https://ton-mainnet.core.chainstack.com/68b4cb9196a69de29db7191014f18715/api/v3'
      : 'https://ton-mainnet.core.chainstack.com/68b4cb9196a69de29db7191014f18715/api/v3'
      
    const fallbackEndpoint = 'https://nd-123-456-789.p2pify.com/3c6e0b8a9c15224a8228b9a98ca1531d'

    // Use Chainstack's REST API for address information
    let response;
    try {
      response = await fetch(`${primaryEndpoint}/address/${address}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
    } catch (error) {
      // Fallback to secondary endpoint
      response = await fetch(`${fallbackEndpoint}/address/${address}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
    }
    
    const data = await response.json()

    // Handle Chainstack REST API response format
    if (!response.ok) {
      throw new Error(`Chainstack API error: ${response.status} ${response.statusText}`)
    }

    if (!data) {
      throw new Error('Invalid response from Chainstack API')
    }

    // Parse Chainstack address response format
    const balanceNanotons = BigInt(data.balance || '0')
    const balanceTon = Number(balanceNanotons) / 1e9

    const result = {
      balance: balanceNanotons.toString(),
      formatted: balanceTon.toFixed(4),
      nanotons: balanceNanotons.toString(),
      lastUpdated: new Date().toISOString(),
      accountState: data.status || data.state || 'unknown',
      addressType: data.address_type || 'unknown',
      chainstackPowered: true,
      network: isTestnet ? 'testnet' : 'mainnet'
    }

    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Error in ton-wallet-balance function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }
      }
    )
  }
})