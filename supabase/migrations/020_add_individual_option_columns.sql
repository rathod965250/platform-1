-- ============================================================
-- ADD INDIVIDUAL OPTION COLUMNS TO questions TABLE
-- ============================================================
-- This migration adds individual columns for MCQ options
-- (option_a, option_b, option_c, option_d, option_e)
-- instead of storing them in a JSONB options column
-- ============================================================

-- Add option columns if they don't exist
DO $$
BEGIN
  -- Add option_a column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'questions'
    AND column_name = 'option_a'
  ) THEN
    ALTER TABLE questions
    ADD COLUMN option_a TEXT;
  END IF;

  -- Add option_b column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'questions'
    AND column_name = 'option_b'
  ) THEN
    ALTER TABLE questions
    ADD COLUMN option_b TEXT;
  END IF;

  -- Add option_c column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'questions'
    AND column_name = 'option_c'
  ) THEN
    ALTER TABLE questions
    ADD COLUMN option_c TEXT;
  END IF;

  -- Add option_d column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'questions'
    AND column_name = 'option_d'
  ) THEN
    ALTER TABLE questions
    ADD COLUMN option_d TEXT;
  END IF;

  -- Add option_e column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'questions'
    AND column_name = 'option_e'
  ) THEN
    ALTER TABLE questions
    ADD COLUMN option_e TEXT;
  END IF;
END $$;

-- Migrate existing data from JSONB options column to individual columns
-- Only for MCQ questions that have options array
DO $$
DECLARE
  question_record RECORD;
  options_array JSONB;
  option_count INTEGER;
BEGIN
  FOR question_record IN 
    SELECT id, options, question_type
    FROM questions
    WHERE question_type = 'mcq'
    AND options IS NOT NULL
    AND options ? 'options'
    AND jsonb_typeof(options->'options') = 'array'
  LOOP
    options_array := question_record.options->'options';
    option_count := jsonb_array_length(options_array);
    
    -- Extract options and update columns
    UPDATE questions
    SET 
      option_a = CASE WHEN option_count >= 1 THEN options_array->0 #>> '{}' ELSE NULL END,
      option_b = CASE WHEN option_count >= 2 THEN options_array->1 #>> '{}' ELSE NULL END,
      option_c = CASE WHEN option_count >= 3 THEN options_array->2 #>> '{}' ELSE NULL END,
      option_d = CASE WHEN option_count >= 4 THEN options_array->3 #>> '{}' ELSE NULL END,
      option_e = CASE WHEN option_count >= 5 THEN options_array->4 #>> '{}' ELSE NULL END
    WHERE id = question_record.id;
  END LOOP;
END $$;

-- Make options column nullable since we're moving to individual columns
-- Keep it for backward compatibility with True/False and Fill Blank questions
DO $$
BEGIN
  ALTER TABLE questions
  ALTER COLUMN options DROP NOT NULL;
EXCEPTION
  WHEN OTHERS THEN
    -- Column might already be nullable, ignore error
    NULL;
END $$;

-- Add CHECK constraint to ensure at least option_a and option_b are filled for MCQ questions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'questions_mcq_options_required'
  ) THEN
    ALTER TABLE questions
    ADD CONSTRAINT questions_mcq_options_required 
    CHECK (
      -- For MCQ questions, option_a and option_b must be provided
      (question_type != 'mcq') OR 
      (question_type = 'mcq' AND option_a IS NOT NULL AND option_a != '' AND option_b IS NOT NULL AND option_b != '')
    );
  END IF;
END $$;

-- Add comments
COMMENT ON COLUMN questions.option_a IS 'Option A for MCQ questions (required for MCQ)';
COMMENT ON COLUMN questions.option_b IS 'Option B for MCQ questions (required for MCQ)';
COMMENT ON COLUMN questions.option_c IS 'Option C for MCQ questions (optional)';
COMMENT ON COLUMN questions.option_d IS 'Option D for MCQ questions (optional)';
COMMENT ON COLUMN questions.option_e IS 'Option E for MCQ questions (optional)';
COMMENT ON CONSTRAINT questions_mcq_options_required ON questions IS 
  'Ensures option_a and option_b are provided for MCQ questions';

