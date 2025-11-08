# Enhanced End Session Dialog - Database Implementation

## Overview
This document describes the implementation of storing Enhanced End Session Dialog data in the database for easy retrieval on the summary page.

## Problem Statement
Previously, the Enhanced End Session Dialog displayed comprehensive statistics (correct/incorrect/skipped/unanswered/marked counts, difficulty breakdown, question minimap) but this data was NOT stored in the database. The summary page had to recalculate everything from `user_metrics` table, leading to:
- Inconsistent data between dialog and summary page
- Complex calculations on every page load
- Potential data loss if calculations failed

## Solution Architecture

### 1. Database Schema
Created a new `session_summary` table to store all Enhanced End Session Dialog data:

**File**: `supabase/migrations/032_add_session_summary_table.sql`

**Key Columns**:
- `session_id` - Reference to practice_sessions (UNIQUE)
- `user_id` - Reference to profiles
- `correct_count`, `incorrect_count`, `skipped_count`, `unanswered_count`, `marked_count` - Basic counts
- `attempted_count` - Total attempted questions
- `total_time_seconds`, `avg_time_per_question` - Time statistics
- `easy_total`, `easy_correct`, `easy_accuracy` - Easy difficulty breakdown
- `medium_total`, `medium_correct`, `medium_accuracy` - Medium difficulty breakdown
- `hard_total`, `hard_correct`, `hard_accuracy` - Hard difficulty breakdown
- `overall_accuracy` - Overall accuracy percentage
- `question_status_map` - JSONB map storing question-level details for minimap reconstruction

**Benefits**:
- Single source of truth for session statistics
- Fast retrieval (no complex calculations)
- Preserves exact state shown in Enhanced End Session Dialog
- Supports minimap reconstruction with full question status

### 2. Data Flow

#### A. During Practice Session
1. User answers questions → Data stored in `user_metrics` table
2. User clicks "End Session" → Enhanced End Session Dialog appears
3. Dialog calculates and displays:
   - Correct/Incorrect/Skipped/Unanswered/Marked counts
   - Average time per question
   - Difficulty breakdown (Easy/Medium/Hard with accuracy)
   - Question minimap with color-coded status

#### B. On Session End Confirmation
**File**: `src/components/practice/AdaptivePracticeInterface.tsx`
**Function**: `handleConfirmEndSession` (lines 945-1132)

The function now:
1. Calculates all Enhanced End Session Dialog statistics
2. Saves to `practice_sessions` table (existing behavior)
3. **NEW**: Saves to `session_summary` table with:
   - All counts (correct, incorrect, skipped, unanswered, marked)
   - Time statistics (total time, average time)
   - Difficulty breakdown with accuracy percentages
   - Question status map (JSONB) containing:
     ```json
     {
       "question_id": {
         "index": 1,
         "status": "correct|incorrect|skipped|unanswered",
         "is_marked": true|false,
         "time_spent": 45,
         "difficulty": "easy|medium|hard",
         "subcategory": "Topic Name"
       }
     }
     ```

#### C. On Summary Page Load
**File**: `src/app/(student)/practice/adaptive/[categoryId]/[sessionId]/summary/page.tsx`

The page now:
1. Fetches `session_summary` data (lines 42-54)
2. **Prioritizes** `session_summary` data over calculated values (lines 621-647)
3. Falls back to calculation if `session_summary` is not available
4. Passes `sessionSummary` to `PracticeSummary` component

**File**: `src/components/practice/PracticeSummary.tsx`

Updated to:
1. Accept `sessionSummary` prop (line 44)
2. Accept `markedCount` prop (line 93)
3. Can use `sessionSummary.question_status_map` for minimap reconstruction (future enhancement)

## Key Features

### 1. Exact Data Preservation
The `session_summary` table stores the EXACT data shown in the Enhanced End Session Dialog, ensuring consistency between:
- What the user sees when ending the session
- What the user sees on the summary page

### 2. Question Status Map
The `question_status_map` JSONB column stores detailed information for each question:
- Question index (for ordering)
- Status (correct/incorrect/skipped/unanswered)
- Marked for review flag
- Time spent on question
- Difficulty level
- Subcategory/topic name

This enables:
- Exact minimap reconstruction on summary page
- Question-level analysis
- Detailed performance tracking

### 3. Performance Optimization
- No complex calculations on summary page load
- Single database query to fetch all statistics
- Indexed for fast retrieval

### 4. Data Integrity
- UNIQUE constraint on `session_id` prevents duplicates
- `upsert` operation allows re-ending session without errors
- RLS policies ensure users can only access their own data

## Migration Instructions

### 1. Apply Database Migration
```bash
# Run the migration
supabase migration up

# Or if using Supabase CLI
supabase db push
```

### 2. Verify Migration
```sql
-- Check if table exists
SELECT * FROM session_summary LIMIT 1;

-- Check indexes
SELECT indexname FROM pg_indexes WHERE tablename = 'session_summary';

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'session_summary';
```

### 3. Test the Implementation
1. Start a practice session
2. Answer some questions (mix of correct/incorrect/skipped)
3. Mark some questions for review
4. Click "End Session"
5. Verify Enhanced End Session Dialog shows correct statistics
6. Click "End Session" button in dialog
7. Navigate to summary page
8. Verify summary page shows same statistics as dialog

### 4. Verify Data in Database
```sql
-- Check session_summary data
SELECT 
  session_id,
  correct_count,
  incorrect_count,
  skipped_count,
  unanswered_count,
  marked_count,
  overall_accuracy,
  easy_accuracy,
  medium_accuracy,
  hard_accuracy
FROM session_summary
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC
LIMIT 5;

-- Check question status map
SELECT 
  session_id,
  jsonb_pretty(question_status_map) as status_map
FROM session_summary
WHERE session_id = 'YOUR_SESSION_ID';
```

## Future Enhancements

### 1. Minimap Reconstruction
Use `question_status_map` to reconstruct the exact question minimap on the summary page, showing:
- Question numbers with color-coded status
- Marked questions indicator
- Time spent per question
- Click to view question details

### 2. Session Comparison
Compare multiple sessions using stored `session_summary` data:
- Track improvement over time
- Identify patterns in mistakes
- Analyze time management trends

### 3. Analytics Dashboard
Use `session_summary` data for:
- Aggregate statistics across sessions
- Performance trends visualization
- Difficulty progression tracking

### 4. Export Functionality
Export session data including:
- Summary statistics
- Question-level details from status map
- Performance analysis

## Troubleshooting

### Issue: session_summary data not saved
**Symptoms**: Summary page shows "Using fallback calculation" in console

**Solutions**:
1. Check if migration was applied: `SELECT * FROM session_summary LIMIT 1;`
2. Check browser console for errors during session end
3. Verify RLS policies allow insert: `SELECT * FROM pg_policies WHERE tablename = 'session_summary';`
4. Check user authentication status

### Issue: Inconsistent data between dialog and summary
**Symptoms**: Numbers don't match between Enhanced End Session Dialog and summary page

**Solutions**:
1. Verify `session_summary` data was saved: Check database
2. Ensure summary page is using `sessionSummary` data (check console logs)
3. Clear browser cache and reload
4. Re-end the session (upsert will update data)

### Issue: Missing marked_count on summary page
**Symptoms**: Marked questions count shows 0 or is missing

**Solutions**:
1. Verify `markedCount` prop is passed to `PracticeSummary` component
2. Check if `marked_count` is saved in `session_summary` table
3. Ensure `markedQuestions` Set is populated during practice session

## Code References

### Database Migration
- `supabase/migrations/032_add_session_summary_table.sql`

### Frontend Components
- `src/components/practice/AdaptivePracticeInterface.tsx` (lines 945-1132)
- `src/app/(student)/practice/adaptive/[categoryId]/[sessionId]/summary/page.tsx` (lines 42-670)
- `src/components/practice/PracticeSummary.tsx` (lines 41-119)

### Key Functions
- `handleConfirmEndSession()` - Saves Enhanced End Session Dialog data
- Summary page data fetching - Retrieves and prioritizes `session_summary` data

## Testing Checklist

- [ ] Database migration applied successfully
- [ ] Table `session_summary` exists with correct schema
- [ ] RLS policies are active and working
- [ ] Practice session can be completed
- [ ] Enhanced End Session Dialog shows correct statistics
- [ ] Session data is saved to `session_summary` table
- [ ] Summary page fetches `session_summary` data
- [ ] Summary page shows same statistics as dialog
- [ ] Marked questions count is displayed correctly
- [ ] Question status map is populated in database
- [ ] Console logs show "Using session_summary data"
- [ ] Fallback works if `session_summary` is not available

## Conclusion

This implementation provides a robust solution for storing and retrieving Enhanced End Session Dialog data. The `session_summary` table serves as a single source of truth, ensuring data consistency and improving performance on the summary page.

The question status map enables future enhancements like minimap reconstruction and detailed question-level analysis, making this a scalable solution for comprehensive practice session tracking.
