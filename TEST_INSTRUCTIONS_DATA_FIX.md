# Test Instructions Data Display Fix - Complete

## Issue
The Test Instructions page was showing:
- **Questions**: 0 (incorrect)
- **Duration**: 90 min (correct from test data)
- **Total Marks**: 60 (correct from test data)

The questions count was showing 0 because the system wasn't properly fetching the selected questions from the custom mock test.

## Root Cause
When a user creates a custom mock test:
1. The `MockTestBuilder` stores the selected question IDs in the `custom_mock_tests` table
2. The `custom_mock_tests` table has:
   - `selected_question_ids`: Array of question IDs selected for this test
   - `total_questions`: Count of questions
3. The instructions page was only querying the `questions` table with `test_id`, but custom tests don't update the `test_id` field on questions (to avoid modifying original questions)

## Solution
Updated both the **instructions page** and **attempt page** to:
1. First check if this is a custom test by querying `custom_mock_tests`
2. If custom test exists, use `selected_question_ids` to fetch the exact questions
3. Fallback to regular `test_id` query for non-custom tests

## Files Modified

### 1. `/src/app/(student)/test/[testId]/instructions/page.tsx`

**Changes:**
```typescript
// Added query to custom_mock_tests table
const { data: customTest } = await supabase
  .from('custom_mock_tests')
  .select('total_questions, selected_question_ids')
  .eq('test_id', testId)
  .eq('user_id', user.id)
  .single()

// Use custom test data if available
let questionsCount = 0
if (customTest && customTest.selected_question_ids) {
  questionsCount = customTest.selected_question_ids.length
} else {
  // Fallback to counting questions in the questions table
  const { count } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true })
    .eq('test_id', testId)
  questionsCount = count || 0
}
```

### 2. `/src/app/(student)/test/[testId]/attempt/page.tsx`

**Changes:**
```typescript
// Try to get questions from custom_mock_tests first
const { data: customTest } = await supabase
  .from('custom_mock_tests')
  .select('selected_question_ids')
  .eq('test_id', testId)
  .eq('user_id', user.id)
  .single()

let questions: any[] = []

if (customTest && customTest.selected_question_ids && customTest.selected_question_ids.length > 0) {
  // Fetch questions by IDs from custom test
  const { data: customQuestions } = await supabase
    .from('questions')
    .select(`
      *,
      subcategory:subcategories(
        id,
        name,
        category:categories(id, name)
      )
    `)
    .in('id', customTest.selected_question_ids)
  
  // Maintain the order of selected_question_ids
  questions = customTest.selected_question_ids
    .map((id: string) => customQuestions.find((q: any) => q.id === id))
    .filter(Boolean)
} else {
  // Fallback to fetching by test_id for regular tests
  // ... regular query
}
```

## Data Flow

### Custom Mock Test Creation (MockTestBuilder)
1. User selects categories, subcategories, difficulty, question count, and duration
2. System creates test record in `tests` table:
   - `duration_minutes`: From user input (hours * 60 + minutes)
   - `total_marks`: Equal to number of questions (1 mark per question)
3. System creates record in `custom_mock_tests` table:
   - `selected_question_ids`: Array of selected question IDs
   - `total_questions`: Count of questions
   - `duration_hours` and `duration_minutes`: Original user input

### Test Instructions Display
Now correctly shows:
- **Questions**: From `custom_mock_tests.selected_question_ids.length`
- **Duration**: From `tests.duration_minutes` (converted from hours + minutes)
- **Total Marks**: From `tests.total_marks` (equals question count, 1 mark per question)

### Test Attempt
- Fetches questions using `selected_question_ids` from `custom_mock_tests`
- Maintains the order of questions as they were selected
- Each question is worth 1 mark (standard for aptitude tests)

## Benefits
1. ✅ Correct question count displayed on instructions page
2. ✅ Correct duration displayed (from user's custom input)
3. ✅ Correct total marks displayed (1 mark per question)
4. ✅ Questions are fetched in the correct order
5. ✅ Original questions in database remain unmodified
6. ✅ Supports both custom tests and regular tests

## Marks Calculation
- Each question is worth **1 mark** (standard for aptitude tests)
- Total marks = Number of questions
- This is set in `MockTestBuilder.tsx` line 308:
  ```typescript
  total_marks: selectedQuestions.length
  ```

## Verification Steps
1. Go to `/test/mock`
2. Select categories, subcategories, difficulty
3. Set custom question count (e.g., 60)
4. Set custom duration (e.g., 1 hour 30 minutes)
5. Click "Generate & Start Test"
6. Verify instructions page shows:
   - ✅ Questions: 60
   - ✅ Duration: 90 min
   - ✅ Total Marks: 60
7. Click "Start Test Now"
8. Verify 60 questions are loaded in the test interface

## Database Schema Reference

### `tests` table
- `duration_minutes`: INT (total duration in minutes)
- `total_marks`: INT (total marks for the test)

### `custom_mock_tests` table
- `selected_question_ids`: UUID[] (array of question IDs)
- `total_questions`: INT (count of questions)
- `duration_hours`: INT (user input hours)
- `duration_minutes`: INT (user input minutes)

### `questions` table
- Each question has its own marks field (typically 1 for aptitude tests)
- Questions are not modified when used in custom tests
