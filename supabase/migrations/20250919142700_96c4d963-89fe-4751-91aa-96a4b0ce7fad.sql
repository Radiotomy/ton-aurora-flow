-- Emergency fix: Create hybrid RLS policies for wallet + auth compatibility
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their own complete profile data" ON public.profiles;
DROP POLICY IF EXISTS "Users can view basic public profile info of others" ON public.profiles;

-- Allow wallet-based profile creation without auth session
CREATE POLICY "Allow wallet-based profile operations" 
ON public.profiles 
FOR ALL
USING (
  -- Allow access to profiles with wallet_address but no auth_user_id (wallet-only users)
  wallet_address IS NOT NULL AND auth_user_id IS NULL
)
WITH CHECK (
  -- Allow creating/updating wallet-only profiles
  wallet_address IS NOT NULL AND auth_user_id IS NULL
);

-- Allow authenticated users full access to their own profiles
CREATE POLICY "Authenticated users full access to own profiles"
ON public.profiles 
FOR ALL
USING (auth_user_id = auth.uid())
WITH CHECK (auth_user_id = auth.uid());

-- Allow authenticated users to view basic info of others (non-sensitive fields only)
CREATE POLICY "Authenticated users view others basic info"
ON public.profiles
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND auth_user_id != auth.uid()
);

-- Allow public read access to basic non-sensitive profile fields
CREATE POLICY "Public read access to basic profile info"
ON public.profiles
FOR SELECT  
USING (true);

-- Note: Application layer must filter sensitive fields (wallet_address, audio_token_balance, etc.) 
-- for public and cross-user access