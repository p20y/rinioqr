-- Complete RLS Fix for users_metadata
-- This ensures users can read their own metadata

-- 1. Drop all existing policies
DROP POLICY IF EXISTS "users_metadata_select" ON public.users_metadata;
DROP POLICY IF EXISTS "Users view own metadata" ON public.users_metadata;
DROP POLICY IF EXISTS "Users update own metadata" ON public.users_metadata;
DROP POLICY IF EXISTS "users_metadata_insert" ON public.users_metadata;

-- 2. Create simple, working policies
CREATE POLICY "users_select_own" ON public.users_metadata
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "users_update_own" ON public.users_metadata
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- 3. Grant all permissions (critical for trigger and queries)
GRANT ALL ON public.users_metadata TO authenticated;
GRANT ALL ON public.users_metadata TO service_role;
GRANT ALL ON public.users_metadata TO postgres;
GRANT SELECT ON public.users_metadata TO anon;

-- 4. Verify the policies
SELECT
  tablename,
  policyname,
  cmd,
  roles,
  CASE
    WHEN cmd = 'SELECT' THEN '✅ Can read'
    WHEN cmd = 'UPDATE' THEN '✅ Can update'
    ELSE '✅ Policy exists'
  END as status
FROM pg_policies
WHERE tablename = 'users_metadata'
ORDER BY cmd, policyname;

-- 5. Test query (should return your user if logged in)
SELECT
  'Test Query' as test,
  COUNT(*) as total_metadata_rows
FROM public.users_metadata;