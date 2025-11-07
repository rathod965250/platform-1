# Database Tables Analysis & Issues

## Overview
Analysis of 8 key tables and how they're being populated in the codebase.

---

## 1. **attempt_answers** Table

### Schema (from 001_initial_schema.sql)
```sql
CREATE TABLE attempt_answers (
  id UUID PRIMARY KEY,
  attempt_id UUID REFERENCES test_attempts(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE NOT NULL,
  user_answer TEXT,
  is_correct BOOLEAN NOT NULL,
  is_marked_for_review BOOLEAN DEFAULT FALSE,
  is_skipped BOOLEAN DEFAULT FALSE,
  marks_obtained INTEGER NOT NULL DEFAULT 0,
  time_taken_seconds INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Unique constraint (from 002_add_unique_constraint_attempt_answers.sql)
ALTER TABLE attempt_answers
ADD CONSTRAINT unique_attempt_question UNIQUE (attempt_id, question_id);
```

### Purpose
Stores individual question answers for formal test attempts (not practice sessions).

### How It's Populated
**File**: `src/components/test/ActiveTestInterface.tsx`

```typescript
// When user answers a question
const { data, error } = await supabase
  .from('attempt_answers')
  .upsert(answerData, { onConflict: 'attempt_id,question_id' })
  .select()
  .single()

// After test submission
await supabase
  .from('attempt_answers')
  .update({
    is_correct: isCorrect,
    marks_obtained: isCorrect ? question.marks : (test.negative_marking ? -question.marks * 0.25 : 0),
  })
  .eq('id', answerId)
```

### ✅ Status: **WORKING CORRECTLY**
- Uses upsert with unique constraint
- Properly handles marks calculation
- Updates correctness after submission

---

## 2. **leaderboard** Table

### Schema
```sql
CREATE TABLE leaderboard (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
  rank INTEGER NOT NULL,
  score INTEGER NOT NULL,
  time_taken INTEGER NOT NULL,
  percentile NUMERIC(5, 2) NOT NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('all', 'weekly', 'monthly')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Purpose
Stores leaderboard rankings for tests across different time periods.

### How It's Populated
**File**: `src/app/(student)/leaderboard/page.tsx`

```typescript
// Fetches leaderboard data
const { data: leaderboardData } = await supabase
  .from('leaderboard')
  .select(`
    *,
    user:profiles(full_name, avatar_url, college),
    test:tests(title, test_type)
  `)
  .eq('period_type', periodType)
  .order('rank', { ascending: true })
  .limit(100)
```

### ⚠️ **ISSUE IDENTIFIED**: **NOT BEING POPULATED**
**Problem**: Leaderboard table is only being READ from, never WRITTEN to.

**Missing Logic**:
- No code to calculate rankings after test submission
- No code to update percentiles
- No code to handle different period_types (all, weekly, monthly)

**Required Fix**: Need to add leaderboard calculation logic after test submission.

---

## 3. **practice_sessions** Table

### Schema
```sql
CREATE TABLE practice_sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  incorrect_answers INTEGER NOT NULL DEFAULT 0,  -- MISSING IN SCHEMA!
  skipped_count INTEGER NOT NULL DEFAULT 0,
  time_taken_seconds INTEGER NOT NULL DEFAULT 0,
  config JSONB NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Purpose
Stores practice session metadata for adaptive practice.

### How It's Populated
**File**: `src/components/practice/AdaptivePracticeInterface.tsx`

```typescript
// On session end (RECENTLY FIXED)
await supabase
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
```

### ⚠️ **SCHEMA ISSUE**: **Missing `incorrect_answers` column**
**Problem**: Code tries to update `incorrect_answers` but column doesn't exist in schema!

**Required Fix**: Add migration to add `incorrect_answers` column.

---

## 4. **session_answers** Table

### Schema
```sql
CREATE TABLE session_answers (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES practice_sessions(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE NOT NULL,
  user_answer TEXT,
  is_correct BOOLEAN NOT NULL,
  time_taken_seconds INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Purpose
Stores individual question answers for practice sessions.

### How It's Populated
**Status**: ❌ **NOT BEING USED**

**Problem**: This table exists but is NOT being populated anywhere in the codebase.
Instead, the system uses `user_metrics` table for practice session answers.

**Options**:
1. **Remove** `session_answers` table (not used)
2. **Use** `session_answers` instead of `user_metrics` for practice
3. **Keep both** for different purposes

**Recommendation**: Keep `user_metrics` (more detailed) and remove `session_answers` or repurpose it.

---

## 5. **session_stats** Table

### Schema
```sql
CREATE TABLE session_stats (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES practice_sessions(id) ON DELETE CASCADE UNIQUE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  avg_accuracy DECIMAL(5,2),
  avg_time_seconds INTEGER,
  difficulty_transitions INTEGER DEFAULT 0,
  session_duration_seconds INTEGER,
  improvement_rate DECIMAL(5,2),
  topic_wise_accuracy JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Purpose
Stores aggregated analytics for practice sessions.

### How It's Populated
**File**: `supabase/functions/calculate-session-analytics/index.ts`

```typescript
// Called from summary page
const { error: insertError } = await supabaseClient
  .from('session_stats')
  .insert({
    session_id,
    user_id,
    category_id: session.category_id,
    avg_accuracy: avgAccuracy,
    avg_time_seconds: avgTime,
    difficulty_transitions: difficultyTransitions,
    session_duration_seconds: sessionDuration,
    improvement_rate: improvementRate,
    topic_wise_accuracy: topicWiseAccuracy,
  })
```

### ✅ Status: **WORKING CORRECTLY**
- Calculated by Edge Function
- Called from summary page
- Handles duplicate inserts gracefully

---

## 6. **test_attempts** Table

### Schema
```sql
CREATE TABLE test_attempts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  test_id UUID REFERENCES tests(id) ON DELETE CASCADE NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  skipped_count INTEGER NOT NULL DEFAULT 0,
  marked_for_review_count INTEGER NOT NULL DEFAULT 0,
  time_taken_seconds INTEGER NOT NULL DEFAULT 0,
  percentile NUMERIC(5, 2),
  rank INTEGER,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Purpose
Stores formal test attempt metadata.

### How It's Populated
**File**: `src/components/test/ActiveTestInterface.tsx`

```typescript
// On test submission
const { data: updatedAttempt, error: updateError } = await supabase
  .from('test_attempts')
  .update({
    score: totalScore,
    correct_answers: correctCount,
    skipped_count: skippedCount,
    marked_for_review_count: markedCount,
    time_taken_seconds: totalTimeSpent,
    submitted_at: new Date().toISOString(),
  })
  .eq('id', attemptId)
  .select()
  .single()
```

### ⚠️ **ISSUE**: **Percentile and Rank not calculated**
**Problem**: `percentile` and `rank` fields are never populated.

**Required Fix**: Calculate percentile and rank after test submission and update leaderboard.

---

## 7. **user_analytics** Table

### Schema
```sql
CREATE TABLE user_analytics (
  user_id UUID PRIMARY KEY,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  subcategory_id UUID REFERENCES subcategories(id) ON DELETE CASCADE,
  total_attempts INTEGER DEFAULT 0,
  total_practice_sessions INTEGER DEFAULT 0,
  avg_score NUMERIC(5, 2) DEFAULT 0,
  total_time_spent_seconds INTEGER DEFAULT 0,
  weak_areas JSONB DEFAULT '{}'::jsonb,
  strengths JSONB DEFAULT '{}'::jsonb,
  current_streak_days INTEGER DEFAULT 0,
  last_activity_date DATE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Purpose
Stores aggregated user analytics across all activities.

### How It's Populated
**Status**: ❌ **NOT BEING POPULATED**

**Problem**: This table exists but is NOT being updated anywhere in the codebase.

**Required Logic**:
- Update after each test attempt
- Update after each practice session
- Calculate weak areas and strengths
- Track streaks based on activity

**Required Fix**: Add triggers or scheduled functions to populate this table.

---

## 8. **user_metrics** Table

### Schema
```sql
CREATE TABLE user_metrics (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES practice_sessions(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE NOT NULL,
  subcategory_id UUID REFERENCES subcategories(id) ON DELETE SET NULL,
  is_correct BOOLEAN NOT NULL,
  time_taken_seconds INTEGER NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  previous_difficulty TEXT CHECK (previous_difficulty IN ('easy', 'medium', 'hard')),
  mastery_score_before DECIMAL(3,2),
  mastery_score_after DECIMAL(3,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Purpose
Logs every question attempt in practice mode for detailed analytics.

### How It's Populated
**Files**: 
1. `src/components/practice/AdaptivePracticeInterface.tsx` (Direct insert)
2. `supabase/functions/adaptive-next-question/index.ts` (Edge Function)

```typescript
// Direct insert (RECENTLY ADDED)
const { error: metricsError } = await supabase
  .from('user_metrics')
  .insert({
    user_id: user.id,
    session_id: sessionId,
    question_id: currentQuestion.id,
    subcategory_id: currentQuestion.subcategory?.id || null,
    is_correct: actualCorrect,
    time_taken_seconds: timeTaken,
    difficulty: currentQuestion.difficulty,
  })

// Edge Function insert
await supabaseClient.from('user_metrics').insert({
  user_id,
  session_id,
  question_id: last_question.question_id,
  subcategory_id: questionData?.subcategory_id,
  is_correct: last_question.is_correct,
  time_taken_seconds: last_question.time_taken,
  difficulty: last_question.difficulty,
  previous_difficulty: previousDifficulty,
  mastery_score_before: currentMastery,
  mastery_score_after: newMastery,
})
```

### ✅ Status: **WORKING CORRECTLY** (After recent fix)
- Dual-save mechanism (direct + Edge Function)
- Comprehensive data capture
- Used for summary page analytics

---

## Summary of Issues

### 🔴 **Critical Issues**

1. **practice_sessions.incorrect_answers** - Column missing from schema
   - **Impact**: HIGH - Code will fail when trying to update
   - **Fix**: Add migration to add column

2. **leaderboard** - Not being populated
   - **Impact**: HIGH - Leaderboard feature non-functional
   - **Fix**: Add leaderboard calculation after test submission

3. **user_analytics** - Not being populated
   - **Impact**: MEDIUM - Analytics features incomplete
   - **Fix**: Add update logic after activities

### 🟡 **Medium Issues**

4. **test_attempts.percentile & rank** - Not calculated
   - **Impact**: MEDIUM - Missing ranking information
   - **Fix**: Calculate after test submission

5. **session_answers** - Table not used
   - **Impact**: LOW - Redundant table
   - **Fix**: Remove or repurpose

### ✅ **Working Correctly**

- **attempt_answers** - Properly populated during tests
- **session_stats** - Calculated by Edge Function
- **user_metrics** - Dual-save mechanism working

---

## Recommended Fixes

### Fix 1: Add missing column to practice_sessions
```sql
-- Migration: 025_add_incorrect_answers_to_practice_sessions.sql
ALTER TABLE practice_sessions
ADD COLUMN incorrect_answers INTEGER NOT NULL DEFAULT 0;
```

### Fix 2: Add leaderboard population logic
Create Edge Function or trigger to:
1. Calculate rankings after test submission
2. Calculate percentiles
3. Update leaderboard table for all period types

### Fix 3: Add user_analytics update logic
Create triggers or scheduled function to:
1. Update after test attempts
2. Update after practice sessions
3. Calculate weak areas and strengths
4. Track activity streaks

### Fix 4: Calculate percentile and rank
Add logic in test submission to:
1. Calculate user's percentile
2. Calculate user's rank
3. Update test_attempts table

### Fix 5: Handle session_answers table
Decision needed:
- Option A: Remove table (not used)
- Option B: Use it instead of user_metrics
- Option C: Keep for different purpose

---

## Data Flow Diagram

### Practice Session Flow
```
User Starts Practice
    ↓
practice_sessions (INSERT) ✅
    ↓
User Answers Questions
    ↓
user_metrics (INSERT per question) ✅
adaptive_state (UPDATE) ✅
    ↓
User Ends Session
    ↓
practice_sessions (UPDATE with stats) ✅
    ↓
Summary Page Loads
    ↓
session_stats (INSERT via Edge Function) ✅
user_analytics (UPDATE) ❌ MISSING
```

### Test Attempt Flow
```
User Starts Test
    ↓
test_attempts (INSERT) ✅
    ↓
User Answers Questions
    ↓
attempt_answers (UPSERT per question) ✅
    ↓
User Submits Test
    ↓
attempt_answers (UPDATE with correctness) ✅
test_attempts (UPDATE with score) ✅
leaderboard (INSERT/UPDATE) ❌ MISSING
user_analytics (UPDATE) ❌ MISSING
```

---

## Next Steps

1. ✅ **Immediate**: Add `incorrect_answers` column migration
2. ✅ **High Priority**: Implement leaderboard population
3. ✅ **High Priority**: Implement user_analytics updates
4. ⚠️ **Medium Priority**: Calculate percentile and rank
5. ⚠️ **Low Priority**: Decide on session_answers table

