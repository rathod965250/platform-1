-- Add longest_streak_days to user_analytics and index last_activity_date
ALTER TABLE user_analytics
ADD COLUMN IF NOT EXISTS longest_streak_days INTEGER DEFAULT 0;

-- Optional index to accelerate last activity lookups
DO $$ BEGIN
  PERFORM 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_user_analytics_last_activity_date';
  IF NOT FOUND THEN
    CREATE INDEX idx_user_analytics_last_activity_date ON user_analytics(last_activity_date);
  END IF;
END $$;

COMMENT ON COLUMN user_analytics.longest_streak_days IS 'Longest consecutive daily activity streak across adaptive practice, mock/company-specific tests, assignments, and custom tests';
