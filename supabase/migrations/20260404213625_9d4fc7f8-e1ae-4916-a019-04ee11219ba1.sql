
-- 1. user_roles privilege escalation
DROP POLICY IF EXISTS "System can insert initial roles" ON public.user_roles;

-- 2. audio_rewards_history open INSERT
DROP POLICY IF EXISTS "System can insert rewards history" ON public.audio_rewards_history;

-- 3. treasury_movements open INSERT
DROP POLICY IF EXISTS "System can insert treasury movements" ON public.treasury_movements;

-- 4. user_recommendations open ALL
DROP POLICY IF EXISTS "System can manage recommendations" ON public.user_recommendations;

-- 5. event_tickets realtime exposure
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime DROP TABLE public.event_tickets;
EXCEPTION WHEN OTHERS THEN
  NULL;
END;
$$;

-- 6. event-thumbnails storage - just drop old policies (new ones already exist)
DROP POLICY IF EXISTS "Authenticated users can update event thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete event thumbnails" ON storage.objects;

-- 7. token_balances client-side mutations
DROP POLICY IF EXISTS "Users can insert their own token balances" ON public.token_balances;
DROP POLICY IF EXISTS "Users can update their own token balances" ON public.token_balances;
