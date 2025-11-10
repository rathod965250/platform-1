# RLS Policy Fix for Auto-Save ✅

## 🐛 Error

```
Error: new row violates row-level security policy (USING expression) for table "attempt_answers"
```

---

## 🔍 Root Cause

### The Problem

**Row Level Security (RLS)** policies control who can read/write data in Supabase tables.

The `attempt_answers` table had policies for:
- ✅ **SELECT** (read) - Users can view their own answers
- ✅ **INSERT** (create) - Users can insert their own answers
- ❌ **UPDATE** (modify) - **MISSING!**

### Why This Matters for Auto-Save

Our auto-save uses **upsert** which requires:
1. **INSERT** permission - To create new answers
2. **UPDATE** permission - To modify existing answers

**Without UPDATE policy**: Upsert fails when trying to update existing answers!

---

## ✅ Solution

### Created UPDATE Policy

**File**: `supabase/migrations/20251111_add_attempt_answers_update_policy.sql`

```sql
CREATE POLICY "Users can update own attempt answers" ON attempt_answers
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 
      FROM test_attempts 
      WHERE test_attempts.id = attempt_answers.attempt_id 
        AND test_attempts.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM test_attempts 
      WHERE test_attempts.id = attempt_answers.attempt_id 
        AND test_attempts.user_id = auth.uid()
    )
  );
```

---

## 🎯 How It Works

### Policy Logic

```
User tries to update answer
  ↓
Check: Does the attempt belong to this user?
  ↓
Query: SELECT FROM test_attempts 
       WHERE attempt_id = [answer's attempt_id]
       AND user_id = [current user]
  ↓
Found? → Allow UPDATE ✅
Not found? → Deny UPDATE ❌
```

### Security

**Ensures**:
- ✅ Users can only update their own answers
- ✅ Users cannot update other users' answers
- ✅ Users cannot update answers for attempts they don't own
- ✅ Maintains data integrity

---

## 📊 Complete RLS Policies for attempt_answers

### 1. SELECT Policy (Existing)
```sql
CREATE POLICY "Users can view own attempt answers" ON attempt_answers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM test_attempts 
            WHERE test_attempts.id = attempt_answers.attempt_id 
            AND test_attempts.user_id = auth.uid())
  );
```
**Purpose**: Users can view their own answers

---

### 2. INSERT Policy (Existing)
```sql
CREATE POLICY "Users can insert own attempt answers" ON attempt_answers
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM test_attempts 
            WHERE test_attempts.id = attempt_answers.attempt_id 
            AND test_attempts.user_id = auth.uid())
  );
```
**Purpose**: Users can create new answers

---

### 3. UPDATE Policy (NEW!)
```sql
CREATE POLICY "Users can update own attempt answers" ON attempt_answers
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM test_attempts 
            WHERE test_attempts.id = attempt_answers.attempt_id 
            AND test_attempts.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM test_attempts 
            WHERE test_attempts.id = attempt_answers.attempt_id 
            AND test_attempts.user_id = auth.uid())
  );
```
**Purpose**: Users can update their existing answers ✅

---

## 🔧 How to Apply

### Option 1: Supabase CLI (Recommended)

```bash
cd c:\Users\ratho\Downloads\platform-1-1
supabase db push
```

This will apply all pending migrations including the new UPDATE policy.

---

### Option 2: Supabase Dashboard

1. Go to **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Copy the contents of `20251111_add_attempt_answers_update_policy.sql`
4. Paste and **Run** the SQL
5. Verify: Check **Database** → **Policies** → `attempt_answers` table

---

### Option 3: Manual SQL

Run this SQL in Supabase SQL Editor:

```sql
-- Add UPDATE policy for attempt_answers
CREATE POLICY "Users can update own attempt answers" ON attempt_answers
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 
      FROM test_attempts 
      WHERE test_attempts.id = attempt_answers.attempt_id 
        AND test_attempts.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM test_attempts 
      WHERE test_attempts.id = attempt_answers.attempt_id 
        AND test_attempts.user_id = auth.uid()
    )
  );
```

---

## ✅ Verification

### Check if Policy Exists

**SQL Query**:
```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'attempt_answers';
```

**Expected Result**: Should see 3 policies:
1. "Users can view own attempt answers" (SELECT)
2. "Users can insert own attempt answers" (INSERT)
3. "Users can update own attempt answers" (UPDATE) ← NEW!

---

### Test Auto-Save

1. **Start a test**
2. **Answer a question**
3. **Wait 5 seconds** (auto-save)
4. **Check console**: Should see "✅ Auto-saved X answer(s)"
5. **Change answer**
6. **Wait 5 seconds** (auto-save update)
7. **Check console**: Should see "✅ Auto-saved X answer(s)" (no RLS error)

---

## 🐛 Troubleshooting

### Issue: Still Getting RLS Error

**Possible Causes**:
1. Migration not applied
2. Policy not created
3. User not authenticated

**Solutions**:

#### 1. Verify Migration Applied
```sql
SELECT * FROM supabase_migrations.schema_migrations
WHERE version = '20251111_add_attempt_answers_update_policy';
```

#### 2. Verify Policy Exists
```sql
SELECT * FROM pg_policies 
WHERE tablename = 'attempt_answers' 
  AND policyname = 'Users can update own attempt answers';
```

#### 3. Check User Authentication
```typescript
// In browser console
const { data: { user } } = await supabase.auth.getUser()
console.log('User:', user?.id)
```

---

### Issue: Policy Exists But Still Fails

**Check Attempt Ownership**:
```sql
-- Replace with actual IDs
SELECT 
  ta.id as attempt_id,
  ta.user_id,
  auth.uid() as current_user,
  (ta.user_id = auth.uid()) as is_owner
FROM test_attempts ta
WHERE ta.id = 'your-attempt-id';
```

**Should show**: `is_owner = true`

---

## 📊 Before vs After

### Before (Missing UPDATE Policy)

```
User changes answer
  ↓
Auto-save triggers upsert
  ↓
Upsert tries to UPDATE existing record
  ↓
RLS blocks UPDATE (no policy)
  ↓
❌ Error: "violates row-level security policy"
```

---

### After (With UPDATE Policy)

```
User changes answer
  ↓
Auto-save triggers upsert
  ↓
Upsert tries to UPDATE existing record
  ↓
RLS checks: Does attempt belong to user?
  ↓
Yes → Allow UPDATE ✅
  ↓
✅ Auto-saved successfully
```

---

## 🎯 Benefits

1. **Auto-save works** - Can update existing answers
2. **Security maintained** - Users can only update their own answers
3. **Upsert functional** - Both INSERT and UPDATE work
4. **No workarounds needed** - Proper solution
5. **Standard practice** - Follows Supabase conventions

---

## 📝 Summary

### What Was Added

**File**: `supabase/migrations/20251111_add_attempt_answers_update_policy.sql`

**Policy**: "Users can update own attempt answers"

**Purpose**: Allow users to update their own test answers during auto-save

**Security**: Only allows updates to answers from user's own attempts

---

### Required Actions

1. ✅ **Apply migration** - Run `supabase db push` or execute SQL
2. ✅ **Verify policy** - Check it exists in database
3. ✅ **Test auto-save** - Confirm no more RLS errors

---

### Status

- ✅ **Migration created** - Ready to apply
- ⚠️ **Migration pending** - Needs to be applied
- ⏳ **Waiting** - For you to run migration

---

## 🚀 Next Steps

1. **Apply the migration**:
   ```bash
   supabase db push
   ```

2. **Test auto-save**:
   - Start a test
   - Answer questions
   - Change answers
   - Verify no RLS errors

3. **Verify in console**:
   ```
   ✅ Auto-saved 5 answer(s) at 12:46:30 AM
   ```

---

**Migration Created**: November 11, 2025, 12:46 AM
**Status**: ⚠️ Pending Application
**Action Required**: Run migration
**File**: `20251111_add_attempt_answers_update_policy.sql`
