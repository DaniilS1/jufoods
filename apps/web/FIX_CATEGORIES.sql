-- Fix: Update products table to support new categories
-- Run this in Supabase Dashboard → SQL Editor

-- First, drop the existing constraint (this will fail if constraint doesn't exist, but that's ok)
ALTER TABLE products DROP CONSTRAINT products_category_check;

-- Add new check constraint with all 5 categories
ALTER TABLE products ADD CONSTRAINT products_category_check 
  CHECK (category IN ('torten', 'desserts', 'cookies', 'macarons', 'cheesecakes'));

