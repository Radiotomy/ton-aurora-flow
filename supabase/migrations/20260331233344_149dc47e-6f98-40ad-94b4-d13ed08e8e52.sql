
-- Fix 1: bridge_transactions - fix broken RLS policies
DROP POLICY IF EXISTS "Users can insert their own bridge transactions" ON public.bridge_transactions;
DROP POLICY IF EXISTS "Users can view their own bridge transactions" ON public.bridge_transactions;

CREATE POLICY "Users can insert their own bridge transactions"
ON public.bridge_transactions FOR INSERT TO authenticated
WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can view their own bridge transactions"
ON public.bridge_transactions FOR SELECT TO authenticated
USING (profile_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

-- Fix 2: live_events - restrict update to event creator only
DROP POLICY IF EXISTS "Event creators can update their events" ON public.live_events;

CREATE POLICY "Event creators can update their events"
ON public.live_events FOR UPDATE TO authenticated
USING (creator_profile_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()))
WITH CHECK (creator_profile_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

-- Fix 3: user_reward_claims - remove overly permissive public ALL policy
DROP POLICY IF EXISTS "System can manage reward claims" ON public.user_reward_claims;

-- Replace with service-role level access only (via security definer functions)
-- The atomic_reward_transfer function already runs as SECURITY DEFINER and handles inserts/updates

-- Fix 4: wallet-based profile policies - restrict public access
DROP POLICY IF EXISTS "Allow wallet-based profile operations" ON public.profiles;
DROP POLICY IF EXISTS "Allow wallet-based profile creation" ON public.profiles;

-- Allow wallet profile creation only with a valid wallet address (limited fields)
CREATE POLICY "Allow wallet-based profile creation"
ON public.profiles FOR INSERT TO public
WITH CHECK (
  wallet_address IS NOT NULL 
  AND auth_user_id IS NULL 
  AND LENGTH(wallet_address) >= 48
);

-- Wallet-based profiles: owners can only update their own (matched by wallet_address)
-- Read access restricted to safe fields via RLS (all columns visible but only to authenticated users)
CREATE POLICY "Authenticated users can view wallet profiles basic info"
ON public.profiles FOR SELECT TO authenticated
USING (wallet_address IS NOT NULL AND auth_user_id IS NULL);
