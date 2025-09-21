import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BatchRequest {
  id: string;
  type: 'balance' | 'transactions' | 'fee_estimate' | 'market_data';
  params: any;
}

interface BatchResponse {
  id: string;
  success: boolean;
  data?: any;
  error?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { requests, isTestnet = false } = await req.json() as { 
      requests: BatchRequest[]; 
      isTestnet?: boolean; 
    };

    if (!requests || !Array.isArray(requests) || requests.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid batch requests' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Limit batch size to prevent abuse
    if (requests.length > 10) {
      return new Response(
        JSON.stringify({ error: 'Batch size too large (max 10)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get API key from secrets
    const { data: apiKeyData } = await supabase
      .from('secrets')
      .select('value')
      .eq('name', 'AUDIOTON_CHAIN')
      .single();

    if (!apiKeyData?.value) {
      throw new Error('Chainstack API key not found');
    }

    const apiKey = apiKeyData.value;
    const baseUrl = isTestnet 
      ? 'https://nd-123-456-789.p2pify.com/testnet' 
      : 'https://nd-123-456-789.p2pify.com/mainnet';

    // Process requests in parallel but with rate limiting
    const results: BatchResponse[] = [];
    const batchSize = 3; // Process 3 at a time to respect rate limits
    
    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);
      const batchPromises = batch.map(async (request): Promise<BatchResponse> => {
        try {
          let data: any;
          
          switch (request.type) {
            case 'balance':
              data = await fetchBalance(baseUrl, apiKey, request.params.address);
              break;
              
            case 'transactions':
              data = await fetchTransactions(
                baseUrl, 
                apiKey, 
                request.params.address, 
                request.params.limit || 10,
                request.params.offset || 0
              );
              break;
              
            case 'fee_estimate':
              data = await estimateFee(
                baseUrl, 
                apiKey,
                request.params.fromAddress,
                request.params.toAddress,
                request.params.amount,
                request.params.operationType || 'transfer'
              );
              break;
              
            case 'market_data':
              data = await fetchMarketData(baseUrl, apiKey);
              break;
              
            default:
              throw new Error(`Unknown request type: ${request.type}`);
          }
          
          return { id: request.id, success: true, data };
        } catch (error) {
          return { 
            id: request.id, 
            success: false, 
            error: error.message || 'Unknown error' 
          };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Small delay between batches to respect rate limits
      if (i + batchSize < requests.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        batchId: crypto.randomUUID(),
        processedAt: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Batch operation error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function fetchBalance(baseUrl: string, apiKey: string, address: string) {
  const response = await fetch(`${baseUrl}/v3/${apiKey}/getWalletInformation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'getWalletInformation',
      params: { address }
    })
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  
  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  
  return {
    balance: data.result?.balance || '0',
    formatted: (parseFloat(data.result?.balance || '0') / 1e9).toFixed(4),
    nanotons: data.result?.balance || '0',
    lastUpdated: new Date().toISOString(),
    chainstackPowered: true,
    network: 'TON'
  };
}

async function fetchTransactions(
  baseUrl: string, 
  apiKey: string, 
  address: string, 
  limit: number,
  offset: number
) {
  const response = await fetch(`${baseUrl}/v3/${apiKey}/getTransactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'getTransactions',
      params: { address, limit, offset }
    })
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  
  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  
  return {
    transactions: data.result?.transactions || [],
    total: data.result?.total || 0,
    address,
    chainstackPowered: true
  };
}

async function estimateFee(
  baseUrl: string,
  apiKey: string,
  fromAddress: string,
  toAddress: string,
  amount: string,
  operationType: string
) {
  const response = await fetch(`${baseUrl}/v3/${apiKey}/estimateFee`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'estimateFee',
      params: { fromAddress, toAddress, amount, operationType }
    })
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  
  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  
  return {
    estimatedFee: data.result?.estimatedFee || '10000000',
    formattedFee: ((parseFloat(data.result?.estimatedFee || '10000000')) / 1e9).toFixed(6),
    recommendedFee: data.result?.recommendedFee || '15000000',
    formattedRecommended: ((parseFloat(data.result?.recommendedFee || '15000000')) / 1e9).toFixed(6),
    operationType,
    chainstackPowered: true,
    fallback: false
  };
}

async function fetchMarketData(baseUrl: string, apiKey: string) {
  // This would typically make multiple calls, but for batching we'll do a single call
  const response = await fetch(`${baseUrl}/v3/${apiKey}/getBlockchainInfo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'getBlockchainInfo'
    })
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  
  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  
  return {
    network: {
      name: 'TON',
      blockHeight: data.result?.blockHeight || 0,
      validators: data.result?.validators || 0
    },
    blockchain: {
      avgBlockTime: 5,
      tps: data.result?.tps || 0
    },
    market: {
      price: 0, // Would need CoinGecko call
      volume24h: 0,
      marketCap: 0
    },
    chainstackPowered: true,
    lastUpdated: new Date().toISOString()
  };
}