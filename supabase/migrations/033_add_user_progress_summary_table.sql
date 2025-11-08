-- Migration: Add user_progress_summary table for efficient recommendation generation
-- This table maintains a rolling summary of user performance for quick lookups
-- Updated after each practice session to provide instant insights

-- Create user_progress_summary table
CREATE TABLE IF NOT EXISTS user_progress_summary (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  
  -- Overall statistics (last 30 days)
  total_sessions INTEGER NOT NULL DEFAULT 0,
  total_questions_attempted INTEGER NOT NULL DEFAULT 0,
  total_correct INTEGER NOT NULL DEFAULT 0,
  total_incorrect INTEGER NOT NULL DEFAULT 0,
  overall_accuracy NUMERIC(5, 2) NOT NULL DEFAULT 0,
  
  -- Time statistics
  total_practice_time_seconds INTEGER NOT NULL DEFAULT 0,
  avg_session_time_seconds INTEGER NOT NULL DEFAULT 0,
  
  -- Difficulty progression
  easy_total INTEGER NOT NULL DEFAULT 0,
  easy_correct INTEGER NOT NULL DEFAULT 0,
  easy_accuracy NUMERIC(5, 2) NOT NULL DEFAULT 0,
  medium_total INTEGER NOT NULL DEFAULT 0,
  medium_correct INTEGER NOT NULL DEFAULT 0,
  medium_accuracy NUMERIC(5, 2) NOT NULL DEFAULT 0,
  hard_total INTEGER NOT NULL DEFAULT 0,
  hard_correct INTEGER NOT NULL DEFAULT 0,
  hard_accuracy NUMERIC(5, 2) NOT NULL DEFAULT 0,
  
  -- Weak topics (top 5, stored as JSONB for flexibility)
  weak_topics JSONB DEFAULT '[]'::jsonb,
  -- Format: [{"topic": "Clock", "accuracy": 45.5, "attempts": 11, "correct": 5, "priority": 1}, ...]
  
  -- Improving topics (top 3)
  improving_topics JSONB DEFAULT '[]'::jsonb,
  -- Format: [{"topic": "Percentages", "accuracy": 72.0, "attempts": 15, "trend": "up"}, ...]
  
  -- Strong topics (top 3)
  strong_topics JSONB DEFAULT '[]'::jsonb,
  -- Format: [{"topic": "Time & Work", "accuracy": 88.0, "attempts": 20, "mastery_level": "advanced"}, ...]
  
  -- Practice patterns
  last_practice_date TIMESTAMP WITH TIME ZONE,
  practice_streak_days INTEGER NOT NULL DEFAULT 0,
  longest_streak_days INTEGER NOT NULL DEFAULT 0,
  avg_sessions_per_week NUMERIC(4, 2) NOT NULL DEFAULT 0,
  
  -- Recommendations metadata
  needs_difficulty_progression BOOLEAN DEFAULT FALSE,
  needs_consistency_improvement BOOLEAN DEFAULT FALSE,
  ready_for_hard_questions BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_user_progress_summary_user_id ON user_progress_summary(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_summary_category_id ON user_progress_summary(category_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_summary_last_practice ON user_progress_summary(user_id, last_practice_date DESC);

-- Unique constraint: one record per user per category
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_progress_summary_user_category ON user_progress_summary(user_id, category_id);

-- Enable RLS
ALTER TABLE user_progress_summary ENABLE ROW LEVEL SECURITY;

-- RLS Policies (drop if exists to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own progress summary" ON user_progress_summary;
CREATE POLICY "Users can view own progress summary" ON user_progress_summary
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own progress summary" ON user_progress_summary;
CREATE POLICY "Users can insert own progress summary" ON user_progress_summary
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own progress summary" ON user_progress_summary;
CREATE POLICY "Users can update own progress summary" ON user_progress_summary
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Function to update user progress summary after a session
CREATE OR REPLACE FUNCTION update_user_progress_summary(
  p_user_id UUID,
  p_category_id UUID,
  p_session_id UUID
) RETURNS void AS $$
DECLARE
  v_thirty_days_ago TIMESTAMP WITH TIME ZONE;
  v_weak_topics JSONB;
  v_improving_topics JSONB;
  v_strong_topics JSONB;
  v_last_practice TIMESTAMP WITH TIME ZONE;
  v_streak INTEGER;
BEGIN
  v_thirty_days_ago := NOW() - INTERVAL '30 days';
  
  -- Calculate weak topics (accuracy < 60%, min 3 attempts)
  SELECT jsonb_agg(
    jsonb_build_object(
      'topic', topic_name,
      'accuracy', current_accuracy,
      'attempts', total_attempts,
      'correct', total_correct,
      'priority', 1
    ) ORDER BY current_accuracy ASC
  )
  INTO v_weak_topics
  FROM topic_mastery
  WHERE user_id = p_user_id 
    AND category_id = p_category_id
    AND total_attempts >= 3
    AND current_accuracy < 60
    AND last_attempted_at >= v_thirty_days_ago
  LIMIT 5;
  
  -- Calculate improving topics (accuracy 60-80%, min 3 attempts)
  SELECT jsonb_agg(
    jsonb_build_object(
      'topic', topic_name,
      'accuracy', current_accuracy,
      'attempts', total_attempts,
      'trend', 'up'
    ) ORDER BY current_accuracy DESC
  )
  INTO v_improving_topics
  FROM topic_mastery
  WHERE user_id = p_user_id 
    AND category_id = p_category_id
    AND total_attempts >= 3
    AND current_accuracy >= 60 
    AND current_accuracy < 80
    AND last_attempted_at >= v_thirty_days_ago
  LIMIT 3;
  
  -- Calculate strong topics (accuracy >= 80%, min 3 attempts)
  SELECT jsonb_agg(
    jsonb_build_object(
      'topic', topic_name,
      'accuracy', current_accuracy,
      'attempts', total_attempts,
      'mastery_level', mastery_level
    ) ORDER BY current_accuracy DESC
  )
  INTO v_strong_topics
  FROM topic_mastery
  WHERE user_id = p_user_id 
    AND category_id = p_category_id
    AND total_attempts >= 3
    AND current_accuracy >= 80
    AND last_attempted_at >= v_thirty_days_ago
  LIMIT 3;
  
  -- Get last practice date
  SELECT MAX(created_at) INTO v_last_practice
  FROM practice_sessions
  WHERE user_id = p_user_id AND category_id = p_category_id;
  
  -- Calculate streak (simplified - consecutive days)
  SELECT COUNT(DISTINCT DATE(created_at)) INTO v_streak
  FROM practice_sessions
  WHERE user_id = p_user_id 
    AND category_id = p_category_id
    AND created_at >= NOW() - INTERVAL '7 days';
  
  -- Insert or update summary
  INSERT INTO user_progress_summary (
    user_id,
    category_id,
    total_sessions,
    total_questions_attempted,
    total_correct,
    total_incorrect,
    overall_accuracy,
    total_practice_time_seconds,
    avg_session_time_seconds,
    easy_total,
    easy_correct,
    easy_accuracy,
    medium_total,
    medium_correct,
    medium_accuracy,
    hard_total,
    hard_correct,
    hard_accuracy,
    weak_topics,
    improving_topics,
    strong_topics,
    last_practice_date,
    practice_streak_days,
    avg_sessions_per_week,
    needs_difficulty_progression,
    ready_for_hard_questions,
    last_updated_at
  )
  SELECT
    p_user_id,
    p_category_id,
    COUNT(DISTINCT ps.id),
    COALESCE(SUM(ps.total_questions), 0),
    COALESCE(SUM(ps.correct_answers), 0),
    COALESCE(SUM(ps.incorrect_answers), 0),
    CASE 
      WHEN SUM(ps.total_questions) > 0 
      THEN (SUM(ps.correct_answers)::NUMERIC / SUM(ps.total_questions) * 100)
      ELSE 0 
    END,
    COALESCE(SUM(ps.time_taken_seconds), 0),
    CASE 
      WHEN COUNT(ps.id) > 0 
      THEN COALESCE(AVG(ps.time_taken_seconds), 0)
      ELSE 0 
    END,
    COALESCE(SUM(ss.easy_total), 0),
    COALESCE(SUM(ss.easy_correct), 0),
    CASE 
      WHEN SUM(ss.easy_total) > 0 
      THEN (SUM(ss.easy_correct)::NUMERIC / SUM(ss.easy_total) * 100)
      ELSE 0 
    END,
    COALESCE(SUM(ss.medium_total), 0),
    COALESCE(SUM(ss.medium_correct), 0),
    CASE 
      WHEN SUM(ss.medium_total) > 0 
      THEN (SUM(ss.medium_correct)::NUMERIC / SUM(ss.medium_total) * 100)
      ELSE 0 
    END,
    COALESCE(SUM(ss.hard_total), 0),
    COALESCE(SUM(ss.hard_correct), 0),
    CASE 
      WHEN SUM(ss.hard_total) > 0 
      THEN (SUM(ss.hard_correct)::NUMERIC / SUM(ss.hard_total) * 100)
      ELSE 0 
    END,
    COALESCE(v_weak_topics, '[]'::jsonb),
    COALESCE(v_improving_topics, '[]'::jsonb),
    COALESCE(v_strong_topics, '[]'::jsonb),
    v_last_practice,
    v_streak,
    CASE 
      WHEN COUNT(DISTINCT ps.id) > 0 
      THEN (COUNT(DISTINCT ps.id)::NUMERIC / 4.0)  -- 30 days ≈ 4 weeks
      ELSE 0 
    END,
    (SUM(ps.correct_answers)::NUMERIC / NULLIF(SUM(ps.total_questions), 0) * 100) >= 80 
      AND COALESCE(SUM(ss.hard_total), 0) = 0,
    (SUM(ps.correct_answers)::NUMERIC / NULLIF(SUM(ps.total_questions), 0) * 100) >= 80 
      AND COALESCE(SUM(ss.hard_total), 0) = 0,
    NOW()
  FROM practice_sessions ps
  LEFT JOIN session_summary ss ON ss.session_id = ps.id
  WHERE ps.user_id = p_user_id 
    AND ps.category_id = p_category_id
    AND ps.created_at >= v_thirty_days_ago
  ON CONFLICT (user_id, category_id) 
  DO UPDATE SET
    total_sessions = EXCLUDED.total_sessions,
    total_questions_attempted = EXCLUDED.total_questions_attempted,
    total_correct = EXCLUDED.total_correct,
    total_incorrect = EXCLUDED.total_incorrect,
    overall_accuracy = EXCLUDED.overall_accuracy,
    total_practice_time_seconds = EXCLUDED.total_practice_time_seconds,
    avg_session_time_seconds = EXCLUDED.avg_session_time_seconds,
    easy_total = EXCLUDED.easy_total,
    easy_correct = EXCLUDED.easy_correct,
    easy_accuracy = EXCLUDED.easy_accuracy,
    medium_total = EXCLUDED.medium_total,
    medium_correct = EXCLUDED.medium_correct,
    medium_accuracy = EXCLUDED.medium_accuracy,
    hard_total = EXCLUDED.hard_total,
    hard_correct = EXCLUDED.hard_correct,
    hard_accuracy = EXCLUDED.hard_accuracy,
    weak_topics = EXCLUDED.weak_topics,
    improving_topics = EXCLUDED.improving_topics,
    strong_topics = EXCLUDED.strong_topics,
    last_practice_date = EXCLUDED.last_practice_date,
    practice_streak_days = EXCLUDED.practice_streak_days,
    avg_sessions_per_week = EXCLUDED.avg_sessions_per_week,
    needs_difficulty_progression = EXCLUDED.needs_difficulty_progression,
    ready_for_hard_questions = EXCLUDED.ready_for_hard_questions,
    last_updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE user_progress_summary IS 'Maintains a rolling 30-day summary of user performance for efficient recommendation generation';
COMMENT ON COLUMN user_progress_summary.weak_topics IS 'Top 5 weak topics (accuracy < 60%) with priority ranking';
COMMENT ON COLUMN user_progress_summary.improving_topics IS 'Top 3 improving topics (accuracy 60-80%) showing positive trends';
COMMENT ON COLUMN user_progress_summary.strong_topics IS 'Top 3 strong topics (accuracy >= 80%) with mastery levels';
COMMENT ON COLUMN user_progress_summary.needs_difficulty_progression IS 'TRUE if user should try harder difficulty levels';
COMMENT ON COLUMN user_progress_summary.ready_for_hard_questions IS 'TRUE if overall accuracy >= 80% and no hard questions attempted';
COMMENT ON FUNCTION update_user_progress_summary IS 'Updates the progress summary after each practice session for fast recommendation lookups';
