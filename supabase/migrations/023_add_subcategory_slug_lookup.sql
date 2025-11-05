-- ============================================================
-- ADD SUBCATEGORY SLUG AUTO-LOOKUP FOR CSV IMPORT
-- ============================================================
-- This migration adds support for importing questions via CSV
-- by providing a "subcategory slug" column that automatically
-- resolves to the subcategory_id UUID.
-- ============================================================

-- Add subcategory_slug column to questions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'questions'
    AND column_name = 'subcategory_slug'
  ) THEN
    ALTER TABLE questions
    ADD COLUMN subcategory_slug TEXT;
    
    COMMENT ON COLUMN questions.subcategory_slug IS 
      'Temporary column for CSV import. Provides subcategory slug which is automatically resolved to subcategory_id via trigger.';
  END IF;
END $$;

-- Create function to lookup subcategory_id from slug and normalize difficulty
CREATE OR REPLACE FUNCTION lookup_subcategory_id_from_slug()
RETURNS TRIGGER AS $$
DECLARE
  found_subcategory_id UUID;
  slug_count INTEGER;
  provided_slug TEXT;
BEGIN
  -- Normalize difficulty to lowercase (handles "Easy", "Medium", "Hard" from CSV)
  -- This ensures the value matches the CHECK constraint requirement of lowercase
  IF NEW.difficulty IS NOT NULL THEN
    NEW.difficulty := LOWER(TRIM(NEW.difficulty));
  END IF;
  
  -- Normalize question_type to lowercase (handles "MCQ", "True_False", etc. from CSV)
  -- This ensures the value matches the CHECK constraint requirement of lowercase
  IF NEW.question_type IS NOT NULL THEN
    NEW.question_type := LOWER(TRIM(NEW.question_type));
    -- Ensure question_type uses underscore format (replace hyphens with underscores)
    NEW.question_type := REPLACE(NEW.question_type, '-', '_');
  END IF;
  
  -- If subcategory_id is already provided, skip lookup
  IF NEW.subcategory_id IS NOT NULL THEN
    RETURN NEW;
  END IF;
  
  -- Get the subcategory_slug value (Supabase CSV import converts "subcategory slug" to "subcategory_slug")
  -- Trim whitespace and handle NULL
  provided_slug := TRIM(COALESCE(NEW.subcategory_slug, ''));
  
  -- Debug logging (safely access difficulty if it exists)
  BEGIN
    RAISE NOTICE 'Trigger fired. subcategory_id: %, subcategory_slug: "%" (length: %)', 
      NEW.subcategory_id, 
      provided_slug, 
      LENGTH(provided_slug);
  EXCEPTION
    WHEN OTHERS THEN
      -- Skip if fields don't exist
      NULL;
  END;
  
  -- Only process if subcategory_slug is provided and not empty
  IF provided_slug != '' AND provided_slug IS NOT NULL THEN
    -- Check if multiple subcategories exist with the same slug (across categories)
    SELECT COUNT(*) INTO slug_count
    FROM subcategories
    WHERE slug = provided_slug;
    
    -- Warn if multiple subcategories have the same slug (shouldn't happen, but handle gracefully)
    IF slug_count > 1 THEN
      RAISE WARNING 
        'Multiple subcategories found with slug "%". Using the first match. Consider including category information.',
        provided_slug;
    END IF;
    
    -- Look up subcategory_id from subcategories table by slug
    -- Note: subcategories table doesn't have created_at column, so we order by id instead
    SELECT id INTO found_subcategory_id
    FROM subcategories
    WHERE slug = provided_slug
    ORDER BY id ASC
    LIMIT 1;
    
    -- If subcategory found, set the subcategory_id
    IF found_subcategory_id IS NOT NULL THEN
      NEW.subcategory_id := found_subcategory_id;
      RAISE NOTICE 'Successfully resolved subcategory_id: % for slug: "%"', found_subcategory_id, provided_slug;
    ELSE
      -- Subcategory slug not found - raise helpful error
      RAISE EXCEPTION 
        'Subcategory slug "%" not found. Available subcategory slugs: %',
        provided_slug,
        (SELECT COALESCE(string_agg(slug, ', ' ORDER BY slug), 'No subcategories found') 
         FROM subcategories 
         LIMIT 20);
    END IF;
  END IF;
  
  -- If subcategory_id is still NULL after processing, raise error with debug info
  IF NEW.subcategory_id IS NULL THEN
    RAISE EXCEPTION 
      'subcategory_id is required. Either provide subcategory_id directly or provide subcategory_slug in CSV. CSV column header must be exactly "subcategory slug" (with space). Current subcategory_slug value: "%" (length: %). Please verify: 1) CSV header is "subcategory slug" (with space, not underscore), 2) The value is not empty in your CSV, 3) The slug exists in subcategories table.',
      provided_slug,
      COALESCE(LENGTH(provided_slug), 0);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS trigger_lookup_subcategory_id_from_slug ON questions;

-- Create BEFORE INSERT trigger
CREATE TRIGGER trigger_lookup_subcategory_id_from_slug
  BEFORE INSERT ON questions
  FOR EACH ROW
  EXECUTE FUNCTION lookup_subcategory_id_from_slug();

-- Add comment
COMMENT ON FUNCTION lookup_subcategory_id_from_slug() IS 
  'Automatically resolves subcategory_id from subcategory_slug during CSV import. Also normalizes difficulty and question_type (if provided) to lowercase using built-in LOWER() function to match database CHECK constraints. Note: question_type defaults to ''mcq'' in the schema, so normalization only applies if explicitly provided. The question_topic column is independent and does not require normalization. Looks up subcategory by slug and sets subcategory_id.';

