-- Create platform_treasury table to track reward pool balances
CREATE TABLE public.platform_treasury (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_type text NOT NULL UNIQUE, -- 'TON' or 'AUDIO'
  balance numeric NOT NULL DEFAULT 0,
  allocated_to_rewards numeric NOT NULL DEFAULT 0,
  reserved_amount numeric NOT NULL DEFAULT 0,
  last_funded_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create treasury_movements table for complete audit trail
CREATE TABLE public.treasury_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  movement_type text NOT NULL, -- 'fee_collection', 'reward_allocation', 'reward_payout', 'manual_deposit', 'manual_withdrawal'
  token_type text NOT NULL,
  amount numeric NOT NULL,
  from_source text, -- e.g., 'platform_fees', 'nft_royalties', 'admin_deposit'
  to_destination text, -- e.g., 'reward_pool', 'user_claim', 'profile_id'
  reference_id uuid, -- links to transaction, profile, etc.
  transaction_hash text,
  performed_by uuid, -- admin who performed manual operations
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create reward_caps table for configurable limits
CREATE TABLE public.reward_caps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reward_type text NOT NULL UNIQUE, -- 'welcome_bonus', 'referral', 'first_tip', 'first_mint', 'activity', 'achievement'
  max_per_user numeric NOT NULL DEFAULT 50,
  max_daily_platform numeric NOT NULL DEFAULT 5000,
  current_daily_used numeric NOT NULL DEFAULT 0,
  last_reset_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_reward_claims to track per-user claiming
CREATE TABLE public.user_reward_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL,
  reward_type text NOT NULL,
  amount_claimed numeric NOT NULL DEFAULT 0,
  claims_today integer NOT NULL DEFAULT 0,
  last_claim_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(profile_id, reward_type)
);

-- Enable RLS on all tables
ALTER TABLE public.platform_treasury ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treasury_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_caps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reward_claims ENABLE ROW LEVEL SECURITY;

-- Treasury table: Admin only read/write
CREATE POLICY "Only admins can view treasury"
ON public.platform_treasury FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can manage treasury"
ON public.platform_treasury FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Treasury movements: Admin only read, system can insert
CREATE POLICY "Admins can view treasury movements"
ON public.treasury_movements FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert treasury movements"
ON public.treasury_movements FOR INSERT
WITH CHECK (true);

-- Reward caps: Admin can manage, authenticated can read
CREATE POLICY "Authenticated users can view reward caps"
ON public.reward_caps FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only admins can manage reward caps"
ON public.reward_caps FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- User reward claims: Users can view own, system can manage
CREATE POLICY "Users can view own reward claims"
ON public.user_reward_claims FOR SELECT
USING (profile_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "System can manage reward claims"
ON public.user_reward_claims FOR ALL
USING (true)
WITH CHECK (true);

-- Create atomic reward transfer function (SECURITY DEFINER for transaction safety)
CREATE OR REPLACE FUNCTION public.atomic_reward_transfer(
  p_profile_id uuid,
  p_amount numeric,
  p_reward_type text,
  p_source text DEFAULT 'treasury_distribution'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  WHERE token_type = 'AUDIO'
  FOR UPDATE;
  
  IF v_treasury_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Treasury not initialized');
  END IF;
  
  IF v_treasury_balance < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient treasury funds');
  END IF;
  
  -- Check reward caps
  SELECT max_per_user, max_daily_platform, current_daily_used
  INTO v_max_per_user, v_max_daily_platform, v_daily_platform_used
  FROM reward_caps
  WHERE reward_type = p_reward_type AND is_active = true;
  
  IF v_max_daily_platform IS NOT NULL AND (v_daily_platform_used + p_amount) > v_max_daily_platform THEN
    RETURN jsonb_build_object('success', false, 'error', 'Daily platform limit reached');
  END IF;
  
  -- Check user limit
  SELECT COALESCE(amount_claimed, 0) INTO v_user_claimed
  FROM user_reward_claims
  WHERE profile_id = p_profile_id AND reward_type = p_reward_type;
  
  IF v_max_per_user IS NOT NULL AND (COALESCE(v_user_claimed, 0) + p_amount) > v_max_per_user THEN
    RETURN jsonb_build_object('success', false, 'error', 'User limit reached for this reward type');
  END IF;
  
  -- Deduct from treasury
  UPDATE platform_treasury 
  SET allocated_to_rewards = allocated_to_rewards - p_amount,
      updated_at = now()
  WHERE token_type = 'AUDIO';
  
  -- Credit user's audio balance
  INSERT INTO audio_token_balances (profile_id, balance, pending_rewards, updated_at)
  VALUES (p_profile_id, 0, p_amount, now())
  ON CONFLICT (profile_id) 
  DO UPDATE SET 
    pending_rewards = audio_token_balances.pending_rewards + p_amount,
    updated_at = now();
  
  -- Record in rewards history
  INSERT INTO audio_rewards_history (profile_id, reward_type, amount, source, claimed, created_at)
  VALUES (p_profile_id, p_reward_type, p_amount, p_source, false, now());
  
  -- Update user reward claims tracking
  INSERT INTO user_reward_claims (profile_id, reward_type, amount_claimed, claims_today, last_claim_at, updated_at)
  VALUES (p_profile_id, p_reward_type, p_amount, 1, now(), now())
  ON CONFLICT (profile_id, reward_type)
  DO UPDATE SET
    amount_claimed = user_reward_claims.amount_claimed + p_amount,
    claims_today = user_reward_claims.claims_today + 1,
    last_claim_at = now(),
    updated_at = now();
  
  -- Update daily platform usage
  UPDATE reward_caps
  SET current_daily_used = current_daily_used + p_amount,
      updated_at = now()
  WHERE reward_type = p_reward_type;
  
  -- Log the treasury movement
  INSERT INTO treasury_movements (
    movement_type, token_type, amount, from_source, to_destination, reference_id
  ) VALUES (
    'reward_payout', 'AUDIO', p_amount, 'reward_pool', p_reward_type, p_profile_id
  );
  
  RETURN jsonb_build_object(
    'success', true, 
    'amount', p_amount, 
    'new_treasury_balance', v_treasury_balance - p_amount
  );
END;
$$;

-- Create function to allocate fees to reward pool
CREATE OR REPLACE FUNCTION public.allocate_fees_to_rewards(
  p_fee_amount numeric,
  p_token_type text,
  p_allocation_percentage numeric DEFAULT 0.5
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_allocation_amount numeric;
BEGIN
  v_allocation_amount := p_fee_amount * p_allocation_percentage;
  
  -- Update treasury
  INSERT INTO platform_treasury (token_type, balance, allocated_to_rewards, last_funded_at)
  VALUES (p_token_type, p_fee_amount, v_allocation_amount, now())
  ON CONFLICT (token_type)
  DO UPDATE SET
    balance = platform_treasury.balance + p_fee_amount,
    allocated_to_rewards = platform_treasury.allocated_to_rewards + v_allocation_amount,
    last_funded_at = now(),
    updated_at = now();
  
  -- Log the movement
  INSERT INTO treasury_movements (
    movement_type, token_type, amount, from_source, to_destination
  ) VALUES (
    'fee_collection', p_token_type, p_fee_amount, 'platform_fees', 'treasury'
  );
  
  INSERT INTO treasury_movements (
    movement_type, token_type, amount, from_source, to_destination
  ) VALUES (
    'reward_allocation', p_token_type, v_allocation_amount, 'treasury', 'reward_pool'
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'fee_collected', p_fee_amount,
    'allocated_to_rewards', v_allocation_amount
  );
END;
$$;

-- Create function to check reward budget before distribution
CREATE OR REPLACE FUNCTION public.check_reward_budget(
  p_profile_id uuid,
  p_amount numeric,
  p_reward_type text
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_treasury_balance numeric;
  v_max_per_user numeric;
  v_user_claimed numeric;
  v_daily_platform_used numeric;
  v_max_daily_platform numeric;
  v_is_active boolean;
BEGIN
  -- Check treasury balance
  SELECT allocated_to_rewards INTO v_treasury_balance
  FROM platform_treasury
  WHERE token_type = 'AUDIO';
  
  IF v_treasury_balance IS NULL OR v_treasury_balance < p_amount THEN
    RETURN jsonb_build_object(
      'can_distribute', false, 
      'reason', 'Insufficient treasury funds',
      'treasury_balance', COALESCE(v_treasury_balance, 0)
    );
  END IF;
  
  -- Check reward cap configuration
  SELECT max_per_user, max_daily_platform, current_daily_used, is_active
  INTO v_max_per_user, v_max_daily_platform, v_daily_platform_used, v_is_active
  FROM reward_caps
  WHERE reward_type = p_reward_type;
  
  IF v_is_active = false THEN
    RETURN jsonb_build_object('can_distribute', false, 'reason', 'Reward type is disabled');
  END IF;
  
  -- Check daily platform limit
  IF v_max_daily_platform IS NOT NULL AND (COALESCE(v_daily_platform_used, 0) + p_amount) > v_max_daily_platform THEN
    RETURN jsonb_build_object(
      'can_distribute', false, 
      'reason', 'Daily platform limit reached',
      'daily_used', v_daily_platform_used,
      'daily_limit', v_max_daily_platform
    );
  END IF;
  
  -- Check user limit
  SELECT COALESCE(amount_claimed, 0) INTO v_user_claimed
  FROM user_reward_claims
  WHERE profile_id = p_profile_id AND reward_type = p_reward_type;
  
  IF v_max_per_user IS NOT NULL AND (COALESCE(v_user_claimed, 0) + p_amount) > v_max_per_user THEN
    RETURN jsonb_build_object(
      'can_distribute', false, 
      'reason', 'User limit reached for this reward type',
      'user_claimed', v_user_claimed,
      'user_limit', v_max_per_user
    );
  END IF;
  
  RETURN jsonb_build_object(
    'can_distribute', true,
    'treasury_balance', v_treasury_balance,
    'user_claimed', COALESCE(v_user_claimed, 0),
    'daily_used', COALESCE(v_daily_platform_used, 0)
  );
END;
$$;

-- Create daily reset function for reward caps
CREATE OR REPLACE FUNCTION public.reset_daily_reward_caps()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE reward_caps
  SET current_daily_used = 0,
      last_reset_at = now(),
      updated_at = now()
  WHERE last_reset_at < now() - interval '24 hours';
  
  UPDATE user_reward_claims
  SET claims_today = 0,
      updated_at = now()
  WHERE last_claim_at < now() - interval '24 hours';
  
  INSERT INTO treasury_movements (
    movement_type, token_type, amount, from_source, to_destination, notes
  ) VALUES (
    'system_reset', 'AUDIO', 0, 'system', 'daily_caps', 'Daily reward caps reset'
  );
END;
$$;

-- Seed initial treasury records
INSERT INTO platform_treasury (token_type, balance, allocated_to_rewards)
VALUES 
  ('TON', 0, 0),
  ('AUDIO', 0, 0)
ON CONFLICT (token_type) DO NOTHING;

-- Seed initial reward caps
INSERT INTO reward_caps (reward_type, max_per_user, max_daily_platform, is_active)
VALUES 
  ('welcome_bonus', 50, 5000, true),
  ('referral', 500, 2500, true),
  ('first_tip', 15, 1500, true),
  ('first_mint', 20, 2000, true),
  ('activity', 100, 10000, true),
  ('achievement', 200, 5000, true)
ON CONFLICT (reward_type) DO NOTHING;