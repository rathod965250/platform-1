# Debug: Practice Session Ending Prematurely

## 🐛 Issue Description

**Problem:** The practice session is redirecting to the summary page saying "test has been completed" even though only half the questions have been attempted. This happens when clicking the Submit button.

**Expected:** Should be able to answer all questions before session ends.

---

## 🔍 Debugging Steps

### **Step 1: Open Browser Console (F12)**

Before starting a practice session, open the browser console to see detailed logs.

### **Step 2: Start a Practice Session**

1. Configure practice (e.g., 30 questions, 6 topics)
2. Start the session
3. Watch console for:
   ```
   === QUESTION LOADING DEBUG ===
   Selected topics: 6
   Requested questions: 30
   Available questions per topic:
     - Topic 1: X questions
     - Topic 2: Y questions
     ...
   Final distribution: { ... }
   Total questions loaded: 30
   ```

### **Step 3: Answer First Question**

1. Select an answer
2. Click "Submit"
3. **Check console logs:**
   ```
   === SUBMIT ANSWER CLICKED ===
   Current question index: 0
   Total questions: 30
   Questions remaining: 29
   ```

### **Step 4: Click "Next"**

1. Click the "Next" button
2. **Check console logs:**
   ```
   === NEXT BUTTON CLICKED ===
   Current question index: 0
   Total questions: 30
   Is last question? false
   
   === FETCH NEXT QUESTION ===
   Current index: 0
   Next index: 1
   Total questions: 30
   Answered so far: 1
   Moving to question 2 of 30
   ```

### **Step 5: Identify the Problem**

Look for these warning signs in the console:

#### **❌ Problem 1: Wrong Total Questions**
```
Total questions loaded: 5  ← Should be 30!
```
**Cause:** Question loading failed or limited incorrectly

#### **❌ Problem 2: Index Mismatch**
```
Current index: 4
Total questions: 5
Is last question? true  ← After only 5 questions!
```
**Cause:** Not enough questions loaded

#### **❌ Problem 3: Premature Completion**
```
✅ All questions completed! Showing end session dialog
```
**Appearing too early**

---

## 🔧 Common Causes & Fixes

### **Cause 1: Not Enough Questions in Database**

**Symptoms:**
```
Available questions per topic:
  - Topic 1: 2 questions  ← Too few!
  - Topic 2: 3 questions
  - Topic 3: 0 questions  ← No questions!
```

**Fix:**
- Check database for questions in selected topics
- Run this SQL query:
```sql
SELECT 
  s.name as subcategory,
  COUNT(q.id) as question_count
FROM subcategories s
LEFT JOIN questions q ON q.subcategory_id = s.id
WHERE s.category_id = 'YOUR_CATEGORY_ID'
GROUP BY s.id, s.name
ORDER BY s.name;
```

**Expected:** Each topic should have at least 5-10 questions

### **Cause 2: Question Loading Logic Issue**

**Symptoms:**
```
Requested questions: 30
Total questions loaded: 10  ← Mismatch!
```

**Check:**
1. Are there enough questions in the database?
2. Is the distribution logic working correctly?

**Debug:**
Look at the "Final distribution" log:
```
Final distribution: {
  "Topic 1": 5,
  "Topic 2": 3,
  "Topic 3": 2
}
Total questions loaded: 10
```

If total < requested, not enough questions available.

### **Cause 3: State Corruption**

**Symptoms:**
- `allQuestions.length` changes unexpectedly
- `currentQuestionIndex` jumps to wrong value

**Check:**
```javascript
// Should stay constant after loading
console.log('Total questions:', allQuestions.length)

// Should increment by 1 each time
console.log('Current index:', currentQuestionIndex)
```

---

## 📊 Expected Console Flow

### **Normal Flow (30 Questions):**

```
1. Loading Questions:
   === QUESTION LOADING DEBUG ===
   Requested questions: 30
   Total questions loaded: 30
   ✅

2. First Question:
   === SUBMIT ANSWER CLICKED ===
   Current question index: 0
   Total questions: 30
   Questions remaining: 29
   ✅

3. Moving to Next:
   === NEXT BUTTON CLICKED ===
   Current index: 0
   Total questions: 30
   Is last question? false
   ✅
   
   === FETCH NEXT QUESTION ===
   Moving to question 2 of 30
   ✅

4. Continue...
   (Repeat for questions 2-29)

5. Last Question (Question 30):
   === SUBMIT ANSWER CLICKED ===
   Current question index: 29
   Total questions: 30
   Questions remaining: 0
   ✅

6. After Last Question:
   === NEXT BUTTON CLICKED ===
   Current index: 29
   Total questions: 30
   Is last question? true
   ✅
   
   === FETCH NEXT QUESTION ===
   Next index: 30
   Total questions: 30
   ✅ All questions completed! Showing end session dialog
   ✅
```

### **Problem Flow (Ends Early):**

```
1. Loading Questions:
   === QUESTION LOADING DEBUG ===
   Requested questions: 30
   Total questions loaded: 5  ❌ PROBLEM!
   
2. After 5 Questions:
   === NEXT BUTTON CLICKED ===
   Current index: 4
   Total questions: 5  ❌ Should be 30!
   Is last question? true  ❌ Too early!
   
3. Premature End:
   ✅ All questions completed! Showing end session dialog
   ❌ Only answered 5 of 30!
```

---

## 🛠️ Fixes Applied

### **1. Added Comprehensive Logging**

Now you can see exactly what's happening at each step:
- When Submit is clicked
- When Next is clicked
- When moving to next question
- When session ends

### **2. Safeguards Added**

```typescript
// Prevents calling fetchNextQuestion when questions not loaded
if (!questionsLoaded || allQuestions.length === 0) {
  console.warn('⚠️ fetchNextQuestion called but questions not loaded')
  return
}
```

### **3. Better End Detection**

```typescript
if (nextIndex >= allQuestions.length) {
  console.log('✅ All questions completed! Showing end session dialog')
  // Shows dialog instead of auto-redirecting
}
```

---

## 🧪 Testing Procedure

### **Test 1: Full Session**

1. Start practice with 30 questions
2. Answer all 30 questions
3. **Check:**
   - ✅ Console shows "Total questions loaded: 30"
   - ✅ Can answer all 30 questions
   - ✅ End dialog appears after question 30
   - ✅ Summary shows 30 questions

### **Test 2: Early End**

1. Start practice with 30 questions
2. Click "End Session" button after 10 questions
3. **Check:**
   - ✅ Dialog appears
   - ✅ Shows 10 attempted, 20 not attempted
   - ✅ Can continue or end

### **Test 3: Topic Without Questions**

1. Select a topic with no questions
2. Try to start practice
3. **Check:**
   - ✅ Console shows "0 questions" for that topic
   - ✅ Either warns user or excludes that topic

---

## 📋 Checklist

Before reporting the issue persists:

- [ ] Opened browser console (F12)
- [ ] Started a new practice session
- [ ] Checked "Total questions loaded" in console
- [ ] Noted when session ends prematurely
- [ ] Copied all console logs
- [ ] Checked database for question counts
- [ ] Verified selected topics have questions

---

## 🎯 Quick Diagnosis

**Run this in browser console after starting practice:**

```javascript
// Check current state
console.log({
  totalQuestions: allQuestions?.length,
  currentIndex: currentQuestionIndex,
  questionsLoaded: questionsLoaded,
  answered: questionHistory?.filter(q => q.hasAnswer).length
})
```

**Expected Output:**
```javascript
{
  totalQuestions: 30,      // Should match what you selected
  currentIndex: 0-29,      // Should be within range
  questionsLoaded: true,   // Should be true
  answered: 0-30           // Should increment as you answer
}
```

---

## 🆘 If Problem Persists

### **Collect This Information:**

1. **Console Logs:**
   - Copy ALL logs from browser console
   - Include from page load to premature end

2. **Configuration:**
   - How many questions selected?
   - How many topics selected?
   - Which category?

3. **Database Check:**
   ```sql
   -- Run in Supabase SQL Editor
   SELECT 
     c.name as category,
     s.name as subcategory,
     COUNT(q.id) as question_count
   FROM categories c
   JOIN subcategories s ON s.category_id = c.id
   LEFT JOIN questions q ON q.subcategory_id = s.id
   GROUP BY c.id, c.name, s.id, s.name
   ORDER BY c.name, s.name;
   ```

4. **Behavior:**
   - Does it happen every time?
   - Does it happen with specific topics?
   - Does it happen with specific question counts?

---

## 💡 Most Likely Causes

1. **Not enough questions in database** (80% of cases)
   - Selected 30 questions but only 10 exist
   - Solution: Add more questions or select fewer

2. **Topic has no questions** (15% of cases)
   - Selected a topic with 0 questions
   - Solution: Deselect that topic or add questions

3. **State corruption** (5% of cases)
   - React state gets out of sync
   - Solution: Refresh page and try again

---

## 🎉 Success Indicators

After fix, you should see:

✅ **Console shows:**
```
Total questions loaded: 30
```

✅ **Can answer all questions:**
- Question 1/30
- Question 2/30
- ...
- Question 30/30

✅ **End dialog appears only after last question**

✅ **Summary shows correct stats:**
- Total: 30
- Attempted: 30
- Correct/Incorrect counts match

---

**With the new logging, we can now see exactly where and why the session is ending prematurely!** 🔍
