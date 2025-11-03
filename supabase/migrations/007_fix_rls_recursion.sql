-- ============================================================
-- FIX RLS INFINITE RECURSION
-- ============================================================
-- This migration fixes the infinite recursion in RLS policies
-- by creating a SECURITY DEFINER function that bypasses RLS
-- when checking admin status.

-- Create a security definer function to check admin role without RLS recursion
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  -- This function bypasses RLS (SECURITY DEFINER) so it won't cause recursion
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

-- Drop existing admin policies that cause recursion
DROP POLICY IF EXISTS "Admins can manage all colleges" ON colleges;
DROP POLICY IF EXISTS "Admins can manage all companies" ON companies;
DROP POLICY IF EXISTS "Admins can manage graduation years" ON graduation_years;
DROP POLICY IF EXISTS "Admins can manage all courses" ON courses;

-- Recreate policies using the is_admin() function
CREATE POLICY "Admins can manage all colleges" ON colleges
  FOR ALL USING (is_admin());

CREATE POLICY "Admins can manage all companies" ON companies
  FOR ALL USING (is_admin());

CREATE POLICY "Admins can manage graduation years" ON graduation_years
  FOR ALL USING (is_admin());

CREATE POLICY "Admins can manage all courses" ON courses
  FOR ALL USING (is_admin());

-- Also fix the profiles admin policy to prevent recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (is_admin());

-- Update other admin policies to use is_admin() function
-- Fix categories policies
DROP POLICY IF EXISTS "Admins can insert categories" ON categories;
DROP POLICY IF EXISTS "Admins can update categories" ON categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON categories;

CREATE POLICY "Admins can insert categories" ON categories
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admins can update categories" ON categories
  FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can delete categories" ON categories
  FOR DELETE USING (is_admin());

-- Fix subcategories policies
DROP POLICY IF EXISTS "Admins can insert subcategories" ON subcategories;
DROP POLICY IF EXISTS "Admins can update subcategories" ON subcategories;
DROP POLICY IF EXISTS "Admins can delete subcategories" ON subcategories;

CREATE POLICY "Admins can insert subcategories" ON subcategories
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admins can update subcategories" ON subcategories
  FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can delete subcategories" ON subcategories
  FOR DELETE USING (is_admin());

-- Fix tests policies
DROP POLICY IF EXISTS "Admins can insert tests" ON tests;
DROP POLICY IF EXISTS "Admins can update tests" ON tests;
DROP POLICY IF EXISTS "Admins can delete tests" ON tests;

CREATE POLICY "Admins can insert tests" ON tests
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admins can update tests" ON tests
  FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can delete tests" ON tests
  FOR DELETE USING (is_admin());

-- Fix questions policies
DROP POLICY IF EXISTS "Admins can insert questions" ON questions;
DROP POLICY IF EXISTS "Admins can update questions" ON questions;
DROP POLICY IF EXISTS "Admins can delete questions" ON questions;

CREATE POLICY "Admins can insert questions" ON questions
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admins can update questions" ON questions
  FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can delete questions" ON questions
  FOR DELETE USING (is_admin());

-- Fix adaptive_state admin policies
DROP POLICY IF EXISTS "Admins can view all adaptive states" ON adaptive_state;
CREATE POLICY "Admins can view all adaptive states" ON adaptive_state
  FOR SELECT USING (is_admin());

-- Fix user_metrics admin policies
DROP POLICY IF EXISTS "Admins can view all metrics" ON user_metrics;
CREATE POLICY "Admins can view all metrics" ON user_metrics
  FOR SELECT USING (is_admin());

-- Fix testimonials admin policy if it exists
DROP POLICY IF EXISTS "Admin full access to testimonials" ON testimonials;
CREATE POLICY "Admin full access to testimonials" ON testimonials
  FOR ALL USING (is_admin());

-- ============================================================
-- COMMENTS
-- ============================================================
COMMENT ON FUNCTION is_admin() IS 'Returns true if the current user is an admin. Uses SECURITY DEFINER to bypass RLS and prevent infinite recursion.';

