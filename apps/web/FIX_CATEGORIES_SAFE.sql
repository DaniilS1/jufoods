-- Fix: Update products table to support new categories
-- Run this in Supabase Dashboard → SQL Editor
-- This version handles the case where the constraint might already exist

-- Drop existing check constraint (using CASCADE to handle dependencies if any)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'products_category_check' 
        AND conrelid = 'products'::regclass
    ) THEN
        ALTER TABLE products DROP CONSTRAINT products_category_check;
    END IF;
END $$;

-- Add new check constraint with all 5 categories
ALTER TABLE products ADD CONSTRAINT products_category_check 
  CHECK (category IN ('torten', 'desserts', 'cookies', 'macarons', 'cheesecakes'));

