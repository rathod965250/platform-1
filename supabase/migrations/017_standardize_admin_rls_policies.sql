-- ============================================================
-- STANDARDIZE ADMIN RLS POLICIES
-- ============================================================
-- This migration standardizes all admin RLS policies to use
-- the is_admin() function for consistency and to prevent recursion
-- ============================================================

-- Ensure is_admin() function exists (from migration 007)
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

-- ============================================================
-- STANDARDIZE student_assignments RLS POLICIES
-- ============================================================

-- Only update student_assignments policies if the table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'student_assignments'
  ) THEN
    -- Drop existing policies that use direct EXISTS checks
    DROP POLICY IF EXISTS "Admins can view all assignments" ON student_assignments;
    DROP POLICY IF EXISTS "Admins can insert assignments" ON student_assignments;
    DROP POLICY IF EXISTS "Admins can update assignments" ON student_assignments;
    DROP POLICY IF EXISTS "Admins can delete assignments" ON student_assignments;

    -- Recreate policies using is_admin() function
    CREATE POLICY "Admins can view all assignments" ON student_assignments
      FOR SELECT
      USING (is_admin());

    CREATE POLICY "Admins can insert assignments" ON student_assignments
      FOR INSERT
      WITH CHECK (is_admin());

    CREATE POLICY "Admins can update assignments" ON student_assignments
      FOR UPDATE
      USING (is_admin())
      WITH CHECK (is_admin());

    CREATE POLICY "Admins can delete assignments" ON student_assignments
      FOR DELETE
      USING (is_admin());
  END IF;
END $$;

-- ============================================================
-- VERIFY AND UPDATE QUESTIONS SELECT POLICY
-- ============================================================

-- Ensure questions SELECT policy uses is_admin() for admin access
DROP POLICY IF EXISTS "Anyone can view questions of published tests" ON questions;

CREATE POLICY "Anyone can view questions of published tests" ON questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tests 
      WHERE tests.id = questions.test_id 
      AND tests.is_published = true
    )
    OR is_admin()
  );

-- ============================================================
-- VERIFY AND UPDATE TESTS SELECT POLICY
-- ============================================================

-- Ensure tests SELECT policy uses is_admin() for admin access
DROP POLICY IF EXISTS "Anyone can view published tests" ON tests;

CREATE POLICY "Anyone can view published tests" ON tests
  FOR SELECT USING (
    is_published = true 
    OR is_admin()
  );

-- ============================================================
-- COMMENTS
-- ============================================================

-- Add comments only if the table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'student_assignments'
  ) THEN
    COMMENT ON POLICY "Admins can view all assignments" ON student_assignments IS 
      'Allows admins to view all student assignments using is_admin() function';

    COMMENT ON POLICY "Admins can insert assignments" ON student_assignments IS 
      'Allows admins to create new assignments using is_admin() function';

    COMMENT ON POLICY "Admins can update assignments" ON student_assignments IS 
      'Allows admins to update assignments using is_admin() function with both USING and WITH CHECK clauses';

    COMMENT ON POLICY "Admins can delete assignments" ON student_assignments IS 
      'Allows admins to delete assignments using is_admin() function';
  END IF;
END $$;

