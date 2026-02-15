-- Fix RLS policies for users_metadata
-- The trigger needs INSERT permission

-- Grant INSERT to service_role and postgres (for the trigger)
GRANT INSERT ON public.users_metadata TO service_role, postgres;

-- Add INSERT policy for authenticated users (shouldn't be needed but just in case)
DROP POLICY IF EXISTS "users_metadata_insert" ON public.users_metadata;
CREATE POLICY "users_metadata_insert" ON public.users_metadata
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Verify policies
SELECT
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'users_metadata'
ORDER BY policyname;