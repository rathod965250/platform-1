# Fix: Next vs Skip Buttons - Different Behaviors

## ✅ Changes Made

Added two distinct buttons with different behaviors:

1. **Next Button** - Move to next question WITHOUT marking as skipped (stays gray/unanswered)
2. **Skip Button** - Mark question as skipped (turns orange) and move to next

---

## 🎯 Button Behaviors

### **Next Button (NEW):**

```typescript
const handleMoveToNext = () => {
  // Move to next question WITHOUT marking as skipped (just unanswered)
  if (questionsLoaded && currentQuestionIndex < allQuestions.length - 1) {
    const nextIndex = currentQuestionIndex + 1
    const nextQuestion = allQuestions[nextIndex]
    
    // Navigate to next question
    setCurrentQuestionIndex(nextIndex)
    setCurrentQuestion(nextQuestion)
    // ... reset states ...
    
    toast.info('Moved to next question')
  }
}
```

**What it does:**
- Moves to next question
- Does NOT add to `skippedQuestions` Set
- Question remains **gray** (unanswered)
- Can come back and answer later

---

### **Skip Button (UPDATED):**

```typescript
const handleSkipQuestion = () => {
  // Mark current question as SKIPPED (orange) and move to next
  if (questionsLoaded && currentQuestionIndex < allQuestions.length - 1) {
    // Mark current question as skipped
    if (currentQuestion) {
      setSkippedQuestions(prev => new Set(prev).add(currentQuestion.id))
    }
    
    const nextIndex = currentQuestionIndex + 1
    const nextQuestion = allQuestions[nextIndex]
    
    // Navigate to next question
    setCurrentQuestionIndex(nextIndex)
    setCurrentQuestion(nextQuestion)
    // ... reset states ...
    
    toast.info('Question skipped')
  }
}
```

**What it does:**
- Adds question to `skippedQuestions` Set
- Moves to next question
- Question turns **orange** (skipped)
- Visual indicator that you intentionally skipped it

---

## 🎨 Visual Differences

### **Using "Next" Button:**

```
Before:
Q5 (current, blue with pulse)
   ↓ Click "Next"
Q5 (gray - unanswered) ⚪
Q6 (current, blue with pulse)
```

**Result:** Q5 stays gray (unanswered)

---

### **Using "Skip" Button:**

```
Before:
Q5 (current, blue with pulse)
   ↓ Click "Skip"
Q5 (orange - skipped) 🟠
Q6 (current, blue with pulse)
```

**Result:** Q5 turns orange (skipped)

---

## 🔄 Complete User Flow

### **Scenario 1: Just Want to Move Forward**

```
1. User on Q5
2. Doesn't know answer yet
3. Clicks "Next" button
   ↓
4. Q5 stays GRAY (unanswered) ⚪
5. Move to Q6
6. Can come back to Q5 later
```

---

### **Scenario 2: Intentionally Skipping**

```
1. User on Q5
2. Decides to skip this question
3. Clicks "Skip" button
   ↓
4. Q5 turns ORANGE (skipped) 🟠
5. Move to Q6
6. Can still come back to Q5 later
```

---

### **Scenario 3: Answer After Next**

```
1. User on Q5
2. Clicks "Next" (Q5 stays gray)
3. Continue to Q10
4. Click Q5 in minimap
   ↓
5. Navigate back to Q5
6. Q5 still gray (unanswered)
7. Answer Q5
   ↓
8. Q5 turns green/red (based on correctness)
```

---

### **Scenario 4: Answer After Skip**

```
1. User on Q5
2. Clicks "Skip" (Q5 turns orange)
3. Continue to Q10
4. Click Q5 in minimap
   ↓
5. Navigate back to Q5
6. Q5 is orange (skipped)
7. Answer Q5
   ↓
8. Q5 turns green/red (answered status overrides skipped)
```

---

## 📊 Button Placement

### **Action Buttons Row:**

```
┌─────────────────────────────────────────────────────────┐
│  [Clear] [Previous] [Hints] [Next] [Skip] ... [Submit]  │
└─────────────────────────────────────────────────────────┘
```

**Order:**
1. Clear - Clear selected answer
2. Previous - Go to previous question
3. Hints - Show/hide hints
4. **Next** - Move to next (unanswered) ← NEW!
5. **Skip** - Skip question (orange) ← UPDATED!
6. Submit - Submit answer (right-aligned)

---

## 🎯 Use Cases

### **When to Use "Next":**

✅ Want to see other questions first
✅ Come back to this question later
✅ Not sure of answer yet
✅ Want to keep question as "unanswered" (not skipped)

### **When to Use "Skip":**

✅ Intentionally skipping this question
✅ Want visual indicator (orange) that you skipped it
✅ Mark question as "to be reviewed later"
✅ Different from just "unanswered"

---

## 🎨 Color States

| Action | Button Used | Color | Status |
|--------|-------------|-------|--------|
| No action | - | Gray ⚪ | Unanswered |
| Click "Next" | Next | Gray ⚪ | Unanswered |
| Click "Skip" | Skip | Orange 🟠 | Skipped |
| Answer correct | Submit | Green 🟢 | Correct |
| Answer wrong | Submit | Red 🔴 | Wrong |
| Mark for review | Bookmark | Purple 🟣 | Marked |

---

## 📋 End Session Dialog

The End Session dialog now shows accurate information:

```typescript
// Calculate statistics
const totalAttempted = questionHistory.filter(q => q.hasAnswer).length
const totalSkipped = skippedQuestions.size  // Only counts orange/skipped
const totalUnanswered = allQuestions.length - totalAttempted - totalSkipped
```

### **Dialog Display:**

```
┌─────────────────────────────────────┐
│  End Practice Session               │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────┐ ┌─────────┐ ┌────────┐│
│  │   20    │ │    5    │ │   5    ││
│  │Attempted│ │ Skipped │ │Unanswer││
│  └─────────┘ └─────────┘ └────────┘│
│                                     │
│  Question Overview:                 │
│  [1] [2] [3] [4] [5] ...           │
│   🟢  🔴  🟠  ⚪  🟢              │
│                                     │
│  Legend:                            │
│  🟢 Correct                         │
│  🔴 Wrong                           │
│  🟠 Skipped (Skip button)           │
│  ⚪ Unanswered (Next button or not attempted) │
│  🟣 Marked                          │
│                                     │
│  [Continue Practice] [End Session]  │
└─────────────────────────────────────┘
```

---

## 🧪 Testing

### **Test 1: Next Button**

1. Start practice session
2. On Q1, don't select answer
3. Click "Next" button
   - ✅ Toast: "Moved to next question"
   - ✅ Q1 stays gray in minimap
   - ✅ Navigate to Q2

### **Test 2: Skip Button**

1. On Q2, don't select answer
2. Click "Skip" button
   - ✅ Toast: "Question skipped"
   - ✅ Q2 turns orange in minimap
   - ✅ Navigate to Q3

### **Test 3: Mixed Usage**

1. Q1: Click "Next" → Gray ⚪
2. Q2: Click "Skip" → Orange 🟠
3. Q3: Answer correctly → Green 🟢
4. Q4: Answer incorrectly → Red 🔴
5. Q5: Click "Next" → Gray ⚪
6. Check minimap:
   - ✅ Q1: Gray
   - ✅ Q2: Orange
   - ✅ Q3: Green
   - ✅ Q4: Red
   - ✅ Q5: Gray

### **Test 4: Answer After Next**

1. Q1: Click "Next" (stays gray)
2. Continue to Q5
3. Click Q1 in minimap
4. Answer Q1 correctly
   - ✅ Q1 turns green
   - ✅ Gray → Green

### **Test 5: Answer After Skip**

1. Q2: Click "Skip" (turns orange)
2. Continue to Q5
3. Click Q2 in minimap
4. Answer Q2 correctly
   - ✅ Q2 turns green
   - ✅ Orange → Green (answered overrides skipped)

### **Test 6: End Session Dialog**

1. Answer Q1-Q10 (10 questions)
2. Click "Next" on Q11-Q15 (5 questions - stay gray)
3. Click "Skip" on Q16-Q20 (5 questions - turn orange)
4. Leave Q21-Q30 untouched (10 questions - gray)
5. Click "End Session"
   - ✅ Attempted: 10
   - ✅ Skipped: 5 (orange ones)
   - ✅ Unanswered: 15 (gray ones from Next + untouched)
   - ✅ Question grid shows:
     * Q1-Q10: Green/Red (answered)
     * Q11-Q15: Gray (Next button)
     * Q16-Q20: Orange (Skip button)
     * Q21-Q30: Gray (untouched)

---

## 💡 Key Differences

### **Next Button:**
- ✅ Moves forward
- ✅ Question stays gray (unanswered)
- ✅ No special marking
- ✅ Same as "not attempted"
- ✅ Toast: "Moved to next question"

### **Skip Button:**
- ✅ Moves forward
- ✅ Question turns orange (skipped)
- ✅ Added to `skippedQuestions` Set
- ✅ Visual indicator of intentional skip
- ✅ Toast: "Question skipped"

---

## 📊 Statistics Impact

### **End Session Calculations:**

```typescript
const totalAttempted = questionHistory.filter(q => q.hasAnswer).length
const totalCorrect = questionHistory.filter(q => q.isCorrect === true).length
const totalIncorrect = questionHistory.filter(q => q.isCorrect === false).length
const totalSkipped = skippedQuestions.size  // Only orange/skipped questions
const totalUnanswered = allQuestions.length - totalAttempted  // Includes gray from Next
```

### **Database Storage:**

```typescript
await supabase
  .from('practice_sessions')
  .update({
    total_questions: allQuestions.length,
    correct_answers: totalCorrect,
    incorrect_answers: totalIncorrect,
    skipped_count: totalSkipped,  // Only counts orange/skipped
    time_taken_seconds: timer,
  })
```

---

## 🎉 Summary

### **Changes Made:**

1. ✅ Added `handleMoveToNext` function
2. ✅ Added "Next" button (moves without marking as skipped)
3. ✅ Updated "Skip" button (marks as skipped with orange color)
4. ✅ Imported `ChevronRight` icon for Next button
5. ✅ Both buttons placed side by side

### **User Benefits:**

- ✅ **Flexibility** - Two ways to move forward
- ✅ **Clear Intent** - Next = unanswered, Skip = intentionally skipped
- ✅ **Visual Feedback** - Orange for skipped, gray for unanswered
- ✅ **Accurate Stats** - End session dialog shows correct counts
- ✅ **Better UX** - Users can choose how to handle questions

### **Button Behavior:**

| Button | Marks as Skipped? | Color | Toast Message |
|--------|-------------------|-------|---------------|
| **Next** | ❌ No | Gray ⚪ | "Moved to next question" |
| **Skip** | ✅ Yes | Orange 🟠 | "Question skipped" |

---

**Users now have two distinct options for moving forward without answering!** 🎯✨
