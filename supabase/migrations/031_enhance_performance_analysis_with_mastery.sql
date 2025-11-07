-- Migration: Enhance performance_analysis table with mastery tracking features
-- This adds mastery level, streaks, and lifetime tracking to the existing performance_analysis table
-- Combines the functionality of topic_mastery into performance_analysis

-- Add new columns for mastery tracking
ALTER TABLE performance_analysis
ADD COLUMN IF NOT EXISTS topic_category TEXT,
ADD COLUMN IF NOT EXISTS topic_type TEXT,
ADD COLUMN IF NOT EXISTS mastery_level TEXT CHECK (mastery_level IN ('beginner', 'intermediate', 'advanced', 'expert', 'master')) DEFAULT 'beginner',
ADD COLUMN IF NOT EXISTS mastery_score NUMERIC(5, 2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_streak INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS longest_streak INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS best_time_seconds INTEGER,
ADD COLUMN IF NOT EXISTS last_attempted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_correct_at TIMESTAMP WITH TIME ZONE;

-- Add index for mastery level queries
CREATE INDEX IF NOT EXISTS idx_performance_analysis_mastery_level ON performance_analysis(user_id, mastery_level);
CREATE INDEX IF NOT EXISTS idx_performance_analysis_mastery_score ON performance_analysis(user_id, mastery_score DESC);
CREATE INDEX IF NOT EXISTS idx_performance_analysis_topic_name ON performance_analysis(user_id, topic_name);

-- Create unique constraint for user + topic_name (for lifetime tracking)
-- This allows us to upsert records per topic across sessions
CREATE UNIQUE INDEX IF NOT EXISTS idx_performance_analysis_user_topic 
ON performance_analysis(user_id, topic_name) 
WHERE topic_name IS NOT NULL;

-- Function to calculate mastery level based on accuracy and attempts
CREATE OR REPLACE FUNCTION calculate_mastery_level(
  accuracy NUMERIC,
  attempts INTEGER
) RETURNS TEXT AS $$
BEGIN
  -- Require minimum attempts for higher levels
  IF attempts < 3 THEN
    RETURN 'beginner';
  ELSIF attempts < 5 THEN
    IF accuracy >= 80 THEN RETURN 'intermediate';
    ELSE RETURN 'beginner';
    END IF;
  ELSIF attempts < 10 THEN
    IF accuracy >= 90 THEN RETURN 'advanced';
    ELSIF accuracy >= 75 THEN RETURN 'intermediate';
    ELSE RETURN 'beginner';
    END IF;
  ELSIF attempts < 20 THEN
    IF accuracy >= 95 THEN RETURN 'expert';
    ELSIF accuracy >= 85 THEN RETURN 'advanced';
    ELSIF accuracy >= 70 THEN RETURN 'intermediate';
    ELSE RETURN 'beginner';
    END IF;
  ELSE
    IF accuracy >= 98 THEN RETURN 'master';
    ELSIF accuracy >= 92 THEN RETURN 'expert';
    ELSIF accuracy >= 82 THEN RETURN 'advanced';
    ELSIF accuracy >= 65 THEN RETURN 'intermediate';
    ELSE RETURN 'beginner';
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate mastery score (0-100)
CREATE OR REPLACE FUNCTION calculate_mastery_score(
  accuracy NUMERIC,
  attempts INTEGER,
  streak INTEGER
) RETURNS NUMERIC AS $$
DECLARE
  base_score NUMERIC;
  attempt_bonus NUMERIC;
  streak_bonus NUMERIC;
BEGIN
  -- Base score from accuracy (0-70 points)
  base_score := accuracy * 0.7;
  
  -- Attempt bonus (0-20 points, maxes at 50 attempts)
  attempt_bonus := LEAST(attempts / 50.0 * 20, 20);
  
  -- Streak bonus (0-10 points, maxes at 10 streak)
  streak_bonus := LEAST(streak / 10.0 * 10, 10);
  
  RETURN LEAST(base_score + attempt_bonus + streak_bonus, 100);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add comments for new columns
COMMENT ON COLUMN performance_analysis.topic_category IS 'Main category extracted from topic_name (e.g., "Time and Distance")';
COMMENT ON COLUMN performance_analysis.topic_type IS 'Specific problem type extracted from topic_name (e.g., "Bus Speed System Problem")';
COMMENT ON COLUMN performance_analysis.mastery_level IS 'Current mastery level: beginner, intermediate, advanced, expert, master';
COMMENT ON COLUMN performance_analysis.mastery_score IS 'Composite score (0-100) based on accuracy, attempts, and streak';
COMMENT ON COLUMN performance_analysis.current_streak IS 'Current consecutive correct answers for this topic';
COMMENT ON COLUMN performance_analysis.longest_streak IS 'Longest streak ever achieved for this topic';
COMMENT ON COLUMN performance_analysis.best_time_seconds IS 'Best (fastest) time to solve a question of this topic';
COMMENT ON COLUMN performance_analysis.last_attempted_at IS 'Timestamp of last attempt for this topic';
COMMENT ON COLUMN performance_analysis.last_correct_at IS 'Timestamp of last correct answer for this topic';

COMMENT ON FUNCTION calculate_mastery_level IS 'Calculates mastery level based on accuracy and number of attempts';
COMMENT ON FUNCTION calculate_mastery_score IS 'Calculates composite mastery score (0-100) from accuracy, attempts, and streak';

-- Update table comment
COMMENT ON TABLE performance_analysis IS 'Stores comprehensive performance analysis by topic including mastery tracking, streaks, and lifetime statistics. Supports both per-session and lifetime tracking via upsert on user_id + topic_name.';
