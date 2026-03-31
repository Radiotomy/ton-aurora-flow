import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DistributeRequest {
  profile_id: string;
  amount: number;
  reward_type: 'welcome_bonus' | 'referral' | 'first_tip' | 'first_mint' | 'activity' | 'achievement';
  token_type?: 'AUDIO' | 'TON';
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

// Helper to authenticate user and get their profile
async function authenticateAndGetProfile(
  req: Request,
  supabase: any
): Promise<{ userId: string; profileId: string } | Response> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({ error: 'Authorization required' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const token = authHeader.replace('Bearer ', '');
  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims) {
    return new Response(
      JSON.stringify({ error: 'Invalid authentication' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const userId = data.claims.sub;

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('auth_user_id', userId)
    .single();

  if (!profile) {
    return new Response(
      JSON.stringify({ error: 'Profile not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return { userId, profileId: profile.id };
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
      // Require authentication for budget checks
      const authResult = await authenticateAndGetProfile(req, supabase);
      if (authResult instanceof Response) return authResult;

      const { profileId } = authResult;
      const { amount, reward_type, token_type = 'AUDIO' } = await req.json();

      if (!amount || !reward_type) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data, error } = await supabase.rpc('check_reward_budget', {
        p_profile_id: profileId,
        p_amount: amount,
        p_reward_type: reward_type,
        p_token_type: token_type
      });

      if (error) {
        console.error('[Distribute Rewards] Budget check error:', error);
        return new Response(
          JSON.stringify({ error: 'Budget check failed' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify(data),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'distribute') {
      // Require authentication
      const authResult = await authenticateAndGetProfile(req, supabase);
      if (authResult instanceof Response) return authResult;

      const { profileId } = authResult;
      const body: DistributeRequest = await req.json();
      const tokenType = body.token_type || 'AUDIO';

      // Enforce that user can only distribute to their own profile
      if (body.profile_id && body.profile_id !== profileId) {
        return new Response(
          JSON.stringify({ error: 'Cannot distribute rewards to another user' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const targetProfileId = profileId;

      // Validate request
      if (!body.amount || !body.reward_type) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: amount, reward_type' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (body.amount <= 0 || body.amount > 1000) {
        return new Response(
          JSON.stringify({ error: 'Invalid amount: must be between 0 and 1000' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validate token type
      if (!['AUDIO', 'TON'].includes(tokenType)) {
        return new Response(
          JSON.stringify({ error: 'Invalid token_type: must be AUDIO or TON' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Rate limit check
      if (!checkRateLimit(targetProfileId)) {
        console.warn(`[Distribute Rewards] Rate limit exceeded for profile: ${targetProfileId}`);
        
        await supabase.from('security_audit_log').insert({
          user_id: null,
          action_type: 'rate_limit_exceeded',
          table_name: 'distribute_rewards',
          metadata: {
            profile_id: targetProfileId,
            reward_type: body.reward_type,
            token_type: tokenType,
            amount: body.amount,
            timestamp: new Date().toISOString()
          }
        });

        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check budget before distribution
      const { data: budgetCheck, error: budgetError } = await supabase.rpc('check_reward_budget', {
        p_profile_id: targetProfileId,
        p_amount: body.amount,
        p_reward_type: body.reward_type,
        p_token_type: tokenType
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
        const isValidActivity = await verifyActivity(supabase, targetProfileId, body.activity_proof);
        if (!isValidActivity) {
          console.warn(`[Distribute Rewards] Activity verification failed for profile: ${targetProfileId}`);
          
          await supabase.from('security_audit_log').insert({
            action_type: 'invalid_activity_proof',
            table_name: 'distribute_rewards',
            metadata: {
              profile_id: targetProfileId,
              reward_type: body.reward_type,
              token_type: tokenType,
              activity_proof: body.activity_proof
            }
          });

          return new Response(
            JSON.stringify({ error: 'Activity verification failed' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      console.log(`[Distribute Rewards] Distributing ${body.amount} ${tokenType} to ${targetProfileId} for ${body.reward_type}`);

      // Execute atomic transfer
      const { data: transferResult, error: transferError } = await supabase.rpc('atomic_reward_transfer', {
        p_profile_id: targetProfileId,
        p_amount: body.amount,
        p_reward_type: body.reward_type,
        p_source: body.source || 'edge_function_distribution',
        p_token_type: tokenType
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

      console.log(`[Distribute Rewards] Successfully distributed ${body.amount} ${tokenType} to ${targetProfileId}`);

      return new Response(
        JSON.stringify({
          success: true,
          amount: body.amount,
          token_type: tokenType,
          reward_type: body.reward_type,
          profile_id: targetProfileId,
          treasury_balance: transferResult.new_treasury_balance
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'bulk-distribute') {
      // Bulk distribution - admin only
      const authResult = await authenticateAndGetProfile(req, supabase);
      if (authResult instanceof Response) return authResult;

      const { userId } = authResult;

      const { data: roleData } = await supabase.rpc('has_role', {
        _user_id: userId,
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
        const tokenType = dist.token_type || 'AUDIO';
        const { data, error } = await supabase.rpc('atomic_reward_transfer', {
          p_profile_id: dist.profile_id,
          p_amount: dist.amount,
          p_reward_type: dist.reward_type,
          p_source: 'admin_bulk_distribution',
          p_token_type: tokenType
        });

        if (error || !data?.success) {
          failCount++;
          results.push({ profile_id: dist.profile_id, success: false, error: error?.message || data?.error });
        } else {
          successCount++;
          results.push({ profile_id: dist.profile_id, success: true, amount: dist.amount, token_type: tokenType });
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
      const authResult = await authenticateAndGetProfile(req, supabase);
      if (authResult instanceof Response) return authResult;

      const { profileId } = authResult;

      const [claimsResult, capsResult, prefResult] = await Promise.all([
        supabase
          .from('user_reward_claims')
          .select('*')
          .eq('profile_id', profileId),
        supabase
          .from('reward_caps')
          .select('reward_type, token_type, max_per_user, max_daily_platform, current_daily_used, is_active'),
        supabase
          .from('user_reward_preferences')
          .select('preferred_token')
          .eq('profile_id', profileId)
          .single()
      ]);

      return new Response(
        JSON.stringify({ 
          claims: claimsResult.data || [], 
          caps: capsResult.data || [],
          preference: prefResult.data?.preferred_token || 'AUDIO'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'set-preference') {
      const authResult = await authenticateAndGetProfile(req, supabase);
      if (authResult instanceof Response) return authResult;

      const { profileId } = authResult;
      const { preferred_token } = await req.json();

      if (!['AUDIO', 'TON'].includes(preferred_token)) {
        return new Response(
          JSON.stringify({ error: 'Invalid token preference: must be AUDIO or TON' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error: upsertError } = await supabase
        .from('user_reward_preferences')
        .upsert({
          profile_id: profileId,
          preferred_token,
          updated_at: new Date().toISOString()
        }, { onConflict: 'profile_id' });

      if (upsertError) {
        console.error('[Distribute Rewards] Failed to set preference:', upsertError);
        return new Response(
          JSON.stringify({ error: 'Failed to save preference' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, preferred_token }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'get-preference') {
      const authResult = await authenticateAndGetProfile(req, supabase);
      if (authResult instanceof Response) {
        // For unauthenticated users, return default
        return new Response(
          JSON.stringify({ preferred_token: 'AUDIO' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { profileId } = authResult;

      const { data: pref } = await supabase
        .from('user_reward_preferences')
        .select('preferred_token')
        .eq('profile_id', profileId)
        .single();

      return new Response(
        JSON.stringify({ preferred_token: pref?.preferred_token || 'AUDIO' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'treasury-status') {
      const authResult = await authenticateAndGetProfile(req, supabase);
      if (authResult instanceof Response) return authResult;

      const { userId } = authResult;

      const { data: isAdmin } = await supabase.rpc('has_role', {
        _user_id: userId,
        _role: 'admin'
      });

      if (!isAdmin) {
        return new Response(
          JSON.stringify({ error: 'Admin access required' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const [treasuryResult, capsResult, recentMovements] = await Promise.all([
        supabase.from('platform_treasury').select('*'),
        supabase.from('reward_caps').select('*'),
        supabase
          .from('treasury_movements')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20)
      ]);

      return new Response(
        JSON.stringify({
          treasury: treasuryResult.data || [],
          caps: capsResult.data || [],
          recent_movements: recentMovements.data || []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Distribute Rewards] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Verify activity proof
async function verifyActivity(supabase: any, profileId: string, proof: any): Promise<boolean> {
  try {
    if (!proof.type) return false;

    switch (proof.type) {
      case 'listening': {
        if (!proof.reference_id) return false;
        const { data } = await supabase
          .from('listening_history')
          .select('id')
          .eq('profile_id', profileId)
          .eq('track_id', proof.reference_id)
          .limit(1);
        return (data?.length || 0) > 0;
      }
      case 'tip': {
        if (!proof.reference_id) return false;
        const { data } = await supabase
          .from('transactions')
          .select('id')
          .eq('from_profile_id', profileId)
          .eq('transaction_type', 'tip')
          .eq('id', proof.reference_id)
          .limit(1);
        return (data?.length || 0) > 0;
      }
      case 'nft_mint': {
        const { data } = await supabase
          .from('user_assets')
          .select('id')
          .eq('profile_id', profileId)
          .eq('asset_type', 'nft')
          .limit(1);
        return (data?.length || 0) > 0;
      }
      case 'fan_club': {
        const { data } = await supabase
          .from('fan_club_memberships')
          .select('id')
          .eq('profile_id', profileId)
          .limit(1);
        return (data?.length || 0) > 0;
      }
      default:
        return false;
    }
  } catch (error) {
    console.error('[Distribute Rewards] Activity verification error:', error);
    return false;
  }
}
