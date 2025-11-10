# Results Page Debugging Guide

## Current Issue
The results page at `/test/9fb9f770-d212-4325-a27b-daccc5fca5f0/results` is not showing dynamic data from the submitted test.

## Changes Made

### Added Logging and Error Handling
Updated `src/app/(student)/test/[testId]/results/page.tsx` with:
- Error logging for all database queries
- Console logs to track data flow
- Better error messages

## How to Debug

### Step 1: Check Browser Console
Open browser DevTools (F12) and check the Console tab for:

**Expected logs**:
```
Attempt found: {
  id: "...",
  score: X,
  correct_answers: Y,
  total_questions: Z,
  submitted_at: "..."
}
Answers fetched: N answers
```

**Error logs to look for**:
```
Error fetching test: {...}
Error fetching attempt: {...}
Error fetching answers: {...}
```

### Step 2: Check Server Terminal
Look at the terminal running `npm run dev` for server-side logs.

### Step 3: Verify Database Data

#### Check if test attempt exists:
```sql
SELECT * FROM test_attempts
WHERE test_id = '9fb9f770-d212-4325-a27b-daccc5fca5f0'
  AND submitted_at IS NOT NULL
ORDER BY submitted_at DESC
LIMIT 1;
```

**Expected**: Should return at least one row with:
- `id` - Attempt ID
- `score` - Your score
- `correct_answers` - Number correct
- `total_questions` - Total questions
- `submitted_at` - Timestamp

#### Check if answers were saved:
```sql
SELECT COUNT(*) FROM attempt_answers
WHERE attempt_id = '<attempt-id-from-above>';
```

**Expected**: Should return the number of questions answered.

#### Check full answer data:
```sql
SELECT 
  aa.*,
  q.question_text,
  q.correct_answer,
  aa.user_answer,
  aa.is_correct
FROM attempt_answers aa
JOIN questions q ON aa.question_id = q.id
WHERE aa.attempt_id = '<attempt-id>';
```

**Expected**: Should show all answers with question details.

## Common Issues and Solutions

### Issue 1: No Attempt Found
**Symptom**: Page redirects to instructions
**Cause**: `submitted_at` is NULL or attempt doesn't exist
**Solution**:
1. Check if test was actually submitted
2. Verify `submitted_at` timestamp exists in database
3. Check if `test_id` matches

### Issue 2: No Answers Saved
**Symptom**: Score shows 0/0 or empty
**Cause**: Answers not inserted into `attempt_answers` table
**Solution**:
1. Check `attempt_answers` table for this attempt
2. Verify answers were saved during test submission
3. Check TestAttemptInterface submission logic

### Issue 3: Wrong Test ID
**Symptom**: Redirects or shows wrong test
**Cause**: URL has incorrect test ID
**Solution**:
1. Verify the test ID in URL matches database
2. Check if test exists in `tests` table

### Issue 4: Permission Issues
**Symptom**: No data loads or errors
**Cause**: RLS policies blocking access
**Solution**:
1. Check Supabase RLS policies
2. Verify user is authenticated
3. Check user_id matches in test_attempts

## Data Flow Verification

### 1. Test Submission (TestAttemptInterface)
```typescript
// When user clicks Submit
await supabase
  .from('test_attempts')
  .update({
    score,
    correct_answers: correctAnswers,
    time_taken_seconds: timeTaken,
    submitted_at: new Date().toISOString(),  // ✅ This must be set
    // ... other fields
  })
  .eq('id', attemptId)

// Insert answers
await supabase
  .from('attempt_answers')
  .insert(formattedAnswers)  // ✅ This must succeed
```

### 2. Results Page Load
```typescript
// Fetch attempt
const { data: attempt } = await supabase
  .from('test_attempts')
  .select('*')
  .eq('test_id', testId)
  .eq('user_id', user.id)
  .not('submitted_at', 'is', null)  // ✅ Requires submitted_at
  .order('submitted_at', { ascending: false })
  .limit(1)
  .single()

// Fetch answers
const { data: answers } = await supabase
  .from('attempt_answers')
  .select('*, question:questions(...)')
  .eq('attempt_id', attempt.id)  // ✅ Requires attempt.id
```

### 3. TestResults Component
```typescript
// Receives props
<TestResults
  test={test}           // ✅ Test details
  attempt={attempt}     // ✅ Attempt with score
  answers={answers}     // ✅ All answers
  avgScore={avgScore}   // ✅ Calculated average
  topScore={topScore}   // ✅ Calculated top
  totalAttempts={totalAttempts}  // ✅ Count
/>
```

## Quick Checks

### Check 1: Is the test submitted?
```
Look in browser console for:
"Test submitted successfully!"
```

### Check 2: Did redirect happen?
```
URL should change to:
/test/{testId}/results
```

### Check 3: Are console logs appearing?
```
Should see:
"Attempt found: {...}"
"Answers fetched: X answers"
```

### Check 4: Is data visible in UI?
```
Should see:
- Score (e.g., "15/33")
- Percentage (e.g., "45.5%")
- Category breakdown
- Question list
```

## Manual Testing Steps

### Step 1: Take a Test
1. Go to `/test/mock`
2. Create a mock test
3. Start the test
4. Answer some questions
5. Click Submit
6. Confirm submission

### Step 2: Verify Submission
1. Check browser console for success message
2. Note the test ID from URL
3. Verify redirect to results page

### Step 3: Check Results Page
1. Should see score immediately
2. Should see category breakdown
3. Should see question list
4. Should see charts

### Step 4: Verify Database
1. Open Supabase dashboard
2. Check `test_attempts` table
3. Find your attempt by test_id and user_id
4. Verify `submitted_at` is not NULL
5. Check `attempt_answers` table
6. Verify answers exist for your attempt_id

## Expected vs Actual

### Expected Behavior:
1. ✅ Test submits successfully
2. ✅ Redirect to `/test/{testId}/results`
3. ✅ Page loads with data
4. ✅ Score displays correctly
5. ✅ All questions show with answers
6. ✅ Charts render
7. ✅ Category breakdown appears

### If Not Working:
1. ❌ Check browser console for errors
2. ❌ Check server terminal for errors
3. ❌ Verify database has data
4. ❌ Check RLS policies
5. ❌ Verify user authentication

## Database Schema Check

### test_attempts table should have:
```sql
- id (uuid)
- test_id (uuid)
- user_id (uuid)
- score (integer)
- correct_answers (integer)
- total_questions (integer)
- time_taken_seconds (integer)
- submitted_at (timestamp)  ← CRITICAL
- created_at (timestamp)
```

### attempt_answers table should have:
```sql
- id (uuid)
- attempt_id (uuid)  ← Links to test_attempts.id
- question_id (uuid)
- user_answer (text)
- is_correct (boolean)
- time_taken_seconds (integer)
- is_marked_for_review (boolean)
- marks_obtained (numeric)
```

## RLS Policy Check

### test_attempts policies:
```sql
-- Users can view their own attempts
CREATE POLICY "Users can view own attempts"
ON test_attempts FOR SELECT
USING (auth.uid() = user_id);
```

### attempt_answers policies:
```sql
-- Users can view their own answers
CREATE POLICY "Users can view own answers"
ON attempt_answers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM test_attempts
    WHERE test_attempts.id = attempt_answers.attempt_id
    AND test_attempts.user_id = auth.uid()
  )
);
```

## Next Steps

1. **Check Browser Console**: Look for the logs I added
2. **Check Server Terminal**: Look for any errors
3. **Verify Database**: Run the SQL queries above
4. **Test Again**: Try submitting a new test
5. **Report Findings**: Share what you see in console/terminal

## Files to Check

1. `src/app/(student)/test/[testId]/results/page.tsx` - Results page (updated with logs)
2. `src/components/test/TestResults.tsx` - Results component
3. `src/components/test/TestAttemptInterface.tsx` - Test submission logic

## Support

If data still not showing:
1. Share browser console output
2. Share server terminal output
3. Share database query results
4. I'll help debug further

---

**Status**: Debugging tools added
**Next**: Check browser console and server terminal
**Goal**: Identify why data not loading
