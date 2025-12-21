import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AllocationRequest {
  fee_amount: number;
  token_type: 'TON' | 'AUDIO';
  allocation_percentage?: number;
  source?: string;
  transaction_hash?: string;
}

interface ManualDepositRequest {
  amount: number;
  token_type: 'TON' | 'AUDIO';
  allocate_to_rewards?: boolean;
  notes?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'allocate';

    console.log(`[Treasury Allocator] Action: ${action}`);

    if (action === 'allocate') {
      // Allocate platform fees to reward pool
      const body: AllocationRequest = await req.json();
      
      if (!body.fee_amount || body.fee_amount <= 0) {
        return new Response(
          JSON.stringify({ error: 'Invalid fee amount' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const allocationPercentage = body.allocation_percentage ?? 0.5;
      
      console.log(`[Treasury Allocator] Allocating ${body.fee_amount} ${body.token_type} with ${allocationPercentage * 100}% to rewards`);

      const { data, error } = await supabase.rpc('allocate_fees_to_rewards', {
        p_fee_amount: body.fee_amount,
        p_token_type: body.token_type,
        p_allocation_percentage: allocationPercentage
      });

      if (error) {
        console.error('[Treasury Allocator] Allocation error:', error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('[Treasury Allocator] Allocation successful:', data);
      
      return new Response(
        JSON.stringify({ success: true, ...data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'manual-deposit') {
      // Manual deposit by admin - requires admin authentication
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: 'Authorization required' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify admin role
      const { data: { user }, error: authError } = await supabase.auth.getUser(
        authHeader.replace('Bearer ', '')
      );

      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: 'Invalid authentication' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check admin role
      const { data: roleData } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin'
      });

      if (!roleData) {
        console.warn(`[Treasury Allocator] Unauthorized manual deposit attempt by user: ${user.id}`);
        return new Response(
          JSON.stringify({ error: 'Admin access required' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const body: ManualDepositRequest = await req.json();
      
      if (!body.amount || body.amount <= 0) {
        return new Response(
          JSON.stringify({ error: 'Invalid deposit amount' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`[Treasury Allocator] Admin ${user.id} depositing ${body.amount} ${body.token_type}`);

      // Update treasury balance
      const { error: updateError } = await supabase
        .from('platform_treasury')
        .update({
          balance: supabase.rpc('', {}), // We'll use raw SQL
          updated_at: new Date().toISOString()
        })
        .eq('token_type', body.token_type);

      // Use RPC for atomic update
      const allocateToRewards = body.allocate_to_rewards !== false;
      
      const { data: treasuryData, error: treasuryError } = await supabase
        .rpc('allocate_fees_to_rewards', {
          p_fee_amount: body.amount,
          p_token_type: body.token_type,
          p_allocation_percentage: allocateToRewards ? 1.0 : 0
        });

      if (treasuryError) {
        console.error('[Treasury Allocator] Manual deposit error:', treasuryError);
        return new Response(
          JSON.stringify({ error: treasuryError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Log the manual deposit movement
      await supabase.from('treasury_movements').insert({
        movement_type: 'manual_deposit',
        token_type: body.token_type,
        amount: body.amount,
        from_source: 'admin_deposit',
        to_destination: allocateToRewards ? 'reward_pool' : 'treasury',
        performed_by: user.id,
        notes: body.notes || `Manual deposit by admin`
      });

      console.log('[Treasury Allocator] Manual deposit successful');

      return new Response(
        JSON.stringify({ success: true, deposited: body.amount, ...treasuryData }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'status') {
      // Get treasury status - admin only
      const authHeader = req.headers.get('Authorization');
      
      if (authHeader) {
        const { data: { user } } = await supabase.auth.getUser(
          authHeader.replace('Bearer ', '')
        );
        
        if (user) {
          const { data: roleData } = await supabase.rpc('has_role', {
            _user_id: user.id,
            _role: 'admin'
          });

          if (roleData) {
            const { data: treasuryData } = await supabase
              .from('platform_treasury')
              .select('*');

            const { data: capsData } = await supabase
              .from('reward_caps')
              .select('*');

            const { data: recentMovements } = await supabase
              .from('treasury_movements')
              .select('*')
              .order('created_at', { ascending: false })
              .limit(50);

            return new Response(
              JSON.stringify({
                treasury: treasuryData,
                reward_caps: capsData,
                recent_movements: recentMovements
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }
      }

      // Non-admin: return limited info
      const { data: capsData } = await supabase
        .from('reward_caps')
        .select('reward_type, max_per_user, is_active');

      return new Response(
        JSON.stringify({ reward_caps: capsData }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('[Treasury Allocator] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
