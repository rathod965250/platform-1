# Supabase Setup Guide

This directory contains the database migrations and Edge Functions for the Aptitude Preparation Platform.

## Prerequisites

1. Create a Supabase account at [supabase.com](https://supabase.com)
2. Create a new project in Supabase
3. Install Supabase CLI: `npm install -g supabase`

## Database Setup

### Method 1: Using Supabase Dashboard (Recommended for beginners)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy the entire contents of `migrations/001_initial_schema.sql`
5. Paste it into the SQL Editor
6. Click "Run" to execute the migration

### Method 2: Using Supabase CLI

1. Initialize Supabase in your project (if not already done):
```bash
supabase init
```

2. Link to your Supabase project:
```bash
supabase link --project-ref your-project-ref
```

3. Push the migration:
```bash
supabase db push
```

## What the Migration Creates

### Tables

1. **profiles** - User profiles linked to Supabase Auth
2. **categories** - Main aptitude categories (5 categories)
3. **subcategories** - Subcategories for each category
4. **tests** - Test definitions (practice, mock, company-specific)
5. **questions** - Question bank with multiple question types
6. **practice_sessions** - Records of practice sessions
7. **session_answers** - Answers for practice sessions
8. **test_attempts** - Records of test attempts
9. **attempt_answers** - Answers for test attempts
10. **user_analytics** - User performance analytics
11. **leaderboard** - Leaderboard rankings

### Row Level Security (RLS) Policies

All tables have RLS enabled with appropriate policies:

- **Students** can:
  - View and update their own profile
  - View published categories, tests, and questions
  - Create and view their own practice sessions and test attempts
  - View their own analytics

- **Admins** can:
  - View all profiles
  - Full CRUD on categories, subcategories, tests, and questions
  - Publish/unpublish tests

- **Public** can:
  - View published categories and tests
  - View leaderboard

### Automatic Triggers

1. **Auto-create profile**: When a user signs up through Supabase Auth, a profile is automatically created in the `profiles` table
2. **Update timestamps**: `updated_at` fields are automatically updated on record updates

### Seed Data

The migration includes initial seed data:
- 5 main categories: Quantitative Aptitude, Logical Reasoning, Verbal Ability, Data Interpretation, Problem Solving
- 20+ subcategories across all categories

## Environment Variables

After setting up your Supabase project, add these to your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Find these values in:
- Supabase Dashboard → Project Settings → API

## Authentication Setup

### Enable Email/Password Authentication

1. Go to **Authentication** → **Providers** in your Supabase dashboard
2. Enable **Email** provider
3. Configure email templates if needed

### Enable Google OAuth (Optional)

1. Go to **Authentication** → **Providers**
2. Enable **Google** provider
3. Add your Google OAuth credentials:
   - Create OAuth credentials in [Google Cloud Console](https://console.cloud.google.com/)
   - Add authorized redirect URIs:
     - `https://your-project-ref.supabase.co/auth/v1/callback`
     - `http://localhost:3000/auth/callback` (for development)
4. Copy Client ID and Client Secret to Supabase

## Creating an Admin User

After signing up your first user:

1. Go to **Authentication** → **Users** in Supabase dashboard
2. Find your user
3. Go to **SQL Editor** and run:

```sql
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
```

## Testing the Setup

Run these queries in the SQL Editor to verify:

```sql
-- Check categories
SELECT * FROM categories ORDER BY "order";

-- Check subcategories
SELECT c.name as category, s.name as subcategory 
FROM subcategories s 
JOIN categories c ON s.category_id = c.id 
ORDER BY c."order", s."order";

-- Check your profile
SELECT * FROM profiles WHERE email = 'your-email@example.com';
```

## Edge Functions

Edge Functions will be added in future updates for:
- Analytics calculation
- AI recommendations
- Leaderboard updates

## Troubleshooting

### Issue: RLS policies blocking requests

**Solution**: Make sure you're authenticated and the user's profile exists in the `profiles` table. The trigger should create it automatically on signup.

### Issue: Cannot insert data

**Solution**: Check that RLS policies allow the operation. Students can only insert their own data, while admins have full access.

### Issue: Migration fails

**Solution**: 
1. Make sure you're using PostgreSQL 14+
2. Check for syntax errors in the SQL
3. Ensure the `auth.users` table exists (it should be created by Supabase automatically)

## Next Steps

1. Verify all tables and policies are created
2. Create your admin user
3. Start adding test content through the admin panel
4. Test authentication flow in your Next.js app

## Support

For issues related to:
- **Supabase setup**: Check [Supabase Documentation](https://supabase.com/docs)
- **Application issues**: Check the main README.md

