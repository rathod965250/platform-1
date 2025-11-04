-- ============================================================
-- CRITICAL FIX FOR DASHBOARD PREFERENCES SAVING
-- ============================================================
-- Copy and paste this ENTIRE file into Supabase SQL Editor and run it
-- This will fix the RLS policy that's preventing preferences from saving

-- Step 1: Drop the old policy (it's missing WITH CHECK clause)
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Step 2: Create new policy with BOTH USING and WITH CHECK clauses
-- This is REQUIRED for UPDATE operations in PostgreSQL RLS
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Step 3: Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Step 4: Verify it worked (this should show both qual and with_check)
SELECT 
  policyname,
  cmd,
  qual as "USING clause",
  with_check as "WITH CHECK clause"
FROM pg_policies
WHERE tablename = 'profiles' 
  AND policyname = 'Users can update own profile';

-- If the query above shows both USING and WITH CHECK clauses, the fix is complete!
-- Now try saving your dashboard preferences again.

