-- ============================================================
-- FIX QUESTIONS RLS FOR PRACTICE MODE
-- ============================================================
-- Update RLS policy to allow ALL questions for adaptive practice
-- For adaptive practice, questions are fetched directly from the questions table
-- regardless of test_id or published status
-- 
-- Questions can be accessed if:
-- 1. User is authenticated (for adaptive practice - all questions accessible)
-- 2. Questions belong to a published test (for test-taking on /assignments page)
-- 3. User is an admin

-- Drop existing policies (including the one we're about to create, in case it already exists)
DROP POLICY IF EXISTS "Anyone can view questions of published tests" ON questions;
DROP POLICY IF EXISTS "Anyone can view questions for practice or published tests" ON questions;
DROP POLICY IF EXISTS "Authenticated users can view all questions for practice" ON questions;

-- Create policy that allows all questions for authenticated users (for adaptive practice)
-- AND questions from published tests (for test-taking)
CREATE POLICY "Authenticated users can view all questions for practice" ON questions
  FOR SELECT USING (
    -- Allow all questions for authenticated users (for adaptive practice)
    auth.uid() IS NOT NULL
    -- OR questions from published tests (for test-taking on /assignments)
    OR EXISTS (
      SELECT 1 FROM tests 
      WHERE tests.id = questions.test_id 
      AND tests.is_published = true
    )
    -- OR user is admin
    OR is_admin()
  );

COMMENT ON POLICY "Authenticated users can view all questions for practice" ON questions IS 
  'Allows authenticated users to view ALL questions for adaptive practice, and questions from published tests for test-taking';

