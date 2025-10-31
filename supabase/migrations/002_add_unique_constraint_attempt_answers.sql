-- Add unique constraint on attempt_answers to support upsert operations
-- This ensures a user can only have one answer per question per attempt

ALTER TABLE attempt_answers
ADD CONSTRAINT unique_attempt_question UNIQUE (attempt_id, question_id);

