
-- 1. Fix NFT marketplace: hide buyer_profile_id from non-parties and fix anonymous access
DROP POLICY IF EXISTS "Public can view active marketplace listings safely" ON public.nft_marketplace;

CREATE POLICY "Authenticated users can view active listings"
ON public.nft_marketplace
FOR SELECT
TO authenticated
USING (
  (status = 'active') AND
  (expires_at IS NULL OR expires_at > now())
);

-- Sellers and buyers can always see their own listings (any status)
CREATE POLICY "Parties can view own listings"
ON public.nft_marketplace
FOR SELECT
TO authenticated
USING (
  seller_profile_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
  OR buyer_profile_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
);

-- 2. Fix admin privilege escalation: replace broad ALL with restricted policies
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Admins can view all roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can assign non-admin roles only
CREATE POLICY "Admins can assign non-admin roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  AND role != 'admin'::app_role
);

-- Admins can update roles but not to admin
CREATE POLICY "Admins can update non-admin roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (role != 'admin'::app_role);

-- Admins can delete non-admin roles
CREATE POLICY "Admins can delete non-admin roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  AND role != 'admin'::app_role
);

-- 3. Fix event-thumbnails storage: ownership check via live_events creator
DROP POLICY IF EXISTS "Authenticated users can update event thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete event thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update event thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete event thumbnails" ON storage.objects;

CREATE POLICY "Event creators can update their thumbnails"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'event-thumbnails'
  AND EXISTS (
    SELECT 1 FROM public.live_events le
    JOIN public.profiles p ON p.id = le.creator_profile_id
    WHERE p.auth_user_id = auth.uid()
    AND le.id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Event creators can delete their thumbnails"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'event-thumbnails'
  AND EXISTS (
    SELECT 1 FROM public.live_events le
    JOIN public.profiles p ON p.id = le.creator_profile_id
    WHERE p.auth_user_id = auth.uid()
    AND le.id::text = (storage.foldername(name))[1]
  )
);

-- 4. Remove validate_data_access() from transaction RLS policies (it's a no-op)
DROP POLICY IF EXISTS "Users can create transactions with rate limiting" ON public.transactions;
DROP POLICY IF EXISTS "Users can view own transactions with logging" ON public.transactions;

CREATE POLICY "Users can create transactions with rate limiting"
ON public.transactions
FOR INSERT
TO authenticated
WITH CHECK (
  from_profile_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
  AND secure_rate_limit_check('transaction_create'::text, 10, '00:05:00'::interval)
);

CREATE POLICY "Users can view own transactions"
ON public.transactions
FOR SELECT
TO authenticated
USING (
  from_profile_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
  OR to_profile_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
);
