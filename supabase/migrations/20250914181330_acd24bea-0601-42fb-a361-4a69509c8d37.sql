-- Create token balances table for cross-chain support
CREATE TABLE IF NOT EXISTS public.token_balances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL,
  token_type TEXT NOT NULL CHECK (token_type IN ('TON', 'AUDIO')),
  balance DECIMAL(20,8) NOT NULL DEFAULT 0,
  locked_balance DECIMAL(20,8) NOT NULL DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(profile_id, token_type)
);

-- Create cross-chain token transactions table
CREATE TABLE IF NOT EXISTS public.cross_token_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL,
  from_token TEXT NOT NULL CHECK (from_token IN ('TON', 'AUDIO')),
  to_token TEXT NOT NULL CHECK (to_token IN ('TON', 'AUDIO')),
  from_amount DECIMAL(20,8) NOT NULL,
  to_amount DECIMAL(20,8) NOT NULL,
  conversion_rate DECIMAL(20,8) NOT NULL,
  fees DECIMAL(20,8) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  transaction_hash TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create token conversion rates table
CREATE TABLE IF NOT EXISTS public.token_conversion_rates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_token TEXT NOT NULL CHECK (from_token IN ('TON', 'AUDIO')),
  to_token TEXT NOT NULL CHECK (to_token IN ('TON', 'AUDIO')),
  rate DECIMAL(20,8) NOT NULL,
  source TEXT NOT NULL DEFAULT 'internal',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(from_token, to_token)
);

-- Create payment preferences table
CREATE TABLE IF NOT EXISTS public.payment_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  preferred_token TEXT NOT NULL CHECK (preferred_token IN ('TON', 'AUDIO')),
  auto_select BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(profile_id, action_type)
);

-- Create NFT marketplace table
CREATE TABLE IF NOT EXISTS public.nft_marketplace (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nft_id UUID NOT NULL,
  seller_profile_id UUID NOT NULL,
  listing_price DECIMAL(20,8) NOT NULL,
  listing_currency TEXT NOT NULL DEFAULT 'TON' CHECK (listing_currency IN ('TON', 'AUDIO')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'sold', 'cancelled', 'expired')),
  royalty_percentage DECIMAL(5,2) NOT NULL DEFAULT 2.5,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  sold_at TIMESTAMP WITH TIME ZONE,
  buyer_profile_id UUID
);

-- Enable RLS on all tables
ALTER TABLE public.token_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cross_token_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_conversion_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nft_marketplace ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for token_balances
CREATE POLICY "Users can view own token balances" 
ON public.token_balances FOR SELECT 
USING (auth.uid()::text = profile_id::text);

CREATE POLICY "Users can update own token balances" 
ON public.token_balances FOR UPDATE 
USING (auth.uid()::text = profile_id::text);

CREATE POLICY "System can manage token balances" 
ON public.token_balances FOR ALL 
USING (true);

-- Create RLS policies for cross_token_transactions
CREATE POLICY "Users can view own token transactions" 
ON public.cross_token_transactions FOR SELECT 
USING (auth.uid()::text = profile_id::text);

CREATE POLICY "Users can create token transactions" 
ON public.cross_token_transactions FOR INSERT 
WITH CHECK (auth.uid()::text = profile_id::text);

-- Create RLS policies for token_conversion_rates
CREATE POLICY "Anyone can view conversion rates" 
ON public.token_conversion_rates FOR SELECT 
USING (true);

-- Create RLS policies for payment_preferences
CREATE POLICY "Users can manage own payment preferences" 
ON public.payment_preferences FOR ALL 
USING (auth.uid()::text = profile_id::text);

-- Create RLS policies for nft_marketplace
CREATE POLICY "Anyone can view active marketplace listings" 
ON public.nft_marketplace FOR SELECT 
USING (status = 'active' OR auth.uid()::text = seller_profile_id::text OR auth.uid()::text = buyer_profile_id::text);

CREATE POLICY "Users can create marketplace listings" 
ON public.nft_marketplace FOR INSERT 
WITH CHECK (auth.uid()::text = seller_profile_id::text);

CREATE POLICY "Sellers can update own listings" 
ON public.nft_marketplace FOR UPDATE 
USING (auth.uid()::text = seller_profile_id::text);

-- Insert default conversion rates
INSERT INTO public.token_conversion_rates (from_token, to_token, rate) VALUES 
('TON', 'AUDIO', 150.0),
('AUDIO', 'TON', 0.0067)
ON CONFLICT (from_token, to_token) DO UPDATE SET 
rate = EXCLUDED.rate,
updated_at = now();

-- Create function to update conversion rates automatically
CREATE OR REPLACE FUNCTION update_conversion_rates()
RETURNS void AS $$
BEGIN
  -- This function can be enhanced to fetch real-time rates from external APIs
  UPDATE token_conversion_rates 
  SET updated_at = now()
  WHERE updated_at < now() - interval '1 hour';
END;
$$ LANGUAGE plpgsql;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_token_balances_profile ON token_balances(profile_id);
CREATE INDEX IF NOT EXISTS idx_cross_token_transactions_profile ON cross_token_transactions(profile_id);
CREATE INDEX IF NOT EXISTS idx_nft_marketplace_status ON nft_marketplace(status);
CREATE INDEX IF NOT EXISTS idx_nft_marketplace_seller ON nft_marketplace(seller_profile_id);