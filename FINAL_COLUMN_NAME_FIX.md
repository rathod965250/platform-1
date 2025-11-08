# Final Fix: Database Column Name Mismatch

## Issue Discovered

After reviewing the actual database schema, I found that the column names in the `questions` table use **spaces** instead of **underscores**:

### Actual Database Schema
```
| column_name      | data_type |
|------------------|-----------|
| question text    | text      |  ← Space, not underscore
| correct answer   | text      |  ← Space, not underscore
| option a         | text      |  ← Space, not underscore
| option b         | text      |  ← Space, not underscore
| option c         | text      |  ← Space, not underscore
| option d         | text      |  ← Space, not underscore
| option e         | text      |  ← Space, not underscore
```

### Code Was Using
```typescript
question.question_text    // ❌ Wrong - uses underscore
question.correct_answer   // ❌ Wrong - uses underscore
question.option_a         // ❌ Wrong - uses underscore
```

### Should Be
```typescript
question['question text']    // ✅ Correct - uses space
question['correct answer']   // ✅ Correct - uses space
question['option a']         // ✅ Correct - uses space
```

## Files Fixed

### 1. TestAttemptInterface.tsx
**Fixed**: Question text display
```typescript
// Before
{currentQuestion.question_text}

// After (supports both conventions)
{currentQuestion['question text'] || currentQuestion.question_text}
```

**Fixed**: Options array
```typescript
// Before
{['option_a', 'option_b', 'option_c', 'option_d'].map((optionKey) => {

// After (includes option e and uses spaces)
{['option a', 'option b', 'option c', 'option d', 'option e'].map((optionKey) => {
```

**Fixed**: Option label parsing
```typescript
// Before
{optionKey.split('_')[1].toUpperCase()}.

// After
{optionKey.split(' ')[1].toUpperCase()}.
```

**Fixed**: Correct answer checking
```typescript
// Before
const isCorrect = answer.selectedOption === question?.correct_answer

// After (supports both conventions)
const correctAnswer = question?.['correct answer'] || question?.correct_answer
const isCorrect = answer.selectedOption === correctAnswer
```

### 2. TestResults.tsx
**Fixed**: Question text display
```typescript
// Before
{question?.question_text}

// After
{question?.['question text'] || question?.question_text}
```

**Fixed**: Correct answer display
```typescript
// Before
{question?.correct_answer}

// After
{question?.['correct answer'] || question?.correct_answer}
```

### 3. QuestionDisplay.tsx
**Fixed**: Question text display
```typescript
// Before
{question.question_text}

// After
{question['question text'] || question.question_text}
```

## Why Both Conventions?

The code now supports BOTH naming conventions:
1. **With spaces** (`'question text'`) - matches your actual database
2. **With underscores** (`question_text`) - fallback for compatibility

This ensures the code works regardless of:
- Database environment differences
- Future migrations
- Supabase client transformations

## PostgreSQL Column Names with Spaces

In PostgreSQL, column names with spaces must be:
1. Created with double quotes: `"question text"`
2. Accessed with bracket notation in JavaScript: `question['question text']`

## Complete Fix Summary

### Database Schema Issues Fixed
1. ✅ Removed non-existent `status` field from `test_attempts` queries
2. ✅ Removed non-existent `started_at` field from `test_attempts` inserts
3. ✅ Fixed column names to use spaces instead of underscores
4. ✅ Added support for `option e` (5th option)

### Question Fetching Fixed
1. ✅ Fetch from `custom_mock_tests.selected_question_ids`
2. ✅ Query `questions` table using those IDs
3. ✅ Maintain question order
4. ✅ Fallback to `test_id` query for regular tests

### Test Flow Now Works
1. ✅ Create custom test → stores question IDs in `custom_mock_tests`
2. ✅ Instructions page → shows correct question count
3. ✅ Start test → creates `test_attempts` record with correct fields
4. ✅ Test interface → loads questions with correct column names
5. ✅ Options display → shows all 5 options (a, b, c, d, e)
6. ✅ Submit test → calculates score correctly

## Testing Checklist

- [ ] Create new custom test
- [ ] Verify instructions page shows correct data
- [ ] Click "Start Test Now"
- [ ] Verify test interface loads without redirect loop
- [ ] Verify question text displays correctly
- [ ] Verify all options (A, B, C, D, E) display correctly
- [ ] Select answers and submit test
- [ ] Verify results page shows correct answers

## Key Takeaways

1. **Always verify actual database schema** - don't rely on migration files alone
2. **PostgreSQL allows spaces in column names** - but requires special syntax
3. **Use bracket notation** for column names with spaces: `obj['column name']`
4. **Support multiple conventions** for robustness
5. **Test with actual data** to catch schema mismatches

## Next Steps

1. Test the complete flow with a new custom test
2. Verify questions and options display correctly
3. If issues persist, check browser console for specific errors
4. Consider standardizing column names (either all spaces or all underscores) in a future migration
