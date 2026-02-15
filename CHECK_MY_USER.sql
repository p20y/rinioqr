-- Run this in Supabase SQL Editor to check your OAuth user

-- 1. Check if your user exists in auth.users
SELECT
  id,
  email,
  raw_user_meta_data->>'full_name' as google_name,
  created_at,
  last_sign_in_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 3;

-- 2. Check if metadata was created
SELECT
  id,
  email,
  full_name,
  subscription_status,
  product_limit,
  current_product_count,
  created_at
FROM users_metadata
ORDER BY created_at DESC
LIMIT 3;

-- 3. Check if there are any users without metadata (shouldn't be any)
SELECT
  u.id,
  u.email,
  u.created_at as user_created,
  m.id as metadata_id
FROM auth.users u
LEFT JOIN users_metadata m ON u.id = m.id
WHERE m.id IS NULL;
