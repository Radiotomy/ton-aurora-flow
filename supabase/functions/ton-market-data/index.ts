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

    const chainstackApiKey = Deno.env.get('AUDIOTON_CHAIN')
    if (!chainstackApiKey) {
      throw new Error('Chainstack API key not configured')
    }

    // Chainstack TON API endpoint
    const apiBase = isTestnet 
      ? `https://nd-123-456-789.p2pify.com/${chainstackApiKey}/v3`
      : `https://nd-123-456-789.p2pify.com/${chainstackApiKey}/v3`

    // Get network statistics and latest block info
    const [statsResponse, blockResponse] = await Promise.all([
      fetch(`${apiBase}/getNetworkStats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${chainstackApiKey}`
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "getNetworkStats", 
          params: {},
          id: 1
        })
      }),
      fetch(`${apiBase}/getMasterchainInfo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${chainstackApiKey}`
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "getMasterchainInfo",
          params: {},
          id: 2
        })
      })
    ])

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
        blockHeight: blockData.result?.last?.seqno || 0,
        blockTime: blockData.result?.last?.gen_utime || Math.floor(Date.now() / 1000),
        validators: statsData.result?.validators_count || 0,
        totalSupply: statsData.result?.total_supply || '0',
        circulatingSupply: statsData.result?.circulating_supply || '0'
      },
      market: {
        price: tonPrice,
        currency: 'USD',
        lastUpdated: new Date().toISOString()
      },
      blockchain: {
        avgBlockTime: statsData.result?.avg_block_time || 5,
        tps: statsData.result?.transactions_per_second || 0,
        activeAddresses: statsData.result?.active_addresses_24h || 0,
        totalTransactions: statsData.result?.total_transactions || 0
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