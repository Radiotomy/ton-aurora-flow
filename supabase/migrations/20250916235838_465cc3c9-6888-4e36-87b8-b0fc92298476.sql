-- Create table for $AUDIO token balances
CREATE TABLE IF NOT EXISTS public.audio_token_balances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL,
  balance DECIMAL(15, 6) NOT NULL DEFAULT 0,
  total_earnings DECIMAL(15, 6) NOT NULL DEFAULT 0,
  pending_rewards DECIMAL(15, 6) NOT NULL DEFAULT 0,
  staked_amount DECIMAL(15, 6) NOT NULL DEFAULT 0,
  last_claim_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.audio_token_balances ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own audio balances" 
ON public.audio_token_balances 
FOR SELECT 
USING (auth.uid()::text = profile_id::text);

CREATE POLICY "Users can update their own audio balances" 
ON public.audio_token_balances 
FOR UPDATE 
USING (auth.uid()::text = profile_id::text);

CREATE POLICY "System can insert audio balances" 
ON public.audio_token_balances 
FOR INSERT 
WITH CHECK (true);

-- Create unique index
CREATE UNIQUE INDEX IF NOT EXISTS audio_token_balances_profile_unique 
ON public.audio_token_balances (profile_id);

-- Create table for audio rewards history
CREATE TABLE IF NOT EXISTS public.audio_rewards_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL,
  reward_type TEXT NOT NULL,
  amount DECIMAL(15, 6) NOT NULL,
  source TEXT,
  metadata JSONB,
  claimed BOOLEAN NOT NULL DEFAULT false,
  claimed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.audio_rewards_history ENABLE ROW LEVEL SECURITY;

-- Create policies for rewards history
CREATE POLICY "Users can view their own rewards history" 
ON public.audio_rewards_history 
FOR SELECT 
USING (auth.uid()::text = profile_id::text);

CREATE POLICY "System can insert rewards history" 
ON public.audio_rewards_history 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their own rewards history" 
ON public.audio_rewards_history 
FOR UPDATE 
USING (auth.uid()::text = profile_id::text);

-- Create table for cross-chain bridge transactions
CREATE TABLE IF NOT EXISTS public.bridge_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL,
  from_chain TEXT NOT NULL,
  to_chain TEXT NOT NULL,
  from_token TEXT NOT NULL,
  to_token TEXT NOT NULL,
  from_amount DECIMAL(15, 6) NOT NULL,
  to_amount DECIMAL(15, 6) NOT NULL,
  exchange_rate DECIMAL(15, 6) NOT NULL,
  fees DECIMAL(15, 6) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  from_tx_hash TEXT,
  to_tx_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.bridge_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for bridge transactions
CREATE POLICY "Users can view their own bridge transactions" 
ON public.bridge_transactions 
FOR SELECT 
USING (auth.uid()::text = profile_id::text);

CREATE POLICY "Users can insert their own bridge transactions" 
ON public.bridge_transactions 
FOR INSERT 
WITH CHECK (auth.uid()::text = profile_id::text);

CREATE POLICY "System can update bridge transactions" 
ON public.bridge_transactions 
FOR UPDATE 
USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS audio_token_balances_profile_id_idx ON public.audio_token_balances (profile_id);
CREATE INDEX IF NOT EXISTS audio_rewards_history_profile_id_idx ON public.audio_rewards_history (profile_id);
CREATE INDEX IF NOT EXISTS audio_rewards_history_claimed_idx ON public.audio_rewards_history (claimed);
CREATE INDEX IF NOT EXISTS bridge_transactions_profile_id_idx ON public.bridge_transactions (profile_id);
CREATE INDEX IF NOT EXISTS bridge_transactions_status_idx ON public.bridge_transactions (status);

-- Create trigger for automatic timestamp updates
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers for timestamp updates
CREATE TRIGGER update_audio_token_balances_updated_at
BEFORE UPDATE ON public.audio_token_balances
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();