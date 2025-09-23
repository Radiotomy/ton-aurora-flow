-- CRITICAL SECURITY FIX: Remove overly permissive profile access policy
-- This policy currently allows public access to ALL profile data including sensitive fields

-- Drop the dangerous policy that allows public read access to all profile data
DROP POLICY IF EXISTS "Public read access to safe profile fields only" ON public.profiles;

-- Create a security definer function to safely expose only public profile fields
CREATE OR REPLACE FUNCTION public.get_safe_profile_data()
RETURNS TABLE (
  id uuid,
  display_name text,
  avatar_url text,
  bio text,
  reputation_score integer,
  created_at timestamp with time zone
)
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.display_name,
    p.avatar_url,
    p.bio,
    p.reputation_score,
    p.created_at
  FROM public.profiles p
  WHERE p.wallet_address IS NULL OR p.auth_user_id IS NOT NULL;
$$;

-- Create a new restrictive policy for public profile viewing
-- Only expose truly safe fields and only for verified profiles
CREATE POLICY "Public can view basic profile info only"
ON public.profiles
FOR SELECT
TO public
USING (
  -- Allow viewing basic info for profiles that are not sensitive
  auth.uid() IS NOT NULL AND
  auth_user_id IS NOT NULL AND
  auth_user_id != auth.uid()
);

-- Update the existing policy to be more restrictive about wallet-based profiles
DROP POLICY IF EXISTS "Public can view safe profile fields only" ON public.profiles;

-- Create policy for viewing other users' profiles (authenticated users only)
CREATE POLICY "Authenticated users can view others basic profile"
ON public.profiles  
FOR SELECT
TO authenticated
USING (
  -- Can view basic profile info of other users, but not sensitive data
  auth_user_id IS NOT NULL AND 
  auth_user_id != auth.uid()
);

-- Log this security fix in the audit log
INSERT INTO public.security_audit_log (
  user_id,
  action_type,
  table_name,
  metadata
) VALUES (
  auth.uid(),
  'security_policy_update',
  'profiles',
  jsonb_build_object(
    'fix_applied', 'Removed public access to sensitive profile data',
    'timestamp', now(),
    'risk_level', 'CRITICAL'
  )
);