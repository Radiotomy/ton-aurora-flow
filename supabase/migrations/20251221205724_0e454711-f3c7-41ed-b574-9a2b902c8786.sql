-- Add token_type column to reward_caps (making it a unique constraint with reward_type)
ALTER TABLE public.reward_caps 
ADD COLUMN IF NOT EXISTS token_type text NOT NULL DEFAULT 'AUDIO';

-- Drop the existing unique constraint if it exists and create a new composite one
ALTER TABLE public.reward_caps
DROP CONSTRAINT IF EXISTS reward_caps_reward_type_key;

CREATE UNIQUE INDEX IF NOT EXISTS reward_caps_reward_type_token_type_idx 
ON public.reward_caps (reward_type, token_type);

-- Add token_type column to user_reward_claims
ALTER TABLE public.user_reward_claims
ADD COLUMN IF NOT EXISTS token_type text NOT NULL DEFAULT 'AUDIO';

-- Update unique constraint for user_reward_claims
ALTER TABLE public.user_reward_claims
DROP CONSTRAINT IF EXISTS user_reward_claims_profile_id_reward_type_key;

CREATE UNIQUE INDEX IF NOT EXISTS user_reward_claims_profile_reward_token_idx 
ON public.user_reward_claims (profile_id, reward_type, token_type);

-- Create user_reward_preferences table for storing token preferences
CREATE TABLE IF NOT EXISTS public.user_reward_preferences (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  preferred_token text NOT NULL DEFAULT 'AUDIO' CHECK (preferred_token IN ('AUDIO', 'TON')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(profile_id)
);

-- Enable RLS on user_reward_preferences
ALTER TABLE public.user_reward_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_reward_preferences
CREATE POLICY "Users can view own token preferences"
ON public.user_reward_preferences FOR SELECT
USING (profile_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can upsert own token preferences"
ON public.user_reward_preferences FOR INSERT
WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can update own token preferences"
ON public.user_reward_preferences FOR UPDATE
USING (profile_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

-- Add token_type to audio_rewards_history for tracking
ALTER TABLE public.audio_rewards_history
ADD COLUMN IF NOT EXISTS token_type text NOT NULL DEFAULT 'AUDIO';

-- Update atomic_reward_transfer function to support token_type
CREATE OR REPLACE FUNCTION public.atomic_reward_transfer(
  p_profile_id uuid, 
  p_amount numeric, 
  p_reward_type text, 
  p_source text DEFAULT 'treasury_distribution',
  p_token_type text DEFAULT 'AUDIO'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_treasury_balance numeric;
  v_max_per_user numeric;
  v_user_claimed numeric;
  v_daily_platform_used numeric;
  v_max_daily_platform numeric;
  v_result jsonb;
BEGIN
  -- Lock the treasury row to prevent race conditions
  SELECT allocated_to_rewards INTO v_treasury_balance
  FROM platform_treasury
  WHERE token_type = p_token_type
  FOR UPDATE;
  
  IF v_treasury_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Treasury not initialized for ' || p_token_type);
  END IF;
  
  IF v_treasury_balance < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient treasury funds for ' || p_token_type);
  END IF;
  
  -- Check reward caps for specific token type
  SELECT max_per_user, max_daily_platform, current_daily_used
  INTO v_max_per_user, v_max_daily_platform, v_daily_platform_used
  FROM reward_caps
  WHERE reward_type = p_reward_type AND token_type = p_token_type AND is_active = true;
  
  IF v_max_daily_platform IS NOT NULL AND (v_daily_platform_used + p_amount) > v_max_daily_platform THEN
    RETURN jsonb_build_object('success', false, 'error', 'Daily platform limit reached for ' || p_token_type);
  END IF;
  
  -- Check user limit for specific token type
  SELECT COALESCE(amount_claimed, 0) INTO v_user_claimed
  FROM user_reward_claims
  WHERE profile_id = p_profile_id AND reward_type = p_reward_type AND token_type = p_token_type;
  
  IF v_max_per_user IS NOT NULL AND (COALESCE(v_user_claimed, 0) + p_amount) > v_max_per_user THEN
    RETURN jsonb_build_object('success', false, 'error', 'User limit reached for this reward type with ' || p_token_type);
  END IF;
  
  -- Deduct from treasury
  UPDATE platform_treasury 
  SET allocated_to_rewards = allocated_to_rewards - p_amount,
      updated_at = now()
  WHERE token_type = p_token_type;
  
  -- Credit user's balance based on token type
  IF p_token_type = 'AUDIO' THEN
    INSERT INTO audio_token_balances (profile_id, balance, pending_rewards, updated_at)
    VALUES (p_profile_id, 0, p_amount, now())
    ON CONFLICT (profile_id) 
    DO UPDATE SET 
      pending_rewards = audio_token_balances.pending_rewards + p_amount,
      updated_at = now();
  ELSE
    -- For TON, use token_balances table
    INSERT INTO token_balances (profile_id, token_type, balance, last_updated)
    VALUES (p_profile_id, 'TON', p_amount, now())
    ON CONFLICT (profile_id, token_type) 
    DO UPDATE SET 
      balance = token_balances.balance + p_amount,
      last_updated = now();
  END IF;
  
  -- Record in rewards history with token type
  INSERT INTO audio_rewards_history (profile_id, reward_type, amount, source, claimed, created_at, token_type)
  VALUES (p_profile_id, p_reward_type, p_amount, p_source, false, now(), p_token_type);
  
  -- Update user reward claims tracking with token type
  INSERT INTO user_reward_claims (profile_id, reward_type, token_type, amount_claimed, claims_today, last_claim_at, updated_at)
  VALUES (p_profile_id, p_reward_type, p_token_type, p_amount, 1, now(), now())
  ON CONFLICT (profile_id, reward_type, token_type)
  DO UPDATE SET
    amount_claimed = user_reward_claims.amount_claimed + p_amount,
    claims_today = user_reward_claims.claims_today + 1,
    last_claim_at = now(),
    updated_at = now();
  
  -- Update daily platform usage for specific token type
  UPDATE reward_caps
  SET current_daily_used = current_daily_used + p_amount,
      updated_at = now()
  WHERE reward_type = p_reward_type AND token_type = p_token_type;
  
  -- Log the treasury movement
  INSERT INTO treasury_movements (
    movement_type, token_type, amount, from_source, to_destination, reference_id
  ) VALUES (
    'reward_payout', p_token_type, p_amount, 'reward_pool', p_reward_type, p_profile_id
  );
  
  RETURN jsonb_build_object(
    'success', true, 
    'amount', p_amount,
    'token_type', p_token_type,
    'new_treasury_balance', v_treasury_balance - p_amount
  );
END;
$function$;

-- Update check_reward_budget function to support token_type
CREATE OR REPLACE FUNCTION public.check_reward_budget(
  p_profile_id uuid, 
  p_amount numeric, 
  p_reward_type text,
  p_token_type text DEFAULT 'AUDIO'
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_treasury_balance numeric;
  v_max_per_user numeric;
  v_user_claimed numeric;
  v_daily_platform_used numeric;
  v_max_daily_platform numeric;
  v_is_active boolean;
BEGIN
  -- Check treasury balance for specific token type
  SELECT allocated_to_rewards INTO v_treasury_balance
  FROM platform_treasury
  WHERE token_type = p_token_type;
  
  IF v_treasury_balance IS NULL OR v_treasury_balance < p_amount THEN
    RETURN jsonb_build_object(
      'can_distribute', false, 
      'reason', 'Insufficient treasury funds for ' || p_token_type,
      'treasury_balance', COALESCE(v_treasury_balance, 0),
      'token_type', p_token_type
    );
  END IF;
  
  -- Check reward cap configuration for specific token type
  SELECT max_per_user, max_daily_platform, current_daily_used, is_active
  INTO v_max_per_user, v_max_daily_platform, v_daily_platform_used, v_is_active
  FROM reward_caps
  WHERE reward_type = p_reward_type AND token_type = p_token_type;
  
  IF v_is_active = false THEN
    RETURN jsonb_build_object('can_distribute', false, 'reason', 'Reward type is disabled for ' || p_token_type, 'token_type', p_token_type);
  END IF;
  
  -- Check daily platform limit
  IF v_max_daily_platform IS NOT NULL AND (COALESCE(v_daily_platform_used, 0) + p_amount) > v_max_daily_platform THEN
    RETURN jsonb_build_object(
      'can_distribute', false, 
      'reason', 'Daily platform limit reached for ' || p_token_type,
      'daily_used', v_daily_platform_used,
      'daily_limit', v_max_daily_platform,
      'token_type', p_token_type
    );
  END IF;
  
  -- Check user limit for specific token type
  SELECT COALESCE(amount_claimed, 0) INTO v_user_claimed
  FROM user_reward_claims
  WHERE profile_id = p_profile_id AND reward_type = p_reward_type AND token_type = p_token_type;
  
  IF v_max_per_user IS NOT NULL AND (COALESCE(v_user_claimed, 0) + p_amount) > v_max_per_user THEN
    RETURN jsonb_build_object(
      'can_distribute', false, 
      'reason', 'User limit reached for this reward type with ' || p_token_type,
      'user_claimed', v_user_claimed,
      'user_limit', v_max_per_user,
      'token_type', p_token_type
    );
  END IF;
  
  RETURN jsonb_build_object(
    'can_distribute', true,
    'treasury_balance', v_treasury_balance,
    'user_claimed', COALESCE(v_user_claimed, 0),
    'daily_used', COALESCE(v_daily_platform_used, 0),
    'token_type', p_token_type
  );
END;
$function$;

-- Add unique constraint for token_balances if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'token_balances_profile_id_token_type_key'
  ) THEN
    ALTER TABLE public.token_balances
    ADD CONSTRAINT token_balances_profile_id_token_type_key UNIQUE (profile_id, token_type);
  END IF;
END $$;

-- Insert TON reward caps matching AUDIO caps
INSERT INTO public.reward_caps (reward_type, token_type, max_per_user, max_daily_platform, is_active)
SELECT reward_type, 'TON', 
  CASE reward_type
    WHEN 'welcome_bonus' THEN 0.26
    WHEN 'referral' THEN 0.13
    WHEN 'first_tip' THEN 0.08
    WHEN 'first_mint' THEN 0.11
    WHEN 'activity' THEN 0.05
    WHEN 'achievement' THEN 0.52
    ELSE max_per_user * 0.0052  -- Rough conversion rate
  END,
  CASE reward_type
    WHEN 'welcome_bonus' THEN 26
    WHEN 'referral' THEN 26
    WHEN 'first_tip' THEN 13
    WHEN 'first_mint' THEN 21
    WHEN 'activity' THEN 52
    WHEN 'achievement' THEN 52
    ELSE max_daily_platform * 0.0052
  END,
  is_active
FROM public.reward_caps
WHERE token_type = 'AUDIO'
ON CONFLICT DO NOTHING;