-- ============================================================
-- AVATAR PROFILE STORAGE BUCKET SETUP
-- ============================================================
-- IMPORTANT: The bucket "Avatar profile" must be created manually in Supabase Dashboard
-- 
-- Steps to create the bucket:
-- 1. Go to your Supabase Dashboard
-- 2. Navigate to Storage → Buckets
-- 3. Click "New bucket"
-- 4. Configure:
--    - Name: Avatar profile
--    - Public: ✅ Enable (so images can be accessed via URL)
--    - File size limit: 5242880 (5MB)
--    - Allowed MIME types: image/jpeg,image/png,image/webp,image/gif
--
-- After creating the bucket, run this migration to set up RLS policies

-- ============================================================
-- STORAGE RLS POLICIES FOR AVATAR PROFILE BUCKET
-- ============================================================

-- Policy 1: Allow authenticated users to upload their own avatars
-- Users can only upload to their own folder: Avatar profile/{user-id}/
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Users can upload their own avatars'
  ) THEN
    CREATE POLICY "Users can upload their own avatars"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'Avatar profile' AND
      (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;
END $$;

-- Policy 2: Allow authenticated users to update their own avatars
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Users can update their own avatars'
  ) THEN
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
  END IF;
END $$;

-- Policy 3: Allow authenticated users to delete their own avatars
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Users can delete their own avatars'
  ) THEN
    CREATE POLICY "Users can delete their own avatars"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'Avatar profile' AND
      (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;
END $$;

-- Policy 4: Allow public read access to avatars
-- This allows profile pictures to be displayed without authentication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Public can view avatars'
  ) THEN
    CREATE POLICY "Public can view avatars"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'Avatar profile');
  END IF;
END $$;

-- Policy 5: Allow authenticated users to list their own avatar files
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Users can list their own avatars'
  ) THEN
    CREATE POLICY "Users can list their own avatars"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
      bucket_id = 'Avatar profile' AND
      (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;
END $$;

-- ============================================================
-- VERIFY AVATAR_URL COLUMN EXISTS IN PROFILES TABLE
-- ============================================================
DO $$
BEGIN
  -- Check if avatar_url column exists, if not add it
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN avatar_url TEXT;
    CREATE INDEX IF NOT EXISTS idx_profiles_avatar_url ON profiles(avatar_url);
  END IF;
END $$;

-- ============================================================
-- NOTES
-- ============================================================
-- The avatar_url is managed directly in the application code:
-- - When a user uploads an avatar, the AvatarUpload component:
--   1. Uploads the image to storage.buckets."Avatar profile"
--   2. Gets the public URL
--   3. Updates profiles.avatar_url with the public URL
--
-- - When a user deletes an avatar:
--   1. Deletes the file from storage
--   2. Sets profiles.avatar_url to NULL
--
-- This ensures the profiles table always has the correct avatar URL
-- and CRUD operations are properly handled.
--
-- Note: Bucket name is "Avatar profile" (with a space), which is URL-encoded
-- in Supabase URLs as "Avatar%20profile"

