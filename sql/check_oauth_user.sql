-- Check if OAuth user was created properly

-- 1. List all auth users
SELECT
  id,
  email,
  created_at,
  raw_app_meta_data->>'provider' as provider
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- 2. Check if they have metadata
SELECT
  um.id,
  um.email,
  um.subscription_status,
  um.product_limit,
  um.created_at,
  CASE
    WHEN u.id IS NOT NULL THEN '✅ Has auth user'
    ELSE '❌ No auth user'
  END as auth_status
FROM public.users_metadata um
LEFT JOIN auth.users u ON um.id = u.id
ORDER BY um.created_at DESC
LIMIT 5;

-- 3. Find orphaned users (auth users without metadata)
SELECT
  u.id,
  u.email,
  u.created_at,
  u.raw_app_meta_data->>'provider' as provider,
  '❌ NO METADATA' as status
FROM auth.users u
LEFT JOIN public.users_metadata um ON u.id = um.id
WHERE um.id IS NULL
ORDER BY u.created_at DESC;