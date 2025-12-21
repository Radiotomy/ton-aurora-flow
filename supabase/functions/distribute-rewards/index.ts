import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DistributeRequest {
  profile_id: string;
  amount: number;
  reward_type: 'welcome_bonus' | 'referral' | 'first_tip' | 'first_mint' | 'activity' | 'achievement';
  source?: string;
  activity_proof?: {
    type: string;
    reference_id?: string;
    timestamp?: string;
  };
}

interface BulkDistributeRequest {
  distributions: DistributeRequest[];
}

// Rate limiting tracker (in-memory for edge function instance)
const rateLimitCache = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(profileId: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
  const now = Date.now();
  const key = profileId;
  const entry = rateLimitCache.get(key);

  if (!entry || entry.resetAt < now) {
    rateLimitCache.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false;
  }

  entry.count++;
  return true;
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
    const action = url.searchParams.get('action') || 'distribute';

    console.log(`[Distribute Rewards] Action: ${action}`);

    if (action === 'check-budget') {
      // Check if a reward can be distributed
      const { profile_id, amount, reward_type } = await req.json();

      if (!profile_id || !amount || !reward_type) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data, error } = await supabase.rpc('check_reward_budget', {
        p_profile_id: profile_id,
        p_amount: amount,
        p_reward_type: reward_type
      });

      if (error) {
        console.error('[Distribute Rewards] Budget check error:', error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify(data),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'distribute') {
      const body: DistributeRequest = await req.json();

      // Validate request
      if (!body.profile_id || !body.amount || !body.reward_type) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: profile_id, amount, reward_type' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (body.amount <= 0 || body.amount > 1000) {
        return new Response(
          JSON.stringify({ error: 'Invalid amount: must be between 0 and 1000' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Rate limit check
      if (!checkRateLimit(body.profile_id)) {
        console.warn(`[Distribute Rewards] Rate limit exceeded for profile: ${body.profile_id}`);
        
        // Log suspicious activity
        await supabase.from('security_audit_log').insert({
          user_id: null,
          action_type: 'rate_limit_exceeded',
          table_name: 'distribute_rewards',
          metadata: {
            profile_id: body.profile_id,
            reward_type: body.reward_type,
            amount: body.amount,
            timestamp: new Date().toISOString()
          }
        });

        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify profile exists
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, display_name')
        .eq('id', body.profile_id)
        .single();

      if (profileError || !profileData) {
        console.error('[Distribute Rewards] Profile not found:', body.profile_id);
        return new Response(
          JSON.stringify({ error: 'Profile not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check budget before distribution
      const { data: budgetCheck, error: budgetError } = await supabase.rpc('check_reward_budget', {
        p_profile_id: body.profile_id,
        p_amount: body.amount,
        p_reward_type: body.reward_type
      });

      if (budgetError) {
        console.error('[Distribute Rewards] Budget check failed:', budgetError);
        return new Response(
          JSON.stringify({ error: 'Budget verification failed' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!budgetCheck?.can_distribute) {
        console.warn(`[Distribute Rewards] Cannot distribute: ${budgetCheck?.reason}`);
        return new Response(
          JSON.stringify({ 
            error: budgetCheck?.reason || 'Distribution not allowed',
            details: budgetCheck
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify activity if proof is provided
      if (body.activity_proof) {
        const isValidActivity = await verifyActivity(supabase, body.profile_id, body.activity_proof);
        if (!isValidActivity) {
          console.warn(`[Distribute Rewards] Activity verification failed for profile: ${body.profile_id}`);
          
          await supabase.from('security_audit_log').insert({
            action_type: 'invalid_activity_proof',
            table_name: 'distribute_rewards',
            metadata: {
              profile_id: body.profile_id,
              reward_type: body.reward_type,
              activity_proof: body.activity_proof
            }
          });

          return new Response(
            JSON.stringify({ error: 'Activity verification failed' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      console.log(`[Distribute Rewards] Distributing ${body.amount} AUDIO to ${body.profile_id} for ${body.reward_type}`);

      // Execute atomic transfer
      const { data: transferResult, error: transferError } = await supabase.rpc('atomic_reward_transfer', {
        p_profile_id: body.profile_id,
        p_amount: body.amount,
        p_reward_type: body.reward_type,
        p_source: body.source || 'edge_function_distribution'
      });

      if (transferError) {
        console.error('[Distribute Rewards] Transfer error:', transferError);
        return new Response(
          JSON.stringify({ error: 'Reward transfer failed' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!transferResult?.success) {
        console.error('[Distribute Rewards] Transfer unsuccessful:', transferResult);
        return new Response(
          JSON.stringify({ error: transferResult?.error || 'Transfer failed' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`[Distribute Rewards] Successfully distributed ${body.amount} AUDIO to ${body.profile_id}`);

      return new Response(
        JSON.stringify({
          success: true,
          amount: body.amount,
          reward_type: body.reward_type,
          profile_id: body.profile_id,
          treasury_balance: transferResult.new_treasury_balance
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'bulk-distribute') {
      // Bulk distribution - admin only
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: 'Authorization required' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: { user }, error: authError } = await supabase.auth.getUser(
        authHeader.replace('Bearer ', '')
      );

      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: 'Invalid authentication' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: roleData } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin'
      });

      if (!roleData) {
        return new Response(
          JSON.stringify({ error: 'Admin access required' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const body: BulkDistributeRequest = await req.json();
      
      if (!body.distributions || !Array.isArray(body.distributions)) {
        return new Response(
          JSON.stringify({ error: 'Invalid distributions array' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`[Distribute Rewards] Admin bulk distribution: ${body.distributions.length} items`);

      const results = [];
      let successCount = 0;
      let failCount = 0;

      for (const dist of body.distributions) {
        const { data, error } = await supabase.rpc('atomic_reward_transfer', {
          p_profile_id: dist.profile_id,
          p_amount: dist.amount,
          p_reward_type: dist.reward_type,
          p_source: 'admin_bulk_distribution'
        });

        if (error || !data?.success) {
          failCount++;
          results.push({ profile_id: dist.profile_id, success: false, error: error?.message || data?.error });
        } else {
          successCount++;
          results.push({ profile_id: dist.profile_id, success: true, amount: dist.amount });
        }
      }

      console.log(`[Distribute Rewards] Bulk complete: ${successCount} success, ${failCount} failed`);

      return new Response(
        JSON.stringify({
          success: true,
          total: body.distributions.length,
          succeeded: successCount,
          failed: failCount,
          results
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'user-claims') {
      // Get user's reward claims - authenticated users can see their own
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: 'Authorization required' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: { user }, error: authError } = await supabase.auth.getUser(
        authHeader.replace('Bearer ', '')
      );

      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: 'Invalid authentication' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get user's profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (!profile) {
        return new Response(
          JSON.stringify({ claims: [], caps: [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: claims } = await supabase
        .from('user_reward_claims')
        .select('*')
        .eq('profile_id', profile.id);

      const { data: caps } = await supabase
        .from('reward_caps')
        .select('reward_type, max_per_user, is_active');

      return new Response(
        JSON.stringify({ claims: claims || [], caps: caps || [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('[Distribute Rewards] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper function to verify user activity
async function verifyActivity(
  supabase: ReturnType<typeof createClient>,
  profileId: string,
  proof: { type: string; reference_id?: string; timestamp?: string }
): Promise<boolean> {
  try {
    switch (proof.type) {
      case 'tip':
        // Verify the user actually sent a tip
        const { data: tipData } = await supabase
          .from('transactions')
          .select('id')
          .eq('from_profile_id', profileId)
          .eq('transaction_type', 'tip')
          .limit(1);
        return (tipData?.length || 0) > 0;

      case 'mint':
        // Verify the user minted an NFT
        const { data: mintData } = await supabase
          .from('user_assets')
          .select('id')
          .eq('profile_id', profileId)
          .eq('asset_type', 'nft')
          .limit(1);
        return (mintData?.length || 0) > 0;

      case 'listen':
        // Verify listening activity
        const { data: listenData } = await supabase
          .from('listening_history')
          .select('id')
          .eq('profile_id', profileId)
          .limit(1);
        return (listenData?.length || 0) > 0;

      case 'referral':
        // Verify referral - would need referred_by field
        return true; // Simplified for now

      case 'welcome':
        // Welcome bonus - verify new user
        const { data: profileData } = await supabase
          .from('profiles')
          .select('created_at')
          .eq('id', profileId)
          .single();
        
        if (!profileData) return false;
        
        const createdAt = new Date(profileData.created_at);
        const daysSinceCreation = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceCreation <= 7; // Welcome bonus valid for 7 days

      default:
        return true; // Allow unknown types (admin may add custom rewards)
    }
  } catch (error) {
    console.error('[Distribute Rewards] Activity verification error:', error);
    return false;
  }
}
