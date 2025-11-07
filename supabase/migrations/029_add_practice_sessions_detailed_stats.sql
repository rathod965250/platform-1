-- Migration: Add detailed statistics columns to practice_sessions table
-- This adds fields for tracking difficulty breakdown, time statistics, and unanswered count

-- Add new columns for detailed statistics
ALTER TABLE practice_sessions
ADD COLUMN IF NOT EXISTS unanswered_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS avg_time_seconds INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS easy_questions INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS easy_correct INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS medium_questions INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS medium_correct INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS hard_questions INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS hard_correct INTEGER NOT NULL DEFAULT 0;

-- Add comments for documentation
COMMENT ON COLUMN practice_sessions.unanswered_count IS 'Number of questions not attempted (neither answered nor skipped)';
COMMENT ON COLUMN practice_sessions.avg_time_seconds IS 'Average time spent per attempted question in seconds';
COMMENT ON COLUMN practice_sessions.easy_questions IS 'Total number of easy difficulty questions in the session';
COMMENT ON COLUMN practice_sessions.easy_correct IS 'Number of easy questions answered correctly';
COMMENT ON COLUMN practice_sessions.medium_questions IS 'Total number of medium difficulty questions in the session';
COMMENT ON COLUMN practice_sessions.medium_correct IS 'Number of medium questions answered correctly';
COMMENT ON COLUMN practice_sessions.hard_questions IS 'Total number of hard difficulty questions in the session';
COMMENT ON COLUMN practice_sessions.hard_correct IS 'Number of hard questions answered correctly';
