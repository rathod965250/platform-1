-- Add UPDATE policy for attempt_answers to support auto-save upsert operations
-- This allows users to update their own answers during a test

-- Drop existing policy if it exists (in case of re-run)
DROP POLICY IF EXISTS "Users can update own attempt answers" ON attempt_answers;

-- Create UPDATE policy for attempt_answers
-- Users can only update answers for their own test attempts
CREATE POLICY "Users can update own attempt answers" ON attempt_answers
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 
      FROM test_attempts 
      WHERE test_attempts.id = attempt_answers.attempt_id 
        AND test_attempts.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM test_attempts 
      WHERE test_attempts.id = attempt_answers.attempt_id 
        AND test_attempts.user_id = auth.uid()
    )
  );

-- Add comment explaining the policy
COMMENT ON POLICY "Users can update own attempt answers" ON attempt_answers IS 
'Allows users to update their own test answers. Required for auto-save upsert operations where answers may be changed before final submission.';
