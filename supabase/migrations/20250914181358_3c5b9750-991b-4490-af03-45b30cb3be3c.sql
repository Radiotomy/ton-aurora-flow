-- Fix token_conversion_rates table structure
ALTER TABLE public.token_conversion_rates 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

-- Create missing tables for NFT marketplace
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

-- Enable RLS on NFT marketplace
ALTER TABLE public.nft_marketplace ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for nft_marketplace
CREATE POLICY "Anyone can view active marketplace listings" 
ON public.nft_marketplace FOR SELECT 
USING (status = 'active' OR (auth.uid() IN (
  SELECT profiles.auth_user_id FROM profiles 
  WHERE profiles.id = seller_profile_id OR profiles.id = buyer_profile_id
)));

CREATE POLICY "Users can create marketplace listings" 
ON public.nft_marketplace FOR INSERT 
WITH CHECK (auth.uid() IN (SELECT profiles.auth_user_id FROM profiles WHERE profiles.id = seller_profile_id));

CREATE POLICY "Sellers can update own listings" 
ON public.nft_marketplace FOR UPDATE 
USING (auth.uid() IN (SELECT profiles.auth_user_id FROM profiles WHERE profiles.id = seller_profile_id));

-- Create function to update conversion rates
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
CREATE INDEX IF NOT EXISTS idx_nft_marketplace_status ON nft_marketplace(status);
CREATE INDEX IF NOT EXISTS idx_nft_marketplace_seller ON nft_marketplace(seller_profile_id);