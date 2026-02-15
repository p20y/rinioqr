-- Check if OAuth users have their metadata properly created
-- Run this in Supabase SQL Editor to verify

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
LIMIT 5;

-- Also check the auth.users table to see raw OAuth data
SELECT
  id,
  email,
  raw_user_meta_data->>'full_name' as google_full_name,
  raw_app_meta_data,
  created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;
