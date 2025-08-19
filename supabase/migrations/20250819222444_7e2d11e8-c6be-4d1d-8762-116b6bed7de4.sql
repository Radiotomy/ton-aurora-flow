-- Add RLS policy to allow wallet-based profile creation
-- This allows users to create profiles with wallet addresses when they don't have traditional auth
CREATE POLICY "Allow wallet-based profile creation" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
  wallet_address IS NOT NULL 
  AND auth_user_id IS NULL 
  AND auth.uid() IS NULL
);