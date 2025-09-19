-- Fix critical security issue: Incorrect RLS policy on audio_rewards_history table
-- The current policy incorrectly compares profile_id directly with auth.uid()
-- but profile_id references profiles.id, not auth.users.id

-- Drop the incorrect policy
DROP POLICY IF EXISTS "Users can view their own rewards history" ON public.audio_rewards_history;
DROP POLICY IF EXISTS "Users can update their own rewards history" ON public.audio_rewards_history;

-- Create correct policies that properly join through the profiles table
CREATE POLICY "Users can view their own rewards history" 
ON public.audio_rewards_history 
FOR SELECT 
USING (
  profile_id IN (
    SELECT profiles.id
    FROM profiles
    WHERE profiles.auth_user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own rewards history" 
ON public.audio_rewards_history 
FOR UPDATE 
USING (
  profile_id IN (
    SELECT profiles.id
    FROM profiles
    WHERE profiles.auth_user_id = auth.uid()
  )
);