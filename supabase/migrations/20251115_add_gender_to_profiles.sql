-- Add gender column to profiles table
ALTER TABLE profiles 
ADD COLUMN gender TEXT NOT NULL DEFAULT 'prefer_not_to_say' CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say'));

-- Add index for gender column for potential filtering
CREATE INDEX idx_profiles_gender ON profiles(gender);

-- Add comment to the column
COMMENT ON COLUMN profiles.gender IS 'User gender: male, female, other, or prefer_not_to_say';
