-- ============================================================
-- ADD QUESTION_TOPIC COLUMN AND SET QUESTION_TYPE DEFAULT
-- ============================================================
-- This migration adds support for descriptive topic names from CSV
-- while maintaining question_type for system logic.
-- 
-- Key Changes:
-- 1. Add question_topic column for descriptive topic names from CSV
-- 2. Set question_type default to 'mcq' for seamless imports
-- 3. Update existing records to have 'mcq' if question_type is NULL
-- 
-- This separation allows:
-- - question_topic: Descriptive analytics data (e.g., "Boats and Streams - Speed")
-- - question_type: System logic data (default: 'mcq', used for backend processing)
-- ============================================================

-- Add question_topic column for descriptive topic names from CSV
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'questions'
    AND column_name = 'question_topic'
  ) THEN
    ALTER TABLE questions
    ADD COLUMN question_topic TEXT;
    
    COMMENT ON COLUMN questions.question_topic IS 
      'Descriptive topic or category from CSV import (e.g., Boats and Streams - Speed Calculation). Used for analytics and topic-level tracking, separate from question_type which is used for system logic.';
  END IF;
END $$;

-- Set question_type default to 'mcq' for seamless CSV imports
-- This ensures all questions have a valid question_type even if not provided in CSV
DO $$
BEGIN
  -- Only alter if default is not already set
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'questions'
    AND column_name = 'question_type'
    AND column_default = '''mcq''::text'
  ) THEN
    ALTER TABLE questions
    ALTER COLUMN question_type SET DEFAULT 'mcq';
  END IF;
END $$;

-- Update existing records to have 'mcq' if question_type is NULL
-- This ensures data consistency for existing records
UPDATE questions
SET question_type = 'mcq'
WHERE question_type IS NULL;

-- Add descriptive comment for question_type column
COMMENT ON COLUMN questions.question_type IS 
  'Internal type field (default: mcq). Used for functional logic (mcq, true_false, fill_blank), not for topic labeling. For descriptive topic names, use question_topic instead.';

-- Note: The trigger lookup_subcategory_id_from_slug() already handles question_type normalization
-- but since we're now defaulting to 'mcq', the trigger will only normalize if a value is provided.
-- The question_topic column is independent and doesn't need normalization.

