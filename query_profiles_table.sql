-- ============================================================
-- SQL Query to Get Detailed Properties and Columns of Profiles Table
-- ============================================================

-- Method 1: Using information_schema (Standard SQL - Recommended)
-- This shows column names, data types, nullable status, default values, etc.
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default,
    ordinal_position,
    udt_name as postgres_type
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' 
    AND table_name = 'profiles'
ORDER BY 
    ordinal_position;

-- ============================================================
-- Method 2: More Detailed Information (PostgreSQL Specific)
-- ============================================================
SELECT 
    c.column_name,
    c.data_type,
    c.character_maximum_length,
    c.numeric_precision,
    c.numeric_scale,
    c.is_nullable,
    c.column_default,
    c.ordinal_position,
    c.udt_name,
    pgd.description as column_comment
FROM 
    information_schema.columns c
LEFT JOIN 
    pg_catalog.pg_statio_all_tables st ON st.schemaname = c.table_schema AND st.relname = c.table_name
LEFT JOIN 
    pg_catalog.pg_description pgd ON pgd.objoid = st.relid AND pgd.objsubid = c.ordinal_position
WHERE 
    c.table_schema = 'public' 
    AND c.table_name = 'profiles'
ORDER BY 
    c.ordinal_position;

-- ============================================================
-- Method 3: Get Table Structure with Constraints
-- ============================================================
SELECT 
    c.column_name,
    c.data_type,
    c.is_nullable,
    c.column_default,
    tc.constraint_type,
    tc.constraint_name,
    kcu.ordinal_position
FROM 
    information_schema.columns c
LEFT JOIN 
    information_schema.key_column_usage kcu 
    ON kcu.table_schema = c.table_schema 
    AND kcu.table_name = c.table_name 
    AND kcu.column_name = c.column_name
LEFT JOIN 
    information_schema.table_constraints tc 
    ON tc.table_schema = kcu.table_schema 
    AND tc.table_name = kcu.table_name 
    AND tc.constraint_name = kcu.constraint_name
WHERE 
    c.table_schema = 'public' 
    AND c.table_name = 'profiles'
ORDER BY 
    c.ordinal_position;

-- ============================================================
-- Method 4: Get All Table Information (PostgreSQL pg_catalog)
-- ============================================================
SELECT 
    a.attname AS column_name,
    pg_catalog.format_type(a.atttypid, a.atttypmod) AS data_type,
    a.attnotnull AS not_null,
    a.atthasdef AS has_default,
    pg_catalog.pg_get_expr(adbin, adrelid) AS default_value,
    pgd.description AS column_comment
FROM 
    pg_catalog.pg_attribute a
JOIN 
    pg_catalog.pg_class c ON a.attrelid = c.oid
LEFT JOIN 
    pg_catalog.pg_attrdef ad ON a.attrelid = ad.adrelid AND a.attnum = ad.adnum
LEFT JOIN 
    pg_catalog.pg_description pgd ON pgd.objoid = c.oid AND pgd.objsubid = a.attnum
WHERE 
    c.relname = 'profiles'
    AND a.attnum > 0
    AND NOT a.attisdropped
ORDER BY 
    a.attnum;

-- ============================================================
-- Method 5: Get Foreign Keys and Relationships
-- ============================================================
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM 
    information_schema.table_constraints AS tc 
JOIN 
    information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN 
    information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE 
    tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'profiles';

-- ============================================================
-- Method 6: Get Indexes on the Table
-- ============================================================
SELECT
    indexname,
    indexdef
FROM 
    pg_indexes
WHERE 
    tablename = 'profiles'
    AND schemaname = 'public';

-- ============================================================
-- Method 7: Complete Table Definition (CREATE TABLE equivalent)
-- ============================================================
SELECT 
    pg_get_tabledef('public.profiles');

-- ============================================================
-- Method 8: Simple Query - Just Column Names and Types
-- ============================================================
SELECT 
    column_name,
    data_type,
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' 
    AND table_name = 'profiles'
ORDER BY 
    ordinal_position;

