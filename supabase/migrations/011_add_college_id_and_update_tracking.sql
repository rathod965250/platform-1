-- Add college_id column to profiles table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'college_id'
  ) THEN
    ALTER TABLE profiles 
    ADD COLUMN college_id UUID REFERENCES colleges(id) ON DELETE SET NULL;
    
    CREATE INDEX IF NOT EXISTS idx_profiles_college_id ON profiles(college_id);
  END IF;
END $$;

-- Add last_college_update column to track monthly updates
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'last_college_update'
  ) THEN
    ALTER TABLE profiles 
    ADD COLUMN last_college_update TIMESTAMP WITH TIME ZONE;
    
    CREATE INDEX IF NOT EXISTS idx_profiles_last_college_update ON profiles(last_college_update);
  END IF;
END $$;

-- Function to check if user can update college (once per month)
CREATE OR REPLACE FUNCTION can_update_college(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  last_update TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT last_college_update INTO last_update
  FROM profiles
  WHERE id = user_id;
  
  -- If never updated, allow
  IF last_update IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Check if at least 30 days have passed
  IF last_update < NOW() - INTERVAL '30 days' THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update college and set last_update timestamp
CREATE OR REPLACE FUNCTION update_user_college(
  user_id UUID,
  new_college_id UUID,
  new_college_name TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  can_update BOOLEAN;
BEGIN
  -- Check if user can update
  SELECT can_update_college(user_id) INTO can_update;
  
  IF NOT can_update THEN
    RAISE EXCEPTION 'College can only be updated once per month. Last update: %', 
      (SELECT last_college_update FROM profiles WHERE id = user_id);
  END IF;
  
  -- Update college_id and college name
  UPDATE profiles
  SET 
    college_id = new_college_id,
    college = new_college_name,
    last_college_update = NOW(),
    updated_at = NOW()
  WHERE id = user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION can_update_college IS 'Checks if user can update college (once per month limit)';
COMMENT ON FUNCTION update_user_college IS 'Updates user college with monthly limit enforcement';

