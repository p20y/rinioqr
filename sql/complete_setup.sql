-- ============================================
-- RINIO QR - Complete Database Setup
-- ============================================
-- This script sets up the entire database from scratch
-- Safe to run on a fresh database or after cleanup
-- ============================================

-- ============================================
-- 1. CLEAN UP (Optional - removes existing data)
-- ============================================
-- Uncomment these lines if you want to start completely fresh
-- DROP TABLE IF EXISTS public.users_metadata CASCADE;
-- DROP TABLE IF EXISTS public.subscription_plans CASCADE;
-- DROP TABLE IF EXISTS public.products CASCADE;
-- DROP FUNCTION IF EXISTS public.create_user_metadata() CASCADE;
-- DROP FUNCTION IF EXISTS public.update_user_product_count() CASCADE;

-- ============================================
-- 2. SUBSCRIPTION PLANS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  product_limit INTEGER NOT NULL,
  price_usd DECIMAL(10,2) DEFAULT 0,
  price_inr DECIMAL(10,2) DEFAULT 0,
  stripe_price_id TEXT,
  razorpay_plan_id TEXT,
  features JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Plans are publicly viewable
DROP POLICY IF EXISTS "Plans are viewable by everyone" ON public.subscription_plans;
CREATE POLICY "Plans are viewable by everyone" ON public.subscription_plans
  FOR SELECT USING (is_active = TRUE);

-- Seed subscription plans
INSERT INTO public.subscription_plans (name, display_name, product_limit, price_usd, price_inr, features)
VALUES
  ('free', 'Free', 3, 0, 0, '{"qr_codes": true, "basic_analytics": true, "email_support": false, "priority_support": false}'::jsonb),
  ('starter', 'Starter', 15, 9.99, 799, '{"qr_codes": true, "basic_analytics": true, "email_support": true, "priority_support": false}'::jsonb),
  ('pro', 'Pro', 100, 29.99, 2499, '{"qr_codes": true, "advanced_analytics": true, "email_support": true, "priority_support": true}'::jsonb),
  ('enterprise', 'Enterprise', 999999, 99.99, 8999, '{"qr_codes": true, "advanced_analytics": true, "custom_integrations": true, "dedicated_support": true, "priority_support": true}'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 3. USERS METADATA TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.users_metadata (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  company_name TEXT,
  subscription_status TEXT DEFAULT 'free' CHECK (subscription_status IN ('free', 'starter', 'pro', 'enterprise')),
  product_limit INTEGER DEFAULT 3,
  current_product_count INTEGER DEFAULT 0,
  total_scans INTEGER DEFAULT 0,
  payment_provider TEXT CHECK (payment_provider IN ('stripe', 'razorpay')),
  customer_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.users_metadata ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users view own metadata" ON public.users_metadata;
CREATE POLICY "Users view own metadata" ON public.users_metadata
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users update own metadata" ON public.users_metadata;
CREATE POLICY "Users update own metadata" ON public.users_metadata
  FOR UPDATE USING (auth.uid() = id);

-- ============================================
-- 4. PRODUCTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  name TEXT NOT NULL,
  asin TEXT NOT NULL,
  marketplace TEXT NOT NULL,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_products_user_id ON public.products(user_id);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Drop old permissive policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.products;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.products;
DROP POLICY IF EXISTS "Enable update for all users" ON public.products;
DROP POLICY IF EXISTS "Enable delete for all users" ON public.products;

-- Create secure multi-tenant RLS policies
DROP POLICY IF EXISTS "Users view own products" ON public.products;
CREATE POLICY "Users view own products" ON public.products
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own products" ON public.products;
CREATE POLICY "Users insert own products" ON public.products
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own products" ON public.products;
CREATE POLICY "Users update own products" ON public.products
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own products" ON public.products;
CREATE POLICY "Users delete own products" ON public.products
  FOR DELETE USING (auth.uid() = user_id);

-- Public can view active products (for QR scan landing page)
DROP POLICY IF EXISTS "Public view active products" ON public.products;
CREATE POLICY "Public view active products" ON public.products
  FOR SELECT USING (is_active = true);

-- ============================================
-- 5. TRIGGER: Auto-create user metadata on signup
-- ============================================
CREATE OR REPLACE FUNCTION public.create_user_metadata()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users_metadata (id, email, subscription_status, product_limit, current_product_count)
  VALUES (NEW.id, NEW.email, 'free', 3, 0)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_user_metadata();

-- ============================================
-- 6. TRIGGER: Auto-update product count
-- ============================================
CREATE OR REPLACE FUNCTION public.update_user_product_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment count
    UPDATE public.users_metadata
    SET current_product_count = current_product_count + 1,
        updated_at = NOW()
    WHERE id = NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement count
    UPDATE public.users_metadata
    SET current_product_count = GREATEST(current_product_count - 1, 0),
        updated_at = NOW()
    WHERE id = OLD.user_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS product_count_trigger ON public.products;
CREATE TRIGGER product_count_trigger
  AFTER INSERT OR DELETE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_product_count();

-- ============================================
-- 7. HELPER FUNCTIONS
-- ============================================

-- Function to check if user can add more products
CREATE OR REPLACE FUNCTION public.can_add_product(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_count INTEGER;
  v_limit INTEGER;
BEGIN
  SELECT current_product_count, product_limit
  INTO v_current_count, v_limit
  FROM public.users_metadata
  WHERE id = p_user_id;

  RETURN v_current_count < v_limit;
END;
$$;

-- Trigger to update updated_at on users_metadata
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_users_metadata_updated_at ON public.users_metadata;
CREATE TRIGGER update_users_metadata_updated_at
  BEFORE UPDATE ON public.users_metadata
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 8. GRANT PERMISSIONS
-- ============================================
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.users_metadata TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.subscription_plans TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.products TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- ============================================
-- 9. BACKFILL EXISTING USERS
-- ============================================
-- Create metadata for any existing users without it
INSERT INTO public.users_metadata (id, email, subscription_status, product_limit, current_product_count)
SELECT
  u.id,
  u.email,
  'free',
  3,
  0
FROM auth.users u
LEFT JOIN public.users_metadata um ON u.id = um.id
WHERE um.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 10. VERIFICATION
-- ============================================
SELECT
  '✅ Database setup complete!' as message,
  (SELECT COUNT(*) FROM public.subscription_plans) as subscription_plans,
  (SELECT COUNT(*) FROM auth.users) as total_users,
  (SELECT COUNT(*) FROM public.users_metadata) as users_with_metadata,
  (SELECT COUNT(*) FROM public.products) as total_products,
  CASE
    WHEN EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created')
    THEN '✅ User creation trigger active'
    ELSE '❌ User creation trigger missing'
  END as user_trigger_status,
  CASE
    WHEN EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'product_count_trigger')
    THEN '✅ Product count trigger active'
    ELSE '❌ Product count trigger missing'
  END as product_trigger_status;
