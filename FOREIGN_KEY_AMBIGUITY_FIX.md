# Foreign Key Ambiguity Fix

## Root Cause Found! ✅

The redirect loop was caused by a **Supabase query error** (PGRST201):

```
"Could not embed because more than one relationship was found for 'questions' and 'subcategories'"
```

### The Problem

The `questions` table has **TWO foreign keys** pointing to `subcategories`:
1. `questions_subcategory_id_fkey` (the main/correct one)
2. `questions_new_subcategory_id_fkey` (probably from an old migration)

When we query:
```typescript
.select(`
  *,
  subcategory:subcategories(...)  // ❌ Ambiguous!
`)
```

Supabase doesn't know which foreign key to use, so it returns an error and **0 questions**.

With 0 questions, the attempt page redirects back to instructions → **redirect loop!**

## The Solution

Specify the **exact foreign key** to use:

```typescript
.select(`
  *,
  subcategory:subcategories!questions_subcategory_id_fkey(...)  // ✅ Explicit!
`)
```

## Files Fixed

### 1. `src/app/(student)/test/[testId]/attempt/page.tsx`
**Fixed both queries:**
- Custom test query (lines 57)
- Fallback query (line 92)

```typescript
// Before
subcategory:subcategories(...)

// After
subcategory:subcategories!questions_subcategory_id_fkey(...)
```

### 2. `src/app/(student)/test/[testId]/results/page.tsx`
**Fixed the answers query** (line 54)

```typescript
// Before
subcategory:subcategories(...)

// After
subcategory:subcategories!questions_subcategory_id_fkey(...)
```

## What the Logs Showed

From your console:
```
✅ Custom Test Data: {selected_question_ids: Array(10)}
✅ Found custom test with 10 question IDs
❌ Fetched 0 questions from questions table
❌ Questions Error: PGRST201 - relationship ambiguity
❌ NO QUESTIONS FOUND - REDIRECTING TO INSTRUCTIONS
```

**The custom_mock_tests record was created successfully!**
**The problem was the query couldn't fetch the questions due to the foreign key ambiguity.**

## Test Now

1. **Refresh your browser** (Ctrl+F5 or Cmd+Shift+R)
2. Go to the instructions page for your test
3. Click "Start Test Now"
4. **It should now load the test interface!** 🎉

## Why This Happened

You likely have a migration that:
1. Created a new `subcategory_id` column
2. Didn't drop the old foreign key constraint
3. Both constraints now exist in the database

## Optional: Clean Up Database

To prevent this issue in other parts of the app, you can drop the unused foreign key:

```sql
-- Check which foreign keys exist
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'questions'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_name = 'subcategories';

-- If you want to drop the unused one:
-- ALTER TABLE questions DROP CONSTRAINT questions_new_subcategory_id_fkey;
```

## Other Files That May Need This Fix

The following files also query `subcategory:subcategories(...)` and may have the same issue:
- `src/app/(student)/practice/page.tsx`
- `src/app/(admin)/admin/questions/page.tsx`
- `src/app/(student)/assignment/[testId]/active/[attemptId]/page.tsx`
- And 20+ other files

**For now, the critical path (mock test flow) is fixed!**

If you encounter the same error in other parts of the app, apply the same fix:
```typescript
subcategories!questions_subcategory_id_fkey
```

## Summary

✅ **Issue**: Foreign key ambiguity causing query to fail
✅ **Root Cause**: Two foreign keys from `questions` to `subcategories`
✅ **Solution**: Explicitly specify which foreign key to use
✅ **Status**: Mock test flow should now work!

**Try it now and let me know if the test interface loads!** 🚀
