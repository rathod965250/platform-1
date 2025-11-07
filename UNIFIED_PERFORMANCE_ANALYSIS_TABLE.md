# Unified Performance Analysis Table 🎯

## ✅ Smart Consolidation Complete

Successfully merged `topic_mastery` functionality into the existing `performance_analysis` table, eliminating redundancy and creating a single, powerful table for all performance tracking needs!

---

## 🎯 The Problem We Solved

**Before (Redundant):**
- ❌ `performance_analysis` table (per-session tracking)
- ❌ `topic_mastery` table (lifetime tracking)
- ❌ Duplicate columns (accuracy, attempts, difficulty breakdown, etc.)
- ❌ Two separate queries needed
- ❌ Data synchronization issues

**After (Unified):**
- ✅ Single `performance_analysis` table
- ✅ Handles both per-session AND lifetime tracking
- ✅ Uses `session_id` to differentiate:
  - `session_id = <uuid>` → Per-session record
  - `session_id = NULL` → Lifetime record
- ✅ One query, one source of truth
- ✅ No data duplication

---

## 🗄️ Unified Table Schema

### **Enhanced `performance_analysis` Table:**

```sql
CREATE TABLE performance_analysis (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  session_id UUID,              -- NULL for lifetime, UUID for per-session
  category_id UUID NOT NULL,
  subcategory_id UUID,
  
  -- Topic details
  topic_name TEXT,              -- "Time and Distance - Bus Speed System Problem"
  topic_category TEXT,          -- "Time and Distance" (extracted)
  topic_type TEXT,              -- "Bus Speed System Problem" (extracted)
  
  -- Performance metrics
  total_questions INTEGER,
  attempted_questions INTEGER,
  correct_answers INTEGER,
  incorrect_answers INTEGER,
  skipped_questions INTEGER,
  
  -- Accuracy metrics
  accuracy_percentage NUMERIC(5, 2),
  error_rate NUMERIC(5, 2),
  
  -- Time metrics
  total_time_seconds INTEGER,
  avg_time_seconds INTEGER,
  best_time_seconds INTEGER,    -- NEW: Best time for this topic
  
  -- Difficulty breakdown
  easy_total INTEGER,
  easy_correct INTEGER,
  medium_total INTEGER,
  medium_correct INTEGER,
  hard_total INTEGER,
  hard_correct INTEGER,
  
  -- Strength indicators
  is_strong_area BOOLEAN,
  is_weak_area BOOLEAN,
  confidence_score NUMERIC(3, 2),
  
  -- Mastery tracking (NEW)
  mastery_level TEXT,           -- beginner, intermediate, advanced, expert, master
  mastery_score NUMERIC(5, 2),  -- 0-100 composite score
  current_streak INTEGER,       -- Current consecutive correct
  longest_streak INTEGER,       -- Best streak ever
  
  -- Activity tracking (NEW)
  last_attempted_at TIMESTAMP,
  last_correct_at TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

---

## 🔑 Key Design: session_id Differentiation

### **Per-Session Records:**
```sql
-- Created when session ends
INSERT INTO performance_analysis (
  session_id = '123e4567-e89b-12d3-a456-426614174000',  -- Actual session UUID
  topic_name = 'Time and Distance - Bus Speed',
  attempted_questions = 5,
  correct_answers = 4,
  -- ... session-specific stats
);
```

### **Lifetime Records:**
```sql
-- Created/updated for lifetime tracking
INSERT INTO performance_analysis (
  session_id = NULL,  -- NULL indicates lifetime record
  topic_name = 'Time and Distance - Bus Speed',
  attempted_questions = 25,  -- Accumulated across all sessions
  correct_answers = 22,
  mastery_level = 'expert',
  -- ... lifetime stats
);
```

### **Querying:**

```sql
-- Get per-session records
SELECT * FROM performance_analysis 
WHERE user_id = $1 AND session_id = $2;

-- Get lifetime records
SELECT * FROM performance_analysis 
WHERE user_id = $1 AND session_id IS NULL;

-- Get lifetime record for specific topic
SELECT * FROM performance_analysis 
WHERE user_id = $1 AND session_id IS NULL AND topic_name = $2;
```

---

## 📊 Data Flow

### **1. During Session End:**

```typescript
// Step 1: Save per-session records (with session_id)
await supabase.from('performance_analysis').insert(
  performanceAnalysis.map(analysis => ({
    session_id: sessionId,  // Actual session UUID
    topic_name: analysis.topicName,
    // ... per-session stats
  }))
)

// Step 2: Upsert lifetime records (session_id = null)
for (const [topicName, stats] of topicMasteryMap) {
  // Check if lifetime record exists
  const { data: existing } = await supabase
    .from('performance_analysis')
    .select('*')
    .eq('user_id', user.id)
    .eq('topic_name', topicName)
    .is('session_id', null)  // Lifetime records
    .single()
  
  if (existing) {
    // Update existing lifetime record
    await supabase.from('performance_analysis').update({
      attempted_questions: existing.attempted_questions + newAttempts,
      correct_answers: existing.correct_answers + newCorrect,
      // ... accumulate all stats
      mastery_level: calculateMasteryLevel(...),
      mastery_score: calculateMasteryScore(...),
    }).eq('id', existing.id)
  } else {
    // Insert new lifetime record
    await supabase.from('performance_analysis').insert({
      session_id: null,  // NULL for lifetime
      topic_name: topicName,
      // ... initial stats
    })
  }
}
```

### **2. On Summary Page:**

```typescript
// Fetch lifetime mastery data
const { data: topicMasteryData } = await supabase
  .from('performance_analysis')
  .select('*')
  .eq('user_id', user.id)
  .is('session_id', null)  // Only lifetime records
  .in('topic_name', uniqueTopicNames)
  .order('mastery_score', { ascending: false })

// Display in Topic Mastery Map
```

---

## 🎨 Benefits of Unified Table

### **1. Single Source of Truth:**
- ✅ All performance data in one table
- ✅ No synchronization issues
- ✅ Consistent schema

### **2. Efficient Queries:**
- ✅ One query for lifetime data
- ✅ One query for session data
- ✅ Simple filtering with `session_id`

### **3. Easy Maintenance:**
- ✅ One table to manage
- ✅ One set of indexes
- ✅ One set of RLS policies

### **4. Flexible Tracking:**
- ✅ Per-session analysis (session_id = UUID)
- ✅ Lifetime analysis (session_id = NULL)
- ✅ Both use same columns

### **5. Data Integrity:**
- ✅ Unique constraint on (user_id, topic_name) WHERE session_id IS NULL
- ✅ Prevents duplicate lifetime records
- ✅ Allows multiple per-session records

---

## 🔧 Migration Strategy

### **Migration 031: Enhance Existing Table**

```sql
-- Add new columns to existing performance_analysis table
ALTER TABLE performance_analysis
ADD COLUMN IF NOT EXISTS topic_category TEXT,
ADD COLUMN IF NOT EXISTS topic_type TEXT,
ADD COLUMN IF NOT EXISTS mastery_level TEXT,
ADD COLUMN IF NOT EXISTS mastery_score NUMERIC(5, 2),
ADD COLUMN IF NOT EXISTS current_streak INTEGER,
ADD COLUMN IF NOT EXISTS longest_streak INTEGER,
ADD COLUMN IF NOT EXISTS best_time_seconds INTEGER,
ADD COLUMN IF NOT EXISTS last_attempted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS last_correct_at TIMESTAMP;

-- Add unique constraint for lifetime records
CREATE UNIQUE INDEX idx_performance_analysis_user_topic 
ON performance_analysis(user_id, topic_name) 
WHERE topic_name IS NOT NULL AND session_id IS NULL;

-- Add mastery calculation functions
CREATE FUNCTION calculate_mastery_level(...);
CREATE FUNCTION calculate_mastery_score(...);
```

**No data migration needed!** Existing records remain unchanged.

---

## 📋 Comparison: Before vs After

### **Before (2 Tables):**

```
performance_analysis (per-session)
├── id
├── session_id (always set)
├── topic_name
├── accuracy_percentage
└── ... 20 columns

topic_mastery (lifetime)
├── id
├── topic_name
├── current_accuracy
├── mastery_level
└── ... 25 columns

Total: 2 tables, ~45 columns (with overlap)
```

### **After (1 Table):**

```
performance_analysis (unified)
├── id
├── session_id (NULL = lifetime, UUID = per-session)
├── topic_name
├── accuracy_percentage
├── mastery_level
└── ... 30 columns total

Total: 1 table, 30 columns (no duplication)
```

---

## 🧪 Testing Scenarios

### **Test 1: First Session**

```typescript
// After first session
// Per-session record created
{
  session_id: '123-456',
  topic_name: 'Time and Distance - Bus Speed',
  attempted_questions: 5,
  correct_answers: 4,
  accuracy_percentage: 80
}

// Lifetime record created
{
  session_id: null,
  topic_name: 'Time and Distance - Bus Speed',
  attempted_questions: 5,
  correct_answers: 4,
  accuracy_percentage: 80,
  mastery_level: 'intermediate'
}
```

### **Test 2: Second Session (Same Topic)**

```typescript
// New per-session record created
{
  session_id: '789-012',
  topic_name: 'Time and Distance - Bus Speed',
  attempted_questions: 8,
  correct_answers: 7,
  accuracy_percentage: 87.5
}

// Lifetime record UPDATED (not duplicated)
{
  session_id: null,
  topic_name: 'Time and Distance - Bus Speed',
  attempted_questions: 13,  // 5 + 8
  correct_answers: 11,      // 4 + 7
  accuracy_percentage: 84.6, // 11/13
  mastery_level: 'advanced'  // Upgraded!
}
```

### **Test 3: Query Lifetime Data**

```sql
-- Get all lifetime mastery data for user
SELECT * FROM performance_analysis
WHERE user_id = 'user-123'
AND session_id IS NULL
ORDER BY mastery_score DESC;

-- Result: Only lifetime records, no per-session clutter
```

---

## 📁 Files Modified

### **Migration:**
- ✅ `031_enhance_performance_analysis_with_mastery.sql` (NEW)
- ❌ `031_add_topic_mastery_tracking.sql` (DELETED - not needed)

### **Code:**
- ✅ `page.tsx` (summary) - Updated to use single table with session_id filter
- ✅ `PracticeSummary.tsx` - Updated field names (accuracy_percentage, attempted_questions, correct_answers)

### **Documentation:**
- ✅ `UNIFIED_PERFORMANCE_ANALYSIS_TABLE.md` (THIS FILE)

---

## 🚀 Next Steps

1. **Apply migration:**
```bash
supabase db push
```

2. **Verify table structure:**
```sql
\d performance_analysis
```

3. **Test the flow:**
- Complete a practice session
- Check per-session records (session_id = UUID)
- Check lifetime records (session_id = NULL)
- Verify mastery levels and scores

4. **Query examples:**
```sql
-- Per-session records for a session
SELECT * FROM performance_analysis 
WHERE session_id = '<session-uuid>';

-- Lifetime records for a user
SELECT * FROM performance_analysis 
WHERE user_id = '<user-uuid>' AND session_id IS NULL;

-- Lifetime record for specific topic
SELECT * FROM performance_analysis 
WHERE user_id = '<user-uuid>' 
AND session_id IS NULL 
AND topic_name = 'Time and Distance - Bus Speed';
```

---

## 🎉 Summary

### **What Changed:**

1. ✅ **Eliminated Redundancy** - Merged two tables into one
2. ✅ **Smart Differentiation** - Used `session_id` (NULL vs UUID)
3. ✅ **Enhanced Functionality** - Added mastery tracking to existing table
4. ✅ **Maintained Flexibility** - Supports both per-session and lifetime tracking
5. ✅ **Improved Efficiency** - Single query, single source of truth

### **Key Benefits:**

- ✅ **Simpler Architecture** - One table instead of two
- ✅ **No Duplication** - Single schema, no overlapping columns
- ✅ **Easy Queries** - Simple `session_id IS NULL` filter
- ✅ **Data Integrity** - Unique constraints prevent duplicates
- ✅ **Future-Proof** - Easy to extend with new columns

**Your database is now cleaner, more efficient, and easier to maintain!** 🎯✨
