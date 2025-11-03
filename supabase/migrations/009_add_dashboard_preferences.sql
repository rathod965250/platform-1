-- ============================================================
-- ADD DASHBOARD PREFERENCES TO PROFILES TABLE
-- ============================================================
-- This migration adds a dashboard_preferences JSONB column to the profiles table
-- to allow users to toggle visibility of motivational dashboard features

-- Add dashboard_preferences column to profiles table if it doesn't exist
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
    
    COMMENT ON COLUMN profiles.dashboard_preferences IS 'User preferences for dashboard feature visibility. All features default to visible (true).';
  END IF;
END $$;

-- ============================================================
-- COMMENTS
-- ============================================================
COMMENT ON TABLE profiles IS 'User profiles with onboarding information and dashboard preferences';

