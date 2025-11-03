-- ============================================================
-- BATCH INITIALIZE ADAPTIVE STATE FUNCTION
-- ============================================================
-- Function to initialize adaptive_state for multiple categories at once
-- Used during onboarding to set up adaptive algorithm for selected categories

CREATE OR REPLACE FUNCTION initialize_adaptive_state_batch(
  p_user_id UUID,
  p_category_ids UUID[]
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_category_id UUID;
  v_count INTEGER := 0;
BEGIN
  -- Loop through each category ID and initialize adaptive state
  FOREACH v_category_id IN ARRAY p_category_ids
  LOOP
    INSERT INTO adaptive_state (
      user_id,
      category_id,
      mastery_score,
      current_difficulty,
      recent_accuracy,
      avg_time_seconds
    )
    VALUES (
      p_user_id,
      v_category_id,
      0.50, -- Default starting mastery score
      'medium', -- Default starting difficulty
      '{}', -- Empty array for recent accuracy
      0 -- Zero average time initially
    )
    ON CONFLICT (user_id, category_id) 
    DO UPDATE SET 
      last_updated = NOW(),
      mastery_score = 0.50, -- Reset to default if updating existing
      current_difficulty = 'medium'
    ;
    
    v_count := v_count + 1;
  END LOOP;
  
  RETURN v_count;
END;
$$;

COMMENT ON FUNCTION initialize_adaptive_state_batch IS 'Batch initializes adaptive_state for multiple categories. Used during user onboarding.';

