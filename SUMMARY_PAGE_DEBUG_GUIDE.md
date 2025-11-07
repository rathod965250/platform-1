# Summary Page Debug Guide

## Changes Made

### 1. Added Fallback Data Logic ✅
The summary page now uses session data as a fallback if `user_metrics` is empty:

```typescript
// If metrics are empty, use session data
const finalCorrectCount = correctCount > 0 ? correctCount : (session.correct_answers || 0)
const finalIncorrectCount = incorrectCount > 0 ? incorrectCount : (session.incorrect_answers || 0)
```

### 2. Added Debug Logging ✅
Server-side console logs now show:
- Session ID
- Metrics count
- Session data (total_questions, correct_answers, etc.)
- Calculated statistics

## How to Test

### Step 1: Complete a Practice Session
1. Start a new practice session
2. Answer at least 5-10 questions
3. Click "End Session"
4. You should be redirected to summary page

### Step 2: Check Server Console
Look for these logs in your terminal (where `npm run dev` is running):

```
=== SUMMARY PAGE DATA FETCH ===
Session ID: [your-session-id]
Metrics count: [number]
Metrics error: null
Session data: {
  total_questions: [number],
  correct_answers: [number],
  incorrect_answers: [number],
  skipped_count: [number]
}
```

### Step 3: Check Browser Console
Open browser DevTools (F12) and check for:
- Any errors
- Network requests to `/practice/adaptive/[categoryId]/[sessionId]/summary`

## Debugging Scenarios

### Scenario 1: All Zeros Displayed
**Symptoms:**
- Summary page shows 0 for all statistics
- No charts display data

**Possible Causes:**
1. **Session data not saved** - Check if `handleConfirmEndSession` was called
2. **Metrics not saved** - Check if `handleSubmitAnswer` saved to `user_metrics`
3. **Wrong session ID** - Check URL parameter

**Debug Steps:**
```bash
# Check server console for:
⚠️ NO METRICS FOUND FOR SESSION: [session-id]
This means answers were not saved to user_metrics table

# Check if session data exists:
Session data: {
  total_questions: 0,  # ← Should NOT be 0
  correct_answers: 0,  # ← Should NOT be 0
  ...
}
```

**Solution:**
- If session data is also 0, the session wasn't saved properly
- Complete a NEW practice session and make sure to answer questions
- Check browser console during practice for "Answer saved to user_metrics successfully"

### Scenario 2: Metrics Count is 0
**Symptoms:**
- Server log shows: `Metrics count: 0`
- But you answered questions

**Possible Causes:**
1. Answers not being saved to `user_metrics` table
2. RLS policy blocking access
3. Session ID mismatch

**Debug Steps:**
1. Check browser console during practice:
   ```
   ✅ "Answer saved to user_metrics successfully"
   ```
   If you DON'T see this, the save is failing

2. Check for errors:
   ```
   ❌ "Error saving to user_metrics: [error]"
   ```

3. Verify in database:
   ```sql
   SELECT * FROM user_metrics 
   WHERE session_id = 'your-session-id'
   ORDER BY created_at DESC;
   ```

**Solution:**
- If RLS error: Check RLS policies on `user_metrics` table
- If session ID mismatch: Verify sessionId is being passed correctly
- If save failing: Check network tab for failed requests

### Scenario 3: Session Data Exists But Not Displayed
**Symptoms:**
- Server log shows session data with values
- But summary page still shows zeros

**Possible Cause:**
- Component not receiving props correctly

**Debug Steps:**
1. Check server logs for "CALCULATED STATISTICS":
   ```
   === CALCULATED STATISTICS ===
   From metrics: { correctCount: 0, incorrectCount: 0, attemptedCount: 0 }
   From session: { correct_answers: 5, incorrect_answers: 3, total_questions: 10 }
   Final values: { 
     finalCorrectCount: 5,  # ← Should use session data
     finalIncorrectCount: 3,
     ...
   }
   ```

2. If final values are correct but page shows zeros:
   - Check if component is receiving props
   - Add console.log in PracticeSummary component
   - Verify no TypeScript errors

**Solution:**
- The fallback logic should now use session data
- Refresh the page to see updated values

## Expected Console Output (Success)

### Server Console:
```
=== SUMMARY PAGE DATA FETCH ===
Session ID: abc-123-def-456
Metrics count: 10
Metrics error: null
Session data: {
  total_questions: 10,
  correct_answers: 7,
  incorrect_answers: 3,
  skipped_count: 0
}
Sample metric: {
  id: '...',
  user_id: '...',
  session_id: 'abc-123-def-456',
  question_id: '...',
  is_correct: true,
  time_taken_seconds: 45,
  difficulty: 'medium'
}
Metrics with is_correct: 10

=== CALCULATED STATISTICS ===
From metrics: { correctCount: 7, incorrectCount: 3, attemptedCount: 10 }
From session: { correct_answers: 7, incorrect_answers: 3, total_questions: 10 }
Final values: { 
  finalCorrectCount: 7,
  finalIncorrectCount: 3,
  finalAttemptedCount: 10,
  finalSkippedCount: 0,
  finalNotAttemptedCount: 0
}
```

### Browser Console:
```
(No errors)
```

## Quick Fixes

### Fix 1: Force Session Data Save
If metrics aren't saving, at least session data will show:

1. Complete practice session
2. Click "End Session"
3. Check server console for session data
4. Summary page should now show at least basic statistics

### Fix 2: Manual Database Check
```sql
-- Check if session exists
SELECT * FROM practice_sessions 
WHERE id = 'your-session-id';

-- Check if metrics exist
SELECT COUNT(*) FROM user_metrics 
WHERE session_id = 'your-session-id';

-- Check if session data was updated
SELECT 
  total_questions,
  correct_answers,
  incorrect_answers,
  time_taken_seconds,
  completed_at
FROM practice_sessions 
WHERE id = 'your-session-id';
```

### Fix 3: Clear Cache and Retry
1. Clear browser cache
2. Restart development server
3. Complete a NEW practice session
4. Check summary page

## What Should Work Now

✅ **Fallback to Session Data**
- Even if `user_metrics` is empty
- Summary page shows basic statistics
- From `practice_sessions` table

✅ **Debug Logging**
- Server console shows what data is fetched
- Easy to identify where the problem is

✅ **Dual Data Source**
- Primary: `user_metrics` (detailed per-question data)
- Fallback: `practice_sessions` (summary statistics)

## Next Steps

1. **Test with a new practice session**
   - Answer questions
   - End session
   - Check summary page

2. **Check server console**
   - Look for debug logs
   - Verify data is being fetched

3. **Verify data display**
   - Numbers should match what you did
   - Charts should show data
   - Not all zeros

4. **Report findings**
   - If still showing zeros, share server console logs
   - Check which scenario matches your issue
   - Follow debug steps for that scenario

## Summary

The summary page now has:
- ✅ Fallback data logic
- ✅ Debug logging
- ✅ Better error handling
- ✅ Multiple data sources

**It should now display actual statistics even if metrics aren't saved!**
