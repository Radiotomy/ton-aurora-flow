-- Privacy Security Fixes: Restrict access to sensitive user data
-- Fix user social connections, favorites, and voting patterns exposure

-- 1. Fix User Connections Privacy
-- Drop overly permissive policy and create restrictive ones
DROP POLICY IF EXISTS "Authenticated users can view connections" ON public.user_connections;

CREATE POLICY "Users can view their own connections" 
ON public.user_connections 
FOR SELECT 
USING (
  -- Users can only see connections where they are the follower or being followed
  follower_id IN (
    SELECT profiles.id
    FROM profiles
    WHERE profiles.auth_user_id = auth.uid()
  )
  OR following_id IN (
    SELECT profiles.id
    FROM profiles
    WHERE profiles.auth_user_id = auth.uid()
  )
);

-- 2. Fix User Favorites Privacy
-- Drop overly permissive policy and create restrictive one
DROP POLICY IF EXISTS "Users can view favorites (authenticated only)" ON public.user_favorites;

CREATE POLICY "Users can view their own favorites only" 
ON public.user_favorites 
FOR SELECT 
USING (
  -- Users can only see their own favorites
  profile_id IN (
    SELECT profiles.id
    FROM profiles
    WHERE profiles.auth_user_id = auth.uid()
  )
);

-- 3. Fix Poll Votes Privacy (Anonymous Voting)
-- Drop overly permissive policy and create restrictive one
DROP POLICY IF EXISTS "Authenticated users can view poll votes" ON public.poll_votes;

CREATE POLICY "Users can view their own votes only" 
ON public.poll_votes 
FOR SELECT 
USING (
  -- Users can only see their own votes, not others' voting patterns
  profile_id IN (
    SELECT profiles.id
    FROM profiles
    WHERE profiles.auth_user_id = auth.uid()
  )
);

-- Note: Keeping token_conversion_rates publicly readable as these are just exchange rates
-- and don't expose sensitive user data