-- Migration: Add performance_analysis table for tracking weak/strong areas
-- This table stores detailed analysis of user performance by topic, subcategory, and difficulty

-- Create performance_analysis table
CREATE TABLE IF NOT EXISTS performance_analysis (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES practice_sessions(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  
  -- Topic/Subcategory analysis
  subcategory_id UUID REFERENCES subcategories(id) ON DELETE CASCADE,
  topic_name TEXT,
  
  -- Performance metrics
  total_questions INTEGER NOT NULL DEFAULT 0,
  attempted_questions INTEGER NOT NULL DEFAULT 0,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  incorrect_answers INTEGER NOT NULL DEFAULT 0,
  skipped_questions INTEGER NOT NULL DEFAULT 0,
  
  -- Accuracy metrics
  accuracy_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0,
  error_rate NUMERIC(5, 2) NOT NULL DEFAULT 0,
  
  -- Time metrics
  total_time_seconds INTEGER NOT NULL DEFAULT 0,
  avg_time_seconds INTEGER NOT NULL DEFAULT 0,
  
  -- Difficulty breakdown
  easy_total INTEGER NOT NULL DEFAULT 0,
  easy_correct INTEGER NOT NULL DEFAULT 0,
  medium_total INTEGER NOT NULL DEFAULT 0,
  medium_correct INTEGER NOT NULL DEFAULT 0,
  hard_total INTEGER NOT NULL DEFAULT 0,
  hard_correct INTEGER NOT NULL DEFAULT 0,
  
  -- Strength indicators
  is_strong_area BOOLEAN DEFAULT FALSE,
  is_weak_area BOOLEAN DEFAULT FALSE,
  confidence_score NUMERIC(3, 2) DEFAULT 0.5,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX idx_performance_analysis_user_id ON performance_analysis(user_id);
CREATE INDEX idx_performance_analysis_session_id ON performance_analysis(session_id);
CREATE INDEX idx_performance_analysis_category_id ON performance_analysis(category_id);
CREATE INDEX idx_performance_analysis_subcategory_id ON performance_analysis(subcategory_id);
CREATE INDEX idx_performance_analysis_weak_areas ON performance_analysis(user_id, is_weak_area) WHERE is_weak_area = TRUE;
CREATE INDEX idx_performance_analysis_strong_areas ON performance_analysis(user_id, is_strong_area) WHERE is_strong_area = TRUE;

-- Enable RLS
ALTER TABLE performance_analysis ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own performance analysis" ON performance_analysis
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own performance analysis" ON performance_analysis
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own performance analysis" ON performance_analysis
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Add comments for documentation
COMMENT ON TABLE performance_analysis IS 'Stores detailed performance analysis by topic/subcategory for identifying weak and strong areas';
COMMENT ON COLUMN performance_analysis.accuracy_percentage IS 'Percentage of correct answers out of attempted questions';
COMMENT ON COLUMN performance_analysis.error_rate IS 'Percentage of incorrect answers out of attempted questions';
COMMENT ON COLUMN performance_analysis.is_strong_area IS 'TRUE if accuracy >= 80% and attempted >= 3 questions';
COMMENT ON COLUMN performance_analysis.is_weak_area IS 'TRUE if accuracy < 50% and attempted >= 3 questions';
COMMENT ON COLUMN performance_analysis.confidence_score IS 'Statistical confidence in the assessment (0-1), based on sample size';
