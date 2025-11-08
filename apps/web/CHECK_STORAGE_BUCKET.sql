-- Check if bilder bucket exists and is configured correctly
-- Run this in Supabase Dashboard → SQL Editor

-- Check if bucket exists
SELECT id, name, public, file_size_limit, allowed_mime_types, created_at
FROM storage.buckets
WHERE id = 'bilder';

-- Check RLS status on storage.objects
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'storage' AND tablename = 'objects';

-- Check existing policies on storage.objects
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects';

