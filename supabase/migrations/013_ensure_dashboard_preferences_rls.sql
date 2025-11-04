-- ============================================================
-- ENSURE DASHBOARD PREFERENCES RLS POLICY
-- ============================================================
-- This migration ensures that users can update their own dashboard_preferences
-- The existing "Users can update own profile" policy should already cover this,
-- but we'll verify and add explicit policy if needed

-- Verify the existing update policy exists
DO $$
BEGIN
  -- Check if the update policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND policyname = 'Users can update own profile'
  ) THEN
    -- Create the update policy if it doesn't exist
    CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- The existing policy should allow updates to dashboard_preferences
-- as it allows users to update their own profile (all columns)
-- No additional policy needed, but this ensures the policy exists

COMMENT ON COLUMN profiles.dashboard_preferences IS 'User preferences for dashboard feature visibility. All features default to visible (true). Users can update their own preferences via RLS policy.';

