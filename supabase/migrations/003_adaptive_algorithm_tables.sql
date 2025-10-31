-- ============================================================
-- ADAPTIVE ALGORITHM TABLES
-- ============================================================
-- These tables support real-time adaptive difficulty adjustment
-- and comprehensive performance tracking for practice mode

-- ============================================================
-- ADAPTIVE STATE TABLE
-- ============================================================
-- Stores user's current mastery level and difficulty state per category
CREATE TABLE adaptive_state (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  mastery_score DECIMAL(3,2) DEFAULT 0.50 CHECK (mastery_score >= 0 AND mastery_score <= 1),
  current_difficulty TEXT DEFAULT 'medium' CHECK (current_difficulty IN ('easy', 'medium', 'hard')),
  recent_accuracy DECIMAL(5,2)[] DEFAULT '{}',
  avg_time_seconds INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, category_id)
);

CREATE INDEX idx_adaptive_state_user_category ON adaptive_state(user_id, category_id);
CREATE INDEX idx_adaptive_state_user_id ON adaptive_state(user_id);
CREATE INDEX idx_adaptive_state_last_updated ON adaptive_state(last_updated DESC);

-- ============================================================
-- USER METRICS TABLE
-- ============================================================
-- Logs every question attempt for granular analytics
CREATE TABLE user_metrics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES practice_sessions(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE NOT NULL,
  subcategory_id UUID REFERENCES subcategories(id) ON DELETE SET NULL,
  is_correct BOOLEAN NOT NULL,
  time_taken_seconds INTEGER NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  previous_difficulty TEXT CHECK (previous_difficulty IN ('easy', 'medium', 'hard')),
  mastery_score_before DECIMAL(3,2),
  mastery_score_after DECIMAL(3,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_metrics_user_id ON user_metrics(user_id);
CREATE INDEX idx_user_metrics_session_id ON user_metrics(session_id);
CREATE INDEX idx_user_metrics_created_at ON user_metrics(created_at DESC);
CREATE INDEX idx_user_metrics_subcategory_id ON user_metrics(subcategory_id);
CREATE INDEX idx_user_metrics_user_session ON user_metrics(user_id, session_id);

-- ============================================================
-- SESSION STATS TABLE
-- ============================================================
-- Aggregated session-level performance tracking
CREATE TABLE session_stats (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES practice_sessions(id) ON DELETE CASCADE UNIQUE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  avg_accuracy DECIMAL(5,2),
  avg_time_seconds INTEGER,
  difficulty_transitions INTEGER DEFAULT 0,
  session_duration_seconds INTEGER,
  improvement_rate DECIMAL(5,2),
  topic_wise_accuracy JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_session_stats_user_id ON session_stats(user_id);
CREATE INDEX idx_session_stats_session_id ON session_stats(session_id);
CREATE INDEX idx_session_stats_category_id ON session_stats(category_id);
CREATE INDEX idx_session_stats_created_at ON session_stats(created_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- Enable RLS on adaptive tables
ALTER TABLE adaptive_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_stats ENABLE ROW LEVEL SECURITY;

-- Adaptive State Policies
CREATE POLICY "Users can view own adaptive state" ON adaptive_state
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own adaptive state" ON adaptive_state
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own adaptive state" ON adaptive_state
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all adaptive states" ON adaptive_state
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- User Metrics Policies
CREATE POLICY "Users can view own metrics" ON user_metrics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own metrics" ON user_metrics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all metrics" ON user_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Session Stats Policies
CREATE POLICY "Users can view own session stats" ON session_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own session stats" ON session_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own session stats" ON session_stats
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all session stats" ON session_stats
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Function to initialize adaptive state for a user-category pair
CREATE OR REPLACE FUNCTION initialize_adaptive_state(
  p_user_id UUID,
  p_category_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_state_id UUID;
BEGIN
  INSERT INTO adaptive_state (user_id, category_id)
  VALUES (p_user_id, p_category_id)
  ON CONFLICT (user_id, category_id) 
  DO UPDATE SET last_updated = NOW()
  RETURNING id INTO v_state_id;
  
  RETURN v_state_id;
END;
$$;

-- Function to update adaptive state after question attempt
CREATE OR REPLACE FUNCTION update_adaptive_state(
  p_user_id UUID,
  p_category_id UUID,
  p_is_correct BOOLEAN,
  p_time_taken INTEGER,
  p_new_difficulty TEXT
)
RETURNS TABLE (
  mastery_score DECIMAL(3,2),
  current_difficulty TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_mastery DECIMAL(3,2);
  v_new_mastery DECIMAL(3,2);
  v_recent_acc DECIMAL(5,2)[];
BEGIN
  -- Get current state
  SELECT adaptive_state.mastery_score, adaptive_state.recent_accuracy
  INTO v_current_mastery, v_recent_acc
  FROM adaptive_state
  WHERE adaptive_state.user_id = p_user_id
    AND adaptive_state.category_id = p_category_id;
  
  -- If no state exists, initialize
  IF v_current_mastery IS NULL THEN
    PERFORM initialize_adaptive_state(p_user_id, p_category_id);
    v_current_mastery := 0.50;
    v_recent_acc := '{}';
  END IF;
  
  -- Calculate new mastery score
  IF p_is_correct THEN
    v_new_mastery := LEAST(v_current_mastery + 0.05, 1.0);
  ELSE
    v_new_mastery := GREATEST(v_current_mastery - 0.05, 0.0);
  END IF;
  
  -- Update recent accuracy (keep last 10)
  v_recent_acc := array_append(v_recent_acc, CASE WHEN p_is_correct THEN 100 ELSE 0 END);
  IF array_length(v_recent_acc, 1) > 10 THEN
    v_recent_acc := v_recent_acc[2:11];
  END IF;
  
  -- Update state
  UPDATE adaptive_state
  SET 
    mastery_score = v_new_mastery,
    current_difficulty = p_new_difficulty,
    recent_accuracy = v_recent_acc,
    avg_time_seconds = (
      COALESCE(avg_time_seconds * 0.8, 0) + p_time_taken * 0.2
    )::INTEGER,
    last_updated = NOW()
  WHERE adaptive_state.user_id = p_user_id
    AND adaptive_state.category_id = p_category_id;
  
  RETURN QUERY SELECT v_new_mastery, p_new_difficulty;
END;
$$;

COMMENT ON TABLE adaptive_state IS 'Tracks user mastery level and current difficulty per category for adaptive practice';
COMMENT ON TABLE user_metrics IS 'Logs every question attempt with performance metrics for analytics';
COMMENT ON TABLE session_stats IS 'Aggregated statistics for each practice session';

