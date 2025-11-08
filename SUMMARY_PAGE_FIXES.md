# Summary Page Card Calculation Fixes

## Issues Identified

### 1. **Attempted Count Calculation**
**Problem**: The "Attempted" card was showing incorrect values because it was using fallback calculations from `user_metrics` table instead of the accurate data from the Enhanced End Session Dialog.

**Root Cause**: 
- The summary page was calculating `attemptedCount` from `user_metrics` table by filtering `is_correct !== null`
- This calculation could be inconsistent with what was shown in the Enhanced End Session Dialog
- The Enhanced End Session Dialog had the correct count but wasn't storing it in the database

### 2. **Time Taken Display**
**Problem**: The "Time Taken" card was showing "0m" instead of the actual time spent.

**Root Cause**:
- The component was looking for `session.time_taken_seconds` which might not be populated
- Fallback to `sessionStats?.session_duration_seconds` also wasn't working
- The actual time data from Enhanced End Session Dialog wasn't being used

## Solutions Implemented

### 1. Database Schema Enhancement
**File**: `supabase/migrations/032_add_session_summary_table.sql`

Created `session_summary` table to store Enhanced End Session Dialog data:
- `attempted_count` - Exact count of attempted questions
- `correct_count` - Exact count of correct answers
- `incorrect_count` - Exact count of incorrect answers
- `skipped_count` - Exact count of skipped questions
- `unanswered_count` - Exact count of unanswered questions
- `marked_count` - Count of questions marked for review
- `total_time_seconds` - Total time spent in session
- `avg_time_per_question` - Average time per attempted question
- Difficulty breakdown with accuracy percentages
- Question status map (JSONB) for minimap reconstruction

### 2. Data Storage on Session End
**File**: `src/components/practice/AdaptivePracticeInterface.tsx`

Updated `handleConfirmEndSession` function to:
- Calculate all statistics exactly as shown in Enhanced End Session Dialog
- Save to `session_summary` table using `upsert` operation
- Include all counts, time statistics, and difficulty breakdown
- Build question status map for future minimap reconstruction

### 3. Summary Page Data Fetching
**File**: `src/app/(student)/practice/adaptive/[categoryId]/[sessionId]/summary/page.tsx`

Enhanced to:
- Fetch `session_summary` data from database
- **Prioritize** `session_summary` data over calculated values
- Fallback to calculation if `session_summary` not available
- Pass `sessionSummary` object to `PracticeSummary` component

### 4. PracticeSummary Component Updates
**File**: `src/components/practice/PracticeSummary.tsx`

**Changes Made**:

#### A. Data Source Prioritization (lines 130-151)
```typescript
// Use sessionSummary data if available (most accurate from Enhanced End Session Dialog)
const finalAttemptedCount = sessionSummary?.attempted_count ?? attemptedCount
const finalCorrectCount = sessionSummary?.correct_count ?? correctCount
const finalIncorrectCount = sessionSummary?.incorrect_count ?? incorrectCount
const finalSkippedCount = sessionSummary?.skipped_count ?? skippedCount
const finalNotAttemptedCount = sessionSummary?.unanswered_count ?? notAttemptedCount
const finalMarkedCount = sessionSummary?.marked_count ?? markedCount
```

**Benefits**:
- Uses `sessionSummary` data when available (most accurate)
- Falls back to calculated values for backward compatibility
- Ensures consistency with Enhanced End Session Dialog

#### B. Time Display Fix (lines 156-162, 376-378)
```typescript
// Use sessionSummary time data if available
const totalTimeSeconds = sessionSummary?.total_time_seconds 
  ?? session.time_taken_seconds 
  ?? sessionStats?.session_duration_seconds 
  ?? 0
const timeInMinutes = Math.floor(totalTimeSeconds / 60)
const timeInSeconds = totalTimeSeconds % 60

// Display format
{timeInMinutes > 0 ? `${timeInMinutes}m ${timeInSeconds}s` : `${totalTimeSeconds}s`}
```

**Benefits**:
- Shows actual time from Enhanced End Session Dialog
- Better formatting (shows minutes and seconds)
- Multiple fallback options for backward compatibility

#### C. Updated All Card Displays
- **Attempted Card** (line 428): Now uses `finalAttemptedCount`
- **Not Attempted Card** (line 437): Now uses `finalNotAttemptedCount`
- **Skipped Card** (line 446): Now uses `finalSkippedCount`
- **Correct Card** (line 455): Now uses `finalCorrectCount`
- **Incorrect Card** (line 464): Now uses `finalIncorrectCount`
- **Avg Time Card** (line 474): Now uses `sessionSummary?.avg_time_per_question ?? avgTime`
- **Accuracy Card** (line 369): Now uses `finalCorrectCount / finalAttemptedCount`
- **Time Taken Card** (line 377): Now shows minutes and seconds

#### D. Debug Logging (lines 138-151)
Added comprehensive console logging to verify data source:
```typescript
console.log('=== PRACTICE SUMMARY DATA SOURCE ===')
console.log('Using sessionSummary:', !!sessionSummary)
console.log('sessionSummary data:', sessionSummary)
console.log('Fallback data:', { attemptedCount, correctCount, ... })
console.log('Final counts:', { finalAttemptedCount, ... })
```

## How It Works

### Data Flow
1. **During Practice Session**:
   - User answers questions
   - Data saved to `user_metrics` table
   - Enhanced End Session Dialog calculates statistics

2. **On Session End**:
   - Enhanced End Session Dialog shows accurate statistics
   - User clicks "End Session"
   - `handleConfirmEndSession` saves data to:
     - `practice_sessions` table (existing)
     - **`session_summary` table (NEW)** - stores exact dialog data

3. **On Summary Page Load**:
   - Fetches `session_summary` data
   - Uses `session_summary` data if available (most accurate)
   - Falls back to calculation if not available
   - Displays consistent statistics

### Calculation Logic

#### Attempted Count
**Before**: 
```typescript
const attemptedCount = metrics?.filter(m => m.is_correct !== null).length || 0
```
- Calculated from `user_metrics` table
- Could be inconsistent

**After**:
```typescript
const finalAttemptedCount = sessionSummary?.attempted_count ?? attemptedCount
```
- Uses exact count from Enhanced End Session Dialog
- Stored in `session_summary.attempted_count`
- Falls back to calculation if not available

#### Time Display
**Before**:
```typescript
const timeInMinutes = session.time_taken_seconds 
  ? Math.floor(session.time_taken_seconds / 60) 
  : 0
// Display: {timeInMinutes}m
```
- Often showed "0m" because `session.time_taken_seconds` was not set
- No seconds display

**After**:
```typescript
const totalTimeSeconds = sessionSummary?.total_time_seconds 
  ?? session.time_taken_seconds 
  ?? 0
const timeInMinutes = Math.floor(totalTimeSeconds / 60)
const timeInSeconds = totalTimeSeconds % 60
// Display: {timeInMinutes}m {timeInSeconds}s
```
- Uses exact time from Enhanced End Session Dialog
- Shows both minutes and seconds
- Multiple fallback options

## Testing Instructions

### 1. Apply Database Migration
```bash
supabase db push
```

### 2. Test Complete Flow
1. Start a practice session
2. Answer some questions (mix of correct/incorrect/skipped)
3. Mark some questions for review
4. Click "End Session"
5. **Verify Enhanced End Session Dialog** shows:
   - Correct count of attempted questions
   - Correct count of correct/incorrect/skipped
   - Actual time spent
6. Click "End Session" in dialog
7. **Verify Summary Page** shows:
   - Same counts as Enhanced End Session Dialog
   - Actual time spent (not "0m")
   - Consistent percentages

### 3. Verify in Browser Console
Open browser console and look for:
```
=== PRACTICE SUMMARY DATA SOURCE ===
Using sessionSummary: true
sessionSummary data: { attempted_count: 24, correct_count: 18, ... }
Final counts: { finalAttemptedCount: 24, ... }
```

### 4. Verify in Database
```sql
-- Check session_summary data
SELECT 
  session_id,
  attempted_count,
  correct_count,
  incorrect_count,
  skipped_count,
  unanswered_count,
  total_time_seconds,
  avg_time_per_question
FROM session_summary
ORDER BY created_at DESC
LIMIT 5;
```

## Expected Results

### Before Fix
- **Attempted**: Might show incorrect count (e.g., 20 instead of 24)
- **Time Taken**: Shows "0m"
- **Inconsistency**: Summary page ≠ Enhanced End Session Dialog

### After Fix
- **Attempted**: Shows exact count from Enhanced End Session Dialog (e.g., 24)
- **Time Taken**: Shows actual time (e.g., "5m 23s")
- **Consistency**: Summary page = Enhanced End Session Dialog
- **All cards**: Use accurate data from `session_summary` table

## Backward Compatibility

The implementation maintains backward compatibility:
- If `session_summary` data exists → Use it (most accurate)
- If `session_summary` data doesn't exist → Calculate from `user_metrics` (fallback)
- Old sessions without `session_summary` will still work
- New sessions will have accurate data

## Benefits

1. **Data Accuracy**: Summary page shows exact same data as Enhanced End Session Dialog
2. **Performance**: No complex calculations on summary page load
3. **Consistency**: Single source of truth for session statistics
4. **User Experience**: Users see consistent data throughout the flow
5. **Debugging**: Console logs help identify data source issues
6. **Future-Proof**: Question status map enables minimap reconstruction

## Files Modified

1. `supabase/migrations/032_add_session_summary_table.sql` - New migration
2. `src/components/practice/AdaptivePracticeInterface.tsx` - Save session summary
3. `src/app/(student)/practice/adaptive/[categoryId]/[sessionId]/summary/page.tsx` - Fetch session summary
4. `src/components/practice/PracticeSummary.tsx` - Use session summary data
5. `ENHANCED_END_SESSION_IMPLEMENTATION.md` - Documentation
6. `SUMMARY_PAGE_FIXES.md` - This document

## Troubleshooting

### Issue: Still showing "0m" for time
**Check**:
1. Browser console: Is `sessionSummary` data present?
2. Database: Does `session_summary` table have data for this session?
3. Migration: Was the migration applied successfully?

### Issue: Attempted count still wrong
**Check**:
1. Browser console: What does `finalAttemptedCount` show?
2. Browser console: Is `Using sessionSummary: true`?
3. Database: Check `session_summary.attempted_count` value

### Issue: No sessionSummary data
**Solution**:
1. Re-end the session (click "End Session" again)
2. The `upsert` operation will create/update the data
3. Refresh the summary page

## Conclusion

These fixes ensure that the summary page displays accurate, consistent data by:
- Storing Enhanced End Session Dialog data in the database
- Prioritizing stored data over calculated values
- Maintaining backward compatibility
- Providing clear debugging information

The "Attempted" count and "Time Taken" cards now show the correct values from the Enhanced End Session Dialog.
