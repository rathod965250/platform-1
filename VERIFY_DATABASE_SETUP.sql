-- ============================================================
-- VERIFICATION SCRIPT FOR DATABASE SETUP
-- Run this in Supabase SQL Editor to check if everything is set up correctly
-- ============================================================

-- 1. Check if incorrect_answers column exists
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'practice_sessions' 
AND column_name IN ('total_questions', 'correct_answers', 'incorrect_answers', 'skipped_count', 'time_taken_seconds');

-- Expected: Should show all 5 columns including incorrect_answers

-- ============================================================

-- 2. Check RLS policies on user_metrics
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'user_metrics';

-- Expected: Should show INSERT and SELECT policies

-- ============================================================

-- 3. Check RLS policies on practice_sessions
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'practice_sessions';

-- Expected: Should show INSERT, SELECT, and UPDATE policies

-- ============================================================

-- 4. Check if you have any practice sessions
SELECT 
  id,
  created_at,
  total_questions,
  correct_answers,
  incorrect_answers,
  skipped_count,
  completed_at
FROM practice_sessions
WHERE user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 5;

-- Expected: Should show your recent sessions

-- ============================================================

-- 5. Check if you have any user_metrics
SELECT 
  session_id,
  COUNT(*) as answer_count,
  SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct_count,
  SUM(CASE WHEN NOT is_correct THEN 1 ELSE 0 END) as incorrect_count,
  AVG(time_taken_seconds) as avg_time
FROM user_metrics
WHERE user_id = auth.uid()
GROUP BY session_id
ORDER BY MAX(created_at) DESC
LIMIT 5;

-- Expected: Should show answer counts per session

-- ============================================================

-- 6. Check if leaderboard unique constraint exists
SELECT 
  conname,
  contype,
  pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'leaderboard'::regclass
AND contype = 'u';

-- Expected: Should show unique_user_test_period constraint

-- ============================================================

-- 7. Check if user_analytics has correct structure
SELECT 
  column_name, 
  data_type
FROM information_schema.columns 
WHERE table_name = 'user_analytics' 
AND column_name IN ('id', 'user_id', 'category_id');

-- Expected: Should show id, user_id, and category_id columns

-- ============================================================

-- 8. Test INSERT into user_metrics (will rollback)
BEGIN;

INSERT INTO user_metrics (
  user_id,
  session_id,
  question_id,
  is_correct,
  time_taken_seconds,
  difficulty
) VALUES (
  auth.uid(),
  '00000000-0000-0000-0000-000000000000', -- dummy session
  '00000000-0000-0000-0000-000000000000', -- dummy question
  true,
  30,
  'medium'
);

-- If this works, you'll see "INSERT 0 1"
-- If it fails, you'll see an error about RLS policies

ROLLBACK; -- Don't actually save the test data

-- ============================================================

-- 9. Check if session_stats table exists and has data
SELECT 
  COUNT(*) as total_session_stats
FROM session_stats
WHERE user_id = auth.uid();

-- Expected: Should show count of calculated session stats

-- ============================================================

-- 10. Get latest session with all related data
WITH latest_session AS (
  SELECT id
  FROM practice_sessions
  WHERE user_id = auth.uid()
  ORDER BY created_at DESC
  LIMIT 1
)
SELECT 
  'practice_sessions' as table_name,
  ps.id,
  ps.total_questions,
  ps.correct_answers,
  ps.incorrect_answers,
  ps.skipped_count,
  ps.time_taken_seconds
FROM practice_sessions ps
WHERE ps.id = (SELECT id FROM latest_session)

UNION ALL

SELECT 
  'user_metrics' as table_name,
  um.session_id as id,
  COUNT(*)::integer as total_questions,
  SUM(CASE WHEN um.is_correct THEN 1 ELSE 0 END)::integer as correct_answers,
  SUM(CASE WHEN NOT um.is_correct THEN 1 ELSE 0 END)::integer as incorrect_answers,
  0 as skipped_count,
  AVG(um.time_taken_seconds)::integer as time_taken_seconds
FROM user_metrics um
WHERE um.session_id = (SELECT id FROM latest_session)
GROUP BY um.session_id

UNION ALL

SELECT 
  'session_stats' as table_name,
  ss.session_id as id,
  0 as total_questions,
  0 as correct_answers,
  0 as incorrect_answers,
  0 as skipped_count,
  ss.avg_time_seconds as time_taken_seconds
FROM session_stats ss
WHERE ss.session_id = (SELECT id FROM latest_session);

-- Expected: Should show data from all three tables for your latest session
-- If any table is missing data, you'll see which one

-- ============================================================

-- SUMMARY OF CHECKS:
-- 1. ✅ incorrect_answers column exists
-- 2. ✅ user_metrics has RLS policies
-- 3. ✅ practice_sessions has UPDATE policy
-- 4. ✅ You have practice sessions
-- 5. ✅ You have user_metrics data
-- 6. ✅ Leaderboard constraint exists
-- 7. ✅ user_analytics structure correct
-- 8. ✅ Can insert into user_metrics
-- 9. ✅ session_stats has data
-- 10. ✅ Latest session has data in all tables

-- If any check fails, that's where the problem is!
