-- ============================================================
-- FIX DASHBOARD PREFERENCES UPDATE RLS POLICY
-- ============================================================
-- This SQL script fixes the RLS policy for updating dashboard_preferences
-- in the profiles table. The issue is that UPDATE policies require both
-- USING and WITH CHECK clauses for proper RLS enforcement.
--
-- INSTRUCTIONS:
-- 1. Open your Supabase Dashboard
-- 2. Go to SQL Editor
-- 3. Paste this entire script
-- 4. Click "Run" to execute
-- 5. Verify the migration was successful
-- ============================================================

-- Step 1: Ensure dashboard_preferences column exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'profiles' 
    AND column_name = 'dashboard_preferences'
  ) THEN
    ALTER TABLE profiles 
    ADD COLUMN dashboard_preferences JSONB DEFAULT '{
      "showRankCards": true,
      "showProgressTracking": true,
      "showAchievementBadges": true,
      "showImprovementTrends": true,
      "showPeerComparison": true,
      "showRecommendations": true,
      "showPerformanceTrend": true,
      "showWeakAreas": true
    }'::jsonb;
    
    COMMENT ON COLUMN profiles.dashboard_preferences IS 
    'User preferences for dashboard feature visibility. All features default to visible (true).';
  END IF;
END $$;

-- Step 2: Drop existing policy if it doesn't have WITH CHECK clause
DO $$
BEGIN
  -- Check if policy exists and lacks WITH CHECK
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND policyname = 'Users can update own profile'
    AND (with_check IS NULL OR with_check = '')
  ) THEN
    DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
  END IF;
END $$;

-- Step 3: Create policy with both USING and WITH CHECK clauses
DO $$
BEGIN
  -- Only create if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile" ON profiles
      FOR UPDATE
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
      
    COMMENT ON POLICY "Users can update own profile" ON profiles IS 
    'Allows authenticated users to update their own profile, including dashboard_preferences. Requires both USING and WITH CHECK clauses for proper RLS enforcement.';
  END IF;
END $$;

-- Step 4: Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Step 5: Verify the fix
DO $$
DECLARE
  policy_exists BOOLEAN;
  has_with_check BOOLEAN;
BEGIN
  -- Check if policy exists with WITH CHECK clause
  SELECT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND policyname = 'Users can update own profile'
    AND with_check IS NOT NULL
    AND with_check != ''
  ) INTO has_with_check;
  
  IF has_with_check THEN
    RAISE NOTICE '✅ SUCCESS: RLS policy "Users can update own profile" has been fixed with WITH CHECK clause.';
  ELSE
    RAISE WARNING '⚠️  WARNING: Policy may not have been created correctly. Please check manually.';
  END IF;
END $$;

-- ============================================================
-- VERIFICATION QUERIES (Optional - run these to verify)
-- ============================================================

-- Check if column exists:
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_schema = 'public' 
-- AND table_name = 'profiles' 
-- AND column_name = 'dashboard_preferences';

-- Check if policy exists with WITH CHECK:
-- SELECT policyname, cmd, qual, with_check 
-- FROM pg_policies 
-- WHERE schemaname = 'public' 
-- AND tablename = 'profiles' 
-- AND policyname = 'Users can update own profile';

-- Check if RLS is enabled:
-- SELECT tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public' 
-- AND tablename = 'profiles';

