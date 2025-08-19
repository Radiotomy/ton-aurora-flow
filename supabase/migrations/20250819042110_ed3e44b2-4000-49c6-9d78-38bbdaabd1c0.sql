-- SECURITY FIX: Enable RLS and create proper policies for existing tables

-- Enable Row Level Security for profiles table (if not already enabled)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can insert profiles" ON public.profiles;

-- Create secure RLS policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = auth_user_id);

-- Fix fan_club_memberships table security
-- Drop overly permissive policies
DROP POLICY IF EXISTS "Anyone can manage fan club memberships" ON public.fan_club_memberships;
DROP POLICY IF EXISTS "Anyone can view fan club memberships" ON public.fan_club_memberships;
DROP POLICY IF EXISTS "Fan club memberships are viewable by everyone" ON public.fan_club_memberships;

-- Create secure policies for fan_club_memberships
CREATE POLICY "Users can view their own memberships" 
ON public.fan_club_memberships 
FOR SELECT 
USING (profile_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can create their own memberships" 
ON public.fan_club_memberships 
FOR INSERT 
WITH CHECK (profile_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()));

-- Secure listening_history policies
DROP POLICY IF EXISTS "Anyone can view listening history" ON public.listening_history;
DROP POLICY IF EXISTS "Anyone can insert listening history" ON public.listening_history;

CREATE POLICY "Users can view their own listening history" 
ON public.listening_history 
FOR SELECT 
USING (profile_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can insert their own listening history" 
ON public.listening_history 
FOR INSERT 
WITH CHECK (profile_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()));

-- Secure track_collections policies
DROP POLICY IF EXISTS "Anyone can view track collections" ON public.track_collections;
DROP POLICY IF EXISTS "Anyone can insert track collections" ON public.track_collections;

CREATE POLICY "Users can view their own track collections" 
ON public.track_collections 
FOR SELECT 
USING (profile_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can insert their own track collections" 
ON public.track_collections 
FOR INSERT 
WITH CHECK (profile_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()));

-- Secure user_assets policies
DROP POLICY IF EXISTS "Anyone can view user assets" ON public.user_assets;
DROP POLICY IF EXISTS "Anyone can insert user assets" ON public.user_assets;

CREATE POLICY "Users can view their own assets" 
ON public.user_assets 
FOR SELECT 
USING (profile_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can insert their own assets" 
ON public.user_assets 
FOR INSERT 
WITH CHECK (profile_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()));

-- Create transactions table for payment tracking (this table doesn't exist yet)
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  to_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  transaction_hash TEXT NOT NULL UNIQUE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('tip', 'nft_purchase', 'fan_club_membership', 'reward')),
  amount_ton DECIMAL(18,8) NOT NULL,
  fee_ton DECIMAL(18,8) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Create secure RLS policies for transactions
CREATE POLICY "Users can view their own transactions" 
ON public.transactions 
FOR SELECT 
USING (
  from_profile_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()) OR
  to_profile_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
);

CREATE POLICY "Users can create transactions they send" 
ON public.transactions 
FOR INSERT 
WITH CHECK (from_profile_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()));

-- Add trigger for transactions updated_at
CREATE TRIGGER update_transactions_updated_at
BEFORE UPDATE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_hash ON public.transactions(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_transactions_from_profile ON public.transactions(from_profile_id);
CREATE INDEX IF NOT EXISTS idx_transactions_to_profile ON public.transactions(to_profile_id);