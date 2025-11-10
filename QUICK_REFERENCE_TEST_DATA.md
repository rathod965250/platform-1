# Quick Reference: Test Data Storage

## 📊 Where Answers Are Saved

### Table: `attempt_answers`

**Location**: Supabase Database → `attempt_answers` table

**Saved When**: User clicks "Submit Test"

**Code Location**: `src/components/test/TestAttemptInterface.tsx` line 681

```typescript
await supabase.from('attempt_answers').insert(formattedAnswers)
```

### Columns in `attempt_answers`:

| Column | Type | Example | Description |
|--------|------|---------|-------------|
| `id` | uuid | `"answer-uuid-222"` | Unique answer ID |
| `attempt_id` | uuid | `"attempt-uuid-789"` | Links to test_attempts table |
| `question_id` | uuid | `"q-uuid-123"` | Links to questions table |
| `user_answer` | text | `"option b"` | **User's selected answer** |
| `is_correct` | boolean | `true` | Whether answer was correct |
| `time_taken_seconds` | integer | `45` | Time spent on question |
| `is_marked_for_review` | boolean | `false` | Marked for review flag |
| `marks_obtained` | numeric | `1` | Marks for this answer |

---

## 📝 Where Questions & Options Are Stored

### Table: `questions`

**Location**: Supabase Database → `questions` table

**Retrieved When**: User starts test at `/test/[testId]/attempt`

**Code Location**: `src/app/(student)/test/[testId]/attempt/page.tsx` line 54

```typescript
const { data: questions } = await supabase
  .from('questions')
  .select('*')
```

### Columns in `questions`:

| Column | Type | Example | Description |
|--------|------|---------|-------------|
| `id` | uuid | `"q-uuid-123"` | Unique question ID |
| `question_text` | text | `"What is 2 + 2?"` | **The question** |
| `option_a` | text | `"3"` | **Option A** |
| `option_b` | text | `"4"` | **Option B** |
| `option_c` | text | `"5"` | **Option C** |
| `option_d` | text | `"6"` | **Option D** |
| `option_e` | text | `null` | **Option E** (optional) |
| `correct_answer` | text | `"option b"` | **Correct answer** |
| `difficulty` | text | `"easy"` | Difficulty level |
| `subcategory_id` | uuid | `"subcat-uuid"` | Category reference |

---

## 🔄 Data Flow Summary

### 1. Test Attempt Page (`/attempt`)
```
questions table
  ↓
Fetch all questions with options
  ↓
Display to user
```

### 2. User Takes Test
```
User selects answers
  ↓
Stored in React state (temporary)
  ↓
Not saved to database yet
```

### 3. User Submits Test
```
Calculate score
  ↓
Save to test_attempts (overall stats)
  ↓
Save to attempt_answers (each answer)
  ↓
Redirect to results
```

### 4. Results Page (`/results`)
```
Fetch from test_attempts (score, time)
  ↓
Fetch from attempt_answers (user answers)
  ↓
JOIN with questions (get question text & options)
  ↓
Display everything together
```

---

## 🎯 Key Points

### User's Answer
- **Saved in**: `attempt_answers.user_answer`
- **Format**: `"option a"`, `"option b"`, `"option c"`, etc.
- **Example**: If user clicks option B, saves `"option b"`

### Question & Options
- **Stored in**: `questions` table
- **Retrieved**: When test loads AND when showing results
- **Columns**: `question_text`, `option_a`, `option_b`, `option_c`, `option_d`, `option_e`

### Results Display
- **Combines**: `attempt_answers` + `questions` (via JOIN)
- **Shows**: 
  - Question text from `questions.question_text`
  - All options from `questions.option_a` through `option_e`
  - User's answer from `attempt_answers.user_answer`
  - Correct answer from `questions.correct_answer`
  - Whether correct from `attempt_answers.is_correct`

---

## 📍 File Locations

| Action | File | Line | Table |
|--------|------|------|-------|
| **Load Questions** | `src/app/(student)/test/[testId]/attempt/page.tsx` | 54 | `questions` |
| **Display Options** | `src/components/test/TestAttemptInterface.tsx` | 910+ | (from props) |
| **Save Answers** | `src/components/test/TestAttemptInterface.tsx` | 681 | `attempt_answers` |
| **Show Results** | `src/app/(student)/test/[testId]/results/page.tsx` | 67 | `attempt_answers` + `questions` |

---

## 💡 Quick Example

### When User Takes Test:
```typescript
// Question from database:
{
  question_text: "What is 2 + 2?",
  option_a: "3",
  option_b: "4",  ← Correct
  option_c: "5",
  option_d: "6"
}

// User clicks option B
// Saved to attempt_answers:
{
  user_answer: "option b",
  is_correct: true
}
```

### When Viewing Results:
```typescript
// Query joins both tables:
{
  // From attempt_answers:
  user_answer: "option b",
  is_correct: true,
  
  // From questions:
  question_text: "What is 2 + 2?",
  option_a: "3",
  option_b: "4",
  option_c: "5",
  option_d: "6",
  correct_answer: "option b"
}

// Display shows:
// ✓ Your answer: B (Correct!)
// All options with B highlighted
```

---

**Created**: November 10, 2025
**Purpose**: Quick reference for test data storage
