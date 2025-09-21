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
    const { 
      fromAddress, 
      toAddress, 
      amount, 
      payload = null, 
      isTestnet = false,
      operationType = 'transfer' 
    } = await req.json()

    if (!fromAddress || !toAddress || !amount) {
      throw new Error('fromAddress, toAddress, and amount are required')
    }

    const chainstackApiKey = Deno.env.get('AUDIOTON_CHAIN')
    if (!chainstackApiKey) {
      throw new Error('Chainstack API key not configured')
    }

    // Chainstack TON API endpoint for fee estimation
    const apiBase = isTestnet 
      ? `https://nd-123-456-789.p2pify.com/${chainstackApiKey}/v3`
      : `https://nd-123-456-789.p2pify.com/${chainstackApiKey}/v3`

    // Use Chainstack's estimateFee method for accurate gas calculation
    const response = await fetch(`${apiBase}/estimateFee`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${chainstackApiKey}`
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "estimateFee",
        params: {
          from: fromAddress,
          to: toAddress,
          value: amount,
          data: payload,
          gas_limit: null // Let Chainstack estimate
        },
        id: 1
      })
    })

    const data = await response.json()

    if (data.error) {
      console.error('Chainstack fee estimation error:', data.error)
      // Fallback to operation-specific estimates if API fails
      const fallbackFees = getFallbackFees(operationType, amount)
      return new Response(
        JSON.stringify(fallbackFees),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse Chainstack fee estimation response
    const estimatedFee = data.result?.gas_used || data.result?.fee || '50000000' // 0.05 TON fallback
    const totalFee = BigInt(estimatedFee)
    
    // Add buffer for network fluctuations (20% extra)
    const feeWithBuffer = totalFee + (totalFee * BigInt(20) / BigInt(100))

    const result = {
      estimatedFee: totalFee.toString(),
      recommendedFee: feeWithBuffer.toString(),
      formattedFee: (Number(totalFee) / 1e9).toFixed(6),
      formattedRecommended: (Number(feeWithBuffer) / 1e9).toFixed(6),
      operationType,
      fromAddress,
      toAddress,
      amount: amount.toString(),
      gasUsed: data.result?.gas_used || estimatedFee,
      timestamp: new Date().toISOString(),
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
    console.error('Error in ton-fee-estimation function:', error)
    
    // Return fallback fee estimation on error
    const { operationType = 'transfer', amount = '0' } = await req.json().catch(() => ({}))
    const fallbackFees = getFallbackFees(operationType, amount)
    
    return new Response(
      JSON.stringify({ 
        ...fallbackFees, 
        error: 'Using fallback estimation: ' + error.message,
        chainstackPowered: false 
      }),
      { 
        status: 200, // Return 200 with fallback data
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }
      }
    )
  }
})

// Fallback fee calculations based on operation type
function getFallbackFees(operationType: string, amount: string) {
  const baseFees = {
    'transfer': '50000000',      // 0.05 TON
    'nft_mint': '200000000',     // 0.2 TON
    'nft_transfer': '100000000', // 0.1 TON
    'contract_deploy': '500000000', // 0.5 TON
    'fan_club': '150000000',     // 0.15 TON
    'tip': '30000000'            // 0.03 TON
  }

  const baseFee = BigInt(baseFees[operationType] || baseFees['transfer'])
  const feeWithBuffer = baseFee + (baseFee * BigInt(20) / BigInt(100))

  return {
    estimatedFee: baseFee.toString(),
    recommendedFee: feeWithBuffer.toString(),
    formattedFee: (Number(baseFee) / 1e9).toFixed(6),
    formattedRecommended: (Number(feeWithBuffer) / 1e9).toFixed(6),
    operationType,
    fallback: true,
    timestamp: new Date().toISOString()
  }
}