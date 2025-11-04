-- ============================================================
-- TEST SUBCATEGORY SLUG IMPORT
-- ============================================================
-- This script helps debug and test the subcategory slug import
-- ============================================================

-- Check if subcategory_slug column exists
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'questions'
  AND column_name = 'subcategory_slug';

-- Check if trigger exists
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table = 'questions'
  AND trigger_name = 'trigger_lookup_subcategory_id_from_slug';

-- Test the trigger function with a sample subcategory slug
-- First, let's see what subcategory slugs exist
SELECT slug, name, id
FROM subcategories
ORDER BY slug
LIMIT 10;

-- Test insert with subcategory_slug (this will fail if trigger doesn't work)
-- Replace 'your-subcategory-slug' with an actual slug from above
/*
INSERT INTO questions (
  question_text,
  question_type,
  difficulty,
  option_a,
  option_b,
  correct_answer,
  explanation,
  marks,
  subcategory_slug
) VALUES (
  'Test question',
  'mcq',
  'easy',
  'Option A',
  'Option B',
  'A',
  'Test explanation',
  1,
  'your-subcategory-slug'  -- Replace with actual slug
);
*/

