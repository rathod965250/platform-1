-- ============================================================
-- CUSTOM MOCK TESTS TABLE
-- ============================================================
-- This migration creates a dedicated table for tracking custom
-- mock tests created by users, including their configuration,
-- analytics, and history
-- ============================================================

-- Create custom_mock_tests table
CREATE TABLE IF NOT EXISTS custom_mock_tests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  test_id UUID REFERENCES tests(id) ON DELETE SET NULL,
  
  -- Test Configuration
  title TEXT NOT NULL,
  description TEXT,
  
  -- Selection Details
  selected_categories UUID[] NOT NULL DEFAULT '{}',
  selected_subcategories UUID[] NOT NULL DEFAULT '{}',
  difficulty_level TEXT NOT NULL CHECK (difficulty_level IN ('all', 'easy', 'medium', 'hard')),
  
  -- Test Parameters
  total_questions INTEGER NOT NULL CHECK (total_questions > 0),
  duration_hours INTEGER NOT NULL DEFAULT 0 CHECK (duration_hours >= 0 AND duration_hours <= 5),
  duration_minutes INTEGER NOT NULL DEFAULT 0 CHECK (duration_minutes >= 0 AND duration_minutes <= 59),
  total_duration_minutes INTEGER GENERATED ALWAYS AS (duration_hours * 60 + duration_minutes) STORED,
  
  -- Question Distribution
  questions_per_topic JSONB, -- Stores how questions were distributed across topics
  selected_question_ids UUID[] NOT NULL DEFAULT '{}',
  
  -- Test Status
  status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'in_progress', 'completed', 'abandoned')),
  
  -- Analytics
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  time_taken_minutes INTEGER,
  score INTEGER,
  total_marks INTEGER,
  percentage DECIMAL(5,2),
  
  -- User Behavior Tracking
  generation_time_ms INTEGER, -- Time taken to generate the test
  is_time_manually_set BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT valid_duration CHECK (duration_hours > 0 OR duration_minutes > 0),
  CONSTRAINT valid_time_taken CHECK (time_taken_minutes IS NULL OR time_taken_minutes >= 0),
  CONSTRAINT valid_score CHECK (score IS NULL OR (score >= 0 AND score <= total_marks))
);

-- Create indexes for performance
CREATE INDEX idx_custom_mock_tests_user_id ON custom_mock_tests(user_id);
CREATE INDEX idx_custom_mock_tests_test_id ON custom_mock_tests(test_id);
CREATE INDEX idx_custom_mock_tests_status ON custom_mock_tests(status);
CREATE INDEX idx_custom_mock_tests_created_at ON custom_mock_tests(created_at DESC);
CREATE INDEX idx_custom_mock_tests_difficulty ON custom_mock_tests(difficulty_level);
CREATE INDEX idx_custom_mock_tests_user_status ON custom_mock_tests(user_id, status);

-- Create GIN index for array searches
CREATE INDEX idx_custom_mock_tests_subcategories ON custom_mock_tests USING GIN(selected_subcategories);
CREATE INDEX idx_custom_mock_tests_categories ON custom_mock_tests USING GIN(selected_categories);

-- Enable Row Level Security
ALTER TABLE custom_mock_tests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their own custom mock tests" ON custom_mock_tests;
CREATE POLICY "Users can view their own custom mock tests" ON custom_mock_tests
  FOR SELECT 
  USING (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Users can create their own custom mock tests" ON custom_mock_tests;
CREATE POLICY "Users can create their own custom mock tests" ON custom_mock_tests
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own custom mock tests" ON custom_mock_tests;
CREATE POLICY "Users can update their own custom mock tests" ON custom_mock_tests
  FOR UPDATE 
  USING (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Users can delete their own custom mock tests" ON custom_mock_tests;
CREATE POLICY "Users can delete their own custom mock tests" ON custom_mock_tests
  FOR DELETE 
  USING (user_id = auth.uid() OR is_admin());

-- Create updated_at trigger
DROP TRIGGER IF EXISTS update_custom_mock_tests_updated_at ON custom_mock_tests;
CREATE TRIGGER update_custom_mock_tests_updated_at
  BEFORE UPDATE ON custom_mock_tests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE custom_mock_tests IS 'Tracks custom mock tests created by users with full configuration and analytics';
COMMENT ON COLUMN custom_mock_tests.user_id IS 'User who created this custom test';
COMMENT ON COLUMN custom_mock_tests.test_id IS 'Reference to the actual test in tests table';
COMMENT ON COLUMN custom_mock_tests.selected_categories IS 'Array of category UUIDs selected by user';
COMMENT ON COLUMN custom_mock_tests.selected_subcategories IS 'Array of subcategory UUIDs selected by user';
COMMENT ON COLUMN custom_mock_tests.questions_per_topic IS 'JSON object showing distribution of questions across topics';
COMMENT ON COLUMN custom_mock_tests.selected_question_ids IS 'Array of question UUIDs included in this test';
COMMENT ON COLUMN custom_mock_tests.is_time_manually_set IS 'Whether user manually set the time or it was auto-calculated';
COMMENT ON COLUMN custom_mock_tests.generation_time_ms IS 'Time taken to generate the test in milliseconds';

-- ============================================================
-- ANALYTICS VIEWS
-- ============================================================

-- View for user's test history with statistics
CREATE OR REPLACE VIEW user_custom_test_history AS
SELECT 
  cmt.id,
  cmt.user_id,
  cmt.title,
  cmt.difficulty_level,
  cmt.total_questions,
  cmt.total_duration_minutes,
  cmt.status,
  cmt.score,
  cmt.total_marks,
  cmt.percentage,
  cmt.time_taken_minutes,
  cmt.created_at,
  cmt.completed_at,
  ARRAY_LENGTH(cmt.selected_subcategories, 1) as topics_count,
  CASE 
    WHEN cmt.completed_at IS NOT NULL THEN 
      EXTRACT(EPOCH FROM (cmt.completed_at - cmt.started_at)) / 60
    ELSE NULL
  END as actual_duration_minutes
FROM custom_mock_tests cmt;

-- View for user analytics
CREATE OR REPLACE VIEW user_custom_test_analytics AS
SELECT 
  user_id,
  COUNT(*) as total_tests_created,
  COUNT(*) FILTER (WHERE status = 'completed') as tests_completed,
  COUNT(*) FILTER (WHERE status = 'abandoned') as tests_abandoned,
  COUNT(*) FILTER (WHERE status = 'in_progress') as tests_in_progress,
  AVG(total_questions) as avg_questions_per_test,
  AVG(total_duration_minutes) as avg_duration_minutes,
  AVG(percentage) FILTER (WHERE status = 'completed') as avg_score_percentage,
  AVG(time_taken_minutes) FILTER (WHERE status = 'completed') as avg_time_taken,
  MODE() WITHIN GROUP (ORDER BY difficulty_level) as preferred_difficulty,
  MAX(created_at) as last_test_created_at,
  MAX(completed_at) as last_test_completed_at
FROM custom_mock_tests
GROUP BY user_id;

-- View for difficulty-wise performance
CREATE OR REPLACE VIEW user_difficulty_performance AS
SELECT 
  user_id,
  difficulty_level,
  COUNT(*) as tests_taken,
  COUNT(*) FILTER (WHERE status = 'completed') as tests_completed,
  AVG(percentage) FILTER (WHERE status = 'completed') as avg_percentage,
  AVG(time_taken_minutes) FILTER (WHERE status = 'completed') as avg_time_taken,
  MAX(percentage) FILTER (WHERE status = 'completed') as best_percentage,
  MIN(percentage) FILTER (WHERE status = 'completed') as worst_percentage
FROM custom_mock_tests
GROUP BY user_id, difficulty_level;

-- View for topic preferences
CREATE OR REPLACE VIEW user_topic_preferences AS
SELECT 
  user_id,
  UNNEST(selected_subcategories) as subcategory_id,
  COUNT(*) as times_selected,
  AVG(percentage) FILTER (WHERE status = 'completed') as avg_performance
FROM custom_mock_tests
GROUP BY user_id, subcategory_id;

COMMENT ON VIEW user_custom_test_history IS 'Complete history of user custom tests with calculated fields';
COMMENT ON VIEW user_custom_test_analytics IS 'Aggregated analytics for each user custom test activity';
COMMENT ON VIEW user_difficulty_performance IS 'Performance breakdown by difficulty level for each user';
COMMENT ON VIEW user_topic_preferences IS 'User preferences and performance by topic';
