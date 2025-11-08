-- ============================================================
-- ALLOW USERS TO CREATE CUSTOM MOCK TESTS
-- ============================================================
-- This migration adds RLS policies to allow authenticated users
-- to create their own custom mock tests and update questions
-- for those tests
-- ============================================================

-- Add policy for users to insert their own tests
DROP POLICY IF EXISTS "Users can create their own tests" ON tests;
CREATE POLICY "Users can create their own tests" ON tests
  FOR INSERT 
  WITH CHECK (
    auth.uid() = created_by 
    AND test_type = 'mock'
  );

-- Add policy for users to view their own created tests
DROP POLICY IF EXISTS "Users can view their own tests" ON tests;
CREATE POLICY "Users can view their own tests" ON tests
  FOR SELECT 
  USING (
    is_published = true 
    OR created_by = auth.uid()
    OR is_admin()
  );

-- Add policy for users to update questions for their custom tests
DROP POLICY IF EXISTS "Users can update questions for their tests" ON questions;
CREATE POLICY "Users can update questions for their tests" ON questions
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM tests 
      WHERE tests.id = questions.test_id 
      AND tests.created_by = auth.uid()
      AND tests.test_type = 'mock'
    )
    OR is_admin()
  );

-- Add policy for users to delete their own custom tests
DROP POLICY IF EXISTS "Users can delete their own tests" ON tests;
CREATE POLICY "Users can delete their own tests" ON tests
  FOR DELETE 
  USING (
    created_by = auth.uid() 
    AND test_type = 'mock'
    OR is_admin()
  );

COMMENT ON POLICY "Users can create their own tests" ON tests IS 
  'Allows authenticated users to create custom mock tests';
COMMENT ON POLICY "Users can view their own tests" ON tests IS 
  'Allows users to view published tests, their own tests, or all tests if admin';
COMMENT ON POLICY "Users can update questions for their tests" ON questions IS 
  'Allows users to link questions to their custom mock tests';
COMMENT ON POLICY "Users can delete their own tests" ON tests IS 
  'Allows users to delete their own custom mock tests';
