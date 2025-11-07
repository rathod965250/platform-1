# Fix: Skipped Questions Tracking and Visual Indicators

## ✅ Changes Made

Added comprehensive tracking and visual indicators for skipped questions across the practice interface, including:

1. **Skipped Questions State** - Track which questions are skipped
2. **Orange Color Indicator** - Skipped questions shown in orange
3. **Updated Status Legend** - Added "Skipped" indicator with larger text
4. **Functional Dialog Buttons** - End Session dialog buttons now navigate to questions
5. **Consistent Behavior** - All question grids work the same way

---

## 🎨 Visual Changes

### **New Color Scheme:**

| Status | Color | Border | Background |
|--------|-------|--------|------------|
| Current | Blue | `border-primary` | `bg-primary/20` with pulse |
| Correct | Green | `border-green-500` | `bg-green-500` |
| Wrong | Red | `border-red-500` | `bg-red-500` |
| **Skipped** | **Orange** | `border-orange-500` | `bg-orange-500` |
| Marked | Purple | `border-purple-500` | `bg-purple-500` |
| Unanswered | Gray | `border-border` | `bg-muted` |
| Correct & Marked | Green/Purple | Split diagonal | |
| Wrong & Marked | Red/Purple | Split diagonal | |

---

## 🔧 Technical Implementation

### **1. Added Skipped Questions State:**

```typescript
const [skippedQuestions, setSkippedQuestions] = useState<Set<string>>(new Set())
```

**Purpose:** Track which questions have been skipped by storing their IDs in a Set.

---

### **2. Updated `handleSkipQuestion` Function:**

```typescript
const handleSkipQuestion = () => {
  if (questionsLoaded && currentQuestionIndex < allQuestions.length - 1) {
    // Mark current question as skipped
    if (currentQuestion) {
      setSkippedQuestions(prev => new Set(prev).add(currentQuestion.id))
    }
    
    // Navigate to next question
    const nextIndex = currentQuestionIndex + 1
    const nextQuestion = allQuestions[nextIndex]
    
    setCurrentQuestionIndex(nextIndex)
    setCurrentQuestion(nextQuestion)
    // ... rest of navigation logic
    
    toast.info('Question skipped')
  }
}
```

**What it does:**
- Adds current question ID to `skippedQuestions` Set
- Navigates to next question
- Shows toast notification

---

### **3. Updated Question Minimap (Sidebar):**

```typescript
{allQuestions.map((q, index) => {
  const historyItem = questionHistory.find(h => h.id === q.id)
  const isCurrent = index === currentQuestionIndex && !showFeedback
  const isAnswered = historyItem?.hasAnswer || false
  const isMarked = markedQuestions.has(q.id)
  const isSkipped = skippedQuestions.has(q.id)  // ← NEW
  const isCorrect = historyItem?.isCorrect
  
  // Priority order: Current > Correct+Marked > Wrong+Marked > Correct > Wrong > Marked > Skipped > Unanswered
  if (isCurrent) {
    buttonClass += 'border-primary bg-primary/20 ring-2 ring-primary/30 animate-pulse'
  } else if (isAnswered && isMarked && isCorrect === true) {
    buttonClass += 'border-green-500 bg-green-500 text-white hover:bg-green-600'
    hasSplitColor = true
    splitColorClass = 'bg-purple-500'
  } else if (isAnswered && isMarked && isCorrect === false) {
    buttonClass += 'border-red-500 bg-red-500 text-white hover:bg-red-600'
    hasSplitColor = true
    splitColorClass = 'bg-purple-500'
  } else if (isAnswered && isCorrect === true) {
    buttonClass += 'border-green-500 bg-green-500 text-white hover:bg-green-600'
  } else if (isAnswered && isCorrect === false) {
    buttonClass += 'border-red-500 bg-red-500 text-white hover:bg-red-600'
  } else if (isMarked) {
    buttonClass += 'border-purple-500 bg-purple-500 text-white hover:bg-purple-600'
  } else if (isSkipped && !isAnswered) {  // ← NEW
    buttonClass += 'border-orange-500 bg-orange-500 text-white hover:bg-orange-600'
  } else {
    buttonClass += 'border-border bg-muted text-muted-foreground hover:bg-muted/80'
  }
  
  return <button className={buttonClass} onClick={...}>...</button>
})}
```

**Key Points:**
- Checks if question is in `skippedQuestions` Set
- Shows orange color for skipped questions
- Only shows orange if NOT answered (answered takes priority)

---

### **4. Updated Status Legend (Larger Text):**

**Before:**
```typescript
<p className="text-xs font-medium text-foreground mb-2">Status</p>
<div className="flex flex-wrap gap-3 text-xs">
  <div className="flex items-center gap-1.5">
    <div className="w-3 h-3 rounded border-2 ..."></div>
    <span className="text-muted-foreground">Correct</span>
  </div>
  ...
</div>
```

**After:**
```typescript
<p className="text-sm font-medium text-foreground mb-2">Status</p>  {/* text-xs → text-sm */}
<div className="flex flex-wrap gap-3 text-sm">  {/* text-xs → text-sm */}
  <div className="flex items-center gap-2">  {/* gap-1.5 → gap-2 */}
    <div className="w-4 h-4 rounded border-2 ..."></div>  {/* w-3 h-3 → w-4 h-4 */}
    <span className="text-muted-foreground">Correct</span>
  </div>
  
  {/* NEW: Skipped indicator */}
  <div className="flex items-center gap-2">
    <div className="w-4 h-4 rounded border-2 border-orange-500 bg-orange-500"></div>
    <span className="text-muted-foreground">Skipped</span>
  </div>
  ...
</div>
```

**Changes:**
- Title: `text-xs` → `text-sm`
- Container: `text-xs` → `text-sm`
- Gap: `gap-1.5` → `gap-2`
- Icon size: `w-3 h-3` → `w-4 h-4`
- Added "Skipped" indicator with orange color

---

### **5. Made End Session Dialog Buttons Functional:**

**Before:**
```typescript
<button
  className={buttonClass}
  title={`Q${index + 1}: ${q.text.substring(0, 50)}...`}
  disabled  // ← Buttons were disabled
>
  {index + 1}
</button>
```

**After:**
```typescript
<button
  className={buttonClass}
  title={`Q${index + 1}: ${q.text.substring(0, 50)}...`}
  onClick={() => {
    // Navigate to clicked question and close dialog
    setShowEndSessionDialog(false)
    
    if (index !== currentQuestionIndex) {
      const historyItem = questionHistory.find(h => h.id === q.id)
      
      setCurrentQuestionIndex(index)
      setCurrentQuestion(q)
      
      // Restore answer if previously answered
      if (historyItem?.hasAnswer) {
        setShowFeedback(true)
        setIsCorrect(historyItem.isCorrect)
        fetchQuestionDetails(q.id)
      } else {
        setSelectedAnswer(null)
        setShowFeedback(false)
        setIsCorrect(null)
        setHints(null)
        setSolutionSteps(null)
        setFormulaUsed(null)
        fetchQuestionDetails(q.id)
      }
      
      setQuestionStartTime(Date.now())
      setShowHints(false)
      setShowCorrectOptions(false)
      setAnalytics((prev) => ({
        ...prev,
        questions_answered: index,
      }))
    }
  }}
>
  {index + 1}
</button>
```

**What it does:**
- Closes End Session dialog
- Navigates to clicked question
- Restores previous answer state if answered
- Resets state if not answered
- Updates analytics

---

## 🎯 User Experience Flow

### **Scenario 1: Skip a Question**

```
1. User on Q5
   ↓
2. User clicks "Skip" button
   ↓
3. Q5 marked as skipped (added to skippedQuestions Set)
   ↓
4. Navigate to Q6
   ↓
5. Q5 button in minimap turns ORANGE 🟠
   ↓
6. Toast: "Question skipped"
```

---

### **Scenario 2: Skip Then Answer**

```
1. User skips Q5 (turns orange)
   ↓
2. User continues to Q10
   ↓
3. User clicks Q5 button in minimap
   ↓
4. Navigate back to Q5
   ↓
5. User answers Q5
   ↓
6. Q5 turns GREEN (correct) or RED (wrong)
   ↓
7. Orange color replaced by answer color
```

**Priority:** Answered status > Skipped status

---

### **Scenario 3: End Session Dialog**

```
1. User clicks "End Session" button
   ↓
2. Dialog opens showing:
   - Statistics (Attempted, Not Attempted, Marked)
   - Question grid with colors:
     * Green: Correct
     * Red: Wrong
     * Orange: Skipped
     * Purple: Marked
     * Gray: Unanswered
   ↓
3. User clicks orange Q5 button
   ↓
4. Dialog closes
   ↓
5. Navigate to Q5
   ↓
6. User can now answer Q5
```

---

## 📊 Visual Examples

### **Question Minimap (Sidebar):**

```
┌─────────────────────────────┐
│   Question Minimap          │
├─────────────────────────────┤
│                             │
│  [1] [2] [3] [4] [5]        │
│   🟢  🔴  🟠  🔵  ⚪        │
│                             │
│  [6] [7] [8] [9] [10]       │
│   🟣  🟢  🔴  🟠  ⚪        │
│                             │
│  Status                     │
│  🟢 Correct                 │
│  🔴 Wrong                   │
│  🟠 Skipped                 │
│  ⚪ Unanswered              │
│  🟣 Marked                  │
│  🟢🟣 Correct & Marked      │
│  🔴🟣 Wrong & Marked        │
│                             │
│  [End Session]              │
└─────────────────────────────┘
```

---

### **End Session Dialog:**

```
┌─────────────────────────────────────┐
│  End Practice Session               │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────┐ ┌─────────┐ ┌────────┐│
│  │   25    │ │    5    │ │   3    ││
│  │Attempted│ │Not Att. │ │ Marked ││
│  └─────────┘ └─────────┘ └────────┘│
│                                     │
│  Question Overview                  │
│  Total: 30 questions                │
│                                     │
│  [1] [2] [3] [4] [5]                │
│   🟢  🔴  🟠  🟢  🔴               │
│                                     │
│  [6] [7] [8] [9] [10]               │
│   🟠  🟢  🔴  🟣  ⚪               │
│                                     │
│  ... (scrollable)                   │
│                                     │
│  [Continue Practice] [End Session]  │
└─────────────────────────────────────┘

Click any question button to jump to it!
```

---

## 🎨 Color Priority Order

When determining button color, the system checks in this order:

1. **Current** (Blue with pulse) - Currently viewing this question
2. **Correct + Marked** (Green/Purple split) - Answered correctly AND marked
3. **Wrong + Marked** (Red/Purple split) - Answered incorrectly AND marked
4. **Correct** (Green) - Answered correctly
5. **Wrong** (Red) - Answered incorrectly
6. **Marked** (Purple) - Marked for review (not answered)
7. **Skipped** (Orange) - Skipped (not answered)
8. **Unanswered** (Gray) - Not attempted

**Key Rule:** Answered status always takes priority over skipped status.

---

## 🧪 Testing

### **Test 1: Skip Question**

1. Start practice session
2. On Q1, click "Skip" button
   - ✅ Q1 turns orange in minimap
   - ✅ Toast: "Question skipped"
   - ✅ Navigate to Q2

### **Test 2: Skip Multiple Questions**

1. Skip Q1, Q3, Q5
   - ✅ All three turn orange
   - ✅ Q2, Q4 remain gray (unanswered)

### **Test 3: Answer Skipped Question**

1. Skip Q1 (turns orange)
2. Continue to Q5
3. Click Q1 in minimap
   - ✅ Navigate back to Q1
4. Answer Q1 correctly
   - ✅ Q1 turns green
   - ✅ Orange color replaced

### **Test 4: End Session Dialog**

1. Skip Q3, Q7, Q10
2. Answer Q1 (correct), Q2 (wrong)
3. Mark Q5 for review
4. Click "End Session"
   - ✅ Dialog shows:
     * Q1: Green
     * Q2: Red
     * Q3: Orange (skipped)
     * Q4: Gray (unanswered)
     * Q5: Purple (marked)
     * Q7: Orange (skipped)
     * Q10: Orange (skipped)

### **Test 5: Dialog Button Navigation**

1. Open End Session dialog
2. Click Q7 button (orange - skipped)
   - ✅ Dialog closes
   - ✅ Navigate to Q7
   - ✅ Can now answer Q7

### **Test 6: Status Legend**

1. Check status legend in minimap
   - ✅ Text is larger (`text-sm` instead of `text-xs`)
   - ✅ Icons are larger (`w-4 h-4` instead of `w-3 h-3`)
   - ✅ "Skipped" indicator with orange color is present

---

## 📋 Summary of Changes

### **Files Modified:**
- `src/components/practice/AdaptivePracticeInterface.tsx`

### **State Added:**
```typescript
const [skippedQuestions, setSkippedQuestions] = useState<Set<string>>(new Set())
```

### **Functions Updated:**
1. **`handleSkipQuestion`** - Tracks skipped questions
2. **Question Minimap (Sidebar)** - Shows orange for skipped
3. **Status Legend** - Added skipped indicator, increased text size
4. **End Session Dialog Grid** - Made buttons functional, shows skipped in orange

### **Visual Changes:**
- ✅ Skipped questions show in **orange** color
- ✅ Status legend text increased from `text-xs` to `text-sm`
- ✅ Status legend icons increased from `w-3 h-3` to `w-4 h-4`
- ✅ Added "Skipped" indicator to legend
- ✅ End Session dialog buttons now clickable and functional

### **Behavior Changes:**
- ✅ Clicking "Skip" marks question as skipped
- ✅ Skipped questions visually distinct in minimap
- ✅ End Session dialog buttons navigate to questions
- ✅ Clicking dialog button closes dialog and jumps to question
- ✅ All question grids work consistently

---

## 🎉 Benefits

### **1. Clear Visual Feedback**
- Users can instantly see which questions were skipped
- Orange color is distinct from other states
- Easy to identify questions to revisit

### **2. Better Navigation**
- End Session dialog buttons are now functional
- Click any question to jump to it
- Seamless navigation between questions

### **3. Improved UX**
- Larger, more readable status legend
- Consistent behavior across all question grids
- Clear indication of question states

### **4. Complete Tracking**
- System tracks: answered, marked, skipped, unanswered
- All states visually represented
- Easy to review session progress

---

**All skipped questions are now tracked and displayed with orange color indicators!** 🟠✨
