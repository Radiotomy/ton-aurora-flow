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

    const apiKey = Deno.env.get('TONCENTER_API_KEY')
    if (!apiKey) {
      throw new Error('TonCenter API key not configured')
    }

    const apiBase = isTestnet 
      ? 'https://testnet.toncenter.com/api/v2'
      : 'https://toncenter.com/api/v2'

    const url = `${apiBase}/getAddressInformation?address=${address}&api_key=${apiKey}`
    
    const response = await fetch(url)
    const data = await response.json()

    if (!data.ok) {
      throw new Error(`TonCenter API error: ${data.error || 'Unknown error'}`)
    }

    const balanceNanotons = BigInt(data.result.balance)
    const balanceTon = Number(balanceNanotons) / 1e9

    const result = {
      balance: balanceNanotons.toString(),
      formatted: balanceTon.toFixed(4),
      nanotons: balanceNanotons.toString(),
      lastUpdated: new Date().toISOString(),
      accountState: data.result.account_state
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