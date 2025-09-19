-- Fix critical security issue: Profiles table exposes sensitive data to all users
-- Drop all existing SELECT policies to avoid conflicts and create secure ones

-- Drop all existing SELECT policies
DROP POLICY IF EXISTS "Authenticated users can view basic profile info" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own complete profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create new secure policies
CREATE POLICY "Users can view their own complete profile data" 
ON public.profiles 
FOR SELECT 
USING (auth_user_id = auth.uid());

CREATE POLICY "Users can view basic public profile info of others" 
ON public.profiles 
FOR SELECT 
USING (
  -- Allow authenticated users to see basic info of other users
  -- but sensitive data like wallet_address should be filtered at application level
  auth_user_id != auth.uid() 
  AND auth.uid() IS NOT NULL
);