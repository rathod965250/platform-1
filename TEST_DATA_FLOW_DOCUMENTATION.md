# Test Data Flow Documentation

## Complete Data Flow: From Test Attempt to Results Display

This document maps out exactly where test answers are saved and how questions/options are stored and retrieved.

---

## 📊 Database Tables and Columns

### 1. **`questions` Table** - Stores All Questions and Options

**Purpose**: Master table containing all test questions with their options and correct answers.

**Key Columns**:
```sql
CREATE TABLE questions (
  id                uuid PRIMARY KEY,
  question_text     text NOT NULL,           -- The question text
  option_a          text,                    -- Option A
  option_b          text,                    -- Option B
  option_c          text,                    -- Option C
  option_d          text,                    -- Option D
  option_e          text,                    -- Option E (optional)
  correct_answer    text,                    -- e.g., "option a", "option b", etc.
  difficulty        text,                    -- "easy", "medium", "hard"
  subcategory_id    uuid,                    -- FK to subcategories
  created_at        timestamp
)
```

**Example Row**:
```json
{
  "id": "q-uuid-123",
  "question_text": "What is 2 + 2?",
  "option_a": "3",
  "option_b": "4",
  "option_c": "5",
  "option_d": "6",
  "option_e": null,
  "correct_answer": "option b",
  "difficulty": "easy",
  "subcategory_id": "subcat-uuid-456"
}
```

---

### 2. **`test_attempts` Table** - Stores Test Attempt Metadata

**Purpose**: Tracks each user's attempt at a test with overall statistics.

**Key Columns**:
```sql
CREATE TABLE test_attempts (
  id                          uuid PRIMARY KEY,
  test_id                     uuid NOT NULL,           -- FK to tests
  user_id                     uuid NOT NULL,           -- FK to users
  score                       integer,                 -- Total score
  correct_answers             integer,                 -- Number correct
  total_questions             integer,                 -- Total questions
  time_taken_seconds          integer,                 -- Time spent
  submitted_at                timestamp,               -- Submission time
  proctoring_warnings         jsonb,                   -- Proctoring alerts
  violation_timestamps        jsonb,                   -- Violation details
  tab_switch_count            integer DEFAULT 0,
  fullscreen_exit_count       integer DEFAULT 0,
  camera_disabled_count       integer DEFAULT 0,
  suspicious_activity_count   integer DEFAULT 0,
  proctoring_flags            jsonb,
  browser_info                jsonb,
  device_info                 jsonb,
  created_at                  timestamp
)
```

**Example Row**:
```json
{
  "id": "attempt-uuid-789",
  "test_id": "test-uuid-999",
  "user_id": "user-uuid-111",
  "score": 15,
  "correct_answers": 15,
  "total_questions": 33,
  "time_taken_seconds": 1800,
  "submitted_at": "2025-11-10T17:36:00Z",
  "tab_switch_count": 2,
  "fullscreen_exit_count": 1
}
```

---

### 3. **`attempt_answers` Table** - Stores Individual Answer Submissions

**Purpose**: Records each answer submitted by the user during a test attempt.

**Key Columns**:
```sql
CREATE TABLE attempt_answers (
  id                      uuid PRIMARY KEY,
  attempt_id              uuid NOT NULL,           -- FK to test_attempts
  question_id             uuid NOT NULL,           -- FK to questions
  user_answer             text,                    -- e.g., "option a", "option b"
  is_correct              boolean,                 -- Was answer correct?
  time_taken_seconds      integer DEFAULT 0,       -- Time on this question
  is_marked_for_review    boolean DEFAULT false,   -- Marked for review?
  marks_obtained          numeric DEFAULT 0,       -- Marks for this answer
  created_at              timestamp
)
```

**Example Row**:
```json
{
  "id": "answer-uuid-222",
  "attempt_id": "attempt-uuid-789",
  "question_id": "q-uuid-123",
  "user_answer": "option b",
  "is_correct": true,
  "time_taken_seconds": 45,
  "is_marked_for_review": false,
  "marks_obtained": 1
}
```

---

### 4. **`subcategories` Table** - Question Topics

**Key Columns**:
```sql
CREATE TABLE subcategories (
  id            uuid PRIMARY KEY,
  name          text NOT NULL,
  category_id   uuid NOT NULL,           -- FK to categories
  created_at    timestamp
)
```

---

### 5. **`categories` Table** - Main Categories

**Key Columns**:
```sql
CREATE TABLE categories (
  id          uuid PRIMARY KEY,
  name        text NOT NULL,
  created_at  timestamp
)
```

---

## 🔄 Complete Data Flow

### Phase 1: Test Attempt Page Load (`/test/[testId]/attempt`)

**File**: `src/app/(student)/test/[testId]/attempt/page.tsx`

#### Step 1: Fetch Questions
```typescript
// Query questions table with nested relationships
const { data: questions } = await supabase
  .from('questions')
  .select(`
    *,
    subcategory:subcategories!questions_subcategory_id_fkey(
      id,
      name,
      category:categories(
        id,
        name
      )
    )
  `)
  .in('id', customTest.selected_question_ids)
```

**Data Retrieved**:
```json
[
  {
    "id": "q-uuid-123",
    "question_text": "What is 2 + 2?",
    "option_a": "3",
    "option_b": "4",
    "option_c": "5",
    "option_d": "6",
    "option_e": null,
    "correct_answer": "option b",
    "difficulty": "easy",
    "subcategory": {
      "id": "subcat-uuid",
      "name": "Arithmetic",
      "category": {
        "id": "cat-uuid",
        "name": "Mathematics"
      }
    }
  },
  // ... more questions
]
```

#### Step 2: Pass to TestAttemptInterface
```typescript
<TestAttemptInterface
  test={test}
  questions={questions}  // ← Questions with all options
  userId={user.id}
  userProfile={userProfile}
  existingAttempt={existingAttempt}
/>
```

---

### Phase 2: User Takes Test

**File**: `src/components/test/TestAttemptInterface.tsx`

#### Display Questions and Options
```typescript
// Component displays each question
const currentQuestion = questions[currentQuestionIndex]

// Shows all options from the question object
['option a', 'option b', 'option c', 'option d', 'option e'].map((optionKey) => {
  const optionValue = currentQuestion[optionKey]
  // Displays: A. {option_a value}
  //           B. {option_b value}
  //           C. {option_c value}
  //           etc.
})
```

#### Store Answers in State
```typescript
// User selects an answer
const [answers, setAnswers] = useState<Record<string, Answer>>({})

// When user clicks an option
setAnswers((prev) => ({
  ...prev,
  [currentQuestion.id]: {
    questionId: currentQuestion.id,
    selectedOption: 'option b',  // ← User's selection
    isMarkedForReview: false,
    timeSpent: 45,
  }
}))
```

**State Structure**:
```json
{
  "q-uuid-123": {
    "questionId": "q-uuid-123",
    "selectedOption": "option b",
    "isMarkedForReview": false,
    "timeSpent": 45
  },
  "q-uuid-456": {
    "questionId": "q-uuid-456",
    "selectedOption": "option a",
    "isMarkedForReview": true,
    "timeSpent": 120
  }
  // ... more answers
}
```

---

### Phase 3: Test Submission

**File**: `src/components/test/TestAttemptInterface.tsx`
**Function**: `handleSubmitTest()`

#### Step 1: Calculate Score
```typescript
let correctAnswers = 0
const answerRecords = Object.values(answers).map((answer) => {
  // Find the question to get correct answer
  const question = questions.find((q) => q.id === answer.questionId)
  const correctAnswer = question?.['correct answer'] || question?.correct_answer
  
  // Check if user's answer matches correct answer
  const isCorrect = answer.selectedOption === correctAnswer
  if (isCorrect) correctAnswers++

  return {
    test_attempt_id: attemptId,
    question_id: answer.questionId,
    selected_answer: answer.selectedOption,  // ← User's answer
    is_correct: isCorrect,                   // ← Calculated
    time_spent: answer.timeSpent,
    is_marked_for_review: answer.isMarkedForReview,
  }
})
```

#### Step 2: Update test_attempts Table
```typescript
await supabase
  .from('test_attempts')
  .update({
    score: correctAnswers,                    // ← Total score
    correct_answers: correctAnswers,          // ← Number correct
    time_taken_seconds: timeTaken,            // ← Total time
    submitted_at: new Date().toISOString(),   // ← Submission timestamp
    proctoring_warnings: proctoringWarnings,
    violation_timestamps: violationTimestamps,
    tab_switch_count: tabSwitchCount,
    fullscreen_exit_count: fullscreenExitCount,
    camera_disabled_count: cameraDisabledCount,
    suspicious_activity_count: suspiciousActivityCount,
    proctoring_flags: proctoringFlags,
    browser_info: browserInfo,
    device_info: deviceInfo,
  })
  .eq('id', attemptId)
```

**Database Update**:
```sql
UPDATE test_attempts
SET 
  score = 15,
  correct_answers = 15,
  time_taken_seconds = 1800,
  submitted_at = '2025-11-10T17:36:00Z',
  -- ... other fields
WHERE id = 'attempt-uuid-789'
```

#### Step 3: Insert into attempt_answers Table
```typescript
const formattedAnswers = answerRecords.map(record => ({
  attempt_id: record.test_attempt_id,       // ← Links to test_attempts
  question_id: record.question_id,          // ← Links to questions
  user_answer: record.selected_answer,      // ← User's selection
  is_correct: record.is_correct,            // ← Correctness
  time_taken_seconds: record.time_spent || 0,
  is_marked_for_review: record.is_marked_for_review || false,
  marks_obtained: record.is_correct ? 1 : 0,
}))

await supabase.from('attempt_answers').insert(formattedAnswers)
```

**Database Insert**:
```sql
INSERT INTO attempt_answers (
  attempt_id,
  question_id,
  user_answer,
  is_correct,
  time_taken_seconds,
  is_marked_for_review,
  marks_obtained
) VALUES
  ('attempt-uuid-789', 'q-uuid-123', 'option b', true, 45, false, 1),
  ('attempt-uuid-789', 'q-uuid-456', 'option a', false, 120, true, 0),
  -- ... more rows
```

---

### Phase 4: Results Page Display (`/test/[testId]/results`)

**File**: `src/app/(student)/test/[testId]/results/page.tsx`

#### Step 1: Fetch Attempt Data
```typescript
const { data: attempt } = await supabase
  .from('test_attempts')
  .select('*')
  .eq('test_id', testId)
  .eq('user_id', user.id)
  .not('submitted_at', 'is', null)
  .order('submitted_at', { ascending: false })
  .limit(1)
  .single()
```

**Retrieved**:
```json
{
  "id": "attempt-uuid-789",
  "score": 15,
  "correct_answers": 15,
  "total_questions": 33,
  "time_taken_seconds": 1800,
  "submitted_at": "2025-11-10T17:36:00Z"
}
```

#### Step 2: Fetch Answers with Questions
```typescript
const { data: answers } = await supabase
  .from('attempt_answers')
  .select(`
    *,
    questions!attempt_answers_question_id_fkey(
      *,
      subcategories!questions_subcategory_id_fkey(
        id,
        name,
        categories!subcategories_category_id_fkey(
          id,
          name
        )
      )
    )
  `)
  .eq('attempt_id', attempt.id)
```

**Retrieved**:
```json
[
  {
    "id": "answer-uuid-222",
    "attempt_id": "attempt-uuid-789",
    "question_id": "q-uuid-123",
    "user_answer": "option b",           // ← What user selected
    "is_correct": true,                  // ← Was it correct?
    "time_taken_seconds": 45,
    "is_marked_for_review": false,
    "marks_obtained": 1,
    "questions": {                       // ← Full question details
      "id": "q-uuid-123",
      "question_text": "What is 2 + 2?",
      "option_a": "3",
      "option_b": "4",                   // ← Correct answer
      "option_c": "5",
      "option_d": "6",
      "correct_answer": "option b",
      "subcategories": {
        "name": "Arithmetic",
        "categories": {
          "name": "Mathematics"
        }
      }
    }
  },
  // ... more answers
]
```

#### Step 3: Display in TestResults Component

**File**: `src/components/test/TestResults.tsx`

```typescript
// Display each question with user's answer
answers.map((answer) => {
  const question = answer.question || answer.questions
  
  return (
    <div>
      {/* Question Text */}
      <p>{question.question_text}</p>
      
      {/* All Options */}
      <div>
        <Option 
          text={question.option_a} 
          isUserAnswer={answer.user_answer === 'option a'}
          isCorrect={question.correct_answer === 'option a'}
        />
        <Option 
          text={question.option_b} 
          isUserAnswer={answer.user_answer === 'option b'}
          isCorrect={question.correct_answer === 'option b'}
        />
        {/* ... more options */}
      </div>
      
      {/* Show if user was correct */}
      {answer.is_correct ? (
        <Badge variant="success">Correct</Badge>
      ) : (
        <Badge variant="destructive">Incorrect</Badge>
      )}
    </div>
  )
})
```

---

## 📋 Summary Table

| Phase | Table | Columns Used | Purpose |
|-------|-------|--------------|---------|
| **Load Test** | `questions` | `id`, `question_text`, `option_a` through `option_e`, `correct_answer`, `difficulty`, `subcategory_id` | Display questions and options to user |
| **Take Test** | (In-memory state) | `questionId`, `selectedOption`, `isMarkedForReview`, `timeSpent` | Store user selections temporarily |
| **Submit Test** | `test_attempts` | `score`, `correct_answers`, `time_taken_seconds`, `submitted_at`, proctoring fields | Save overall test results |
| **Submit Test** | `attempt_answers` | `attempt_id`, `question_id`, `user_answer`, `is_correct`, `time_taken_seconds`, `is_marked_for_review`, `marks_obtained` | Save each individual answer |
| **View Results** | `test_attempts` | All columns | Get overall score and stats |
| **View Results** | `attempt_answers` + `questions` (JOIN) | All columns from both tables | Show each question with user's answer and correct answer |

---

## 🔑 Key Relationships

```
test_attempts
  ├─ id (PK)
  └─ test_id (FK → tests.id)
  └─ user_id (FK → users.id)

attempt_answers
  ├─ id (PK)
  ├─ attempt_id (FK → test_attempts.id)  ← Links answer to attempt
  └─ question_id (FK → questions.id)     ← Links answer to question

questions
  ├─ id (PK)
  └─ subcategory_id (FK → subcategories.id)

subcategories
  ├─ id (PK)
  └─ category_id (FK → categories.id)
```

---

## 🎯 Critical Data Points

### What Gets Saved When User Submits:

1. **In `test_attempts`**:
   - Overall score
   - Number of correct answers
   - Total time taken
   - Submission timestamp
   - Proctoring violations

2. **In `attempt_answers`** (one row per question):
   - Which question (question_id)
   - What user selected (user_answer: "option a", "option b", etc.)
   - Whether it was correct (is_correct: true/false)
   - Time spent on that question
   - Whether marked for review
   - Marks obtained

### What Gets Retrieved for Results Display:

1. **From `test_attempts`**:
   - Score and percentage
   - Time taken
   - Proctoring data

2. **From `attempt_answers` + `questions` (JOIN)**:
   - User's answer for each question
   - The full question text
   - All options (A, B, C, D, E)
   - The correct answer
   - Whether user was correct
   - Category/subcategory info

---

## 🔍 Example Query Flow

### Submission Query:
```sql
-- 1. Update attempt
UPDATE test_attempts 
SET score = 15, correct_answers = 15, submitted_at = NOW()
WHERE id = 'attempt-uuid-789';

-- 2. Insert answers
INSERT INTO attempt_answers (attempt_id, question_id, user_answer, is_correct)
VALUES 
  ('attempt-uuid-789', 'q-uuid-123', 'option b', true),
  ('attempt-uuid-789', 'q-uuid-456', 'option a', false);
```

### Results Query:
```sql
-- Fetch answers with full question details
SELECT 
  aa.*,
  q.*,
  sc.name as subcategory_name,
  c.name as category_name
FROM attempt_answers aa
JOIN questions q ON aa.question_id = q.id
JOIN subcategories sc ON q.subcategory_id = sc.id
JOIN categories c ON sc.category_id = c.id
WHERE aa.attempt_id = 'attempt-uuid-789';
```

---

**Document Created**: November 10, 2025
**Purpose**: Complete data flow documentation for test system
**Status**: ✅ Complete and Accurate
