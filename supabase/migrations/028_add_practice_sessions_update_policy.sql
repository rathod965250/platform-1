-- Migration: Add UPDATE policy for practice_sessions table
-- This is required for updating session statistics when ending a practice session

-- Add UPDATE policy for practice_sessions
CREATE POLICY "Users can update own practice sessions" ON practice_sessions
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add comment for documentation
COMMENT ON POLICY "Users can update own practice sessions" ON practice_sessions IS 
  'Allows users to update their own practice sessions. This is needed for updating session statistics (correct_answers, incorrect_answers, skipped_count, time_taken_seconds, completed_at) when ending a practice session via the End Session dialog.';
