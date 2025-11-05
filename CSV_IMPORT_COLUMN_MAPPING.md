# CSV Import Column Mapping Guide

## Questions Table CSV Import Structure

This document maps the CSV headers (with spaces) to the Supabase database column names (with underscores).

### Column Mapping

| CSV Header       | Supabase Column | Data Type | Required | Notes |
| ---------------- | --------------- | --------- | -------- | ----- |
| question text    | question_text   | TEXT      | Yes      | Main question content |
| question_topic   | question_topic  | TEXT      | No       | **NEW**: Descriptive topic name from CSV (e.g., "Boats and Streams - Speed Calculation"). Used for analytics. |
| difficulty level | difficulty      | TEXT      | Yes      | Values: 'easy', 'medium', 'hard' (case-insensitive, will be normalized to lowercase) |
| option a         | option_a        | TEXT      | No       | Required for MCQ questions |
| option b         | option_b        | TEXT      | No       | Required for MCQ questions |
| option c         | option_c        | TEXT      | No       | Optional |
| option d         | option_d        | TEXT      | No       | Optional |
| option e         | option_e        | TEXT      | No       | Optional |
| correct answer   | correct_answer  | TEXT      | Yes      | The correct answer |
| explanation      | explanation     | TEXT      | Yes      | Detailed explanation |
| solution steps   | solution_steps  | TEXT      | No       | Step-by-step solution |
| hints            | hints           | TEXT      | No       | Hints for solving |
| formula used     | formula_used    | TEXT      | No       | Formulas or equations |
| marks            | marks           | INTEGER   | Yes      | Points awarded (default: 1) |
| subcategory_slug | subcategory_slug| TEXT      | Yes      | Subcategory slug (automatically resolves to subcategory_id). CSV header must use underscore format: "subcategory_slug" |

**Important Changes:**
- **`question_topic`** (NEW): Use this column for descriptive topic names from your CSV (e.g., "Boats and Streams - Still Water and Stream Speed")
- **`question_type`**: Now **automatically defaults to 'mcq'** - you don't need to include it in your CSV. The system will auto-fill it.
- The separation between `question_topic` (descriptive/analytics) and `question_type` (system logic) allows for better data organization.

### CSV Import Requirements

1. **Column Order**: The CSV columns should be in the exact order shown above
2. **Column Headers**: Use the exact header names shown in the "CSV Header" column
3. **Data Types**: 
   - All text fields should be plain text
   - `marks` should be a number/integer
   - `question_topic` is optional and can contain any descriptive text (e.g., "Boats and Streams - Speed Calculation")
   - `question_type` is **automatically set to 'mcq'** - you don't need to include it in your CSV
   - `difficulty` must be one of: `easy`, `medium`, `hard` (case-insensitive, will be normalized to lowercase)

### Important Notes

- **Question Topic vs Question Type**: 
  - **`question_topic`**: Descriptive topic name from CSV (e.g., "Boats and Streams - Speed Calculation"). Used for analytics and topic tracking.
  - **`question_type`**: System-level type (default: 'mcq'). Automatically set by the database, no need to include in CSV.
  - This separation allows descriptive analytics data while maintaining system logic integrity.

- **MCQ Questions**: Since `question_type` defaults to 'mcq', both `option_a` and `option_b` must be provided for standard imports
- **True/False Questions**: If you need `question_type = 'true_false'`, you'll need to set it manually after import (currently defaults to 'mcq')
- **Fill Blank Questions**: If you need `question_type = 'fill_blank'`, you'll need to set it manually after import (currently defaults to 'mcq')
- **Optional Fields**: `question_topic`, `solution_steps`, `hints`, and `formula_used` can be left empty
- **System Columns**: The following columns are automatically handled by the system:
  - `id` (UUID, auto-generated)
  - `test_id` (UUID, optional)
  - `subcategory_id` (UUID, required - automatically resolved from `subcategory_slug`)
  - `question_type` (TEXT, automatically set to 'mcq' if not provided)
  - `options` (JSONB, for backward compatibility)
  - `order` (INTEGER, default: 0)
  - `created_at` (TIMESTAMP, auto-generated)
  - `updated_at` (TIMESTAMP, auto-generated)

### Subcategory Slug Auto-Lookup

- **CSV Header Format**: **IMPORTANT** - Use underscore format: `subcategory_slug` (not "subcategory slug" with space)
- **Subcategory Slug**: Provide the subcategory slug in your CSV (e.g., "quantitative-aptitude", "logical-reasoning")
- **Automatic Resolution**: A trigger automatically looks up the `subcategory_id` UUID from the `subcategories` table based on the slug
- **Error Handling**: If the slug is not found, you'll get a helpful error message listing available subcategory slugs
- **Validation**: The subcategory slug must match an existing subcategory slug in the database
- **Note**: Supabase CSV import requires column headers to match database column names exactly. Use `subcategory_slug` (with underscore) in your CSV header.

### CSV Import Example

```csv
question text,question_topic,difficulty level,option a,option b,option c,option d,option e,correct answer,explanation,solution steps,hints,formula used,marks,subcategory_slug
"What is 2+2?","Basic Arithmetic - Addition","easy","2","3","4","5","6","4","The answer is 4","Step 1: Add 2 and 2","Think about basic addition","a + b = c",1,"quantitative-aptitude"
"A boat travels downstream...","Boats and Streams - Still Water and Stream Speed","Easy","Option A","Option B","Option C","Option D","Option E","A","Detailed explanation","Step-by-step solution","Hints for solving","Speed formula",1,"boats-streams"
```

**Important Notes:**
- Notice the header uses `question_topic` (not `question_type`). The `question_type` column is automatically set to 'mcq' by the database.
- The header uses `subcategory_slug` (with underscore), not `subcategory slug` (with space).
- `question_topic` can contain descriptive text like "Boats and Streams - Still Water and Stream Speed" for analytics purposes.

### Finding Available Subcategory Slugs

To find available subcategory slugs for your CSV, run this query:

```sql
SELECT slug, name, category_id 
FROM subcategories 
ORDER BY category_id, slug;
```

Or to see slugs with their category names:

```sql
SELECT 
  s.slug as subcategory_slug,
  s.name as subcategory_name,
  c.name as category_name
FROM subcategories s
JOIN categories c ON s.category_id = c.id
ORDER BY c.name, s.name;
```

### Verification Query

After importing, verify the data with:

```sql
SELECT 
  question_text,
  question_topic,
  question_type,
  difficulty,
  option_a,
  option_b,
  option_c,
  option_d,
  option_e,
  correct_answer,
  explanation,
  solution_steps,
  hints,
  formula_used,
  marks,
  subcategory_slug,
  subcategory_id
FROM questions
ORDER BY created_at DESC
LIMIT 10;
```

**Expected Results:**
- `question_topic`: Should contain your descriptive topic name from CSV (e.g., "Boats and Streams - Speed Calculation")
- `question_type`: Should automatically be 'mcq' for all imported records
- `subcategory_id`: Should be automatically resolved from `subcategory_slug`

### Troubleshooting CSV Import

**Error: "Subcategory slug 'X' not found"**
- Verify the slug exists in the `subcategories` table
- Check for typos or case sensitivity issues
- Use the query above to list all available slugs

**Error: "subcategory_id is required"**
- Make sure you've included the `subcategory_slug` column in your CSV (with underscore in header)
- Ensure the subcategory slug value is not empty
- Verify the slug matches exactly (case-sensitive) with a slug in the database

**Error: "The data that you are trying to import is incompatible with your table structure"**
- This usually means the CSV header doesn't match the database column name
- Use `subcategory_slug` (with underscore) in your CSV header, not `subcategory slug` (with space)
- Supabase CSV import requires exact column name matching

**Error: "column created_at does not exist"**
- This has been fixed in the trigger function
- If you still see this error, re-run migration `023_add_subcategory_slug_lookup.sql` to update the trigger

**Error: "violates check constraint questions_new_difficulty_check"**
- This means the difficulty value doesn't match the allowed values
- The trigger now automatically normalizes difficulty to lowercase (e.g., "Easy" → "easy")
- If you still see this error, ensure your CSV uses valid values: Easy/Medium/Hard (any case) or easy/medium/hard
- Re-run migration `023_add_subcategory_slug_lookup.sql` to update the trigger with normalization

**Error: "question_type column not found" or "violates check constraint" for question_type**
- This should not happen anymore as `question_type` is automatically set to 'mcq'
- Make sure you're using `question_topic` in your CSV header (not `question_type`)
- Run migration `024_add_question_topic_column.sql` to add the `question_topic` column and set the default
- The `question_type` column now defaults to 'mcq' automatically, so you don't need to include it in your CSV

