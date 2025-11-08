-- ============================================================
-- ADD PROCTORING & VIOLATION TRACKING COLUMNS
-- ============================================================
-- This migration adds comprehensive proctoring and violation
-- tracking to test_attempts and custom_mock_tests tables
-- ============================================================

-- Add proctoring columns to test_attempts table
ALTER TABLE test_attempts
ADD COLUMN IF NOT EXISTS proctoring_warnings JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS tab_switch_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS fullscreen_exit_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS camera_disabled_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS suspicious_activity_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_violations INTEGER GENERATED ALWAYS AS (
  tab_switch_count + fullscreen_exit_count + camera_disabled_count + suspicious_activity_count
) STORED,
ADD COLUMN IF NOT EXISTS proctoring_flags JSONB DEFAULT '{
  "camera_enabled": false,
  "fullscreen_active": false,
  "audio_enabled": false,
  "network_stable": true
}'::jsonb,
ADD COLUMN IF NOT EXISTS violation_timestamps JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS browser_info JSONB,
ADD COLUMN IF NOT EXISTS device_info JSONB;

-- Add proctoring columns to custom_mock_tests table
ALTER TABLE custom_mock_tests
ADD COLUMN IF NOT EXISTS proctoring_warnings JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS tab_switch_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS fullscreen_exit_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS camera_disabled_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS suspicious_activity_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_violations INTEGER GENERATED ALWAYS AS (
  tab_switch_count + fullscreen_exit_count + camera_disabled_count + suspicious_activity_count
) STORED,
ADD COLUMN IF NOT EXISTS proctoring_flags JSONB DEFAULT '{
  "camera_enabled": false,
  "fullscreen_active": false,
  "audio_enabled": false,
  "network_stable": true
}'::jsonb,
ADD COLUMN IF NOT EXISTS violation_timestamps JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS integrity_score DECIMAL(5,2) GENERATED ALWAYS AS (
  CASE 
    WHEN (tab_switch_count + fullscreen_exit_count + camera_disabled_count + suspicious_activity_count) = 0 THEN 100.00
    WHEN (tab_switch_count + fullscreen_exit_count + camera_disabled_count + suspicious_activity_count) <= 3 THEN 90.00
    WHEN (tab_switch_count + fullscreen_exit_count + camera_disabled_count + suspicious_activity_count) <= 5 THEN 75.00
    WHEN (tab_switch_count + fullscreen_exit_count + camera_disabled_count + suspicious_activity_count) <= 10 THEN 50.00
    ELSE 25.00
  END
) STORED,
ADD COLUMN IF NOT EXISTS is_flagged_for_review BOOLEAN DEFAULT false;

-- Create index for violation queries
CREATE INDEX IF NOT EXISTS idx_test_attempts_violations 
ON test_attempts(total_violations DESC) 
WHERE total_violations > 0;

CREATE INDEX IF NOT EXISTS idx_custom_mock_tests_violations 
ON custom_mock_tests(total_violations DESC) 
WHERE total_violations > 0;

CREATE INDEX IF NOT EXISTS idx_custom_mock_tests_flagged 
ON custom_mock_tests(is_flagged_for_review) 
WHERE is_flagged_for_review = true;

-- Update the user_custom_test_history view to include violation data
DROP VIEW IF EXISTS user_custom_test_history;
CREATE OR REPLACE VIEW user_custom_test_history AS
SELECT 
  cmt.id,
  cmt.user_id,
  cmt.test_id,
  cmt.title,
  cmt.description,
  cmt.difficulty_level,
  cmt.total_questions,
  cmt.status,
  cmt.score,
  cmt.total_marks,
  cmt.percentage,
  cmt.time_taken_minutes,
  cmt.duration_hours,
  cmt.duration_minutes,
  cmt.total_duration_minutes,
  cmt.created_at,
  cmt.started_at,
  cmt.completed_at,
  cmt.is_time_manually_set,
  cmt.generation_time_ms,
  -- Proctoring data
  cmt.proctoring_warnings,
  cmt.tab_switch_count,
  cmt.fullscreen_exit_count,
  cmt.camera_disabled_count,
  cmt.suspicious_activity_count,
  cmt.total_violations,
  cmt.proctoring_flags,
  cmt.violation_timestamps,
  cmt.integrity_score,
  cmt.is_flagged_for_review,
  -- Fixed: Using array_length for UUID[] type
  COALESCE(array_length(cmt.selected_categories, 1), 0) as topics_count,
  CASE 
    WHEN cmt.completed_at IS NOT NULL AND cmt.started_at IS NOT NULL 
    THEN EXTRACT(EPOCH FROM (cmt.completed_at - cmt.started_at)) / 60 
    ELSE NULL 
  END as actual_duration_minutes
FROM custom_mock_tests cmt;

-- Create a new view for violation analytics
CREATE OR REPLACE VIEW user_violation_analytics AS
SELECT 
  user_id,
  COUNT(*) as total_tests_taken,
  COUNT(*) FILTER (WHERE total_violations > 0) as tests_with_violations,
  COUNT(*) FILTER (WHERE is_flagged_for_review = true) as flagged_tests,
  AVG(total_violations) as avg_violations_per_test,
  AVG(tab_switch_count) as avg_tab_switches,
  AVG(fullscreen_exit_count) as avg_fullscreen_exits,
  AVG(camera_disabled_count) as avg_camera_issues,
  AVG(integrity_score) as avg_integrity_score,
  MAX(total_violations) as max_violations_in_test,
  MIN(integrity_score) as lowest_integrity_score,
  -- Violation breakdown
  SUM(tab_switch_count) as total_tab_switches,
  SUM(fullscreen_exit_count) as total_fullscreen_exits,
  SUM(camera_disabled_count) as total_camera_issues,
  SUM(suspicious_activity_count) as total_suspicious_activities
FROM custom_mock_tests
WHERE status = 'completed'
GROUP BY user_id;

-- Create view for high-risk tests (admin monitoring)
CREATE OR REPLACE VIEW high_risk_test_attempts AS
SELECT 
  cmt.id,
  cmt.user_id,
  p.email,
  p.full_name,
  cmt.title,
  cmt.total_violations,
  cmt.integrity_score,
  cmt.tab_switch_count,
  cmt.fullscreen_exit_count,
  cmt.camera_disabled_count,
  cmt.suspicious_activity_count,
  cmt.proctoring_warnings,
  cmt.violation_timestamps,
  cmt.completed_at,
  cmt.score,
  cmt.percentage
FROM custom_mock_tests cmt
JOIN profiles p ON p.id = cmt.user_id
WHERE cmt.total_violations > 5 
   OR cmt.is_flagged_for_review = true
   OR cmt.integrity_score < 50
ORDER BY cmt.total_violations DESC, cmt.completed_at DESC;

-- Function to automatically flag suspicious tests
CREATE OR REPLACE FUNCTION flag_suspicious_tests()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-flag if violations exceed threshold
  IF NEW.total_violations > 10 THEN
    NEW.is_flagged_for_review := true;
  END IF;
  
  -- Auto-flag if integrity score is too low
  IF NEW.integrity_score < 40 THEN
    NEW.is_flagged_for_review := true;
  END IF;
  
  -- Auto-flag if too many tab switches
  IF NEW.tab_switch_count > 15 THEN
    NEW.is_flagged_for_review := true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-flagging
DROP TRIGGER IF EXISTS auto_flag_suspicious_tests ON custom_mock_tests;
CREATE TRIGGER auto_flag_suspicious_tests
  BEFORE INSERT OR UPDATE ON custom_mock_tests
  FOR EACH ROW
  EXECUTE FUNCTION flag_suspicious_tests();

-- Add RLS policies for violation views
ALTER TABLE test_attempts ENABLE ROW LEVEL SECURITY;

-- Users can only see their own test attempt violations
CREATE POLICY "Users can view their own test attempt violations" ON test_attempts
  FOR SELECT
  USING (user_id = auth.uid() OR is_admin());

-- Grant access to views
GRANT SELECT ON user_custom_test_history TO authenticated;
GRANT SELECT ON user_violation_analytics TO authenticated;
GRANT SELECT ON high_risk_test_attempts TO authenticated;

-- Add comments
COMMENT ON COLUMN test_attempts.proctoring_warnings IS 'Array of timestamped proctoring warnings';
COMMENT ON COLUMN test_attempts.tab_switch_count IS 'Number of times user switched tabs';
COMMENT ON COLUMN test_attempts.fullscreen_exit_count IS 'Number of times user exited fullscreen';
COMMENT ON COLUMN test_attempts.camera_disabled_count IS 'Number of times camera was disabled';
COMMENT ON COLUMN test_attempts.total_violations IS 'Total count of all violations';
COMMENT ON COLUMN custom_mock_tests.integrity_score IS 'Test integrity score (0-100) based on violations';
COMMENT ON COLUMN custom_mock_tests.is_flagged_for_review IS 'Automatically flagged for admin review';

COMMENT ON VIEW user_violation_analytics IS 'Per-user violation statistics and integrity metrics';
COMMENT ON VIEW high_risk_test_attempts IS 'Tests flagged for suspicious activity (admin view)';