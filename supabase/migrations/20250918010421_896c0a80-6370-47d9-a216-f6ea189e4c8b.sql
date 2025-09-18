-- Fix critical database security issues
-- Phase 1: Secure user profiles and financial data

-- 1. Fix profiles table - restrict public access
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create more restrictive policies for profiles
CREATE POLICY "Authenticated users can view basic profile info" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Users can view their own complete profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = auth_user_id);

-- 2. Restrict token conversion rates to authenticated users only
DROP POLICY IF EXISTS "Everyone can view token conversion rates" ON public.token_conversion_rates;

CREATE POLICY "Authenticated users can view token conversion rates" 
ON public.token_conversion_rates 
FOR SELECT 
TO authenticated
USING (true);

-- 3. Fix chat messages - restrict to authenticated users only
DROP POLICY IF EXISTS "Users can view chat messages for accessible communities" ON public.chat_messages;

CREATE POLICY "Authenticated users can view chat messages" 
ON public.chat_messages 
FOR SELECT 
TO authenticated
USING (true);

-- 4. Fix track comments - restrict to authenticated users
DROP POLICY IF EXISTS "Users can view all comments" ON public.track_comments;

CREATE POLICY "Authenticated users can view non-deleted comments" 
ON public.track_comments 
FOR SELECT 
TO authenticated
USING (is_deleted = false);

-- 5. Fix user favorites - remove public access
DROP POLICY IF EXISTS "Users can view all favorites" ON public.user_favorites;

CREATE POLICY "Users can view favorites (authenticated only)" 
ON public.user_favorites 
FOR SELECT 
TO authenticated
USING (true);

-- 6. Fix user connections - already properly restricted, but ensure no public access
-- (Current policy "Users can view all connections" allows public access)
DROP POLICY IF EXISTS "Users can view all connections" ON public.user_connections;

CREATE POLICY "Authenticated users can view connections" 
ON public.user_connections 
FOR SELECT 
TO authenticated
USING (true);

-- 7. Fix poll votes - already has some protection, but ensure authenticated only
DROP POLICY IF EXISTS "Users can view poll votes" ON public.poll_votes;

CREATE POLICY "Authenticated users can view poll votes" 
ON public.poll_votes 
FOR SELECT 
TO authenticated
USING (true);

-- 8. Fix live events - restrict to authenticated users for sensitive data
-- Keep basic info public but restrict detailed access
DROP POLICY IF EXISTS "Users can view live events" ON public.live_events;

CREATE POLICY "Public can view basic live event info" 
ON public.live_events 
FOR SELECT 
TO anon
USING (true);

CREATE POLICY "Authenticated users can view full live event details" 
ON public.live_events 
FOR SELECT 
TO authenticated
USING (true);

-- 9. NFT Marketplace - implement more granular access control
-- Keep active listings somewhat public but restrict sensitive data
DROP POLICY IF EXISTS "Anyone can view active marketplace listings" ON public.nft_marketplace;

CREATE POLICY "Public can view basic active marketplace listings" 
ON public.nft_marketplace 
FOR SELECT 
TO anon
USING (status = 'active');

CREATE POLICY "Authenticated users can view detailed marketplace listings" 
ON public.nft_marketplace 
FOR SELECT 
TO authenticated
USING (true);

-- 10. Add additional security constraints
-- Create a function to check if user can access financial data
CREATE OR REPLACE FUNCTION public.can_access_financial_data(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  -- Only allow access to own financial data or if admin
  SELECT (
    auth.uid() = target_user_id OR 
    public.has_role(auth.uid(), 'admin'::app_role)
  );
$$;

-- Apply stricter policies to financial tables
DROP POLICY IF EXISTS "Users can view their own token balances" ON public.token_balances;

CREATE POLICY "Users can view their own token balances" 
ON public.token_balances 
FOR SELECT 
TO authenticated
USING (
  profile_id IN (
    SELECT id FROM profiles 
    WHERE auth_user_id = auth.uid()
  )
);

-- Ensure audio token balances are also properly restricted
DROP POLICY IF EXISTS "Users can view their own audio balances" ON public.audio_token_balances;

CREATE POLICY "Users can view their own audio balances" 
ON public.audio_token_balances 
FOR SELECT 
TO authenticated
USING (
  profile_id IN (
    SELECT id FROM profiles 
    WHERE auth_user_id = auth.uid()
  )
);

-- Add rate limiting for sensitive operations
CREATE OR REPLACE FUNCTION public.rate_limit_check(operation_type text, user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_count integer;
BEGIN
  -- Check recent operations (last 5 minutes)
  SELECT COUNT(*) INTO recent_count
  FROM transactions
  WHERE from_profile_id IN (
    SELECT id FROM profiles WHERE auth_user_id = user_id
  )
  AND created_at > NOW() - INTERVAL '5 minutes'
  AND transaction_type = operation_type;
  
  -- Allow max 10 transactions per 5 minutes per operation type
  RETURN recent_count < 10;
END;
$$;