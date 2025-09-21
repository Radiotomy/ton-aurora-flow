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
    const { address, limit = 10, offset = 0, isTestnet = false } = await req.json()

    if (!address) {
      throw new Error('Address is required')
    }

    // Chainstack TON API endpoints with path-based authentication
    const primaryEndpoint = isTestnet 
      ? 'https://ton-mainnet.core.chainstack.com/68b4cb9196a69de29db7191014f18715/api/v3'
      : 'https://ton-mainnet.core.chainstack.com/68b4cb9196a69de29db7191014f18715/api/v3'
      
    const fallbackEndpoint = 'https://nd-123-456-789.p2pify.com/3c6e0b8a9c15224a8228b9a98ca1531d'

    // Use Chainstack's REST API for transaction history
    const params = new URLSearchParams({
      limit: Math.min(limit, 100).toString(),
      offset: offset.toString()
    })

    let response;
    try {
      response = await fetch(`${primaryEndpoint}/address/${address}/transactions?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
    } catch (error) {
      // Fallback to secondary endpoint
      response = await fetch(`${fallbackEndpoint}/address/${address}/transactions?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
    }

    const data = await response.json()

    if (!response.ok) {
      throw new Error(`Chainstack API error: ${response.status} ${response.statusText}`)
    }

    // Process and format transaction data from Chainstack REST response
    const transactions = (data.transactions || data || []).map((tx: any) => ({
      hash: tx.transaction_id?.hash || '',
      lt: tx.transaction_id?.lt || '',
      account: tx.account || '',
      timestamp: tx.utime ? new Date(tx.utime * 1000).toISOString() : null,
      fee: tx.fee || '0',
      storagePhase: tx.storage_phase || {},
      computePhase: tx.compute_phase || {},
      actionPhase: tx.action_phase || {},
      inMsg: tx.in_msg || null,
      outMsgs: tx.out_msgs || [],
      description: tx.description || {},
      value: tx.in_msg?.value || '0',
      source: tx.in_msg?.source || '',
      destination: tx.in_msg?.destination || '',
      success: tx.compute_phase?.success || false
    }))

    const result = {
      transactions,
      address,
      total: transactions.length,
      limit,
      offset,
      lastUpdated: new Date().toISOString(),
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
    console.error('Error in ton-transaction-history function:', error)
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