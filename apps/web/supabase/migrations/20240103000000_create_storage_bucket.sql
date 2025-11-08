-- Create storage bucket for images
-- This migration creates the "bilder" bucket in Supabase Storage

-- Insert bucket configuration
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'bilder',
  'bilder',
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for public read access
CREATE POLICY "Public Access for bilder bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'bilder');

-- Allow anyone to upload (for admin interface without auth)
-- NOTE: In production, you should restrict this to authenticated users only
CREATE POLICY "Anyone can upload to bilder"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'bilder');

-- Allow anyone to update (for admin interface without auth)
-- NOTE: In production, you should restrict this to authenticated users only
CREATE POLICY "Anyone can update bilder"
ON storage.objects FOR UPDATE
USING (bucket_id = 'bilder');

-- Allow anyone to delete (for admin interface without auth)
-- NOTE: In production, you should restrict this to authenticated users only
CREATE POLICY "Anyone can delete bilder"
ON storage.objects FOR DELETE
USING (bucket_id = 'bilder');

