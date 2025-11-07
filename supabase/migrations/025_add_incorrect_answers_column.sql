-- Add missing incorrect_answers column to practice_sessions table
-- This column is referenced in the codebase but was missing from the schema

ALTER TABLE practice_sessions
ADD COLUMN IF NOT EXISTS incorrect_answers INTEGER NOT NULL DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN practice_sessions.incorrect_answers IS 'Number of questions answered incorrectly in the practice session';

