-- Add time_zone column to profiles to support local-time streaks
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS time_zone TEXT NOT NULL DEFAULT 'UTC';

COMMENT ON COLUMN profiles.time_zone IS 'IANA time zone for local-day calculations (e.g., Asia/Kolkata)';
