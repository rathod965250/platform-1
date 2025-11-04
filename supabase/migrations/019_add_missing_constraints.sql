-- ============================================================
-- ADD MISSING DATABASE CONSTRAINTS
-- ============================================================
-- This migration adds missing constraints to match frontend validation
-- and ensure data integrity
-- ============================================================

-- ============================================================
-- QUESTIONS TABLE CONSTRAINTS
-- ============================================================

-- Add CHECK constraint for minimum question_text length (matches frontend: min 10)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'questions_question_text_min_length'
  ) THEN
    ALTER TABLE questions
    ADD CONSTRAINT questions_question_text_min_length 
    CHECK (char_length(question_text) >= 10);
  END IF;
END $$;

-- Add CHECK constraint for minimum explanation length (matches frontend: min 10)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'questions_explanation_min_length'
  ) THEN
    ALTER TABLE questions
    ADD CONSTRAINT questions_explanation_min_length 
    CHECK (char_length(explanation) >= 10);
  END IF;
END $$;

-- Add CHECK constraint for minimum marks (matches frontend: min 1)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'questions_marks_min'
  ) THEN
    ALTER TABLE questions
    ADD CONSTRAINT questions_marks_min 
    CHECK (marks >= 1);
  END IF;
END $$;

-- Add CHECK constraint for options JSONB structure
-- MCQ: must have 'options' array with at least 2 items
-- True/False: must have 'options' array with ['True', 'False']
-- Fill Blank: must have 'acceptableAnswers' array
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'questions_options_structure'
  ) THEN
    ALTER TABLE questions
    ADD CONSTRAINT questions_options_structure 
    CHECK (
      -- MCQ validation
      (question_type = 'mcq' AND 
       options ? 'options' AND 
       jsonb_typeof(options->'options') = 'array' AND
       jsonb_array_length(options->'options') >= 2 AND
       jsonb_array_length(options->'options') <= 10)
      OR
      -- True/False validation
      (question_type = 'true_false' AND 
       options ? 'options' AND 
       jsonb_typeof(options->'options') = 'array' AND
       options->'options' = '["True", "False"]'::jsonb)
      OR
      -- Fill Blank validation
      (question_type = 'fill_blank' AND 
       options ? 'acceptableAnswers' AND 
       jsonb_typeof(options->'acceptableAnswers') = 'array' AND
       jsonb_array_length(options->'acceptableAnswers') >= 1)
    );
  END IF;
END $$;

-- ============================================================
-- TESTS TABLE CONSTRAINTS
-- ============================================================

-- Add CHECK constraint for minimum title length (matches frontend: min 3)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'tests_title_min_length'
  ) THEN
    ALTER TABLE tests
    ADD CONSTRAINT tests_title_min_length 
    CHECK (char_length(title) >= 3);
  END IF;
END $$;

-- Add CHECK constraint for minimum slug length (matches frontend: min 3)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'tests_slug_min_length'
  ) THEN
    ALTER TABLE tests
    ADD CONSTRAINT tests_slug_min_length 
    CHECK (char_length(slug) >= 3);
  END IF;
END $$;

-- Add CHECK constraint for slug format (lowercase with hyphens only)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'tests_slug_format'
  ) THEN
    ALTER TABLE tests
    ADD CONSTRAINT tests_slug_format 
    CHECK (slug ~ '^[a-z0-9-]+$');
  END IF;
END $$;

-- Add CHECK constraint for minimum duration (matches frontend: min 1)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'tests_duration_min'
  ) THEN
    ALTER TABLE tests
    ADD CONSTRAINT tests_duration_min 
    CHECK (duration_minutes >= 1);
  END IF;
END $$;

-- Add CHECK constraint for minimum total_marks (matches frontend: min 0)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'tests_total_marks_min'
  ) THEN
    ALTER TABLE tests
    ADD CONSTRAINT tests_total_marks_min 
    CHECK (total_marks >= 0);
  END IF;
END $$;

-- Add CHECK constraint: company_name required if test_type is company_specific
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'tests_company_specific_requires_company'
  ) THEN
    ALTER TABLE tests
    ADD CONSTRAINT tests_company_specific_requires_company 
    CHECK (
      (test_type != 'company_specific') OR 
      (test_type = 'company_specific' AND company_name IS NOT NULL AND char_length(company_name) > 0)
    );
  END IF;
END $$;

-- ============================================================
-- STUDENT_ASSIGNMENTS TABLE CONSTRAINTS
-- ============================================================

-- Ensure status values match CHECK constraint (already exists, but verify)
-- The status CHECK constraint is already in migration 016

-- Add CHECK constraint: completed_at can only be set if status is 'completed'
-- Only add this constraint if the table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'student_assignments'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'student_assignments_completed_at_status'
  ) THEN
    ALTER TABLE student_assignments
    ADD CONSTRAINT student_assignments_completed_at_status 
    CHECK (
      (completed_at IS NULL) OR 
      (completed_at IS NOT NULL AND status = 'completed')
    );
  END IF;
END $$;

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON CONSTRAINT questions_question_text_min_length ON questions IS 
  'Ensures question text is at least 10 characters (matches frontend validation)';

COMMENT ON CONSTRAINT questions_explanation_min_length ON questions IS 
  'Ensures explanation is at least 10 characters (matches frontend validation)';

COMMENT ON CONSTRAINT questions_marks_min ON questions IS 
  'Ensures marks is at least 1 (matches frontend validation)';

COMMENT ON CONSTRAINT questions_options_structure ON questions IS 
  'Validates options JSONB structure based on question type: MCQ (options array 2-10 items), True/False (options: ["True", "False"]), Fill Blank (acceptableAnswers array)';

COMMENT ON CONSTRAINT tests_title_min_length ON tests IS 
  'Ensures test title is at least 3 characters (matches frontend validation)';

COMMENT ON CONSTRAINT tests_slug_min_length ON tests IS 
  'Ensures test slug is at least 3 characters (matches frontend validation)';

COMMENT ON CONSTRAINT tests_slug_format ON tests IS 
  'Ensures test slug follows format: lowercase letters, numbers, and hyphens only (matches frontend validation)';

COMMENT ON CONSTRAINT tests_duration_min ON tests IS 
  'Ensures test duration is at least 1 minute (matches frontend validation)';

COMMENT ON CONSTRAINT tests_total_marks_min ON tests IS 
  'Ensures total marks is at least 0 (matches frontend validation)';

COMMENT ON CONSTRAINT tests_company_specific_requires_company ON tests IS 
  'Ensures company_name is provided when test_type is company_specific';

-- Add comment only if the constraint exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'student_assignments_completed_at_status'
  ) THEN
    COMMENT ON CONSTRAINT student_assignments_completed_at_status ON student_assignments IS 
      'Ensures completed_at can only be set when status is completed';
  END IF;
END $$;

