-- Add unique constraint on user_analytics for upsert operations
-- The primary key is just user_id, but we need category_id for proper analytics per category

-- First, drop the existing primary key
ALTER TABLE user_analytics DROP CONSTRAINT IF EXISTS user_analytics_pkey;

-- Add composite unique constraint
ALTER TABLE user_analytics
ADD CONSTRAINT user_analytics_user_category_unique UNIQUE (user_id, category_id);

-- Add back a primary key on id column (create if doesn't exist)
ALTER TABLE user_analytics
ADD COLUMN IF NOT EXISTS id UUID DEFAULT uuid_generate_v4();

ALTER TABLE user_analytics
ADD PRIMARY KEY (id);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_user_analytics_user_category ON user_analytics(user_id, category_id);

