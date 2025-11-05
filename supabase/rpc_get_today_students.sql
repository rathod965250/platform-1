-- ============================================================
-- Supabase RPC Function: Get Students Who Joined Today
-- ============================================================
-- This function uses PostgreSQL's DATE() function which handles
-- timezone conversion automatically
-- 
-- To create this function in Supabase:
-- 1. Go to Supabase Dashboard > SQL Editor
-- 2. Run this SQL to create the function
-- 3. Then use it in your code with supabase.rpc('get_today_students')

-- Function to get count of students who joined today
CREATE OR REPLACE FUNCTION get_today_students_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  student_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO student_count
  FROM profiles
  WHERE role = 'student'
    AND created_at IS NOT NULL
    AND DATE(created_at) = CURRENT_DATE;
  
  RETURN COALESCE(student_count, 0);
END;
$$;

-- Function to get recent students who joined today (with limit)
CREATE OR REPLACE FUNCTION get_today_students(limit_count INTEGER DEFAULT 3)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  avatar_url TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.avatar_url,
    p.email,
    p.created_at
  FROM profiles p
  WHERE p.role = 'student'
    AND p.created_at IS NOT NULL
    AND DATE(p.created_at) = CURRENT_DATE
  ORDER BY p.created_at DESC
  LIMIT limit_count;
END;
$$;

-- Function to get both count and students in one call
CREATE OR REPLACE FUNCTION get_today_students_with_count(limit_count INTEGER DEFAULT 3)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  student_count INTEGER;
  students_data JSON;
BEGIN
  -- Get count
  SELECT COUNT(*) INTO student_count
  FROM profiles
  WHERE role = 'student'
    AND created_at IS NOT NULL
    AND DATE(created_at) = CURRENT_DATE;
  
  -- Get students
  SELECT json_agg(
    json_build_object(
      'id', p.id,
      'full_name', p.full_name,
      'avatar_url', p.avatar_url,
      'email', p.email,
      'created_at', p.created_at
    )
  ) INTO students_data
  FROM (
    SELECT 
      id,
      full_name,
      avatar_url,
      email,
      created_at
    FROM profiles
    WHERE role = 'student'
      AND created_at IS NOT NULL
      AND DATE(created_at) = CURRENT_DATE
    ORDER BY created_at DESC
    LIMIT limit_count
  ) p;
  
  -- Return combined result
  result := json_build_object(
    'count', COALESCE(student_count, 0),
    'students', COALESCE(students_data, '[]'::json)
  );
  
  RETURN result;
END;
$$;

-- Grant execute permissions (adjust as needed for your security model)
GRANT EXECUTE ON FUNCTION get_today_students_count() TO authenticated;
GRANT EXECUTE ON FUNCTION get_today_students(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_today_students_with_count(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_today_students_count() TO anon;
GRANT EXECUTE ON FUNCTION get_today_students(INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION get_today_students_with_count(INTEGER) TO anon;

