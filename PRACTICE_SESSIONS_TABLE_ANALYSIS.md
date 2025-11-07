# Practice Sessions Table Structure Analysis

## 📊 Current Table Structure

Based on migrations `001_initial_schema.sql` and `025_add_incorrect_answers_column.sql`:

```sql
CREATE TABLE practice_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  incorrect_answers INTEGER NOT NULL DEFAULT 0,  -- Added in migration 025
  skipped_count INTEGER NOT NULL DEFAULT 0,
  time_taken_seconds INTEGER NOT NULL DEFAULT 0,
  config JSONB NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## ✅ Available Columns

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | UUID | uuid_generate_v4() | Primary key |
| `user_id` | UUID | - | Foreign key to profiles |
| `category_id` | UUID | - | Foreign key to categories |
| `total_questions` | INTEGER | - | Total number of questions in session |
| `correct_answers` | INTEGER | 0 | Number of correct answers |
| `incorrect_answers` | INTEGER | 0 | Number of incorrect answers ✅ |
| `skipped_count` | INTEGER | 0 | Number of skipped questions |
| `time_taken_seconds` | INTEGER | 0 | Total time spent in seconds |
| `config` | JSONB | - | Session configuration (topics, difficulty, etc.) |
| `completed_at` | TIMESTAMP | NOW() | When session was completed |
| `created_at` | TIMESTAMP | NOW() | When session was created |

---

## 🎯 Data Collection from End Session Dialog

### **What the Dialog Shows:**

```typescript
// From AdaptivePracticeInterface.tsx End Session Dialog
const totalAttempted = questionHistory.filter(q => q.hasAnswer).length
const totalCorrect = questionHistory.filter(q => q.isCorrect === true).length
const totalIncorrect = questionHistory.filter(q => q.isCorrect === false).length
const totalSkipped = allQuestions.length - totalAttempted
const markedCount = markedQuestions.size
```

### **Mapping to Table Columns:**

| Dialog Data | Table Column | Calculation |
|-------------|--------------|-------------|
| Total Questions | `total_questions` | `allQuestions.length` |
| Attempted | *(calculated)* | `totalAttempted` |
| Not Attempted | *(calculated)* | `total_questions - totalAttempted` |
| Correct | `correct_answers` | `totalCorrect` |
| Incorrect | `incorrect_answers` | `totalIncorrect` |
| Skipped | `skipped_count` | `totalSkipped` |
| Marked | *(not stored)* | `markedCount` |
| Time | `time_taken_seconds` | `timer` |

---

## ✅ Current Implementation

### **In `handleConfirmEndSession` function:**

```typescript
const handleConfirmEndSession = async () => {
  setShowEndSessionDialog(false)
  
  try {
    const supabase = createClient()
    
    // Calculate final statistics from questionHistory
    const totalAttempted = questionHistory.filter(q => q.hasAnswer).length
    const totalCorrect = questionHistory.filter(q => q.isCorrect === true).length
    const totalIncorrect = questionHistory.filter(q => q.isCorrect === false).length
    
    console.log('=== ENDING PRACTICE SESSION ===')
    console.log('Session ID:', sessionId)
    console.log('Total questions loaded:', allQuestions.length)
    console.log('Question history:', questionHistory.length)
    console.log('Statistics:', {
      totalAttempted,
      totalCorrect,
      totalIncorrect,
      totalSkipped: allQuestions.length - totalAttempted,
      timer
    })
    
    // Update practice_sessions table
    const { data: updateData, error: updateError } = await supabase
      .from('practice_sessions')
      .update({
        total_questions: allQuestions.length,
        correct_answers: totalCorrect,
        incorrect_answers: totalIncorrect,
        skipped_count: allQuestions.length - totalAttempted,
        time_taken_seconds: timer,
        completed_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .select()
    
    if (updateError) {
      console.error('❌ Error updating practice_sessions:', updateError)
      toast.error('Failed to save session data')
    } else {
      console.log('✅ Session data saved successfully:', updateData)
      toast.success('Session completed!')
    }
    
    // Verify data was saved
    const { data: verifyData, error: verifyError } = await supabase
      .from('practice_sessions')
      .select('total_questions, correct_answers, incorrect_answers, skipped_count')
      .eq('id', sessionId)
      .single()
    
    if (verifyData) {
      console.log('✅ Verified session data in database:', verifyData)
    } else {
      console.error('❌ Could not verify session data:', verifyError)
    }
  } catch (error) {
    console.error('❌ Error in handleConfirmEndSession:', error)
    toast.error('Error ending session')
  }
  
  console.log('Navigating to summary page...')
  router.push(`/practice/adaptive/${category.id}/${sessionId}/summary`)
}
```

---

## ⚠️ Missing: UPDATE Policy

### **Current RLS Policies:**

```sql
-- ✅ SELECT policy exists
CREATE POLICY "Users can view own practice sessions" ON practice_sessions
  FOR SELECT USING (auth.uid() = user_id);

-- ✅ INSERT policy exists
CREATE POLICY "Users can insert own practice sessions" ON practice_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ❌ UPDATE policy MISSING!
```

### **Problem:**

When `handleConfirmEndSession` tries to update the session:
```typescript
await supabase
  .from('practice_sessions')
  .update({ ... })
  .eq('id', sessionId)
```

**It will fail** because there's no UPDATE policy!

---

## 🔧 Required Migration

Create a new migration to add the UPDATE policy:

```sql
-- Migration: 028_add_practice_sessions_update_policy.sql

-- Add UPDATE policy for practice_sessions
CREATE POLICY "Users can update own practice sessions" ON practice_sessions
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add comment for documentation
COMMENT ON POLICY "Users can update own practice sessions" ON practice_sessions IS 
  'Allows users to update their own practice sessions, needed for updating session stats when ending a session';
```

---

## 📋 Summary Page Data Retrieval

### **Current Implementation:**

```typescript
// Fetch session data
const { data: sessionData } = await supabase
  .from('practice_sessions')
  .select('*')
  .eq('id', sessionId)
  .single()

// Fetch individual answers
const { data: metricsData } = await supabase
  .from('user_metrics')
  .select(`
    *,
    questions (
      id,
      "question text",
      difficulty,
      question_topic
    )
  `)
  .eq('session_id', sessionId)
```

### **Data Flow:**

```
1. User clicks "End Session" in dialog
   ↓
2. handleConfirmEndSession() calculates stats from questionHistory
   ↓
3. Updates practice_sessions table with:
   - total_questions
   - correct_answers
   - incorrect_answers
   - skipped_count
   - time_taken_seconds
   - completed_at
   ↓
4. Navigates to summary page
   ↓
5. Summary page fetches from practice_sessions table
   ↓
6. Displays statistics
```

---

## ✅ Verification Checklist

### **Before Ending Session:**

- [ ] `practice_sessions` row exists (created when session starts)
- [ ] `user_metrics` rows exist (one per answered question)
- [ ] `questionHistory` state is populated
- [ ] `allQuestions` array is populated

### **When Ending Session:**

- [ ] Dialog shows correct statistics
- [ ] Console logs show calculated stats
- [ ] UPDATE query executes successfully
- [ ] Verification query confirms data saved
- [ ] No RLS policy errors

### **On Summary Page:**

- [ ] Session data fetched successfully
- [ ] Metrics data fetched successfully
- [ ] Statistics displayed correctly
- [ ] No zeros (unless actually zero)

---

## 🎯 Expected Behavior

### **Session Creation (Start):**

```sql
INSERT INTO practice_sessions (
  user_id,
  category_id,
  total_questions,
  config
) VALUES (
  'user-uuid',
  'category-uuid',
  30,  -- Will be updated when session ends
  '{"topics": [...], "difficulty": "mixed"}'
);
```

### **Session Update (End):**

```sql
UPDATE practice_sessions SET
  total_questions = 30,
  correct_answers = 20,
  incorrect_answers = 8,
  skipped_count = 2,
  time_taken_seconds = 1200,
  completed_at = NOW()
WHERE id = 'session-uuid'
  AND user_id = 'user-uuid';  -- RLS check
```

### **Summary Page Fetch:**

```sql
SELECT 
  total_questions,
  correct_answers,
  incorrect_answers,
  skipped_count,
  time_taken_seconds,
  completed_at
FROM practice_sessions
WHERE id = 'session-uuid'
  AND user_id = 'user-uuid';  -- RLS check
```

---

## 🚨 Common Issues

### **Issue 1: Summary Shows Zeros**

**Cause:** UPDATE policy missing or UPDATE failed

**Check:**
```javascript
// Look for this error in console:
❌ Error updating practice_sessions: {
  code: "42501",
  message: "new row violates row-level security policy"
}
```

**Fix:** Add UPDATE policy (see migration above)

### **Issue 2: Session Not Found**

**Cause:** Session wasn't created or was deleted

**Check:**
```sql
SELECT * FROM practice_sessions 
WHERE id = 'session-uuid';
```

**Fix:** Ensure session is created when practice starts

### **Issue 3: Incorrect Stats**

**Cause:** `questionHistory` state is out of sync

**Check:**
```javascript
console.log('Question history:', questionHistory)
console.log('Answered:', questionHistory.filter(q => q.hasAnswer).length)
```

**Fix:** Ensure `questionHistory` is updated after each answer

---

## 💡 Recommendations

### **1. Add UPDATE Policy (Critical)**

```sql
CREATE POLICY "Users can update own practice sessions" ON practice_sessions
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### **2. Add Marked Questions Column (Optional)**

```sql
ALTER TABLE practice_sessions
ADD COLUMN IF NOT EXISTS marked_count INTEGER NOT NULL DEFAULT 0;
```

### **3. Add Session Status Column (Optional)**

```sql
ALTER TABLE practice_sessions
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'in_progress'
  CHECK (status IN ('in_progress', 'completed', 'abandoned'));
```

### **4. Add Accuracy Calculation (Optional)**

```sql
ALTER TABLE practice_sessions
ADD COLUMN IF NOT EXISTS accuracy DECIMAL(5,2) 
  GENERATED ALWAYS AS (
    CASE 
      WHEN (correct_answers + incorrect_answers) > 0 
      THEN (correct_answers::DECIMAL / (correct_answers + incorrect_answers) * 100)
      ELSE 0 
    END
  ) STORED;
```

---

## 🎉 Summary

### **Table Structure: ✅ Complete**

All necessary columns exist:
- ✅ `total_questions`
- ✅ `correct_answers`
- ✅ `incorrect_answers` (added in migration 025)
- ✅ `skipped_count`
- ✅ `time_taken_seconds`
- ✅ `completed_at`

### **Implementation: ✅ Correct**

The `handleConfirmEndSession` function:
- ✅ Calculates stats from dialog data
- ✅ Updates all required columns
- ✅ Verifies data was saved
- ✅ Logs everything for debugging

### **Missing: ⚠️ UPDATE Policy**

**Action Required:**
1. Create migration `028_add_practice_sessions_update_policy.sql`
2. Add UPDATE policy for `practice_sessions`
3. Run migration
4. Test session ending

**After adding UPDATE policy, everything will work perfectly!** 🎯
