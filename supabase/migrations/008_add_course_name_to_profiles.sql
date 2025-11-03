-- ============================================================
-- ADD COURSE_NAME COLUMN TO PROFILES TABLE
-- ============================================================
-- This migration adds the course_name field to store custom course names
-- entered during onboarding, in addition to course_id for lookup table references

-- Add course_name column to profiles table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'course_name'
  ) THEN
    ALTER TABLE profiles 
    ADD COLUMN course_name TEXT;
    
    COMMENT ON COLUMN profiles.course_name IS 'Custom course name entered by user during onboarding (used when course not in courses lookup table)';
  END IF;
END $$;

-- ============================================================
-- COMMENTS
-- ============================================================
COMMENT ON TABLE profiles IS 'User profiles with onboarding information including college, graduation year, target companies, course, and phone';

