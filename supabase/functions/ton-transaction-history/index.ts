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

    const chainstackApiKey = Deno.env.get('AUDIOTON_CHAIN')
    if (!chainstackApiKey) {
      throw new Error('Chainstack API key not configured')
    }

    // Chainstack TON API endpoint for transaction history
    const apiBase = isTestnet 
      ? `https://nd-123-456-789.p2pify.com/${chainstackApiKey}/v3`
      : `https://nd-123-456-789.p2pify.com/${chainstackApiKey}/v3`

    const response = await fetch(`${apiBase}/getTransactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${chainstackApiKey}`
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "getTransactions",
        params: {
          address: address,
          limit: Math.min(limit, 100), // Cap at 100
          offset: offset,
          archival: true
        },
        id: 1
      })
    })

    const data = await response.json()

    if (data.error) {
      throw new Error(`Chainstack API error: ${data.error.message}`)
    }

    // Process and format transaction data
    const transactions = (data.result || []).map((tx: any) => ({
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