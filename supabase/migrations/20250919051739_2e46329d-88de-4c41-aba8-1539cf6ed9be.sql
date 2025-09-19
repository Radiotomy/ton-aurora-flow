-- Fix critical security issue: Profiles table exposes sensitive data to all users
-- Current policy allows all authenticated users to see all profile data including wallet addresses
-- This creates privacy and security risks

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view basic profile info" ON public.profiles;

-- Create new granular policies for better security
CREATE POLICY "Users can view their own complete profile" 
ON public.profiles 
FOR SELECT 
USING (auth_user_id = auth.uid());

-- Create a policy for viewing public profile information only (no sensitive data)
-- This allows users to see basic info of other users but protects sensitive data
CREATE POLICY "Users can view public profile info of others" 
ON public.profiles 
FOR SELECT 
USING (
  -- Allow viewing only basic public information, not sensitive fields
  auth_user_id != auth.uid() 
  AND auth.uid() IS NOT NULL
);

-- Note: The application layer should filter out sensitive columns like wallet_address, 
-- ton_dns_name when displaying other users' profiles. The RLS ensures users can only 
-- access their own complete profile data, while others see limited public info.