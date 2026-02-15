-- Add remaining tables to complete the setup
-- Run this AFTER minimal_working_setup.sql

-- ============================================
-- 1. SUBSCRIPTION PLANS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  product_limit INTEGER NOT NULL,
  price_usd DECIMAL(10,2) DEFAULT 0,
  price_inr DECIMAL(10,2) DEFAULT 0,
  features JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Plans are publicly viewable
CREATE POLICY "subscription_plans_select" ON public.subscription_plans
  FOR SELECT USING (is_active = TRUE);

-- Seed subscription plans
INSERT INTO public.subscription_plans (name, display_name, product_limit, price_usd, price_inr, features)
VALUES
  ('free', 'Free', 3, 0, 0, '{"qr_codes": true, "basic_analytics": true}'::jsonb),
  ('starter', 'Starter', 15, 9.99, 799, '{"qr_codes": true, "basic_analytics": true, "email_support": true}'::jsonb),
  ('pro', 'Pro', 100, 29.99, 2499, '{"qr_codes": true, "advanced_analytics": true, "priority_support": true}'::jsonb),
  ('enterprise', 'Enterprise', 999999, 99.99, 8999, '{"qr_codes": true, "advanced_analytics": true, "dedicated_support": true}'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 2. PRODUCTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  name TEXT NOT NULL,
  asin TEXT NOT NULL,
  marketplace TEXT NOT NULL,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_products_user_id ON public.products(user_id);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- RLS Policies for products
CREATE POLICY "products_select_own" ON public.products
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "products_insert_own" ON public.products
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "products_update_own" ON public.products
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "products_delete_own" ON public.products
  FOR DELETE USING (auth.uid() = user_id);

-- Public can view active products (for QR scan landing page)
CREATE POLICY "products_select_active_public" ON public.products
  FOR SELECT USING (is_active = true);

-- ============================================
-- 3. PRODUCT COUNT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION public.update_user_product_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment count
    UPDATE public.users_metadata
    SET current_product_count = current_product_count + 1
    WHERE id = NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement count
    UPDATE public.users_metadata
    SET current_product_count = GREATEST(current_product_count - 1, 0)
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
-- 4. GRANT PERMISSIONS
-- ============================================
GRANT ALL ON public.subscription_plans TO postgres, service_role, authenticated;
GRANT SELECT ON public.subscription_plans TO anon;

GRANT ALL ON public.products TO postgres, service_role, authenticated;
GRANT SELECT ON public.products TO anon;

-- ============================================
-- 5. VERIFICATION
-- ============================================
SELECT
  '✅ Setup complete!' as message,
  (SELECT COUNT(*) FROM public.subscription_plans) as subscription_plans,
  (SELECT COUNT(*) FROM public.users_metadata) as users_with_metadata,
  (SELECT COUNT(*) FROM public.products) as total_products;
