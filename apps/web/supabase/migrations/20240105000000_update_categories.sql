-- Update products table to support new categories
-- Add new categories: cookies, macarons, cheesecakes

-- Drop existing check constraint
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_category_check;

-- Add new check constraint with all 5 categories
ALTER TABLE products ADD CONSTRAINT products_category_check 
  CHECK (category IN ('torten', 'desserts', 'cookies', 'macarons', 'cheesecakes'));

-- Update index if needed (category index already exists)
-- No changes needed for indexes as they work with any category value

