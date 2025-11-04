# CSV Import Column Mapping Guide

## Questions Table CSV Import Structure

This document maps the CSV headers (with spaces) to the Supabase database column names (with underscores).

### Column Mapping

| CSV Header       | Supabase Column | Data Type | Required | Notes |
| ---------------- | --------------- | --------- | -------- | ----- |
| question text    | question_text   | TEXT      | Yes      | Main question content |
| question type    | question_type   | TEXT      | Yes      | Values: 'mcq', 'true_false', 'fill_blank' (case-insensitive, will be normalized to lowercase) |
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

### CSV Import Requirements

1. **Column Order**: The CSV columns should be in the exact order shown above
2. **Column Headers**: Use the exact header names shown in the "CSV Header" column
3. **Data Types**: 
   - All text fields should be plain text
   - `marks` should be a number/integer
   - `question_type` must be one of: `mcq`, `true_false`, `fill_blank` (case-insensitive, will be normalized to lowercase)
   - `difficulty` must be one of: `easy`, `medium`, `hard` (case-insensitive, will be normalized to lowercase)

### Important Notes

- **MCQ Questions**: For `question_type = 'mcq'`, both `option_a` and `option_b` must be provided
- **True/False Questions**: For `question_type = 'true_false'`, options are automatically set to "True" and "False"
- **Fill Blank Questions**: For `question_type = 'fill_blank'`, provide the correct answer in `correct_answer`
- **Optional Fields**: `solution_steps`, `hints`, and `formula_used` can be left empty
- **System Columns**: The following columns are automatically handled by the system:
  - `id` (UUID, auto-generated)
  - `test_id` (UUID, optional)
  - `subcategory_id` (UUID, required - automatically resolved from `subcategory_slug`)
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
question text,question type,difficulty level,option a,option b,option c,option d,option e,correct answer,explanation,solution steps,hints,formula used,marks,subcategory_slug
"What is 2+2?","mcq","easy","2","3","4","5","6","4","The answer is 4","Step 1: Add 2 and 2","Think about basic addition","a + b = c",1,"quantitative-aptitude"
"Is Python a programming language?","true_false","easy",,,,,"True","Yes, Python is a programming language","","","",1,"logical-reasoning"
```

**Important**: Notice the header uses `subcategory_slug` (with underscore), not `subcategory slug` (with space).

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

