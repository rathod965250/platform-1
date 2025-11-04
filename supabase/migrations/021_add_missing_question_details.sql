-- ============================================================
-- ADD MISSING QUESTION DETAIL COLUMNS TO questions TABLE
-- ============================================================
-- This migration adds columns for solution steps, hints,
-- and formula used to match the complete question structure.
-- Column order: question_text, question_type, difficulty, 
-- option_a, option_b, option_c, option_d, option_e,
-- correct_answer, explanation, solution_steps, hints,
-- formula_used, marks
-- ============================================================

-- Add solution_steps column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'questions'
    AND column_name = 'solution_steps'
  ) THEN
    ALTER TABLE questions
    ADD COLUMN solution_steps TEXT;
    COMMENT ON COLUMN questions.solution_steps IS 'Step-by-step solution or breakdown for the question';
  END IF;
END $$;

-- Add hints column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'questions'
    AND column_name = 'hints'
  ) THEN
    ALTER TABLE questions
    ADD COLUMN hints TEXT;
    COMMENT ON COLUMN questions.hints IS 'Hints or clues to help solve the question';
  END IF;
END $$;

-- Add formula_used column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'questions'
    AND column_name = 'formula_used'
  ) THEN
    ALTER TABLE questions
    ADD COLUMN formula_used TEXT;
    COMMENT ON COLUMN questions.formula_used IS 'Formulas or equations relevant to the question';
  END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN questions.question_text IS 'The main question content';
COMMENT ON COLUMN questions.question_type IS 'Type of question: mcq, true_false, or fill_blank';
COMMENT ON COLUMN questions.difficulty IS 'Difficulty level: easy, medium, or hard';
COMMENT ON COLUMN questions.option_a IS 'Option A for MCQ questions (required for MCQ)';
COMMENT ON COLUMN questions.option_b IS 'Option B for MCQ questions (required for MCQ)';
COMMENT ON COLUMN questions.option_c IS 'Option C for MCQ questions (optional)';
COMMENT ON COLUMN questions.option_d IS 'Option D for MCQ questions (optional)';
COMMENT ON COLUMN questions.option_e IS 'Option E for MCQ questions (optional)';
COMMENT ON COLUMN questions.correct_answer IS 'The correct answer for the question';
COMMENT ON COLUMN questions.explanation IS 'Detailed explanation of why the answer is correct';
COMMENT ON COLUMN questions.marks IS 'Points awarded for correctly answering the question';

