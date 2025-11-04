-- ============================================================
-- FIX DASHBOARD PREFERENCES UPDATE ISSUE
-- ============================================================
-- This migration ensures the RLS policy allows updates to dashboard_preferences
-- and verifies the column exists and has proper defaults

-- Ensure dashboard_preferences column exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'dashboard_preferences'
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
  END IF;
END $$;

-- Ensure the update policy has both USING and WITH CHECK clauses
DO $$
BEGIN
  -- Drop existing policy if it doesn't have WITH CHECK
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND policyname = 'Users can update own profile'
    AND with_check IS NULL
  ) THEN
    DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
  END IF;
  
  -- Create policy with both clauses if it doesn't exist
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
  END IF;
END $$;

-- Verify RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Add comment
COMMENT ON COLUMN profiles.dashboard_preferences IS 
'User preferences for dashboard feature visibility. All features default to visible (true). Users can update their own preferences.';

