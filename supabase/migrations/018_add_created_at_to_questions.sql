-- ============================================================
-- ADD created_at COLUMN TO questions TABLE
-- ============================================================
-- This migration adds the created_at timestamp column to the
-- questions table for proper ordering and tracking
-- ============================================================

-- Add created_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'questions'
    AND column_name = 'created_at'
  ) THEN
    ALTER TABLE questions
    ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    
    -- Update existing rows to have a created_at timestamp
    -- Use a default timestamp based on when they were likely created
    UPDATE questions
    SET created_at = NOW()
    WHERE created_at IS NULL;
    
    -- Make the column NOT NULL after setting defaults
    ALTER TABLE questions
    ALTER COLUMN created_at SET NOT NULL;
    
    -- Create index for better query performance
    CREATE INDEX IF NOT EXISTS idx_questions_created_at ON questions(created_at DESC);
  END IF;
END $$;

-- Add comment
COMMENT ON COLUMN questions.created_at IS 'Timestamp when the question was created';

