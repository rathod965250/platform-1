-- Add unique constraint for attempt_answers to support upsert operations
-- This allows auto-save to update existing answers instead of creating duplicates

-- First, remove any duplicate entries if they exist
DELETE FROM attempt_answers a
USING attempt_answers b
WHERE a.id > b.id
  AND a.attempt_id = b.attempt_id
  AND a.question_id = b.question_id;

-- Add unique constraint on (attempt_id, question_id)
-- This ensures one answer per question per attempt
ALTER TABLE attempt_answers
ADD CONSTRAINT attempt_answers_attempt_question_unique 
UNIQUE (attempt_id, question_id);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_attempt_answers_attempt_id 
ON attempt_answers(attempt_id);

CREATE INDEX IF NOT EXISTS idx_attempt_answers_question_id 
ON attempt_answers(question_id);

-- Add comment explaining the constraint
COMMENT ON CONSTRAINT attempt_answers_attempt_question_unique ON attempt_answers IS 
'Ensures one answer per question per attempt. Supports upsert operations for auto-save functionality.';
