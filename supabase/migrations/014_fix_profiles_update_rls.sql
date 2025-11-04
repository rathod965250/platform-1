-- ============================================================
-- FIX PROFILES UPDATE RLS POLICY
-- ============================================================
-- The existing UPDATE policy only has USING clause but no WITH CHECK clause
-- For UPDATE operations, PostgreSQL RLS requires both:
-- - USING: for selecting which rows can be updated
-- - WITH CHECK: for validating the updated row
-- This migration fixes the policy to include both clauses

-- Drop existing update policy if it exists
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create new policy with both USING and WITH CHECK clauses
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- This ensures that:
-- 1. Users can only update their own profile (USING clause)
-- 2. The updated row must still belong to the same user (WITH CHECK clause)
-- This is especially important for dashboard_preferences and other fields

COMMENT ON POLICY "Users can update own profile" ON profiles IS 
'Allows authenticated users to update their own profile, including dashboard_preferences. Requires both USING and WITH CHECK clauses for proper RLS enforcement.';

