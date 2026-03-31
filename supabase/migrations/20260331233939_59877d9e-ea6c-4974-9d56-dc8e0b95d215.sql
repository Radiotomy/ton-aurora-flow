
-- Fix bridge_transactions UPDATE policy - add ownership check
DROP POLICY IF EXISTS "Authorized system can update bridge transactions" ON public.bridge_transactions;

CREATE POLICY "Users can update own pending bridge transactions"
ON public.bridge_transactions FOR UPDATE TO authenticated
USING (
  profile_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
  AND status = ANY (ARRAY['pending'::text, 'processing'::text])
)
WITH CHECK (
  profile_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
);
