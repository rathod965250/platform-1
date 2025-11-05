-- ============================================================
-- Test RPC Function to Verify It Works
-- ============================================================
-- Run this in Supabase SQL Editor to test the RPC function

-- Test 1: Test the count function
SELECT get_today_students_count();

-- Test 2: Test the students function
SELECT * FROM get_today_students(3);

-- Test 3: Test the combined function
SELECT * FROM get_today_students_with_count(3);

-- Test 4: Verify the function exists
SELECT 
    routine_name,
    routine_type,
    data_type
FROM 
    information_schema.routines
WHERE 
    routine_schema = 'public'
    AND routine_name LIKE '%today_students%';

-- Test 5: Check what students actually exist today
SELECT 
    id,
    full_name,
    email,
    role,
    created_at,
    DATE(created_at) as join_date,
    CURRENT_DATE as today
FROM 
    profiles
WHERE 
    role = 'student'
    AND created_at IS NOT NULL
    AND DATE(created_at) = CURRENT_DATE
ORDER BY 
    created_at DESC;

-- Test 6: Count manually
SELECT 
    COUNT(*) as manual_count
FROM 
    profiles
WHERE 
    role = 'student'
    AND created_at IS NOT NULL
    AND DATE(created_at) = CURRENT_DATE;

