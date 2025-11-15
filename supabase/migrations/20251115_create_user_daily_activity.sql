-- User daily activity table to consolidate streak sources
CREATE TABLE IF NOT EXISTS user_daily_activity (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  activity_date DATE NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'adaptive_practice',
    'mock_test',
    'company_specific_test',
    'assignment',
    'custom_test'
  )),
  source_table TEXT,
  source_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, activity_date)
);

CREATE INDEX IF NOT EXISTS idx_user_daily_activity_user_date ON user_daily_activity(user_id, activity_date DESC);

ALTER TABLE user_daily_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own daily activity" ON user_daily_activity;
CREATE POLICY "Users can view own daily activity" ON user_daily_activity
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert daily activity" ON user_daily_activity;
CREATE POLICY "System can insert daily activity" ON user_daily_activity
  FOR INSERT WITH CHECK (true);

-- Helper to record a daily activity (idempotent by date)
CREATE OR REPLACE FUNCTION log_user_daily_activity(p_user_id UUID, p_ts TIMESTAMPTZ, p_type TEXT, p_source_table TEXT, p_source_id UUID)
RETURNS VOID AS $$
BEGIN
  IF p_ts IS NULL THEN
    RETURN;
  END IF;
  INSERT INTO user_daily_activity(user_id, activity_date, activity_type, source_table, source_id)
  VALUES (p_user_id, (p_ts AT TIME ZONE 'UTC')::date, p_type, p_source_table, p_source_id)
  ON CONFLICT (user_id, activity_date) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Trigger for test_attempts (mock/company_specific only)
CREATE OR REPLACE FUNCTION trg_log_activity_test_attempts()
RETURNS TRIGGER AS $$
DECLARE v_type TEXT;
BEGIN
  IF NEW.submitted_at IS NULL THEN RETURN NEW; END IF;
  SELECT test_type INTO v_type FROM tests WHERE id = NEW.test_id;
  IF v_type = 'mock' THEN
    PERFORM log_user_daily_activity(NEW.user_id, NEW.submitted_at, 'mock_test', 'test_attempts', NEW.id);
  ELSIF v_type = 'company_specific' THEN
    PERFORM log_user_daily_activity(NEW.user_id, NEW.submitted_at, 'company_specific_test', 'test_attempts', NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_log_activity_test_attempts_insup ON test_attempts;
CREATE TRIGGER trg_log_activity_test_attempts_insup
AFTER INSERT OR UPDATE OF submitted_at ON test_attempts
FOR EACH ROW EXECUTE FUNCTION trg_log_activity_test_attempts();

-- Trigger for practice_sessions (adaptive practice)
CREATE OR REPLACE FUNCTION trg_log_activity_practice_sessions()
RETURNS TRIGGER AS $$
DECLARE v_ts TIMESTAMPTZ;
BEGIN
  v_ts := COALESCE(NEW.completed_at, NEW.created_at);
  IF v_ts IS NULL THEN RETURN NEW; END IF;
  PERFORM log_user_daily_activity(NEW.user_id, v_ts, 'adaptive_practice', 'practice_sessions', NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_log_activity_practice_sessions_ins ON practice_sessions;
CREATE TRIGGER trg_log_activity_practice_sessions_ins
AFTER INSERT ON practice_sessions
FOR EACH ROW EXECUTE FUNCTION trg_log_activity_practice_sessions();

-- Trigger for student_assignments (on completion)
CREATE OR REPLACE FUNCTION trg_log_activity_student_assignments()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.completed_at IS NULL THEN RETURN NEW; END IF;
  PERFORM log_user_daily_activity(NEW.student_id, NEW.completed_at, 'assignment', 'student_assignments', NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_log_activity_student_assignments_upd ON student_assignments;
CREATE TRIGGER trg_log_activity_student_assignments_upd
AFTER UPDATE OF completed_at ON student_assignments
FOR EACH ROW EXECUTE FUNCTION trg_log_activity_student_assignments();

-- Trigger for custom_mock_tests (on completion)
CREATE OR REPLACE FUNCTION trg_log_activity_custom_mock_tests()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND NEW.completed_at IS NOT NULL THEN
    PERFORM log_user_daily_activity(NEW.user_id, NEW.completed_at, 'custom_test', 'custom_mock_tests', NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_log_activity_custom_mock_tests_upd ON custom_mock_tests;
CREATE TRIGGER trg_log_activity_custom_mock_tests_upd
AFTER UPDATE OF status, completed_at ON custom_mock_tests
FOR EACH ROW EXECUTE FUNCTION trg_log_activity_custom_mock_tests();
