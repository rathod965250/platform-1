-- ============================================================
-- AVATAR PROFILE STORAGE BUCKET SETUP
-- ============================================================
-- IMPORTANT: The bucket "Avatar profile" must be created manually in Supabase Dashboard
-- Run this SQL in Supabase Dashboard → SQL Editor

-- First, ensure RLS is enabled on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can list their own avatars" ON storage.objects;

-- Policy 1: Allow authenticated users to upload their own avatars
CREATE POLICY "Users can upload their own avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'Avatar profile' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 2: Allow authenticated users to update their own avatars
CREATE POLICY "Users can update their own avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'Avatar profile' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'Avatar profile' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 3: Allow authenticated users to delete their own avatars
CREATE POLICY "Users can delete their own avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'Avatar profile' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 4: Allow public read access to avatars
CREATE POLICY "Public can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'Avatar profile');

-- Policy 5: Allow authenticated users to list their own avatar files
CREATE POLICY "Users can list their own avatars"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'Avatar profile' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Verify avatar_url column exists in profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN avatar_url TEXT;
    CREATE INDEX IF NOT EXISTS idx_profiles_avatar_url ON profiles(avatar_url);
  END IF;
END $$;

