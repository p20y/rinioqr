-- Migration: Authentication and Multi-Tenancy Setup
-- Phase 1.1 of SaaS Transformation
-- Creates user profiles, subscription plans, and secures product ownership

-- ============================================
-- 1. User Metadata Table
-- ============================================
-- Extends Supabase auth.users with application-specific data
CREATE TABLE users_metadata (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  company_name TEXT,
  subscription_status TEXT DEFAULT 'free' CHECK (subscription_status IN ('free', 'starter', 'pro', 'enterprise')),
  product_limit INTEGER DEFAULT 3,
  current_product_count INTEGER DEFAULT 0,
  total_scans INTEGER DEFAULT 0,
  payment_provider TEXT CHECK (payment_provider IN ('stripe', 'razorpay')),
  customer_id TEXT, -- Stripe or Razorpay customer ID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on users_metadata
ALTER TABLE users_metadata ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only view/update their own metadata
CREATE POLICY "Users view own metadata" ON users_metadata
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users update own metadata" ON users_metadata
  FOR UPDATE USING (auth.uid() = id);

-- Trigger to create user_metadata when new user signs up
CREATE OR REPLACE FUNCTION create_user_metadata()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users_metadata (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_metadata();

-- ============================================
-- 2. Subscription Plans Table
-- ============================================
CREATE TABLE subscription_plans (
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

-- Enable RLS - Plans are publicly viewable
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Plans are viewable by everyone" ON subscription_plans
  FOR SELECT USING (is_active = TRUE);

-- Seed subscription plans
INSERT INTO subscription_plans (name, display_name, product_limit, price_usd, price_inr, features) VALUES
  ('free', 'Free', 3, 0, 0, '{"qr_codes": true, "basic_analytics": true, "email_support": false, "priority_support": false}'::jsonb),
  ('starter', 'Starter', 15, 9.99, 799, '{"qr_codes": true, "basic_analytics": true, "email_support": true, "priority_support": false}'::jsonb),
  ('pro', 'Pro', 100, 29.99, 2499, '{"qr_codes": true, "advanced_analytics": true, "email_support": true, "priority_support": true}'::jsonb),
  ('enterprise', 'Enterprise', 999999, 99.99, 8999, '{"qr_codes": true, "advanced_analytics": true, "custom_integrations": true, "dedicated_support": true, "priority_support": true}'::jsonb);

-- ============================================
-- 3. Add User Ownership to Products Table
-- ============================================
-- Add user_id column to products (will be required after backfill)
ALTER TABLE products ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX idx_products_user_id ON products(user_id);

-- ============================================
-- 4. Drop Insecure RLS Policies
-- ============================================
-- Remove existing permissive policies that allowed anyone to CRUD anything
DROP POLICY IF EXISTS "Enable read access for all users" ON products;
DROP POLICY IF EXISTS "Enable insert for all users" ON products;
DROP POLICY IF EXISTS "Enable update for all users" ON products;
DROP POLICY IF EXISTS "Enable delete for all users" ON products;

-- ============================================
-- 5. Create Secure Multi-Tenant RLS Policies
-- ============================================
-- Authenticated users can view their own products
CREATE POLICY "Users view own products" ON products
  FOR SELECT
  USING (auth.uid() = user_id);

-- Authenticated users can insert products (ownership enforced by application)
CREATE POLICY "Users insert own products" ON products
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Authenticated users can update their own products
CREATE POLICY "Users update own products" ON products
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Authenticated users can delete their own products
CREATE POLICY "Users delete own products" ON products
  FOR DELETE
  USING (auth.uid() = user_id);

-- Public can view active products (for QR scan landing page)
CREATE POLICY "Public view active products" ON products
  FOR SELECT
  USING (is_active = true);

-- ============================================
-- 6. Product Count Trigger
-- ============================================
-- Automatically update current_product_count when products are added/deleted
CREATE OR REPLACE FUNCTION update_user_product_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment count
    UPDATE users_metadata
    SET current_product_count = current_product_count + 1,
        updated_at = NOW()
    WHERE id = NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement count
    UPDATE users_metadata
    SET current_product_count = GREATEST(current_product_count - 1, 0),
        updated_at = NOW()
    WHERE id = OLD.user_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER product_count_trigger
  AFTER INSERT OR DELETE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_user_product_count();

-- ============================================
-- 7. Helper Function: Check Product Limit
-- ============================================
-- Function to check if user can add more products
CREATE OR REPLACE FUNCTION can_add_product(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_count INTEGER;
  v_limit INTEGER;
BEGIN
  SELECT current_product_count, product_limit
  INTO v_current_count, v_limit
  FROM users_metadata
  WHERE id = p_user_id;

  RETURN v_current_count < v_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 8. Updated At Trigger for users_metadata
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_metadata_updated_at
  BEFORE UPDATE ON users_metadata
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- NOTES FOR MANUAL STEPS
-- ============================================
-- After running this migration, you need to:
-- 1. Backfill existing products with a user_id (if any exist)
-- 2. Make user_id column NOT NULL: ALTER TABLE products ALTER COLUMN user_id SET NOT NULL;
-- 3. Update Stripe with actual price IDs after creating products in Stripe dashboard
-- 4. Update Razorpay with actual plan IDs after creating plans in Razorpay dashboard
