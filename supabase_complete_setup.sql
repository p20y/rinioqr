-- Complete Database Setup for Rinio QR
-- This script will DROP the existing products table and create a new one with all required fields
-- WARNING: This will DELETE ALL existing data in the products table!

-- Step 1: Drop the existing products table (if it exists)
DROP TABLE IF EXISTS products CASCADE;

-- Step 2: Create the products table with all required fields
CREATE TABLE products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    asin TEXT NOT NULL,
    marketplace TEXT NOT NULL,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true NOT NULL
);

-- Step 3: Enable Row Level Security (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Step 4: Create policies to allow anonymous access
-- Allow anyone to read products
CREATE POLICY "Enable read access for all users" ON products
    FOR SELECT
    USING (true);

-- Allow anyone to insert products
CREATE POLICY "Enable insert for all users" ON products
    FOR INSERT
    WITH CHECK (true);

-- Allow anyone to update products
CREATE POLICY "Enable update for all users" ON products
    FOR UPDATE
    USING (true);

-- Allow anyone to delete products
CREATE POLICY "Enable delete for all users" ON products
    FOR DELETE
    USING (true);

-- Step 5: Create indexes for better performance
CREATE INDEX idx_products_asin ON products(asin);
CREATE INDEX idx_products_marketplace ON products(marketplace);
CREATE INDEX idx_products_created_at ON products(created_at DESC);
CREATE INDEX idx_products_is_active ON products(is_active);

-- Step 6: Insert some sample data for testing (optional - comment out if not needed)
-- INSERT INTO products (name, asin, marketplace, image_url, is_active) VALUES
-- ('Sample Product - US', 'B08N5KWB9H', 'amazon.com', 'https://ws-na.amazon-adsystem.com/widgets/q?_encoding=UTF8&ASIN=B08N5KWB9H&Format=_SL250_&ID=AsinImage&MarketPlace=US&ServiceVersion=20070822&WS=1', true),
-- ('Sample Product - India', 'B07HGJKXYZ', 'amazon.in', 'https://ws-na.amazon-adsystem.com/widgets/q?_encoding=UTF8&ASIN=B07HGJKXYZ&Format=_SL250_&ID=AsinImage&MarketPlace=IN&ServiceVersion=20070822&WS=1', true),
-- ('Sample Product - UK', 'B08ABC1234', 'amazon.co.uk', 'https://ws-na.amazon-adsystem.com/widgets/q?_encoding=UTF8&ASIN=B08ABC1234&Format=_SL250_&ID=AsinImage&MarketPlace=UK&ServiceVersion=20070822&WS=1', false);

-- Step 7: Verify the table was created correctly
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM
    information_schema.columns
WHERE
    table_name = 'products'
ORDER BY
    ordinal_position;

-- Step 8: Show all products (should be empty unless you added sample data)
SELECT * FROM products ORDER BY created_at DESC;
