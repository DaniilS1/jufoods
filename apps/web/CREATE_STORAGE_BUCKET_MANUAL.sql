-- Create bilder bucket manually if it doesn't exist
-- Run this in Supabase Dashboard → SQL Editor

-- Check if bucket exists first
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'bilder') THEN
        -- Create the bucket
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
            'bilder',
            'bilder',
            true,
            52428800, -- 50MB limit
            ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
        );
        RAISE NOTICE 'Bucket "bilder" created successfully';
    ELSE
        RAISE NOTICE 'Bucket "bilder" already exists';
    END IF;
END $$;

-- If RLS is disabled, we don't need policies
-- But if RLS is enabled, we need to disable it for storage.objects
-- OR create policies

-- Option 1: Disable RLS on storage.objects (if you want to allow all operations)
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Option 2: If you want to keep RLS enabled, uncomment the policies below:
/*
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Access for bilder bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'bilder');

CREATE POLICY "Anyone can upload to bilder"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'bilder');

CREATE POLICY "Anyone can update bilder"
ON storage.objects FOR UPDATE
USING (bucket_id = 'bilder')
WITH CHECK (bucket_id = 'bilder');

CREATE POLICY "Anyone can delete bilder"
ON storage.objects FOR DELETE
USING (bucket_id = 'bilder');
*/

