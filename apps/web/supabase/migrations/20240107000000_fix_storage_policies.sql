-- Fix Storage Policies for bilder bucket
-- This migration ensures RLS is enabled and policies allow anonymous uploads

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Public Access for bilder bucket" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload to bilder" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update bilder" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete bilder" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to bilder" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update bilder" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete bilder" ON storage.objects;

-- Create public read access policy (for all users, authenticated or not)
CREATE POLICY "Public Access for bilder bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'bilder');

-- Create upload policy (allows anyone to upload, including anonymous users)
CREATE POLICY "Anyone can upload to bilder"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'bilder');

-- Create update policy (allows anyone to update)
CREATE POLICY "Anyone can update bilder"
ON storage.objects FOR UPDATE
USING (bucket_id = 'bilder')
WITH CHECK (bucket_id = 'bilder');

-- Create delete policy (allows anyone to delete)
CREATE POLICY "Anyone can delete bilder"
ON storage.objects FOR DELETE
USING (bucket_id = 'bilder');

