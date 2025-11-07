-- Migration: Add topic mastery tracking for granular insights
-- This creates a dedicated table for tracking mastery at the question_topic level
-- Enables eye-catching visualizations like "You're a master at Chase Problems!"

-- Create topic_mastery table for granular tracking
CREATE TABLE IF NOT EXISTS topic_mastery (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  subcategory_id UUID REFERENCES subcategories(id) ON DELETE CASCADE,
  
  -- Topic details (from question_topic field)
  topic_name TEXT NOT NULL,  -- e.g., "Time and Distance - Bus Speed System Problem"
  topic_category TEXT,        -- e.g., "Time and Distance" (extracted from topic_name)
  topic_type TEXT,            -- e.g., "Bus Speed System Problem" (extracted from topic_name)
  
  -- Lifetime statistics
  total_attempts INTEGER NOT NULL DEFAULT 0,
  total_correct INTEGER NOT NULL DEFAULT 0,
  total_incorrect INTEGER NOT NULL DEFAULT 0,
  total_skipped INTEGER NOT NULL DEFAULT 0,
  
  -- Current mastery metrics
  current_accuracy NUMERIC(5, 2) NOT NULL DEFAULT 0,
  mastery_level TEXT CHECK (mastery_level IN ('beginner', 'intermediate', 'advanced', 'expert', 'master')) DEFAULT 'beginner',
  mastery_score NUMERIC(5, 2) NOT NULL DEFAULT 0,  -- 0-100 score
  
  -- Streak tracking
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  
  -- Time metrics
  total_time_seconds INTEGER NOT NULL DEFAULT 0,
  avg_time_seconds INTEGER NOT NULL DEFAULT 0,
  best_time_seconds INTEGER,
  
  -- Difficulty breakdown
  easy_attempts INTEGER NOT NULL DEFAULT 0,
  easy_correct INTEGER NOT NULL DEFAULT 0,
  medium_attempts INTEGER NOT NULL DEFAULT 0,
  medium_correct INTEGER NOT NULL DEFAULT 0,
  hard_attempts INTEGER NOT NULL DEFAULT 0,
  hard_correct INTEGER NOT NULL DEFAULT 0,
  
  -- Last activity
  last_attempted_at TIMESTAMP WITH TIME ZONE,
  last_correct_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for fast queries
CREATE INDEX idx_topic_mastery_user_id ON topic_mastery(user_id);
CREATE INDEX idx_topic_mastery_category_id ON topic_mastery(category_id);
CREATE INDEX idx_topic_mastery_subcategory_id ON topic_mastery(subcategory_id);
CREATE INDEX idx_topic_mastery_topic_name ON topic_mastery(topic_name);
CREATE INDEX idx_topic_mastery_mastery_level ON topic_mastery(user_id, mastery_level);
CREATE INDEX idx_topic_mastery_accuracy ON topic_mastery(user_id, current_accuracy DESC);

-- Unique constraint: one record per user per topic
CREATE UNIQUE INDEX idx_topic_mastery_user_topic ON topic_mastery(user_id, topic_name);

-- Enable RLS
ALTER TABLE topic_mastery ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own topic mastery" ON topic_mastery
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own topic mastery" ON topic_mastery
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own topic mastery" ON topic_mastery
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

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

-- Add comments for documentation
COMMENT ON TABLE topic_mastery IS 'Tracks user mastery at the granular question_topic level for detailed insights and visualizations';
COMMENT ON COLUMN topic_mastery.topic_name IS 'Full topic name from question_topic field (e.g., "Time and Distance - Bus Speed System Problem")';
COMMENT ON COLUMN topic_mastery.topic_category IS 'Main category extracted from topic_name (e.g., "Time and Distance")';
COMMENT ON COLUMN topic_mastery.topic_type IS 'Specific problem type extracted from topic_name (e.g., "Bus Speed System Problem")';
COMMENT ON COLUMN topic_mastery.mastery_level IS 'Current mastery level: beginner, intermediate, advanced, expert, master';
COMMENT ON COLUMN topic_mastery.mastery_score IS 'Composite score (0-100) based on accuracy, attempts, and streak';
COMMENT ON COLUMN topic_mastery.current_streak IS 'Current consecutive correct answers';
COMMENT ON COLUMN topic_mastery.longest_streak IS 'Longest streak ever achieved for this topic';

COMMENT ON FUNCTION calculate_mastery_level IS 'Calculates mastery level based on accuracy and number of attempts';
COMMENT ON FUNCTION calculate_mastery_score IS 'Calculates composite mastery score (0-100) from accuracy, attempts, and streak';
