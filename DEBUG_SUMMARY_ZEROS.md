# Debug Summary Page Showing Zeros

## Quick Diagnosis Steps

### Step 1: Check Browser Console (F12)

When you're on the summary page, open DevTools (F12) and look for these logs:

```
=== SUMMARY PAGE DATA FETCH ===
Session ID: [your-session-id]
Metrics count: [should be > 0]
Session data: { total_questions: X, correct_answers: Y, ... }
```

**What to check:**
- ✅ If `Metrics count: 0` → Data not saved to user_metrics
- ✅ If `Session data` shows all zeros → Session not updated on end
- ✅ If you see errors → Database permission issue

### Step 2: Check Database Directly

Run these queries in Supabase SQL Editor:

#### A. Check if session exists and has data
```sql
SELECT 
  id,
  user_id,
  total_questions,
  correct_answers,
  incorrect_answers,
  skipped_count,
  time_taken_seconds,
  completed_at,
  created_at
FROM practice_sessions
WHERE user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 5;
```

**Expected:** Should show your recent sessions with numbers > 0

#### B. Check if user_metrics has data
```sql
SELECT 
  session_id,
  COUNT(*) as total_answers,
  SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct_count,
  SUM(CASE WHEN NOT is_correct THEN 1 ELSE 0 END) as incorrect_count
FROM user_metrics
WHERE user_id = auth.uid()
GROUP BY session_id
ORDER BY MAX(created_at) DESC
LIMIT 5;
```

**Expected:** Should show answer counts for your sessions

#### C. Check specific session
```sql
-- Replace 'YOUR_SESSION_ID' with actual session ID from URL
SELECT * FROM user_metrics 
WHERE session_id = 'YOUR_SESSION_ID'
ORDER BY created_at;
```

**Expected:** Should show one row per question answered

### Step 3: Check Network Tab

1. Open DevTools (F12) → Network tab
2. Reload summary page
3. Look for failed requests (red)
4. Check if any requests to `/api/adaptive` failed

---

## Common Issues & Fixes

### Issue 1: Metrics count is 0

**Cause:** Answers not being saved to user_metrics table

**Debug:**
1. Go back to practice page
2. Open browser console (F12)
3. Answer a question
4. Look for: `"Answer saved to user_metrics successfully"`

**If you DON'T see this message:**
- Check RLS policies on user_metrics table
- Check if user is authenticated
- Check network tab for failed requests

**Fix:**
```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'user_metrics';

-- If policies are missing, run:
CREATE POLICY "Users can insert own metrics" ON user_metrics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own metrics" ON user_metrics
  FOR SELECT USING (auth.uid() = user_id);
```

### Issue 2: Session data shows all zeros

**Cause:** Session not updated when ending practice

**Debug:**
1. Complete a practice session
2. Click "End Session"
3. Check browser console for: `"Session data saved: { ... }"`

**If you DON'T see this message:**
- The update query might be failing
- Check RLS policies on practice_sessions table

**Fix:**
```sql
-- Check if practice_sessions has UPDATE policy
SELECT * FROM pg_policies WHERE tablename = 'practice_sessions';

-- If missing, add:
CREATE POLICY "Users can update own sessions" ON practice_sessions
  FOR UPDATE USING (auth.uid() = user_id);
```

### Issue 3: incorrect_answers column error

**Cause:** Migration not applied

**Symptoms:**
- Error in console about column not existing
- Session update fails

**Fix:**
Run the migration:
```sql
ALTER TABLE practice_sessions
ADD COLUMN IF NOT EXISTS incorrect_answers INTEGER NOT NULL DEFAULT 0;
```

---

## Step-by-Step Test

### Test 1: Fresh Practice Session

1. **Start new practice:**
   - Dashboard → Select category → Configure → Start
   - Select 3-5 topics
   - Choose 10 questions

2. **Answer questions:**
   - Answer at least 5 questions
   - Mix correct and incorrect
   - Check console after each answer:
     ```
     ✅ "Answer saved to user_metrics successfully"
     ```

3. **End session:**
   - Click "End Session"
   - Confirm
   - Check console:
     ```
     ✅ "Session data saved: { total_questions: 10, correct_answers: 3, ... }"
     ```

4. **Check summary:**
   - Should redirect automatically
   - Check console:
     ```
     ✅ "Metrics count: 5" (or however many you answered)
     ✅ "Session data: { total_questions: 10, ... }"
     ```

5. **Verify display:**
   - Accuracy should show percentage
   - All stat boxes should have numbers
   - Charts should display

### Test 2: Database Verification

After completing a session, run:

```sql
-- Get your latest session ID
SELECT id, created_at, total_questions, correct_answers
FROM practice_sessions
WHERE user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 1;

-- Copy the ID and check metrics
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct,
  SUM(CASE WHEN NOT is_correct THEN 1 ELSE 0 END) as incorrect
FROM user_metrics
WHERE session_id = 'PASTE_SESSION_ID_HERE';
```

**Expected Results:**
- `total` = number of questions you answered
- `correct` = number you got right
- `incorrect` = number you got wrong

---

## Quick Fixes

### Fix 1: Clear and Retry

1. Complete a NEW practice session
2. Make sure to ANSWER questions (not just skip)
3. Click "End Session" button
4. Wait for redirect

### Fix 2: Check Authentication

```javascript
// Run in browser console
const { createClient } = await import('@supabase/supabase-js')
const supabase = createClient(/* your config */)
const { data: { user } } = await supabase.auth.getUser()
console.log('User:', user)
```

If `user` is null, you're not logged in.

### Fix 3: Manual Data Check

```sql
-- Check if ANY data exists
SELECT 
  (SELECT COUNT(*) FROM practice_sessions WHERE user_id = auth.uid()) as sessions,
  (SELECT COUNT(*) FROM user_metrics WHERE user_id = auth.uid()) as metrics;
```

If both are 0, no data has been saved at all.

---

## Expected vs Actual

### Expected Flow:
```
Answer Question
  ↓
Console: "Answer saved to user_metrics successfully"
  ↓
user_metrics table: +1 row
  ↓
End Session
  ↓
Console: "Session data saved: { ... }"
  ↓
practice_sessions table: updated with stats
  ↓
Summary Page
  ↓
Console: "Metrics count: X"
  ↓
Display: Shows all stats
```

### If Showing Zeros:
```
Answer Question
  ↓
❌ No console message OR
❌ Error in console
  ↓
user_metrics table: empty
  ↓
End Session
  ↓
❌ No "Session data saved" OR
❌ Error in console
  ↓
practice_sessions table: not updated
  ↓
Summary Page
  ↓
Console: "Metrics count: 0"
  ↓
Display: All zeros
```

---

## Checklist

Before reporting an issue, verify:

- [ ] Migrations applied (especially 025_add_incorrect_answers_column.sql)
- [ ] RLS policies exist for user_metrics (INSERT, SELECT)
- [ ] RLS policies exist for practice_sessions (UPDATE)
- [ ] User is authenticated (check console)
- [ ] Questions were actually answered (not just skipped)
- [ ] "End Session" button was clicked
- [ ] Browser console shows success messages
- [ ] Database has data (run SQL queries above)

---

## Get Session ID from URL

When on summary page, the URL looks like:
```
/practice/adaptive/[categoryId]/[sessionId]/summary
```

Example:
```
/practice/adaptive/123e4567-e89b-12d3-a456-426614174000/987f6543-e21b-12d3-a456-426614174111/summary
                   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                   Category ID                        Session ID (use this!)
```

Copy the second UUID (session ID) and use it in SQL queries.

---

## Still Showing Zeros?

If after all checks it still shows zeros:

1. **Open browser console (F12)**
2. **Copy ALL console logs**
3. **Run this SQL query:**
   ```sql
   SELECT 
     ps.id,
     ps.total_questions,
     ps.correct_answers,
     ps.incorrect_answers,
     COUNT(um.id) as metrics_count
   FROM practice_sessions ps
   LEFT JOIN user_metrics um ON um.session_id = ps.id
   WHERE ps.user_id = auth.uid()
   GROUP BY ps.id
   ORDER BY ps.created_at DESC
   LIMIT 1;
   ```
4. **Share the results**

This will show exactly what's in the database vs what should be displayed.
