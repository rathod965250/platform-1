-- ============================================================
-- LIST QUESTIONS TABLE COLUMNS
-- ============================================================
-- Query to list all columns in the questions table
-- with their data types and order
-- ============================================================

-- Method 1: Simple column listing with types
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  ordinal_position
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'questions'
ORDER BY ordinal_position;

-- Method 2: Detailed column information
SELECT 
  ordinal_position AS "Position",
  column_name AS "Column Name",
  data_type AS "Data Type",
  character_maximum_length AS "Max Length",
  is_nullable AS "Nullable",
  column_default AS "Default Value"
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'questions'
ORDER BY ordinal_position;

-- Method 3: Get column names only (for CSV import mapping)
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'questions'
ORDER BY ordinal_position;

-- Method 4: Full table structure with constraints
SELECT 
  c.ordinal_position,
  c.column_name,
  c.data_type,
  c.character_maximum_length,
  c.is_nullable,
  c.column_default,
  CASE 
    WHEN pk.column_name IS NOT NULL THEN 'YES'
    ELSE 'NO'
  END AS is_primary_key,
  CASE 
    WHEN fk.column_name IS NOT NULL THEN 'YES'
    ELSE 'NO'
  END AS is_foreign_key
FROM information_schema.columns c
LEFT JOIN (
  SELECT ku.column_name
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage ku
    ON tc.constraint_name = ku.constraint_name
  WHERE tc.table_schema = 'public'
    AND tc.table_name = 'questions'
    AND tc.constraint_type = 'PRIMARY KEY'
) pk ON c.column_name = pk.column_name
LEFT JOIN (
  SELECT ku.column_name
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage ku
    ON tc.constraint_name = ku.constraint_name
  WHERE tc.table_schema = 'public'
    AND tc.table_name = 'questions'
    AND tc.constraint_type = 'FOREIGN KEY'
) fk ON c.column_name = fk.column_name
WHERE c.table_schema = 'public'
  AND c.table_name = 'questions'
ORDER BY c.ordinal_position;

