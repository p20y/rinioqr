-- Migration to add marketplace column to products table
-- Run this SQL in your Supabase SQL Editor

-- Add marketplace column (default to amazon.in for existing products)
ALTER TABLE products
ADD COLUMN marketplace TEXT NOT NULL DEFAULT 'amazon.in';

-- Optional: Update the default value to null after migration if you want
-- This keeps existing products with amazon.in but requires new products to specify
-- ALTER TABLE products ALTER COLUMN marketplace DROP DEFAULT;

-- Verify the change
SELECT * FROM products LIMIT 5;
