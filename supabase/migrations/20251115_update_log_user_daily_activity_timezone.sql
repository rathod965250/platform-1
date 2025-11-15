-- Replace logger to use user's timezone from profiles.time_zone
CREATE OR REPLACE FUNCTION log_user_daily_activity(
  p_user_id UUID,
  p_ts TIMESTAMPTZ,
  p_type TEXT,
  p_source_table TEXT,
  p_source_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_tz TEXT := 'UTC';
  v_date DATE;
BEGIN
  IF p_ts IS NULL THEN
    RETURN;
  END IF;
  SELECT COALESCE(time_zone, 'UTC') INTO v_tz FROM profiles WHERE id = p_user_id;
  -- Convert timestamp to user's local calendar day
  v_date := (p_ts AT TIME ZONE v_tz)::date;
  INSERT INTO user_daily_activity(user_id, activity_date, activity_type, source_table, source_id)
  VALUES (p_user_id, v_date, p_type, p_source_table, p_source_id)
  ON CONFLICT (user_id, activity_date) DO NOTHING;
END;
$$ LANGUAGE plpgsql;
