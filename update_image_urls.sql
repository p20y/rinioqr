-- Clear invalid image URLs for existing products
-- Run this in Supabase SQL Editor to clean up existing products

UPDATE products
SET image_url = NULL
WHERE image_url LIKE '%images-na.ssl-images-amazon%'
   OR image_url LIKE '%LZZZZZZZ%';

-- Show updated products
SELECT id, name, asin, marketplace, image_url FROM products;
