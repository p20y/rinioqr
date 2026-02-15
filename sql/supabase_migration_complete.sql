-- Complete Migration for Marketplace Support
-- Run this SQL in your Supabase SQL Editor

-- Step 1: Add marketplace column with default value
ALTER TABLE products
ADD COLUMN IF NOT EXISTS marketplace TEXT NOT NULL DEFAULT 'amazon.in';

-- Step 2: Update existing products to populate marketplace field
-- This sets all existing products to use amazon.in marketplace
UPDATE products
SET marketplace = 'amazon.in'
WHERE marketplace IS NULL OR marketplace = '';

-- Step 3: Optional - Generate image URLs for existing products
-- Uncomment the lines below if you want to auto-populate image URLs for existing products
-- UPDATE products
-- SET image_url = 'https://ws-na.amazon-adsystem.com/widgets/q?_encoding=UTF8&ASIN=' || asin || '&Format=_SL250_&ID=AsinImage&MarketPlace=IN&ServiceVersion=20070822&WS=1'
-- WHERE image_url IS NULL;

-- Verify the changes
SELECT id, name, asin, marketplace, image_url, is_active, created_at
FROM products
ORDER BY created_at DESC
LIMIT 10;
