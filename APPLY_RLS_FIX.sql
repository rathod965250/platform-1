-- ============================================================
-- CRITICAL FIX: Apply this to fix Dashboard Preferences saving
-- ============================================================
-- Run this in Supabase SQL Editor to fix the RLS policy issue

-- Step 1: Drop the old policy if it exists
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Step 2: Create new policy with BOTH USING and WITH CHECK clauses
-- This is REQUIRED for UPDATE operations in PostgreSQL RLS
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Step 3: Verify RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Step 4: Verify the policy was created correctly
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles' 
  AND policyname = 'Users can update own profile';

-- Expected result should show:
-- - cmd: 'UPDATE'
-- - qual: '(auth.uid() = id)' (USING clause)
-- - with_check: '(auth.uid() = id)' (WITH CHECK clause)

