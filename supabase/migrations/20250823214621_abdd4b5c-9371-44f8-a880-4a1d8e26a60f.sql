-- Add $AUDIO token tracking to profiles
ALTER TABLE public.profiles 
ADD COLUMN audio_token_balance NUMERIC DEFAULT 0,
ADD COLUMN preferred_payment_token TEXT DEFAULT 'TON' CHECK (preferred_payment_token IN ('TON', 'AUDIO'));

-- Create token_balances table for real-time tracking
CREATE TABLE public.token_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  token_type TEXT NOT NULL CHECK (token_type IN ('TON', 'AUDIO')),
  balance NUMERIC NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT now(),
  UNIQUE(profile_id, token_type)
);

-- Create cross_token_transactions table
CREATE TABLE public.cross_token_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  from_token TEXT NOT NULL CHECK (from_token IN ('TON', 'AUDIO')),
  to_token TEXT NOT NULL CHECK (to_token IN ('TON', 'AUDIO')),
  from_amount NUMERIC NOT NULL,
  to_amount NUMERIC NOT NULL,
  conversion_rate NUMERIC NOT NULL,
  fees NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Create payment_preferences table
CREATE TABLE public.payment_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'tip', 'fan_club', 'nft_purchase', etc.
  preferred_token TEXT NOT NULL CHECK (preferred_token IN ('TON', 'AUDIO')),
  auto_select BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(profile_id, action_type)
);

-- Create token_conversion_rates table for real-time rates
CREATE TABLE public.token_conversion_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_token TEXT NOT NULL CHECK (from_token IN ('TON', 'AUDIO')),
  to_token TEXT NOT NULL CHECK (to_token IN ('TON', 'AUDIO')),
  rate NUMERIC NOT NULL,
  source TEXT NOT NULL, -- 'dex', 'oracle', 'manual'
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(from_token, to_token)
);

-- Enable RLS on new tables
ALTER TABLE public.token_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cross_token_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_conversion_rates ENABLE ROW LEVEL SECURITY;

-- RLS policies for token_balances
CREATE POLICY "Users can view their own token balances" ON public.token_balances
FOR SELECT USING (profile_id IN (
  SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
));

CREATE POLICY "Users can update their own token balances" ON public.token_balances
FOR UPDATE USING (profile_id IN (
  SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
));

CREATE POLICY "Users can insert their own token balances" ON public.token_balances
FOR INSERT WITH CHECK (profile_id IN (
  SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
));

-- RLS policies for cross_token_transactions
CREATE POLICY "Users can view their own cross token transactions" ON public.cross_token_transactions
FOR SELECT USING (profile_id IN (
  SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
));

CREATE POLICY "Users can create their own cross token transactions" ON public.cross_token_transactions
FOR INSERT WITH CHECK (profile_id IN (
  SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
));

-- RLS policies for payment_preferences
CREATE POLICY "Users can view their own payment preferences" ON public.payment_preferences
FOR SELECT USING (profile_id IN (
  SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
));

CREATE POLICY "Users can manage their own payment preferences" ON public.payment_preferences
FOR ALL USING (profile_id IN (
  SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
));

-- RLS policies for token_conversion_rates (public read-only)
CREATE POLICY "Everyone can view token conversion rates" ON public.token_conversion_rates
FOR SELECT USING (true);

-- Insert initial conversion rates
INSERT INTO public.token_conversion_rates (from_token, to_token, rate, source) VALUES
('TON', 'AUDIO', 0.25, 'manual'),
('AUDIO', 'TON', 4.0, 'manual');

-- Update transactions table to support dual tokens
ALTER TABLE public.transactions 
ADD COLUMN token_type TEXT DEFAULT 'TON' CHECK (token_type IN ('TON', 'AUDIO')),
ADD COLUMN audio_amount NUMERIC,
ADD COLUMN conversion_rate NUMERIC;

-- Create trigger for updated_at on new tables
CREATE TRIGGER update_payment_preferences_updated_at
  BEFORE UPDATE ON public.payment_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_token_balances_updated_at
  BEFORE UPDATE ON public.token_balances
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();