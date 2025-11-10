-- Verification Query: Check if RLS policies exist for attempt_answers

-- 1. Check all policies on attempt_answers table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as operation,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE tablename = 'attempt_answers'
ORDER BY cmd;

-- Expected Result: Should show 3 policies
-- 1. "Users can view own attempt answers" (SELECT)
-- 2. "Users can insert own attempt answers" (INSERT)
-- 3. "Users can update own attempt answers" (UPDATE)

-- 2. Check if RLS is enabled on the table
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'attempt_answers';

-- Expected Result: rls_enabled = true
