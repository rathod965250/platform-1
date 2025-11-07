-- Add unique constraint on leaderboard for upsert operations
-- This ensures a user can only have one leaderboard entry per test per period type

ALTER TABLE leaderboard
ADD CONSTRAINT unique_user_test_period UNIQUE (user_id, test_id, period_type);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_leaderboard_user_test_period ON leaderboard(user_id, test_id, period_type);

