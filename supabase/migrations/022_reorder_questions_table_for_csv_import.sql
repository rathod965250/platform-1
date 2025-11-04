-- ============================================================
-- REORDER QUESTIONS TABLE TO MATCH CSV IMPORT STRUCTURE
-- ============================================================
-- This migration ensures the questions table structure matches
-- the CSV import format exactly. Column order:
-- 1. question_text (question text)
-- 2. question_type (question type)
-- 3. difficulty (difficulty level)
-- 4. option_a (option a)
-- 5. option_b (option b)
-- 6. option_c (option c)
-- 7. option_d (option d)
-- 8. option_e (option e)
-- 9. correct_answer (correct answer)
-- 10. explanation (explanation)
-- 11. solution_steps (solution steps)
-- 12. hints (hints)
-- 13. formula_used (formula used)
-- 14. marks (marks)
-- ============================================================

-- First, ensure all required columns exist
DO $$
BEGIN
  -- Add option columns if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'questions' AND column_name = 'option_a') THEN
    ALTER TABLE questions ADD COLUMN option_a TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'questions' AND column_name = 'option_b') THEN
    ALTER TABLE questions ADD COLUMN option_b TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'questions' AND column_name = 'option_c') THEN
    ALTER TABLE questions ADD COLUMN option_c TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'questions' AND column_name = 'option_d') THEN
    ALTER TABLE questions ADD COLUMN option_d TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'questions' AND column_name = 'option_e') THEN
    ALTER TABLE questions ADD COLUMN option_e TEXT;
  END IF;
  
  -- Add new detail columns if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'questions' AND column_name = 'solution_steps') THEN
    ALTER TABLE questions ADD COLUMN solution_steps TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'questions' AND column_name = 'hints') THEN
    ALTER TABLE questions ADD COLUMN hints TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'questions' AND column_name = 'formula_used') THEN
    ALTER TABLE questions ADD COLUMN formula_used TEXT;
  END IF;
END $$;

-- Create a new table with the correct column order
CREATE TABLE IF NOT EXISTS questions_new (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
  subcategory_id UUID REFERENCES subcategories(id) ON DELETE CASCADE NOT NULL,
  -- Columns in CSV import order:
  question_text TEXT NOT NULL,                    -- 1. question text
  question_type TEXT NOT NULL CHECK (question_type IN ('mcq', 'true_false', 'fill_blank')), -- 2. question type
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')), -- 3. difficulty level
  option_a TEXT,                                   -- 4. option a
  option_b TEXT,                                   -- 5. option b
  option_c TEXT,                                   -- 6. option c
  option_d TEXT,                                   -- 7. option d
  option_e TEXT,                                   -- 8. option e
  correct_answer TEXT NOT NULL,                    -- 9. correct answer
  explanation TEXT NOT NULL,                       -- 10. explanation
  solution_steps TEXT,                             -- 11. solution steps
  hints TEXT,                                      -- 12. hints
  formula_used TEXT,                              -- 13. formula used
  marks INTEGER NOT NULL DEFAULT 1,                -- 14. marks
  -- Additional columns (not in CSV but required for system)
  options JSONB,                                   -- Keep for backward compatibility
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Copy data from old table to new table
-- Use dynamic SQL to handle the options column safely
DO $$
DECLARE
  options_exists BOOLEAN;
  sql_text TEXT;
BEGIN
  -- Check if options column exists in the old table
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'questions' 
    AND column_name = 'options'
  ) INTO options_exists;
  
  IF options_exists THEN
    -- Copy with options column - use explicit table alias to avoid ambiguity
    sql_text := '
      INSERT INTO questions_new (
        id, test_id, subcategory_id,
        question_text, question_type, difficulty,
        option_a, option_b, option_c, option_d, option_e,
        correct_answer, explanation,
        solution_steps, hints, formula_used,
        marks, subcategory_slug, options, "order", created_at, updated_at
      )
      SELECT 
        q.id, q.test_id, q.subcategory_id,
        q.question_text, q.question_type, q.difficulty,
        COALESCE(q.option_a, NULL) as option_a,
        COALESCE(q.option_b, NULL) as option_b,
        COALESCE(q.option_c, NULL) as option_c,
        COALESCE(q.option_d, NULL) as option_d,
        COALESCE(q.option_e, NULL) as option_e,
        q.correct_answer, q.explanation,
        COALESCE(q.solution_steps, NULL) as solution_steps,
        COALESCE(q.hints, NULL) as hints,
        COALESCE(q.formula_used, NULL) as formula_used,
        q.marks,
        COALESCE(q.subcategory_slug, NULL) as subcategory_slug,
        q.options,
        COALESCE(q."order", 0) as "order",
        COALESCE(q.created_at, NOW()) as created_at,
        NOW() as updated_at
      FROM questions q';
  ELSE
    -- Copy without options column (set to NULL)
    sql_text := '
      INSERT INTO questions_new (
        id, test_id, subcategory_id,
        question_text, question_type, difficulty,
        option_a, option_b, option_c, option_d, option_e,
        correct_answer, explanation,
        solution_steps, hints, formula_used,
        marks, subcategory_slug, options, "order", created_at, updated_at
      )
      SELECT 
        q.id, q.test_id, q.subcategory_id,
        q.question_text, q.question_type, q.difficulty,
        COALESCE(q.option_a, NULL) as option_a,
        COALESCE(q.option_b, NULL) as option_b,
        COALESCE(q.option_c, NULL) as option_c,
        COALESCE(q.option_d, NULL) as option_d,
        COALESCE(q.option_e, NULL) as option_e,
        q.correct_answer, q.explanation,
        COALESCE(q.solution_steps, NULL) as solution_steps,
        COALESCE(q.hints, NULL) as hints,
        COALESCE(q.formula_used, NULL) as formula_used,
        q.marks,
        COALESCE(q.subcategory_slug, NULL) as subcategory_slug,
        NULL::jsonb as options,
        COALESCE(q."order", 0) as "order",
        COALESCE(q.created_at, NOW()) as created_at,
        NOW() as updated_at
      FROM questions q';
  END IF;
  
  EXECUTE sql_text;
END $$;

-- Drop old table
DROP TABLE IF EXISTS questions CASCADE;

-- Rename new table to original name
ALTER TABLE questions_new RENAME TO questions;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_questions_test_id ON questions(test_id);
CREATE INDEX IF NOT EXISTS idx_questions_subcategory_id ON questions(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_created_at ON questions(created_at DESC);

-- Recreate foreign key constraints (they were dropped with CASCADE)
ALTER TABLE questions 
  ADD CONSTRAINT questions_test_id_fkey 
  FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE;

ALTER TABLE questions 
  ADD CONSTRAINT questions_subcategory_id_fkey 
  FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE CASCADE;

-- Make subcategory_id nullable temporarily to allow CSV import with subcategory_slug
-- The trigger will resolve it to NOT NULL before the constraint check
DO $$
BEGIN
  ALTER TABLE questions
  ALTER COLUMN subcategory_id DROP NOT NULL;
EXCEPTION
  WHEN OTHERS THEN
    -- Column might already be nullable, ignore error
    NULL;
END $$;

-- Recreate RLS policies
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Recreate RLS policies for questions
DROP POLICY IF EXISTS "Anyone can view questions of published tests" ON questions;
DROP POLICY IF EXISTS "Admins can insert questions" ON questions;
DROP POLICY IF EXISTS "Admins can update questions" ON questions;
DROP POLICY IF EXISTS "Admins can delete questions" ON questions;

CREATE POLICY "Anyone can view questions of published tests" ON questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tests 
      WHERE tests.id = questions.test_id 
      AND tests.is_published = true
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can insert questions" ON questions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update questions" ON questions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete questions" ON questions
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Add constraint for MCQ options
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'questions_mcq_options_required'
  ) THEN
    ALTER TABLE questions
    ADD CONSTRAINT questions_mcq_options_required 
    CHECK (
      (question_type != 'mcq') OR 
      (question_type = 'mcq' AND option_a IS NOT NULL AND option_a != '' AND option_b IS NOT NULL AND option_b != '')
    );
  END IF;
END $$;

-- Recreate constraints from previous migrations
-- Add CHECK constraint for minimum question_text length
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

-- Add CHECK constraint for minimum explanation length
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

-- Add CHECK constraint for minimum marks
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

-- Add comments
COMMENT ON TABLE questions IS 'Questions table matching CSV import structure';
COMMENT ON COLUMN questions.question_text IS '1. question text - The main question content';
COMMENT ON COLUMN questions.question_type IS '2. question type - Type: mcq, true_false, or fill_blank';
COMMENT ON COLUMN questions.difficulty IS '3. difficulty level - Level: easy, medium, or hard';
COMMENT ON COLUMN questions.option_a IS '4. option a - Option A for MCQ questions';
COMMENT ON COLUMN questions.option_b IS '5. option b - Option B for MCQ questions';
COMMENT ON COLUMN questions.option_c IS '6. option c - Option C for MCQ questions (optional)';
COMMENT ON COLUMN questions.option_d IS '7. option d - Option D for MCQ questions (optional)';
COMMENT ON COLUMN questions.option_e IS '8. option e - Option E for MCQ questions (optional)';
COMMENT ON COLUMN questions.correct_answer IS '9. correct answer - The correct answer for the question';
COMMENT ON COLUMN questions.explanation IS '10. explanation - Detailed explanation of why the answer is correct';
COMMENT ON COLUMN questions.solution_steps IS '11. solution steps - Step-by-step solution or breakdown';
COMMENT ON COLUMN questions.hints IS '12. hints - Hints or clues to help solve the question';
COMMENT ON COLUMN questions.formula_used IS '13. formula used - Formulas or equations relevant to the question';
COMMENT ON COLUMN questions.marks IS '14. marks - Points awarded for correctly answering the question';

