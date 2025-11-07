# How to Test the Practice Summary Page

## Quick Test Steps

### 1. Start Practice Session
```
1. Go to Dashboard
2. Click on any category (e.g., "Quantitative Aptitude")
3. Select 2-3 topics
4. Set question count to 10-15
5. Click "Start Adaptive Practice"
```

### 2. Answer Questions
```
1. Answer at least 5-10 questions
2. Get some correct ✅
3. Get some incorrect ❌
4. Mark 1-2 questions for review 🔖
5. Skip 1-2 questions ⏭️
```

### 3. Check Console Logs
Open browser console (F12) and look for:
```
✅ "Answer saved to user_metrics successfully"
✅ "Answer submitted successfully"
```

### 4. End Session
```
1. Click "End Session" button (top right or sidebar)
2. Confirm in dialog
3. Check console for: "Session data saved"
4. Should redirect to summary page
```

### 5. Verify Summary Page Data

#### Check These Sections:

**A. Hero Card (Top)**
- [ ] Shows achievement message based on your performance
- [ ] Displays correct accuracy percentage
- [ ] Shows category name

**B. Key Metrics (4 Cards)**
- [ ] **Correct**: Matches number of correct answers
- [ ] **Incorrect**: Matches number of wrong answers
- [ ] **Accuracy**: Calculated correctly (Correct / Attempted × 100)
- [ ] **Total Time**: Shows actual session time

**C. Time Analysis Card**
- [ ] **Minimum Time**: Shows fastest answer time
- [ ] **Average Time**: Shows average per question
- [ ] **Maximum Time**: Shows slowest answer time
- [ ] Bar chart displays these times

**D. Difficulty Breakdown Card**
- [ ] **Easy**: Shows questions you answered at easy level
- [ ] **Medium**: Shows medium difficulty questions
- [ ] **Hard**: Shows hard difficulty questions
- [ ] Accuracy percentage for each level
- [ ] Bar chart shows correct vs incorrect

**E. Performance Pie Chart**
- [ ] Shows distribution of:
  - Correct (green)
  - Incorrect (red)
  - Skipped (orange)
  - Not Attempted (gray)

**F. Weak Areas Card (Red Border)**
- [ ] Lists topics where you performed poorly (<50% accuracy)
- [ ] Shows question count per topic
- [ ] Shows accuracy percentage
- [ ] Progress bar indicates performance

**G. Strong Areas Card (Green Border)**
- [ ] Lists topics where you excelled (>70% accuracy)
- [ ] Shows question count per topic
- [ ] Shows accuracy percentage

**H. Topic Performance Radar Chart**
- [ ] Shows accuracy across different topics
- [ ] Interactive visualization

**I. Performance Trend Chart**
- [ ] Line chart showing correct/incorrect pattern
- [ ] Question-by-question progression

**J. AI Recommendations**
- [ ] Personalized study suggestions
- [ ] Based on your weak areas

**K. Question Review Section**
- [ ] Click to expand
- [ ] Shows all questions
- [ ] Your answers
- [ ] Correct answers
- [ ] Explanations
- [ ] Time taken per question

## What to Look For

### ✅ **GOOD SIGNS:**
1. Numbers match what you actually did
2. Charts show real data (not zeros or same values)
3. Topics listed are the ones you practiced
4. Time statistics are realistic
5. Each session shows DIFFERENT data

### ❌ **BAD SIGNS:**
1. All zeros or empty data
2. Same data for every session
3. Topics don't match what you selected
4. Time shows 0:00
5. No questions in review section

## Common Issues & Solutions

### Issue 1: Summary Shows All Zeros
**Cause**: Data not being saved
**Solution**: 
1. Check browser console for errors
2. Verify you're logged in
3. Check network tab for failed requests
4. Try answering questions again

### Issue 2: Same Data Every Time
**Cause**: Not creating new session
**Solution**:
1. Make sure you're starting a NEW practice session
2. Check that sessionId in URL is different each time
3. Verify practice_sessions table has new entries

### Issue 3: Topics Don't Match
**Cause**: question_topic not being fetched
**Solution**:
1. Check that questions table has question_topic column
2. Verify migration 024 is applied
3. Check console for SQL errors

### Issue 4: Time Shows 0:00
**Cause**: Timer not being saved
**Solution**:
1. Verify timer is running during practice
2. Check that time_taken_seconds is being saved
3. Look for "Session data saved" in console

## Database Verification

If summary page still shows dummy data, check database directly:

### Check practice_sessions:
```sql
SELECT 
  id,
  total_questions,
  correct_answers,
  incorrect_answers,
  time_taken_seconds,
  completed_at
FROM practice_sessions
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC
LIMIT 5;
```

### Check user_metrics:
```sql
SELECT 
  session_id,
  question_id,
  is_correct,
  time_taken_seconds,
  difficulty,
  created_at
FROM user_metrics
WHERE session_id = 'YOUR_SESSION_ID'
ORDER BY created_at;
```

### Expected Results:
- **practice_sessions**: Should have row with your session_id and non-null values
- **user_metrics**: Should have rows for each question you answered

## Success Criteria

The summary page is working correctly if:

1. ✅ **Data is Dynamic**: Each session shows different statistics
2. ✅ **Numbers are Accurate**: Matches what you actually did
3. ✅ **Topics are Correct**: Shows topics you practiced
4. ✅ **Time is Real**: Shows actual time spent
5. ✅ **Charts Display Data**: Not empty or all zeros
6. ✅ **Question Review Works**: Shows all your answers
7. ✅ **Weak/Strong Areas**: Based on your performance
8. ✅ **Recommendations**: Relevant to your weak areas

## Quick Verification Script

Run this in browser console on summary page:

```javascript
// Check if data is loaded
console.log('Session Data:', {
  totalQuestions: document.querySelector('[data-test="total-questions"]')?.textContent,
  correctAnswers: document.querySelector('[data-test="correct-answers"]')?.textContent,
  accuracy: document.querySelector('[data-test="accuracy"]')?.textContent,
});

// Check if charts are rendered
console.log('Charts:', {
  difficultyChart: !!document.querySelector('.recharts-wrapper'),
  pieChart: !!document.querySelector('.recharts-pie'),
});

// Check if topics are listed
console.log('Topics:', {
  weakAreas: document.querySelectorAll('[data-test="weak-area"]').length,
  strongAreas: document.querySelectorAll('[data-test="strong-area"]').length,
});
```

## Need Help?

If summary page still shows dummy data after following this guide:

1. Check browser console for errors
2. Check network tab for failed API calls
3. Verify database has data (use SQL queries above)
4. Check that all migrations are applied
5. Restart development server
6. Clear browser cache and try again

## Summary

The practice summary page should now:
- ✅ Show real data from your practice session
- ✅ Update dynamically for each new session
- ✅ Display accurate statistics and analytics
- ✅ Provide meaningful insights and recommendations

**Test it now and verify everything works!** 🚀
