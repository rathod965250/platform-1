-- Add missing foreign key constraint from attempt_answers to questions table
-- This is required for Supabase to properly join the tables in queries

-- Add foreign key constraint for question_id
ALTER TABLE attempt_answers
ADD CONSTRAINT attempt_answers_question_id_fkey 
FOREIGN KEY (question_id) 
REFERENCES questions(id) 
ON DELETE CASCADE;

-- Add comment explaining the constraint
COMMENT ON CONSTRAINT attempt_answers_question_id_fkey ON attempt_answers IS 
'Foreign key relationship to questions table. Required for joining attempt answers with question details in results pages.';
