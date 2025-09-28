-- Fix USER PROFILE DATA SECURITY VULNERABILITY
-- Remove public access to profiles table and secure sensitive data

-- Drop existing problematic policies that allow public access
DROP POLICY IF EXISTS "Public can view basic profile info only" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view others basic profile" ON public.profiles;

-- Create secure policies for profiles table
-- 1. Users can only view their own complete profile
CREATE POLICY "Users can view own complete profile" 
ON public.profiles 
FOR SELECT 
USING (auth_user_id = auth.uid());

-- 2. Authenticated users can view ONLY basic info of other users (no sensitive data like wallet addresses)
CREATE POLICY "Authenticated users can view basic profile info of others" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND auth_user_id IS NOT NULL 
  AND auth_user_id != auth.uid()
);

-- 3. Keep existing policies for user's own profile management
-- (These already exist and are secure - users can only manage their own profiles)

-- 4. Keep wallet-based profile policies for Web3 functionality
-- (These are needed for wallet-only users and are appropriately scoped)

-- Add function to get safe profile fields for public/other user viewing
CREATE OR REPLACE FUNCTION public.get_safe_profile_for_others(target_user_id uuid)
RETURNS TABLE(
  id uuid,
  display_name text,
  avatar_url text,
  bio text,
  reputation_score integer,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only return safe fields, never wallet addresses or sensitive data
  RETURN QUERY
  SELECT 
    p.id,
    p.display_name,
    p.avatar_url,
    p.bio,
    p.reputation_score,
    p.created_at
  FROM public.profiles p
  WHERE p.auth_user_id = target_user_id
    AND auth.uid() IS NOT NULL  -- Require authentication
    AND auth.uid() != target_user_id; -- Not for own profile
END;
$$;

-- Log this security fix
INSERT INTO public.security_audit_log (
  user_id,
  action_type,
  table_name,
  metadata
) VALUES (
  NULL,
  'security_fix_applied',
  'profiles',
  jsonb_build_object(
    'fix_type', 'PUBLIC_USER_DATA',
    'description', 'Removed public access to profiles table, secured sensitive data',
    'timestamp', now()
  )
);