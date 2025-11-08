-- Add RLS policies for products table to allow INSERT, UPDATE, and DELETE
-- Note: This allows anyone to perform these operations. In production, you should restrict this to authenticated admin users.

-- Allow anyone to insert products (for admin interface)
CREATE POLICY IF NOT EXISTS "Anyone can insert products" ON products
  FOR INSERT WITH CHECK (true);

-- Allow anyone to update products (for admin interface)
CREATE POLICY IF NOT EXISTS "Anyone can update products" ON products
  FOR UPDATE USING (true) WITH CHECK (true);

-- Allow anyone to delete products (for admin interface)
CREATE POLICY IF NOT EXISTS "Anyone can delete products" ON products
  FOR DELETE USING (true);

-- Note: For production, replace these with admin-only policies:
-- Example:
-- CREATE POLICY "Only admins can insert products" ON products
--   FOR INSERT WITH CHECK (
--     EXISTS (
--       SELECT 1 FROM auth.users 
--       WHERE auth.users.id = auth.uid() 
--       AND auth.users.raw_user_meta_data->>'role' = 'admin'
--     )
--   );

