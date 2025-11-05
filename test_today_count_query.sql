-- ============================================================
-- Test Query: Count Users Who Joined Today
-- ============================================================
-- This query counts students who joined today using created_at
-- Run this in Supabase SQL Editor to verify the count

-- Method 1: Using DATE() function (Recommended - handles timezone automatically)
SELECT 
    COUNT(*) as students_joined_today
FROM 
    profiles
WHERE 
    role = 'student'
    AND created_at IS NOT NULL
    AND DATE(created_at) = CURRENT_DATE;

-- ============================================================
-- Method 2: Using date range with timezone
-- ============================================================
SELECT 
    COUNT(*) as students_joined_today
FROM 
    profiles
WHERE 
    role = 'student'
    AND created_at IS NOT NULL
    AND created_at >= CURRENT_DATE::timestamp
    AND created_at < (CURRENT_DATE + INTERVAL '1 day')::timestamp;

-- ============================================================
-- Method 3: Using date_trunc (PostgreSQL specific)
-- ============================================================
SELECT 
    COUNT(*) as students_joined_today
FROM 
    profiles
WHERE 
    role = 'student'
    AND created_at IS NOT NULL
    AND DATE_TRUNC('day', created_at) = DATE_TRUNC('day', CURRENT_TIMESTAMP);

-- ============================================================
-- Method 4: Get detailed information with names
-- ============================================================
SELECT 
    id,
    full_name,
    email,
    avatar_url,
    created_at,
    DATE(created_at) as join_date
FROM 
    profiles
WHERE 
    role = 'student'
    AND created_at IS NOT NULL
    AND DATE(created_at) = CURRENT_DATE
ORDER BY 
    created_at DESC;

-- ============================================================
-- Method 5: Get count grouped by date (last 7 days)
-- ============================================================
SELECT 
    DATE(created_at) as join_date,
    COUNT(*) as students_count
FROM 
    profiles
WHERE 
    role = 'student'
    AND created_at IS NOT NULL
    AND created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY 
    DATE(created_at)
ORDER BY 
    join_date DESC;

-- ============================================================
-- Method 6: Verify timezone settings
-- ============================================================
SELECT 
    CURRENT_DATE,
    CURRENT_TIMESTAMP,
    NOW(),
    TIMEZONE('UTC', NOW()) as utc_now,
    TIMEZONE('UTC', CURRENT_TIMESTAMP) as utc_current;

