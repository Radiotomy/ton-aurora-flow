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
    const { isTestnet = false } = await req.json().catch(() => ({ isTestnet: false }))

    // Chainstack TON API endpoints with path-based authentication
    const primaryEndpoint = isTestnet 
      ? 'https://ton-mainnet.core.chainstack.com/68b4cb9196a69de29db7191014f18715/api/v3'
      : 'https://ton-mainnet.core.chainstack.com/68b4cb9196a69de29db7191014f18715/api/v3'
      
    const fallbackEndpoint = 'https://nd-123-456-789.p2pify.com/3c6e0b8a9c15224a8228b9a98ca1531d'

    // Get network statistics and latest block info using Chainstack REST API
    let statsResponse, blockResponse;
    try {
      [statsResponse, blockResponse] = await Promise.all([
        fetch(`${primaryEndpoint}/network/stats`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }),
        fetch(`${primaryEndpoint}/masterchain/info`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })
      ])
    } catch (error) {
      // Fallback to secondary endpoint
      [statsResponse, blockResponse] = await Promise.all([
        fetch(`${fallbackEndpoint}/network/stats`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }),
        fetch(`${fallbackEndpoint}/masterchain/info`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })
      ])
    }

    const [statsData, blockData] = await Promise.all([
      statsResponse.json(),
      blockResponse.json()
    ])

    // Get TON price from external API (CoinGecko as fallback)
    let tonPrice = null
    try {
      const priceResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd')
      const priceData = await priceResponse.json()
      tonPrice = priceData?.['the-open-network']?.usd || null
    } catch (error) {
      console.warn('Failed to fetch TON price:', error)
    }

    const result = {
      network: {
        name: isTestnet ? 'TON Testnet' : 'TON Mainnet',
        isTestnet,
        blockHeight: blockData?.seqno || blockData?.last?.seqno || 0,
        blockTime: blockData?.gen_utime || blockData?.last?.gen_utime || Math.floor(Date.now() / 1000),
        validators: statsData?.validators_count || 0,
        totalSupply: statsData?.total_supply || '0',
        circulatingSupply: statsData?.circulating_supply || '0'
      },
      market: {
        price: tonPrice,
        currency: 'USD',
        lastUpdated: new Date().toISOString()
      },
      blockchain: {
        avgBlockTime: statsData?.avg_block_time || 5,
        tps: statsData?.transactions_per_second || 0,
        activeAddresses: statsData?.active_addresses_24h || 0,
        totalTransactions: statsData?.total_transactions || 0
      },
      timestamp: new Date().toISOString(),
      chainstackPowered: true
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
    console.error('Error in ton-market-data function:', error)
    
    // Return basic fallback data
    const fallbackData = {
      network: {
        name: 'TON Network',
        isTestnet: false,
        blockHeight: 0,
        blockTime: Math.floor(Date.now() / 1000)
      },
      market: {
        price: null,
        currency: 'USD',
        lastUpdated: new Date().toISOString()
      },
      blockchain: {
        avgBlockTime: 5,
        tps: 0
      },
      error: 'Using fallback data: ' + error.message,
      timestamp: new Date().toISOString(),
      chainstackPowered: false
    }

    return new Response(
      JSON.stringify(fallbackData),
      { 
        status: 200,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }
      }
    )
  }
})