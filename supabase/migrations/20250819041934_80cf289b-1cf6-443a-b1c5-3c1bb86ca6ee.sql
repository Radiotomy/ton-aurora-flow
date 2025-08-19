-- CRITICAL SECURITY FIX: Enable RLS and create policies for all tables

-- Enable Row Level Security for profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
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

-- Create tracks table for user-generated content
CREATE TABLE public.tracks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  audius_track_id TEXT,
  cover_art_url TEXT,
  audio_url TEXT,
  duration INTEGER DEFAULT 0,
  genre TEXT,
  mood TEXT,
  is_nft BOOLEAN DEFAULT false,
  nft_contract_address TEXT,
  nft_token_id TEXT,
  price_ton DECIMAL(18,8),
  royalty_percentage DECIMAL(5,2) DEFAULT 10.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for tracks
ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tracks
CREATE POLICY "Tracks are viewable by everyone" 
ON public.tracks 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own tracks" 
ON public.tracks 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tracks" 
ON public.tracks 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tracks" 
ON public.tracks 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create fan_clubs table
CREATE TABLE public.fan_clubs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  membership_price_ton DECIMAL(18,8) NOT NULL DEFAULT 0.1,
  total_members INTEGER DEFAULT 0,
  contract_address TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for fan_clubs
ALTER TABLE public.fan_clubs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for fan_clubs
CREATE POLICY "Fan clubs are viewable by everyone" 
ON public.fan_clubs 
FOR SELECT 
USING (true);

CREATE POLICY "Artists can create their own fan clubs" 
ON public.fan_clubs 
FOR INSERT 
WITH CHECK (auth.uid() = artist_id);

CREATE POLICY "Artists can update their own fan clubs" 
ON public.fan_clubs 
FOR UPDATE 
USING (auth.uid() = artist_id);

-- Create fan_club_memberships table
CREATE TABLE public.fan_club_memberships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fan_club_id UUID NOT NULL REFERENCES public.fan_clubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_hash TEXT NOT NULL,
  payment_amount_ton DECIMAL(18,8) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(fan_club_id, user_id)
);

-- Enable RLS for fan_club_memberships
ALTER TABLE public.fan_club_memberships ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for fan_club_memberships
CREATE POLICY "Users can view their own memberships" 
ON public.fan_club_memberships 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Artists can view their fan club memberships" 
ON public.fan_club_memberships 
FOR SELECT 
USING (auth.uid() IN (SELECT artist_id FROM public.fan_clubs WHERE id = fan_club_id));

CREATE POLICY "Users can create their own memberships" 
ON public.fan_club_memberships 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create transactions table for payment tracking
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  to_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
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

-- Create RLS policies for transactions
CREATE POLICY "Users can view their own transactions" 
ON public.transactions 
FOR SELECT 
USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can create transactions they send" 
ON public.transactions 
FOR INSERT 
WITH CHECK (auth.uid() = from_user_id);

-- Add triggers for updated_at columns
CREATE TRIGGER update_tracks_updated_at
BEFORE UPDATE ON public.tracks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fan_clubs_updated_at
BEFORE UPDATE ON public.fan_clubs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fan_club_memberships_updated_at
BEFORE UPDATE ON public.fan_club_memberships
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
BEFORE UPDATE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_tracks_user_id ON public.tracks(user_id);
CREATE INDEX idx_tracks_genre ON public.tracks(genre);
CREATE INDEX idx_tracks_is_nft ON public.tracks(is_nft);
CREATE INDEX idx_fan_clubs_artist_id ON public.fan_clubs(artist_id);
CREATE INDEX idx_fan_club_memberships_user_id ON public.fan_club_memberships(user_id);
CREATE INDEX idx_fan_club_memberships_fan_club_id ON public.fan_club_memberships(fan_club_id);
CREATE INDEX idx_transactions_hash ON public.transactions(transaction_hash);
CREATE INDEX idx_transactions_from_user ON public.transactions(from_user_id);
CREATE INDEX idx_transactions_to_user ON public.transactions(to_user_id);