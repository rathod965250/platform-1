-- ============================================================
-- CREATE QUESTION REPORTS TABLE
-- ============================================================
-- This migration creates a table for users to report errors
-- in questions (wrong options, wrong answer, wrong hint, etc.)
-- Admins can view these reports in the admin dashboard
-- ============================================================

-- Create question_reports table
CREATE TABLE IF NOT EXISTS question_reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  error_type TEXT NOT NULL CHECK (error_type IN (
    'option_wrong',
    'question_wrong',
    'wrong_answer',
    'wrong_hint',
    'wrong_formula',
    'wrong_explanation',
    'other'
  )),
  description TEXT NOT NULL,
  user_answer TEXT,
  correct_answer TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_question_reports_question_id ON question_reports(question_id);
CREATE INDEX IF NOT EXISTS idx_question_reports_user_id ON question_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_question_reports_status ON question_reports(status);
CREATE INDEX IF NOT EXISTS idx_question_reports_created_at ON question_reports(created_at DESC);

-- Enable RLS
ALTER TABLE question_reports ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can create question reports" ON question_reports;
DROP POLICY IF EXISTS "Users can view their own reports" ON question_reports;
DROP POLICY IF EXISTS "Admins can view all question reports" ON question_reports;
DROP POLICY IF EXISTS "Admins can update question reports" ON question_reports;

-- RLS Policies
-- Users can create reports
CREATE POLICY "Users can create question reports" ON question_reports
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own reports
CREATE POLICY "Users can view their own reports" ON question_reports
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all reports
CREATE POLICY "Admins can view all question reports" ON question_reports
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can update reports
CREATE POLICY "Admins can update question reports" ON question_reports
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Add comments
COMMENT ON TABLE question_reports IS 'User reports of errors in questions';
COMMENT ON COLUMN question_reports.error_type IS 'Type of error: option_wrong, question_wrong, wrong_answer, wrong_hint, wrong_formula, wrong_explanation, other';
COMMENT ON COLUMN question_reports.status IS 'Report status: pending, reviewed, resolved, dismissed';
COMMENT ON COLUMN question_reports.description IS 'User description of the error';
COMMENT ON COLUMN question_reports.user_answer IS 'The answer the user selected (if applicable)';
COMMENT ON COLUMN question_reports.correct_answer IS 'The correct answer shown (if applicable)';
COMMENT ON COLUMN question_reports.admin_notes IS 'Admin notes on the report';

