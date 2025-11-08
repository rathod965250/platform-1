# User Progress Tracking & Recommendation System

## 📊 Overview

This document explains the comprehensive database architecture for tracking user progress and generating personalized recommendations in the "What's Next?" section.

## 🗄️ Database Tables

### Existing Tables (Already in Use)

#### 1. **`practice_sessions`**
- **Purpose**: Stores each practice session
- **Key Fields**: 
  - `total_questions`, `correct_answers`, `incorrect_answers`
  - `time_taken_seconds`, `completed_at`
  - Difficulty breakdowns: `easy_questions`, `easy_correct`, etc.
- **Usage**: Historical session tracking

#### 2. **`session_summary`** ✨ NEW
- **Purpose**: Enhanced session statistics from End Session Dialog
- **Key Fields**:
  - All question counts: `correct_count`, `incorrect_count`, `skipped_count`, `unanswered_count`, `marked_count`
  - Difficulty stats: `easy_total`, `easy_correct`, `easy_accuracy`
  - `question_status_map`: JSONB with detailed question states
- **Usage**: Accurate session data for difficulty breakdown

#### 3. **`user_metrics`**
- **Purpose**: Logs every question attempt
- **Key Fields**:
  - `is_correct`, `time_taken`, `difficulty`
  - `question_id` with relation to `questions(question_topic)`
- **Usage**: Granular question-level analytics

#### 4. **`topic_mastery`**
- **Purpose**: Lifetime topic-level mastery tracking
- **Key Fields**:
  - `topic_name`, `current_accuracy`, `mastery_level`
  - `total_attempts`, `total_correct`, `current_streak`
  - Difficulty breakdown: `easy_attempts`, `easy_correct`, etc.
- **Usage**: Track mastery progression per topic

#### 5. **`performance_analysis`**
- **Purpose**: Session-level performance by topic/subcategory
- **Key Fields**:
  - `accuracy_percentage`, `error_rate`
  - `is_weak_area`, `is_strong_area`, `confidence_score`
  - Difficulty breakdown per topic
- **Usage**: Identify weak/strong areas per session

### New Table (Recommended)

#### 6. **`user_progress_summary`** ⭐ NEW
- **Purpose**: Rolling 30-day summary for FAST recommendations
- **Key Fields**:
  ```sql
  -- Overall stats (30 days)
  total_sessions INTEGER
  total_questions_attempted INTEGER
  overall_accuracy NUMERIC(5, 2)
  
  -- Difficulty progression
  easy_accuracy, medium_accuracy, hard_accuracy
  
  -- Pre-calculated topic lists (JSONB)
  weak_topics JSONB  -- Top 5 weak topics
  improving_topics JSONB  -- Top 3 improving topics
  strong_topics JSONB  -- Top 3 strong topics
  
  -- Practice patterns
  practice_streak_days INTEGER
  avg_sessions_per_week NUMERIC
  last_practice_date TIMESTAMP
  
  -- Recommendation flags
  needs_difficulty_progression BOOLEAN
  ready_for_hard_questions BOOLEAN
  ```

## 🔄 Data Flow

### When User Ends a Practice Session:

```
1. User clicks "End Session"
   ↓
2. Save to `practice_sessions` table
   ↓
3. Save to `session_summary` table (Enhanced stats)
   ↓
4. Call `update_user_progress_summary()` function
   ↓
5. Function aggregates last 30 days:
   - Queries `practice_sessions` + `session_summary`
   - Queries `topic_mastery` for topic lists
   - Calculates weak/improving/strong topics
   - Stores in `user_progress_summary`
   ↓
6. Navigate to summary page
```

### When Summary Page Loads:

```
1. Fetch `session_summary` (current session)
   ↓
2. Fetch `user_progress_summary` (30-day summary)
   ↓
3. Generate recommendations:
   - If progress_summary exists: Use pre-calculated data (FAST!)
   - Else: Query historical data (SLOWER)
   ↓
4. Display recommendations in "What's Next?" section
```

## 📈 Recommendation Logic

### Weak Topics (📚 PRACTICE - Blue)
- **Criteria**: Accuracy < 60% with ≥ 3 attempts
- **Example**: 
  ```
  📚 Practice Clock [PRACTICE]
  Your accuracy in Clock is 45% (5/11).
  Daily practice will help improve this area.
  Topic: Clock
  ```

### Improving Topics (📈 IMPROVE - Green)
- **Criteria**: Accuracy 60-80% with ≥ 3 attempts
- **Example**:
  ```
  📈 Keep Improving Percentages [IMPROVE]
  You're making progress in Percentages (72% accuracy).
  A few more practice sessions will solidify your understanding.
  Topic: Percentages
  ```

### Strong Topics (⭐ MAINTAIN - Yellow)
- **Criteria**: Accuracy ≥ 80% with ≥ 3 attempts
- **Example**:
  ```
  ⭐ Maintain Excellence in Time & Work [MAINTAIN]
  Great work! You have 88% accuracy in Time & Work.
  Review periodically to maintain this level.
  Topic: Time & Work
  ```

### Additional Recommendations:
- **Practice Streak**: If < 3 sessions this month
- **Difficulty Progression**: If 80%+ accuracy but no hard questions attempted

## 🚀 Performance Benefits

### Without `user_progress_summary`:
```sql
-- Query 1: Fetch last 30 days of sessions
SELECT * FROM practice_sessions WHERE user_id = ? AND created_at >= ?

-- Query 2: Fetch all metrics for topic analysis
SELECT * FROM user_metrics WHERE user_id = ? AND created_at >= ?

-- Query 3: Calculate topic performance (complex aggregation)
-- ... multiple JOINs and GROUP BYs ...

Total: ~500ms - 2000ms (depending on data volume)
```

### With `user_progress_summary`:
```sql
-- Single query
SELECT * FROM user_progress_summary WHERE user_id = ? AND category_id = ?

Total: ~10ms - 50ms ⚡
```

**Performance Improvement: 10-100x faster!**

## 📝 Implementation Steps

### 1. Apply Migration
```bash
# Run the migration
supabase db push

# Or apply manually
psql -f supabase/migrations/033_add_user_progress_summary_table.sql
```

### 2. Update Existing Sessions (One-time)
```sql
-- Backfill progress summaries for existing users
SELECT update_user_progress_summary(
  user_id, 
  category_id, 
  (SELECT id FROM practice_sessions WHERE user_id = ps.user_id AND category_id = ps.category_id ORDER BY created_at DESC LIMIT 1)
)
FROM (
  SELECT DISTINCT user_id, category_id 
  FROM practice_sessions 
  WHERE created_at >= NOW() - INTERVAL '30 days'
) ps;
```

### 3. Verify Data
```sql
-- Check progress summaries
SELECT 
  user_id,
  category_id,
  total_sessions,
  overall_accuracy,
  weak_topics,
  last_practice_date
FROM user_progress_summary
LIMIT 10;
```

## 🎯 Benefits Summary

### ✅ **Accuracy**
- Uses actual historical data from last 30 days
- Tracks topic-level performance
- Identifies trends (weak → improving → strong)

### ✅ **Performance**
- Single query vs. multiple complex queries
- Pre-calculated aggregations
- 10-100x faster page loads

### ✅ **Personalization**
- Dynamic recommendations based on user's history
- Changes with each new session
- Prioritized by importance

### ✅ **Scalability**
- Efficient for thousands of users
- Minimal database load
- Automatic updates after each session

### ✅ **Maintainability**
- Clear separation of concerns
- Well-documented functions
- Easy to extend with new recommendation types

## 🔧 Maintenance

### Automatic Updates
- `update_user_progress_summary()` called after each session
- Rolling 30-day window (old data automatically excluded)
- No manual intervention needed

### Monitoring
```sql
-- Check last update times
SELECT 
  user_id,
  category_id,
  last_updated_at,
  NOW() - last_updated_at as time_since_update
FROM user_progress_summary
WHERE last_updated_at < NOW() - INTERVAL '7 days';

-- Check data freshness
SELECT 
  COUNT(*) as total_summaries,
  COUNT(*) FILTER (WHERE last_updated_at >= NOW() - INTERVAL '1 day') as updated_today,
  COUNT(*) FILTER (WHERE last_updated_at >= NOW() - INTERVAL '7 days') as updated_this_week
FROM user_progress_summary;
```

## 📊 Example Data Structure

### `user_progress_summary` Record:
```json
{
  "user_id": "uuid-123",
  "category_id": "uuid-456",
  "total_sessions": 8,
  "total_questions_attempted": 120,
  "overall_accuracy": 68.5,
  "easy_accuracy": 85.0,
  "medium_accuracy": 65.0,
  "hard_accuracy": 45.0,
  "weak_topics": [
    {
      "topic": "Clock",
      "accuracy": 45.5,
      "attempts": 11,
      "correct": 5,
      "priority": 1
    },
    {
      "topic": "Calendar",
      "accuracy": 50.0,
      "attempts": 8,
      "correct": 4,
      "priority": 1
    }
  ],
  "improving_topics": [
    {
      "topic": "Percentages",
      "accuracy": 72.0,
      "attempts": 15,
      "trend": "up"
    }
  ],
  "strong_topics": [
    {
      "topic": "Time & Work",
      "accuracy": 88.0,
      "attempts": 20,
      "mastery_level": "advanced"
    }
  ],
  "practice_streak_days": 3,
  "avg_sessions_per_week": 2.5,
  "last_practice_date": "2025-11-08T12:30:00Z",
  "ready_for_hard_questions": false
}
```

## 🎓 Conclusion

The `user_progress_summary` table provides:
- **Fast** recommendations (10-100x faster)
- **Accurate** insights (based on 30-day rolling data)
- **Personalized** suggestions (unique to each user)
- **Scalable** architecture (handles growth efficiently)

This system ensures the "What's Next?" section is always relevant, helpful, and lightning-fast! ⚡
