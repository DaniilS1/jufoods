-- Security fix: storage.objects policies for the "bilder" bucket allowed
-- ANYONE (including anonymous, unauthenticated requests) to upload, overwrite,
-- and delete any object, completely bypassing the admin-gated /api/upload route
-- and threatening the integrity of custom-torte reference images.
--
-- New model:
--   - Public read stays (product/catalog images must be publicly viewable).
--   - Admin uploads (/api/upload) already use the service-role key, which
--     bypasses RLS entirely — admins do not need a storage.objects policy.
--   - Guest custom-torte uploads (/api/custom-designs) are switched to use the
--     service-role key as well (see route.ts change), so they don't need a
--     public storage policy either.
--   - Therefore anonymous/authenticated INSERT/UPDATE/DELETE policies are
--     dropped outright; only service-role (which bypasses RLS) and admins
--     acting through server routes can write to this bucket going forward.

DROP POLICY IF EXISTS "Anyone can upload to bilder" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update bilder" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete bilder" ON storage.objects;

-- Public read access is intentional and unchanged.
-- "Public Access for bilder bucket" (SELECT, bucket_id = 'bilder') stays in place.
