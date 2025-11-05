-- ============================================================
-- ADD USER PREFERENCES COLUMNS TO PROFILES TABLE
-- ============================================================
-- This migration adds preference columns for notifications, tests, appearance, and privacy
-- to allow users to customize their experience

-- Add notification_preferences column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'notification_preferences'
  ) THEN
    ALTER TABLE profiles 
    ADD COLUMN notification_preferences JSONB DEFAULT '{
      "emailNotifications": true,
      "assignmentReminders": true,
      "testResults": true,
      "weeklyReports": true,
      "achievementNotifications": true,
      "pushNotifications": false
    }'::jsonb;
    
    COMMENT ON COLUMN profiles.notification_preferences IS 'User preferences for email and push notifications';
  END IF;
END $$;

-- Add test_preferences column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'test_preferences'
  ) THEN
    ALTER TABLE profiles 
    ADD COLUMN test_preferences JSONB DEFAULT '{
      "autoSubmitOnTimeExpiry": true,
      "showCorrectAnswersImmediately": false,
      "defaultDifficulty": "medium",
      "enableQuestionReviewMode": true
    }'::jsonb;
    
    COMMENT ON COLUMN profiles.test_preferences IS 'User preferences for test-taking behavior';
  END IF;
END $$;

-- Add appearance_preferences column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'appearance_preferences'
  ) THEN
    ALTER TABLE profiles 
    ADD COLUMN appearance_preferences JSONB DEFAULT '{
      "themeMode": "system",
      "fontSize": "medium",
      "compactMode": false
    }'::jsonb;
    
    COMMENT ON COLUMN profiles.appearance_preferences IS 'User preferences for UI appearance and theme';
  END IF;
END $$;

-- Add privacy_preferences column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'privacy_preferences'
  ) THEN
    ALTER TABLE profiles 
    ADD COLUMN privacy_preferences JSONB DEFAULT '{
      "leaderboardVisibility": true,
      "profileVisibility": true,
      "showEmail": false,
      "showPhone": false
    }'::jsonb;
    
    COMMENT ON COLUMN profiles.privacy_preferences IS 'User preferences for privacy and data visibility';
  END IF;
END $$;

-- Ensure RLS policies allow users to update their own preferences
-- The existing "Users can update own profile" policy should cover these columns
-- Verify RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- COMMENTS
-- ============================================================
COMMENT ON TABLE profiles IS 'User profiles with onboarding information, dashboard preferences, and user preferences';

