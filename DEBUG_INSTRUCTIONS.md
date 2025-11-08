# Debug Instructions for Mock Test Flow

## Current Issue
The "Start Test Now" button redirects back to the instructions page instead of loading the test interface.

## What I've Added

### 1. Logging in MockTestBuilder
When you create a new test, you'll see in the browser console:
```
=== CREATING CUSTOM MOCK TEST ===
Test ID: ...
User ID: ...
Question IDs: [...]
Custom Test Data: {...}
Insert Result: ...
Insert Error: ...
```

### 2. Logging in Attempt Page
When you click "Start Test Now", check the **terminal/server logs** for:
```
=== ATTEMPT PAGE DEBUG ===
Test ID: ...
User ID: ...
Custom Test Data: ...
Custom Test Error: ...
```

## How to Debug

### Step 1: Create a New Test
1. Go to `/test/mock`
2. Select categories, subcategories, difficulty
3. Set question count (e.g., 10 questions)
4. Click "Generate & Start Test"
5. **Open browser console (F12)** and look for the "CREATING CUSTOM MOCK TEST" logs
6. Check if there's an error in the "Insert Error" line

### Step 2: Try to Start the Test
1. On the instructions page, check the checkbox
2. Click "Start Test Now"
3. **Check the terminal where `npm run dev` is running**
4. Look for "ATTEMPT PAGE DEBUG" logs
5. See what "Custom Test Data" shows (null or actual data?)

### Step 3: Check Database Directly

Run these queries in your Supabase SQL Editor:

#### Check if custom_mock_tests record exists
```sql
SELECT 
  id,
  test_id,
  user_id,
  selected_question_ids,
  array_length(selected_question_ids, 1) as question_count,
  status,
  created_at
FROM custom_mock_tests
ORDER BY created_at DESC
LIMIT 5;
```

#### Check if questions exist
```sql
-- Replace with actual question IDs from above query
SELECT 
  id,
  "question text",
  "option a",
  "option b",
  difficulty
FROM questions
WHERE id = ANY(ARRAY[
  -- Paste question IDs here
  'question-id-1'::uuid,
  'question-id-2'::uuid
]::uuid[]);
```

#### Check RLS policies
```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN ('custom_mock_tests', 'questions')
ORDER BY tablename, policyname;
```

## Possible Issues

### Issue 1: RLS Policy Blocking SELECT
If `Custom Test Data` is `null` but no error, the RLS policy might be blocking the SELECT.

**Solution**: Check if the user_id matches and RLS policy allows SELECT.

### Issue 2: Insert Failing Silently
If you see an error in "Insert Error", the custom_mock_tests record is not being created.

**Common causes**:
- Missing required fields
- CHECK constraint violations
- Foreign key violations
- RLS policy blocking INSERT

### Issue 3: Questions Not in Database
If custom_mock_tests exists but questions query returns 0 results, the question IDs might not exist in the questions table.

**Solution**: Check if the questions actually exist with the IDs stored in selected_question_ids.

### Issue 4: Column Name Mismatch
If questions exist but aren't displaying, check if column names match:
- Database: `question text`, `option a` (with spaces)
- Code: Should use `question['question text']` (bracket notation)

## Quick Test Query

Run this in Supabase SQL Editor to see the latest test attempt:

```sql
SELECT 
  cmt.id,
  cmt.test_id,
  cmt.user_id,
  cmt.title,
  cmt.status,
  cmt.selected_question_ids,
  array_length(cmt.selected_question_ids, 1) as question_count,
  t.title as test_title,
  t.is_published,
  p.email as user_email
FROM custom_mock_tests cmt
LEFT JOIN tests t ON t.id = cmt.test_id
LEFT JOIN profiles p ON p.id = cmt.user_id
ORDER BY cmt.created_at DESC
LIMIT 1;
```

This will show you:
- If the record was created
- If it's linked to the correct test
- If it has question IDs
- How many questions it has

## Next Steps

1. **Create a NEW test** (don't use the old test ID `13470832-98ff-4153-8aa5-9c3db0c62252`)
2. **Check browser console** for creation logs
3. **Check terminal** for attempt page logs
4. **Run the SQL query** above to verify the record exists
5. **Share the logs** with me so I can see exactly what's happening

The logs will tell us exactly where the flow is breaking!
