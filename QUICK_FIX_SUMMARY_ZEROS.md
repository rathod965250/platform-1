# Quick Fix for Summary Page Showing Zeros

## 🚨 Most Likely Cause

The `incorrect_answers` column is missing from the `practice_sessions` table, causing the session update to fail silently.

---

## ✅ Quick Fix (Run in Supabase SQL Editor)

### Step 1: Add Missing Column

```sql
-- Add the incorrect_answers column if it doesn't exist
ALTER TABLE practice_sessions
ADD COLUMN IF NOT EXISTS incorrect_answers INTEGER NOT NULL DEFAULT 0;
```

### Step 2: Verify Column Exists

```sql
-- Check if column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'practice_sessions' 
AND column_name = 'incorrect_answers';
```

**Expected:** Should show one row with `incorrect_answers | integer`

### Step 3: Check RLS Policies

```sql
-- Ensure UPDATE policy exists
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'practice_sessions' 
AND cmd = 'UPDATE';
```

**Expected:** Should show at least one UPDATE policy

**If no UPDATE policy exists, run:**

```sql
CREATE POLICY "Users can update own practice sessions" ON practice_sessions
  FOR UPDATE USING (auth.uid() = user_id);
```

---

## 🧪 Test the Fix

### 1. Complete a NEW Practice Session

1. Go to Dashboard
2. Start a new practice session
3. Answer 5-10 questions (mix correct/incorrect)
4. Click "End Session"
5. Check browser console (F12) for:
   ```
   ✅ "Session data saved: { total_questions: X, correct_answers: Y, incorrect_answers: Z }"
   ```

### 2. Verify in Database

```sql
-- Check your latest session
SELECT 
  id,
  total_questions,
  correct_answers,
  incorrect_answers,
  skipped_count,
  time_taken_seconds,
  completed_at
FROM practice_sessions
WHERE user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 1;
```

**Expected:** All fields should have values > 0

### 3. Check user_metrics

```sql
-- Check if answers were saved
SELECT 
  COUNT(*) as total_answers,
  SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct,
  SUM(CASE WHEN NOT is_correct THEN 1 ELSE 0 END) as incorrect
FROM user_metrics
WHERE session_id = (
  SELECT id FROM practice_sessions 
  WHERE user_id = auth.uid() 
  ORDER BY created_at DESC 
  LIMIT 1
);
```

**Expected:** Numbers should match what you did in practice

---

## 🔍 If Still Showing Zeros

### Check Browser Console

On the summary page, look for these logs:

```
=== SUMMARY PAGE DATA FETCH ===
Session ID: [uuid]
Metrics count: [number]
Session data: { total_questions: X, correct_answers: Y, ... }

=== CALCULATED STATISTICS ===
From metrics: { correctCount: X, incorrectCount: Y, attemptedCount: Z }
From session: { correct_answers: X, incorrect_answers: Y, total_questions: Z }
Final values: { finalCorrectCount: X, finalIncorrectCount: Y, ... }
```

**Diagnosis:**
- If `Metrics count: 0` AND `Session data` all zeros → Both saves failed
- If `Metrics count: > 0` BUT `Final values` all zeros → Calculation bug
- If `Metrics count: 0` BUT `Session data` has values → Should use fallback (check Final values)

### Manual Data Check

```sql
-- Get session ID from URL, then run:
SELECT 
  'Session Data' as source,
  total_questions,
  correct_answers,
  incorrect_answers
FROM practice_sessions
WHERE id = 'YOUR_SESSION_ID_FROM_URL'

UNION ALL

SELECT 
  'Metrics Data' as source,
  COUNT(*)::integer as total_questions,
  SUM(CASE WHEN is_correct THEN 1 ELSE 0 END)::integer as correct_answers,
  SUM(CASE WHEN NOT is_correct THEN 1 ELSE 0 END)::integer as incorrect_answers
FROM user_metrics
WHERE session_id = 'YOUR_SESSION_ID_FROM_URL';
```

This will show you exactly what data exists in both tables.

---

## 🛠️ Alternative: Update Existing Sessions

If you have old sessions with zeros, you can recalculate them:

```sql
-- Recalculate stats for a specific session
WITH metrics_stats AS (
  SELECT 
    session_id,
    COUNT(*) as total,
    SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct,
    SUM(CASE WHEN NOT is_correct THEN 1 ELSE 0 END) as incorrect
  FROM user_metrics
  WHERE session_id = 'YOUR_SESSION_ID'
  GROUP BY session_id
)
UPDATE practice_sessions ps
SET 
  correct_answers = ms.correct,
  incorrect_answers = ms.incorrect
FROM metrics_stats ms
WHERE ps.id = ms.session_id;
```

---

## 📋 Checklist

Before testing again:

- [ ] Run Step 1: Add `incorrect_answers` column
- [ ] Run Step 2: Verify column exists
- [ ] Run Step 3: Check/add UPDATE policy
- [ ] Refresh browser page
- [ ] Complete a NEW practice session
- [ ] Check browser console for success messages
- [ ] Verify summary page shows data

---

## 🎯 Expected Result

After the fix, the summary page should show:

✅ **Accuracy**: Percentage (e.g., 60.0%)
✅ **Attempted**: Number of questions answered
✅ **Not Attempted**: Remaining questions
✅ **Skipped**: Questions skipped
✅ **Correct**: Green number
✅ **Incorrect**: Red number
✅ **Charts**: Colorful visualizations
✅ **Weak Areas**: Topics where accuracy < 50%
✅ **Strong Areas**: Topics where accuracy > 70%

---

## 🆘 Still Not Working?

If after all these steps it still shows zeros:

1. **Copy the session ID from the URL**
2. **Run this comprehensive check:**

```sql
SELECT 
  'practice_sessions' as table_name,
  ps.id,
  ps.user_id,
  ps.total_questions,
  ps.correct_answers,
  ps.incorrect_answers,
  ps.completed_at,
  (SELECT COUNT(*) FROM user_metrics WHERE session_id = ps.id) as metrics_count
FROM practice_sessions ps
WHERE ps.id = 'YOUR_SESSION_ID';
```

3. **Share the output** - this will show exactly what's in the database

---

## 💡 Pro Tip

To see real-time what's happening:

1. Open browser DevTools (F12)
2. Go to Console tab
3. Keep it open while practicing
4. Watch for success/error messages
5. This will help you catch issues immediately

---

## ✨ After Fix Works

Once you see data on the summary page:

1. ✅ All numbers should be accurate
2. ✅ Charts should display
3. ✅ Weak/strong areas should be identified
4. ✅ Each session should show different data
5. ✅ Historical sessions should be preserved

**The summary page will now provide detailed performance analysis!** 🎉
