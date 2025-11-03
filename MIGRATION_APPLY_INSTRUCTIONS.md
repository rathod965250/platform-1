# How to Apply Migration 006 - Onboarding Lookup Tables

## Issue
The tables (colleges, companies, graduation_years, courses) are not appearing in your database.

## Solution
Apply the migration manually through the Supabase Dashboard.

## Step-by-Step Instructions

### Option 1: Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy and Paste Migration**
   - Open the file: `supabase/migrations/006_add_onboarding_lookup_tables.sql`
   - Copy the ENTIRE contents
   - Paste into the SQL Editor

4. **Run the Migration**
   - Click "Run" button (or press Ctrl+Enter)
   - Wait for execution to complete

5. **Verify Tables Created**
   - Go to "Table Editor" in left sidebar
   - You should see these tables:
     - ✅ `colleges`
     - ✅ `companies`
     - ✅ `graduation_years`
     - ✅ `courses`

### Option 2: Supabase CLI (If Installed)

```bash
# Navigate to your project directory
cd c:\Users\ratho\OneDrive\Desktop\platform

# Apply all pending migrations
supabase db push

# Or apply specific migration
supabase migration up
```

### Option 3: Direct SQL Execution

If you have direct database access, you can execute the SQL file directly:

```bash
# Using psql (if installed)
psql -h [your-db-host] -U postgres -d postgres -f supabase/migrations/006_add_onboarding_lookup_tables.sql
```

## What This Migration Does

1. **Creates 4 New Tables:**
   - `colleges` - College/university options
   - `companies` - Target company options  
   - `graduation_years` - Graduation year options
   - `courses` - Course/degree options

2. **Adds User Submission Support:**
   - `is_user_submitted` - Marks user-added entries
   - `submitted_by` - Tracks who added it

3. **Sets Up Security:**
   - Row Level Security (RLS) policies
   - Public read access
   - Authenticated users can add entries
   - Admins can manage all

4. **Enables Real-time:**
   - Subscribes tables to Supabase Realtime
   - Changes appear instantly

5. **Seeds Initial Data:**
   - 28 companies (TCS, Infosys, Microsoft, Google, etc.)
   - 10 colleges (IIT Delhi, IIT Bombay, NIT Warangal, etc.)
   - 9 courses (CSE, IT, ECE, MBA, etc.)
   - 10 graduation years (current year + next 9 years)

6. **Adds Course Reference:**
   - Adds `course_id` column to `profiles` table

## Troubleshooting

### Error: "table already exists"
- The tables might already exist from a previous migration
- Check Table Editor to see if they're there
- If they exist but are empty, the INSERT statements will populate them

### Error: "permission denied"
- Make sure you're using the correct database connection
- Use the SQL Editor in Supabase Dashboard (it has proper permissions)

### Error: "publication does not exist"
- This is OK - the realtime publication is managed by Supabase
- The migration handles this gracefully with error handling

### Tables Created But Empty
- The INSERT statements use `ON CONFLICT DO NOTHING`
- If data exists, it won't duplicate
- Check if tables have data:
  ```sql
  SELECT COUNT(*) FROM colleges;
  SELECT COUNT(*) FROM companies;
  SELECT COUNT(*) FROM courses;
  SELECT COUNT(*) FROM graduation_years;
  ```

## After Migration

1. **Refresh Your App**
   - The onboarding form should now show:
     - College dropdown with options
     - Company selection grid
     - Course dropdown
     - Graduation year dropdown

2. **Test User Submissions**
   - Add a custom college → Should save to database
   - Add a custom company → Should save to database
   - Refresh page → Custom entries should appear

3. **Verify Real-time Updates**
   - Open onboarding form in two browsers
   - Add entry in one → Should appear in other

## Need Help?

If tables still don't appear after following these steps:
1. Check Supabase Dashboard logs for errors
2. Verify you have proper permissions
3. Try running the SQL statements one section at a time
4. Check that your Supabase project is active and connected

