-- ============================================================
-- FIX TESTS RLS TO ALLOW USER-CREATED MOCK TESTS
-- ============================================================
-- This migration ensures users can create custom mock tests
-- by properly configuring the RLS policies
-- ============================================================

-- First, drop all existing INSERT policies on tests to avoid conflicts
DROP POLICY IF EXISTS "Admins can insert tests" ON tests;
DROP POLICY IF EXISTS "Users can create their own tests" ON tests;

-- Create a single comprehensive INSERT policy
CREATE POLICY "Allow test creation" ON tests
  FOR INSERT 
  WITH CHECK (
    -- Admins can create any test
    is_admin()
    OR
    -- Users can create mock tests where they are the creator
    (auth.uid() = created_by AND test_type = 'mock')
  );

-- Ensure the SELECT policy allows users to see their own tests
DROP POLICY IF EXISTS "Anyone can view published tests" ON tests;
DROP POLICY IF EXISTS "Users can view their own tests" ON tests;

CREATE POLICY "View tests policy" ON tests
  FOR SELECT 
  USING (
    is_published = true 
    OR created_by = auth.uid()
    OR is_admin()
  );

-- Ensure UPDATE policy for admins and test creators
DROP POLICY IF EXISTS "Admins can update tests" ON tests;
DROP POLICY IF EXISTS "Users can update their own tests" ON tests;

CREATE POLICY "Update tests policy" ON tests
  FOR UPDATE 
  USING (
    is_admin()
    OR (created_by = auth.uid() AND test_type = 'mock')
  );

-- Ensure DELETE policy for admins and test creators
DROP POLICY IF EXISTS "Admins can delete tests" ON tests;
DROP POLICY IF EXISTS "Users can delete their own tests" ON tests;

CREATE POLICY "Delete tests policy" ON tests
  FOR DELETE 
  USING (
    is_admin()
    OR (created_by = auth.uid() AND test_type = 'mock')
  );

-- Update questions policies to allow users to link questions to their tests
DROP POLICY IF EXISTS "Users can update questions for their tests" ON questions;

CREATE POLICY "Update questions for custom tests" ON questions
  FOR UPDATE 
  USING (
    is_admin()
    OR
    EXISTS (
      SELECT 1 FROM tests 
      WHERE tests.id = questions.test_id 
      AND tests.created_by = auth.uid()
      AND tests.test_type = 'mock'
    )
  );

-- Add comments
COMMENT ON POLICY "Allow test creation" ON tests IS 
  'Allows admins to create any test and users to create custom mock tests';
COMMENT ON POLICY "View tests policy" ON tests IS 
  'Allows viewing published tests, own tests, or all tests if admin';
COMMENT ON POLICY "Update tests policy" ON tests IS 
  'Allows admins and test creators to update tests';
COMMENT ON POLICY "Delete tests policy" ON tests IS 
  'Allows admins and test creators to delete tests';
COMMENT ON POLICY "Update questions for custom tests" ON questions IS 
  'Allows admins and test creators to link questions to tests';
