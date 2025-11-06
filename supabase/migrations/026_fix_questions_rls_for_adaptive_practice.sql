-- ============================================================
-- FIX QUESTIONS RLS FOR ADAPTIVE PRACTICE (FINAL FIX)
-- ============================================================
-- This migration ensures that authenticated users can view ALL questions
-- for adaptive practice mode, while maintaining backward compatibility
-- with published tests and admin access.
-- 
-- The issue was that previous migrations created conflicting policies
-- or the auth context wasn't properly recognized in edge functions.
-- 
-- This migration:
-- 1. Drops ALL existing SELECT policies on questions
-- 2. Creates a single, comprehensive SELECT policy that:
--    - Allows authenticated users to view ALL questions (for adaptive practice)
--    - Allows questions from published tests (for test-taking)
--    - Allows admin access via is_admin() function
-- ============================================================

-- Drop ALL existing SELECT policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view questions of published tests" ON questions;
DROP POLICY IF EXISTS "Anyone can view questions for practice or published tests" ON questions;
DROP POLICY IF EXISTS "Authenticated users can view all questions for practice" ON questions;
DROP POLICY IF EXISTS "Users can view questions for practice" ON questions;
DROP POLICY IF EXISTS "Authenticated users can view questions" ON questions;

-- Ensure is_admin() function exists (from migration 007/017)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin() TO anon;

-- Create a single, comprehensive SELECT policy
-- This policy allows:
-- 1. Authenticated users to view ALL questions (for adaptive practice)
-- 2. Questions from published tests (for test-taking on /assignments)
-- 3. Admin access via is_admin() function
-- 
-- Note: Using auth.uid() IS NOT NULL for edge function compatibility
-- Edge functions pass the Authorization header which sets auth.uid()
CREATE POLICY "Authenticated users can view all questions for practice" ON questions
  FOR SELECT USING (
    -- Allow all questions for authenticated users (for adaptive practice)
    -- This works in both edge functions and direct client access
    -- Edge functions pass Authorization header which sets auth.uid()
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

-- Add comment for documentation
COMMENT ON POLICY "Authenticated users can view all questions for practice" ON questions IS 
  'Allows authenticated users to view ALL questions for adaptive practice, questions from published tests for test-taking, and admin access. This policy works in both edge functions and direct client access.';

-- Verify the policy was created
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'questions' 
    AND policyname = 'Authenticated users can view all questions for practice'
  ) THEN
    RAISE EXCEPTION 'Policy creation failed';
  END IF;
END $$;

