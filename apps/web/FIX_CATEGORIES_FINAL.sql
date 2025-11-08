-- Fix: Update products table to support new categories
-- Run this in Supabase Dashboard → SQL Editor
-- This version safely updates the constraint

-- Step 1: Check current constraint (run this first to see what's there)
-- SELECT conname, pg_get_constraintdef(oid) 
-- FROM pg_constraint 
-- WHERE conname = 'products_category_check' AND conrelid = 'products'::regclass;

-- Step 2: Drop the constraint (this will work even if it already has the new categories)
ALTER TABLE products DROP CONSTRAINT products_category_check;

-- Step 3: Add the new constraint with all 5 categories
ALTER TABLE products ADD CONSTRAINT products_category_check 
  CHECK (category IN ('torten', 'desserts', 'cookies', 'macarons', 'cheesecakes'));

