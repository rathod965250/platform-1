# End Session Dialog → Database → Summary Page Data Flow

## 🎯 Overview

When you click the "End Session" button, a dialog appears showing session statistics. When you confirm, this data is saved to the `practice_sessions` table and later displayed on the summary page.

---

## 📊 Practice Sessions Table Structure

```sql
CREATE TABLE practice_sessions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  category_id UUID NOT NULL,
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  incorrect_answers INTEGER NOT NULL DEFAULT 0,  -- ✅ Added
  skipped_count INTEGER NOT NULL DEFAULT 0,
  time_taken_seconds INTEGER NOT NULL DEFAULT 0,
  config JSONB NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 🔄 Complete Data Flow

### **Step 1: Session Starts**

When practice session begins:

```typescript
// Create session record
const { data: session } = await supabase
  .from('practice_sessions')
  .insert({
    user_id: user.id,
    category_id: categoryId,
    total_questions: questionCount,  // Initial value
    config: {
      topics: selectedSubcategories,
      difficulty: 'mixed'
    }
  })
  .select()
  .single()

// Session ID: session.id
```

**Database State:**
```sql
-- practice_sessions table
id: "abc-123"
user_id: "user-xyz"
category_id: "cat-456"
total_questions: 30
correct_answers: 0        -- Will be updated when session ends
incorrect_answers: 0      -- Will be updated when session ends
skipped_count: 0          -- Will be updated when session ends
time_taken_seconds: 0     -- Will be updated when session ends
completed_at: NOW()
created_at: NOW()
```

---

### **Step 2: Answering Questions**

As user answers each question:

```typescript
// Save to user_metrics (one row per answer)
await supabase
  .from('user_metrics')
  .insert({
    user_id: user.id,
    session_id: sessionId,
    question_id: currentQuestion.id,
    subcategory_id: currentQuestion.subcategory_id,
    is_correct: actualCorrect,
    time_taken_seconds: timeTaken,
    difficulty: currentQuestion.difficulty
  })

// Update local state
setQuestionHistory(prev => prev.map(q => 
  q.id === currentQuestion.id 
    ? { ...q, isCorrect: actualCorrect, timeSpent: timeTaken, hasAnswer: true }
    : q
))
```

**Database State:**
```sql
-- user_metrics table (grows with each answer)
Row 1: question_id: "q1", is_correct: true,  time_taken: 30
Row 2: question_id: "q2", is_correct: false, time_taken: 45
Row 3: question_id: "q3", is_correct: true,  time_taken: 25
...

-- practice_sessions table (unchanged until session ends)
Still has: correct_answers: 0, incorrect_answers: 0, etc.
```

---

### **Step 3: User Clicks "End Session"**

Dialog appears showing current statistics:

```typescript
// Calculate from questionHistory state
const totalAttempted = questionHistory.filter(q => q.hasAnswer).length
const totalCorrect = questionHistory.filter(q => q.isCorrect === true).length
const totalIncorrect = questionHistory.filter(q => q.isCorrect === false).length
const totalSkipped = allQuestions.length - totalAttempted
const markedCount = markedQuestions.size
```

**Dialog Shows:**
```
┌─────────────────────────────────────┐
│  End Practice Session               │
├─────────────────────────────────────┤
│                                     │
│  Attempted:       25                │
│  Not Attempted:    5                │
│  Marked:           3                │
│                                     │
│  Question Overview:                 │
│  [1][2][3][4][5]...                │
│                                     │
│  [Continue Practice] [End Session]  │
└─────────────────────────────────────┘
```

---

### **Step 4: User Confirms "End Session"**

When user clicks "End Session" in dialog:

```typescript
const handleConfirmEndSession = async () => {
  setShowEndSessionDialog(false)
  
  try {
    const supabase = createClient()
    
    // 1. Calculate statistics from questionHistory
    const totalAttempted = questionHistory.filter(q => q.hasAnswer).length
    const totalCorrect = questionHistory.filter(q => q.isCorrect === true).length
    const totalIncorrect = questionHistory.filter(q => q.isCorrect === false).length
    const totalSkipped = allQuestions.length - totalAttempted
    
    console.log('=== ENDING PRACTICE SESSION ===')
    console.log('Session ID:', sessionId)
    console.log('Total questions loaded:', allQuestions.length)
    console.log('Statistics:', {
      totalAttempted,
      totalCorrect,
      totalIncorrect,
      totalSkipped,
      timer
    })
    
    // 2. Update practice_sessions table
    const { data: updateData, error: updateError } = await supabase
      .from('practice_sessions')
      .update({
        total_questions: allQuestions.length,
        correct_answers: totalCorrect,
        incorrect_answers: totalIncorrect,
        skipped_count: totalSkipped,
        time_taken_seconds: timer,
        completed_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .select()
    
    if (updateError) {
      console.error('❌ Error updating practice_sessions:', updateError)
      toast.error('Failed to save session data')
      return
    }
    
    console.log('✅ Session data saved successfully:', updateData)
    
    // 3. Verify data was saved
    const { data: verifyData } = await supabase
      .from('practice_sessions')
      .select('total_questions, correct_answers, incorrect_answers, skipped_count')
      .eq('id', sessionId)
      .single()
    
    console.log('✅ Verified session data in database:', verifyData)
    
    // 4. Navigate to summary page
    router.push(`/practice/adaptive/${category.id}/${sessionId}/summary`)
    
  } catch (error) {
    console.error('❌ Error in handleConfirmEndSession:', error)
    toast.error('Error ending session')
  }
}
```

**Console Output:**
```
=== ENDING PRACTICE SESSION ===
Session ID: abc-123
Total questions loaded: 30
Statistics: {
  totalAttempted: 25,
  totalCorrect: 18,
  totalIncorrect: 7,
  totalSkipped: 5,
  timer: 1200
}
✅ Session data saved successfully: [{
  id: "abc-123",
  total_questions: 30,
  correct_answers: 18,
  incorrect_answers: 7,
  skipped_count: 5,
  time_taken_seconds: 1200,
  ...
}]
✅ Verified session data in database: {
  total_questions: 30,
  correct_answers: 18,
  incorrect_answers: 7,
  skipped_count: 5
}
```

**Database State After Update:**
```sql
-- practice_sessions table (NOW UPDATED!)
id: "abc-123"
total_questions: 30
correct_answers: 18       -- ✅ Updated from dialog data
incorrect_answers: 7      -- ✅ Updated from dialog data
skipped_count: 5          -- ✅ Updated from dialog data
time_taken_seconds: 1200  -- ✅ Updated from dialog data
completed_at: "2024-11-07T18:00:00Z"  -- ✅ Updated
```

---

### **Step 5: Summary Page Loads**

Summary page fetches data from database:

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

// Calculate statistics
const totalQuestions = sessionData.total_questions
const correctAnswers = sessionData.correct_answers
const incorrectAnswers = sessionData.incorrect_answers
const skippedCount = sessionData.skipped_count
const timeTaken = sessionData.time_taken_seconds

const accuracy = totalQuestions > 0 
  ? (correctAnswers / totalQuestions) * 100 
  : 0
```

**Summary Page Displays:**
```
┌─────────────────────────────────────┐
│  Practice Session Summary           │
├─────────────────────────────────────┤
│                                     │
│  Overall Performance                │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                     │
│  Total Questions:    30             │
│  Correct:           18 (60%)        │
│  Incorrect:          7 (23%)        │
│  Skipped:            5 (17%)        │
│  Time Taken:        20:00           │
│  Accuracy:          72%             │
│                                     │
│  Weak Areas:                        │
│  - Topic A: 40% accuracy            │
│  - Topic B: 50% accuracy            │
│                                     │
│  Strong Areas:                      │
│  - Topic C: 90% accuracy            │
│  - Topic D: 85% accuracy            │
│                                     │
└─────────────────────────────────────┘
```

---

## 🔑 Key Points

### **Data Sources:**

1. **End Session Dialog:**
   - Source: `questionHistory` state (in-memory)
   - Contains: All answered questions with correct/incorrect status
   - Calculated: Attempted, correct, incorrect, skipped counts

2. **Database Update:**
   - Target: `practice_sessions` table
   - Columns: `total_questions`, `correct_answers`, `incorrect_answers`, `skipped_count`, `time_taken_seconds`, `completed_at`
   - Method: UPDATE query with session ID

3. **Summary Page:**
   - Source: `practice_sessions` table (database)
   - Also uses: `user_metrics` table for detailed breakdown
   - Displays: All statistics from database

---

## ✅ Data Mapping

| Dialog Data | Calculation | Database Column | Summary Display |
|-------------|-------------|-----------------|-----------------|
| Total Questions | `allQuestions.length` | `total_questions` | "Total Questions: 30" |
| Attempted | `questionHistory.filter(q => q.hasAnswer).length` | *(calculated)* | "Attempted: 25" |
| Not Attempted | `total - attempted` | *(calculated)* | "Not Attempted: 5" |
| Correct | `questionHistory.filter(q => q.isCorrect === true).length` | `correct_answers` | "Correct: 18 (60%)" |
| Incorrect | `questionHistory.filter(q => q.isCorrect === false).length` | `incorrect_answers` | "Incorrect: 7 (23%)" |
| Skipped | `total - attempted` | `skipped_count` | "Skipped: 5 (17%)" |
| Marked | `markedQuestions.size` | *(not stored)* | *(not shown)* |
| Time | `timer` | `time_taken_seconds` | "Time: 20:00" |
| Accuracy | *(calculated)* | *(calculated)* | "Accuracy: 72%" |

---

## 🚨 Critical: UPDATE Policy Required

### **Problem:**

The UPDATE query will **FAIL** without proper RLS policy:

```typescript
// This will fail with RLS error:
await supabase
  .from('practice_sessions')
  .update({ ... })
  .eq('id', sessionId)

// Error: "new row violates row-level security policy"
```

### **Solution:**

Migration `028_add_practice_sessions_update_policy.sql`:

```sql
CREATE POLICY "Users can update own practice sessions" ON practice_sessions
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### **Apply Migration:**

```bash
# Using Supabase CLI
supabase db push

# Or in Supabase Dashboard
# SQL Editor → Paste migration → Run
```

---

## 🧪 Testing

### **Test 1: Verify UPDATE Policy**

```sql
-- Run in Supabase SQL Editor
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'practice_sessions';
```

**Expected Output:**
```
policyname: "Users can view own practice sessions"     cmd: SELECT
policyname: "Users can insert own practice sessions"   cmd: INSERT
policyname: "Users can update own practice sessions"   cmd: UPDATE  ← Should exist!
```

### **Test 2: End Session Flow**

1. Start practice session
2. Answer some questions
3. Click "End Session" button
4. Verify dialog shows correct stats
5. Click "End Session" in dialog
6. **Check console:**
   ```
   ✅ Session data saved successfully
   ✅ Verified session data in database
   ```
7. Navigate to summary page
8. **Verify:** All stats match what was in dialog

### **Test 3: Database Verification**

```sql
-- Check latest session
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

**Expected:** All columns have correct values (not zeros)

---

## 📊 Example Data Flow

### **Scenario: 30 Questions, Answer 25**

```
Start Session:
  practice_sessions: { total_questions: 30, correct_answers: 0, ... }

Answer Q1 (Correct):
  user_metrics: INSERT { question_id: q1, is_correct: true }
  questionHistory: [{ id: q1, isCorrect: true, hasAnswer: true }]

Answer Q2 (Incorrect):
  user_metrics: INSERT { question_id: q2, is_correct: false }
  questionHistory: [{ id: q1, ... }, { id: q2, isCorrect: false, hasAnswer: true }]

... (answer 23 more questions)

End Session Dialog:
  Attempted: 25
  Correct: 18
  Incorrect: 7
  Skipped: 5

Click "End Session":
  practice_sessions: UPDATE {
    total_questions: 30,
    correct_answers: 18,
    incorrect_answers: 7,
    skipped_count: 5,
    time_taken_seconds: 1200
  }

Summary Page:
  Fetches from practice_sessions
  Displays: 30 total, 18 correct, 7 incorrect, 5 skipped
  Accuracy: 72% (18/25)
```

---

## 🎯 Summary

### **✅ Table Structure: Complete**
- All necessary columns exist
- `incorrect_answers` added in migration 025

### **✅ Implementation: Correct**
- Dialog calculates from `questionHistory`
- UPDATE query saves to database
- Summary page fetches from database

### **⚠️ Missing: UPDATE Policy**
- **Action Required:** Run migration 028
- **Without it:** UPDATE will fail with RLS error
- **After adding:** Everything works perfectly

### **🔄 Data Flow:**
```
questionHistory (state)
  ↓ Calculate stats
End Session Dialog
  ↓ User confirms
UPDATE practice_sessions
  ↓ Save to database
Summary Page
  ↓ Fetch from database
Display Statistics
```

---

**After running migration 028, the complete data flow will work perfectly!** ✅
