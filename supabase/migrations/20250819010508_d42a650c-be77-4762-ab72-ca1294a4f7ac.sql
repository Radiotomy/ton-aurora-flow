-- Create user profiles table with Web3 identity
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT UNIQUE,
  ton_dns_name TEXT,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  reputation_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user assets table for NFT tracking
CREATE TABLE public.user_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL, -- 'nft', 'token', 'achievement'
  contract_address TEXT,
  token_id TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create fan club memberships table
CREATE TABLE public.fan_club_memberships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  artist_id TEXT NOT NULL,
  membership_tier TEXT NOT NULL, -- 'bronze', 'silver', 'gold', 'platinum'
  nft_token_id TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create listening history table
CREATE TABLE public.listening_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  track_id TEXT NOT NULL,
  artist_id TEXT NOT NULL,
  played_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  duration_played INTEGER, -- in seconds
  tip_amount NUMERIC(10,4) DEFAULT 0 -- TON amount tipped
);

-- Create track collections table (for NFT ownership)
CREATE TABLE public.track_collections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  track_id TEXT NOT NULL,
  nft_contract_address TEXT,
  nft_token_id TEXT,
  purchase_price NUMERIC(10,4),
  collected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fan_club_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listening_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.track_collections ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles (public read, own update)
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (wallet_address = current_setting('app.current_wallet_address', true));

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (wallet_address = current_setting('app.current_wallet_address', true));

-- Create RLS policies for user assets
CREATE POLICY "Users can view their own assets" 
ON public.user_assets 
FOR SELECT 
USING (profile_id IN (SELECT id FROM public.profiles WHERE wallet_address = current_setting('app.current_wallet_address', true)));

CREATE POLICY "Users can insert their own assets" 
ON public.user_assets 
FOR INSERT 
WITH CHECK (profile_id IN (SELECT id FROM public.profiles WHERE wallet_address = current_setting('app.current_wallet_address', true)));

-- Create RLS policies for fan club memberships (viewable by everyone for social features)
CREATE POLICY "Fan club memberships are viewable by everyone" 
ON public.fan_club_memberships 
FOR SELECT 
USING (true);

CREATE POLICY "Users can manage their own memberships" 
ON public.fan_club_memberships 
FOR ALL 
USING (profile_id IN (SELECT id FROM public.profiles WHERE wallet_address = current_setting('app.current_wallet_address', true)));

-- Create RLS policies for listening history
CREATE POLICY "Users can view their own listening history" 
ON public.listening_history 
FOR SELECT 
USING (profile_id IN (SELECT id FROM public.profiles WHERE wallet_address = current_setting('app.current_wallet_address', true)));

CREATE POLICY "Users can insert their own listening history" 
ON public.listening_history 
FOR INSERT 
WITH CHECK (profile_id IN (SELECT id FROM public.profiles WHERE wallet_address = current_setting('app.current_wallet_address', true)));

-- Create RLS policies for track collections
CREATE POLICY "Users can view their own collections" 
ON public.track_collections 
FOR SELECT 
USING (profile_id IN (SELECT id FROM public.profiles WHERE wallet_address = current_setting('app.current_wallet_address', true)));

CREATE POLICY "Users can insert into their own collections" 
ON public.track_collections 
FOR INSERT 
WITH CHECK (profile_id IN (SELECT id FROM public.profiles WHERE wallet_address = current_setting('app.current_wallet_address', true)));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();