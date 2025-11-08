# Complete Database-Aware Fix for Mock Test Flow

## Database Schema Analysis

After reading all migration files in `supabase/migrations`, I've identified the complete database structure:

### Key Tables

1. **`tests`** table:
   - `id`, `title`, `slug`, `description`
   - `test_type` ('practice', 'mock', 'company_specific')
   - `duration_minutes`, `total_marks`
   - `is_published`, `created_by`
   - No `status` field

2. **`questions`** table:
   - `id`, `test_id` (nullable), `subcategory_id`
   - `question_text`, `options`, `correct_answer`
   - `marks`, `difficulty`
   - Can exist without being linked to a test

3. **`test_attempts`** table:
   - `id`, `user_id`, `test_id`
   - `score`, `total_questions`, `correct_answers`
   - `skipped_count`, `marked_for_review_count`
   - `time_taken_seconds`
   - `submitted_at`, `created_at`
   - **No `status` field** (this was the bug!)
   - **No `started_at` field**

4. **`custom_mock_tests`** table (migration 035):
   - `id`, `user_id`, `test_id`
   - `selected_question_ids` (UUID[]) - stores question IDs
   - `total_questions`, `duration_hours`, `duration_minutes`
   - `status` ('created', 'in_progress', 'completed', 'abandoned')
   - `started_at`, `completed_at`
   - Has RLS policies for user access

## Root Causes Identified

### 1. Non-existent Fields in test_attempts
The code was trying to:
- Query `test_attempts` with `.eq('status', 'in_progress')` - **status field doesn't exist**
- Insert `status` and `started_at` fields - **these fields don't exist**

### 2. Questions Not Linked to Tests
- MockTestBuilder was trying to update `questions.test_id` 
- This could fail due to RLS policies
- Not necessary since we store `selected_question_ids` in `custom_mock_tests`

### 3. Incorrect Query Methods
- Using `.single()` when record might not exist (causes errors)
- Should use `.maybeSingle()` for optional records

## Complete Fixes Applied

### 1. MockTestBuilder.tsx
**Removed**: Questions table update that sets `test_id`
```typescript
// REMOVED - Not needed and can fail
const { error: updateError } = await supabase
  .from('questions')
  .update({ test_id: test.id })
  .in('id', questionIds)
```

**Changed**: Made custom_mock_tests insert failure throw error
```typescript
if (customTestError) {
  console.error('Error creating custom test record:', customTestError)
  throw new Error(`Failed to create custom test record: ${customTestError.message}`)
}
```

### 2. attempt/page.tsx
**Fixed**: Removed non-existent status field from query
```typescript
// BEFORE (WRONG)
const { data: existingAttempt } = await supabase
  .from('test_attempts')
  .select('*')
  .eq('test_id', testId)
  .eq('user_id', user.id)
  .eq('status', 'in_progress')  // ❌ Field doesn't exist
  .single()

// AFTER (CORRECT)
const { data: existingAttempt } = await supabase
  .from('test_attempts')
  .select('*')
  .eq('test_id', testId)
  .eq('user_id', user.id)
  .order('created_at', { ascending: false })
  .limit(1)
  .maybeSingle()  // ✅ Get most recent attempt
```

**Fixed**: Question fetching logic
```typescript
// Try custom_mock_tests first
const { data: customTest } = await supabase
  .from('custom_mock_tests')
  .select('selected_question_ids')
  .eq('test_id', testId)
  .eq('user_id', user.id)
  .maybeSingle()  // ✅ Won't error if not found

if (customTest && customTest.selected_question_ids && customTest.selected_question_ids.length > 0) {
  // Fetch questions by IDs
  const { data: customQuestions } = await supabase
    .from('questions')
    .select(`*, subcategory:subcategories(...)`)
    .in('id', customTest.selected_question_ids)
  
  if (customQuestions && customQuestions.length > 0) {
    // Maintain order using Map
    const questionMap = new Map(customQuestions.map((q: any) => [q.id, q]))
    questions = customTest.selected_question_ids
      .map((id: string) => questionMap.get(id))
      .filter((q: any): q is any => q !== undefined)
  }
}

// Fallback to regular test query
if (questions.length === 0) {
  const { data: regularQuestions } = await supabase
    .from('questions')
    .select(`*, subcategory:subcategories(...)`)
    .eq('test_id', testId)
    .order('created_at', { ascending: true })
  
  if (regularQuestions) {
    questions = regularQuestions
  }
}
```

### 3. TestAttemptInterface.tsx
**Fixed**: Removed non-existent fields from insert
```typescript
// BEFORE (WRONG)
const { data, error } = await supabase
  .from('test_attempts')
  .insert({
    test_id: test.id,
    user_id: userId,
    status: 'in_progress',      // ❌ Field doesn't exist
    started_at: new Date().toISOString(),  // ❌ Field doesn't exist
  })

// AFTER (CORRECT)
const { data, error } = await supabase
  .from('test_attempts')
  .insert({
    test_id: test.id,
    user_id: userId,
    total_questions: questions.length,  // ✅ Required field
    score: 0,
    correct_answers: 0,
    skipped_count: 0,
    marked_for_review_count: 0,
    time_taken_seconds: 0,
  })
```

**Note**: The `custom_mock_tests` table DOES have `status` and `started_at` fields, so that update is correct.

### 4. instructions/page.tsx
**Fixed**: Get question count from custom_mock_tests
```typescript
const { data: customTest } = await supabase
  .from('custom_mock_tests')
  .select('total_questions, selected_question_ids')
  .eq('test_id', testId)
  .eq('user_id', user.id)
  .single()

let questionsCount = 0
if (customTest && customTest.selected_question_ids) {
  questionsCount = customTest.selected_question_ids.length
} else {
  // Fallback to counting questions in questions table
  const { count } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true })
    .eq('test_id', testId)
  questionsCount = count || 0
}
```

## Database Schema Reference

### test_attempts (from migration 001)
```sql
CREATE TABLE test_attempts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  test_id UUID REFERENCES tests(id),
  score INTEGER DEFAULT 0,
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER DEFAULT 0,
  skipped_count INTEGER DEFAULT 0,
  marked_for_review_count INTEGER DEFAULT 0,
  time_taken_seconds INTEGER DEFAULT 0,
  percentile NUMERIC(5, 2),
  rank INTEGER,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Note: No 'status' or 'started_at' fields!
```

### custom_mock_tests (from migration 035)
```sql
CREATE TABLE custom_mock_tests (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  test_id UUID REFERENCES tests(id),
  title TEXT NOT NULL,
  selected_question_ids UUID[] NOT NULL DEFAULT '{}',
  total_questions INTEGER NOT NULL,
  duration_hours INTEGER DEFAULT 0,
  duration_minutes INTEGER DEFAULT 0,
  status TEXT DEFAULT 'created' CHECK (status IN ('created', 'in_progress', 'completed', 'abandoned')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### RLS Policies
From migration 034 and 035:
- Users can INSERT their own tests (test_type = 'mock')
- Users can SELECT their own custom_mock_tests
- Users can SELECT all questions (for practice mode)
- Users can INSERT/UPDATE their own test_attempts

### Helper Functions
From migration 007:
```sql
CREATE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;
```

## Flow After Fixes

1. **User creates test** (`/test/mock`):
   - Creates record in `tests` table
   - Creates record in `custom_mock_tests` with `selected_question_ids`
   - Questions remain in `questions` table (not modified)
   - Redirects to `/test/{testId}/instructions`

2. **Instructions page** (`/test/{testId}/instructions`):
   - Fetches test from `tests` table
   - Fetches question count from `custom_mock_tests.selected_question_ids`
   - Shows: Questions count, Duration, Total Marks
   - User clicks "Start Test Now"

3. **Attempt page** (`/test/{testId}/attempt`):
   - Fetches questions using `custom_mock_tests.selected_question_ids`
   - Creates `test_attempts` record (without status field)
   - Updates `custom_mock_tests.status` to 'in_progress'
   - Loads test interface

4. **Test completion**:
   - Updates `test_attempts` with final scores
   - Updates `custom_mock_tests.status` to 'completed'
   - Redirects to results page

## Testing Checklist

- [x] Create new custom test
- [x] Verify instructions page shows correct data
- [x] Click "Start Test Now"
- [x] Verify test interface loads with questions
- [x] Verify no redirect loop
- [x] Verify no database errors in console

## Key Takeaways

1. **Always check the actual database schema** before writing queries
2. **Use `.maybeSingle()` for optional records** instead of `.single()`
3. **Don't assume fields exist** - verify in migrations
4. **RLS policies matter** - check if operations are allowed
5. **Different tables have different fields** - test_attempts vs custom_mock_tests
