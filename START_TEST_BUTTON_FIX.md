# Start Test Button Redirect Loop Fix

## Issue
After clicking "Start Test Now" button on the instructions page, the user is redirected back to the instructions page instead of proceeding to the test interface. This creates a redirect loop.

## Root Cause
The test attempt page (`/test/[testId]/attempt`) is unable to find questions for the test and redirects back to instructions. This happens because:

1. The `MockTestBuilder` creates a record in `custom_mock_tests` table with `selected_question_ids`
2. If the `custom_mock_tests` insert fails silently, there's no record to fetch questions from
3. The fallback query to `questions` table by `test_id` also returns no results because questions aren't linked to the test

## Changes Made

### 1. MockTestBuilder.tsx
**Removed**: The code that updates questions table to set `test_id` (lines 325-330)
- This was causing issues and wasn't necessary since we store `selected_question_ids`

**Changed**: Made `custom_mock_tests` insert failure throw an error instead of silently continuing
```typescript
if (customTestError) {
  console.error('Error creating custom test record:', customTestError)
  throw new Error(`Failed to create custom test record: ${customTestError.message}`)
}
```

### 2. attempt/page.tsx
**Simplified**: The question fetching logic
- Use `maybeSingle()` instead of `single()` to avoid errors when no record exists
- Better null checking
- Cleaner fallback logic

```typescript
const { data: customTest } = await supabase
  .from('custom_mock_tests')
  .select('selected_question_ids')
  .eq('test_id', testId)
  .eq('user_id', user.id)
  .maybeSingle()

if (customTest && customTest.selected_question_ids && customTest.selected_question_ids.length > 0) {
  // Fetch questions by IDs
  const { data: customQuestions } = await supabase
    .from('questions')
    .select(`*,subcategory:subcategories(...)`)
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
    .select(`*,subcategory:subcategories(...)`)
    .eq('test_id', testId)
    .order('created_at', { ascending: true })
  
  if (regularQuestions) {
    questions = regularQuestions
  }
}
```

## Potential Issues to Check

### 1. RLS Policies
The `custom_mock_tests` table has RLS enabled. Check if:
- User can INSERT into `custom_mock_tests`
- User can SELECT from `custom_mock_tests`

Policies should be:
```sql
-- INSERT policy
CREATE POLICY "Users can create their own custom mock tests" 
ON custom_mock_tests FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- SELECT policy
CREATE POLICY "Users can view their own custom mock tests" 
ON custom_mock_tests FOR SELECT 
USING (user_id = auth.uid() OR is_admin());
```

### 2. is_admin() Function
The SELECT policy references `is_admin()` function. Verify this function exists:
```sql
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 3. Database Constraints
Check if the `custom_mock_tests` insert is failing due to:
- NOT NULL constraints
- CHECK constraints
- Foreign key constraints

## Testing Steps

1. **Create a new test**:
   - Go to `/test/mock`
   - Select categories and subcategories
   - Set question count and duration
   - Click "Generate & Start Test"

2. **Check if test is created**:
   - Open browser console
   - Look for any errors during test creation
   - Verify redirect to instructions page

3. **Check instructions page**:
   - Verify questions count is correct (not 0)
   - Verify duration is correct
   - Verify total marks is correct

4. **Start the test**:
   - Check "I have read and understood" checkbox
   - Click "Start Test Now"
   - Should redirect to `/test/{testId}/attempt`
   - Should NOT redirect back to instructions

5. **Verify questions load**:
   - Test interface should show questions
   - Navigation panel should show all questions
   - Timer should start

## Debug Commands

### Check if custom_mock_tests record exists
```sql
SELECT * FROM custom_mock_tests 
WHERE test_id = 'YOUR_TEST_ID' 
AND user_id = 'YOUR_USER_ID';
```

### Check selected_question_ids
```sql
SELECT selected_question_ids, array_length(selected_question_ids, 1) as count
FROM custom_mock_tests 
WHERE test_id = 'YOUR_TEST_ID';
```

### Check if questions exist
```sql
SELECT COUNT(*) FROM questions 
WHERE id = ANY(
  SELECT unnest(selected_question_ids) 
  FROM custom_mock_tests 
  WHERE test_id = 'YOUR_TEST_ID'
);
```

### Check RLS policies
```sql
SELECT * FROM pg_policies 
WHERE tablename = 'custom_mock_tests';
```

## Next Steps

If the issue persists:

1. **Add server-side logging**: Check the Next.js server logs for any Supabase errors
2. **Check browser network tab**: Look for failed API requests
3. **Verify database data**: Ensure `custom_mock_tests` record is actually created
4. **Test RLS policies**: Try disabling RLS temporarily to see if that's the issue
5. **Check Supabase logs**: Go to Supabase dashboard > Logs to see any database errors

## Expected Behavior After Fix

1. User creates custom test → Test and custom_mock_tests records created
2. User sees instructions page → Shows correct question count, duration, marks
3. User clicks "Start Test Now" → Redirects to attempt page
4. Attempt page loads questions from custom_mock_tests.selected_question_ids
5. User sees test interface with all questions loaded
6. User can take the test normally
