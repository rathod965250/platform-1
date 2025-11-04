-- ============================================================
-- FIX: Storage RLS Policies for "Avatar profile" Bucket
-- ============================================================
-- Run this SQL in Supabase Dashboard → SQL Editor
-- This will fix the "new row violates row-level security policy" error

-- Step 1: Drop existing policies for this bucket (to avoid conflicts)
-- Note: If you get "policy does not exist" errors, that's fine - just continue
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
  DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;
  DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
  DROP POLICY IF EXISTS "Users can list their own avatars" ON storage.objects;
EXCEPTION
  WHEN OTHERS THEN
    -- Ignore errors if policies don't exist
    NULL;
END $$;

-- Step 3: Create policies for "Avatar profile" bucket
-- Note: Bucket name with space needs to match exactly

-- Policy 1: Allow authenticated users to INSERT (upload) their own avatars
CREATE POLICY "Users can upload their own avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'Avatar profile' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 2: Allow authenticated users to UPDATE their own avatars
CREATE POLICY "Users can update their own avatars"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'Avatar profile' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'Avatar profile' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 3: Allow authenticated users to DELETE their own avatars
CREATE POLICY "Users can delete their own avatars"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'Avatar profile' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 4: Allow PUBLIC to SELECT (read/view) avatars
-- This is needed to display profile pictures without authentication
CREATE POLICY "Public can view avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'Avatar profile');

-- Policy 5: Allow authenticated users to SELECT (list) their own avatars
CREATE POLICY "Users can list their own avatars"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'Avatar profile' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Step 4: Verify the policies were created
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%avatar%'
ORDER BY policyname;

-- Expected output: 5 policies should be listed

