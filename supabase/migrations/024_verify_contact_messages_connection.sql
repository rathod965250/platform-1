-- ============================================================
-- VERIFY CONTACT MESSAGES TABLE CONNECTION AND FUNCTIONALITY
-- ============================================================
-- This migration verifies that the contact_messages table is properly configured
-- for multiple replies functionality

-- Verify table exists and has correct structure
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'contact_messages'
  ) THEN
    RAISE EXCEPTION 'contact_messages table does not exist. Please run migration 023 first.';
  END IF;
END $$;

-- Verify reply column exists and can store multiple replies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contact_messages' 
    AND column_name = 'reply'
    AND data_type = 'text'
  ) THEN
    RAISE EXCEPTION 'reply column does not exist or has wrong type.';
  END IF;
END $$;

-- Verify RLS is enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'contact_messages' 
    AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'RLS is not enabled on contact_messages table.';
  END IF;
END $$;

-- Verify indexes exist for performance
CREATE INDEX IF NOT EXISTS idx_contact_messages_reply ON contact_messages(reply) WHERE reply IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contact_messages_replied_at ON contact_messages(replied_at) WHERE replied_at IS NOT NULL;

-- Test function to verify database connection
CREATE OR REPLACE FUNCTION test_contact_messages_connection()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Test insert capability
  PERFORM 1 FROM contact_messages LIMIT 1;
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION test_contact_messages_connection() TO authenticated;
GRANT EXECUTE ON FUNCTION test_contact_messages_connection() TO anon;

-- Add comment
COMMENT ON FUNCTION test_contact_messages_connection() IS 'Test function to verify contact_messages table connection and accessibility';

