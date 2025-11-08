-- Migration: Add session_summary table to store Enhanced End Session Dialog data
-- This table stores the exact statistics shown in the Enhanced End Session Dialog
-- for easy retrieval on the summary page

-- Create session_summary table
CREATE TABLE IF NOT EXISTS session_summary (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES practice_sessions(id) ON DELETE CASCADE NOT NULL UNIQUE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Basic counts (from Enhanced End Session Dialog)
  total_questions INTEGER NOT NULL DEFAULT 0,
  correct_count INTEGER NOT NULL DEFAULT 0,
  incorrect_count INTEGER NOT NULL DEFAULT 0,
  skipped_count INTEGER NOT NULL DEFAULT 0,
  unanswered_count INTEGER NOT NULL DEFAULT 0,
  marked_count INTEGER NOT NULL DEFAULT 0,
  attempted_count INTEGER NOT NULL DEFAULT 0,
  
  -- Time statistics
  total_time_seconds INTEGER NOT NULL DEFAULT 0,
  avg_time_per_question INTEGER NOT NULL DEFAULT 0,
  
  -- Difficulty breakdown (from Enhanced End Session Dialog)
  easy_total INTEGER NOT NULL DEFAULT 0,
  easy_correct INTEGER NOT NULL DEFAULT 0,
  easy_accuracy NUMERIC(5, 2) DEFAULT 0,
  
  medium_total INTEGER NOT NULL DEFAULT 0,
  medium_correct INTEGER NOT NULL DEFAULT 0,
  medium_accuracy NUMERIC(5, 2) DEFAULT 0,
  
  hard_total INTEGER NOT NULL DEFAULT 0,
  hard_correct INTEGER NOT NULL DEFAULT 0,
  hard_accuracy NUMERIC(5, 2) DEFAULT 0,
  
  -- Overall accuracy
  overall_accuracy NUMERIC(5, 2) DEFAULT 0,
  
  -- Question status map (stores the minimap data as JSONB)
  -- Format: { "question_id": { "status": "correct|incorrect|skipped|unanswered", "is_marked": boolean, "time_spent": number } }
  question_status_map JSONB DEFAULT '{}'::jsonb,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX idx_session_summary_session_id ON session_summary(session_id);
CREATE INDEX idx_session_summary_user_id ON session_summary(user_id);
CREATE INDEX idx_session_summary_created_at ON session_summary(created_at);

-- Add comments for documentation
COMMENT ON TABLE session_summary IS 'Stores the Enhanced End Session Dialog data for easy retrieval on summary page';
COMMENT ON COLUMN session_summary.session_id IS 'Reference to the practice session';
COMMENT ON COLUMN session_summary.correct_count IS 'Number of questions answered correctly';
COMMENT ON COLUMN session_summary.incorrect_count IS 'Number of questions answered incorrectly';
COMMENT ON COLUMN session_summary.skipped_count IS 'Number of questions explicitly skipped';
COMMENT ON COLUMN session_summary.unanswered_count IS 'Number of questions not attempted';
COMMENT ON COLUMN session_summary.marked_count IS 'Number of questions marked for review';
COMMENT ON COLUMN session_summary.attempted_count IS 'Number of questions attempted (correct + incorrect)';
COMMENT ON COLUMN session_summary.avg_time_per_question IS 'Average time spent per attempted question in seconds';
COMMENT ON COLUMN session_summary.question_status_map IS 'JSONB map of question statuses for minimap reconstruction';

-- Enable RLS
ALTER TABLE session_summary ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own session summaries" ON session_summary
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own session summaries" ON session_summary
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own session summaries" ON session_summary
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all session summaries" ON session_summary
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_session_summary_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_session_summary_updated_at_trigger
  BEFORE UPDATE ON session_summary
  FOR EACH ROW
  EXECUTE FUNCTION update_session_summary_updated_at();
