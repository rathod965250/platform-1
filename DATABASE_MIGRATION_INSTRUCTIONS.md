# 📋 Database Migration Instructions - Testimonials Table

## ✅ Migration File Ready

The migration file `supabase/migrations/004_add_testimonials_table.sql` is ready to be applied to your Supabase database.

## 🚀 How to Apply the Migration

### Option 1: Via Supabase Dashboard (Recommended - Easiest)

1. **Go to Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard
   - Select your project: `rscxnpoffeedqfgynnct`

2. **Navigate to SQL Editor:**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy and Paste the Migration:**
   - Open the file: `supabase/migrations/004_add_testimonials_table.sql`
   - Copy ALL the SQL content
   - Paste it into the SQL Editor

4. **Run the Migration:**
   - Click "Run" button (or press Ctrl+Enter)
   - Wait for the success message

5. **Verify the Table:**
   - Go to "Table Editor" in the left sidebar
   - Look for the `testimonials` table
   - You should see 9 sample testimonials

### Option 2: Via Supabase CLI (If you have it installed)

```bash
# Navigate to your project directory
cd C:\Users\ratho\OneDrive\Desktop\platform

# Apply the migration
supabase db push

# Or apply specific migration
supabase migration up
```

## 🔍 Verify the Migration

After applying the migration, verify it worked:

### 1. Check Table Exists
Run this query in SQL Editor:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'testimonials';
```

### 2. Check Data Was Inserted
```sql
SELECT COUNT(*) FROM testimonials;
```
Should return: **9**

### 3. View Sample Data
```sql
SELECT id, name, role, company, is_active, display_order 
FROM testimonials 
ORDER BY display_order;
```

### 4. Test RLS Policies
```sql
-- This should return all 9 active testimonials (public access)
SELECT * FROM testimonials WHERE is_active = true;
```

## 🎯 Component Connection Verification

The component at `src/components/landing/TestimonialsSection.tsx` is already correctly configured to:

1. ✅ Query the `testimonials` table
2. ✅ Filter by `is_active = true`
3. ✅ Order by `display_order`
4. ✅ Transform `image_url` → `image` for the component
5. ✅ Format `role` with `company` as "Role at Company"
6. ✅ Use fallback data if database is unavailable

### Database Query Being Used:
```typescript
const { data, error } = await supabase
  .from('testimonials')
  .select('text, image_url, name, role, company')
  .eq('is_active', true)
  .order('display_order', { ascending: true })
  .limit(9)
```

### Schema Mapping:
| Database Column | Component Property | Transformation |
|----------------|-------------------|----------------|
| `text` | `text` | Direct mapping |
| `image_url` | `image` | Direct mapping |
| `name` | `name` | Direct mapping |
| `role` + `company` | `role` | `company ? "${role} at ${company}" : role` |

## 🔧 Troubleshooting

### Error: "Could not find the table 'public.testimonials'"
**Solution:** The migration hasn't been applied yet. Follow Option 1 above to apply it.

### Error: "permission denied for table testimonials"
**Solution:** Check that RLS policies are correctly set:
```sql
-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'testimonials';

-- Should return: rowsecurity = true
```

### No Data Showing
**Check:**
1. Are testimonials set to `is_active = true`?
```sql
SELECT * FROM testimonials WHERE is_active = false;
```

2. Check browser console for errors
3. Verify Supabase environment variables are set in `.env.local`

### Component Shows Fallback Data
This is expected if:
- Migration hasn't been applied yet
- Database connection fails
- All testimonials have `is_active = false`

The component will automatically use database data once the migration is applied and data is active.

## ✅ Success Indicators

Once the migration is successfully applied, you should see:

1. ✅ Table appears in Supabase Dashboard → Table Editor
2. ✅ 9 testimonials visible in the table
3. ✅ Component loads testimonials from database (check browser console)
4. ✅ No 404 errors in browser console for `/rest/v1/testimonials`
5. ✅ Console shows: `✅ Successfully loaded 9 testimonials from database`

## 📝 Next Steps

After applying the migration:
1. Visit http://localhost:3000
2. Scroll to the Testimonials section
3. Check browser console - you should see the success message
4. Testimonials should display with data from the database

## 🎉 Expected Result

The testimonials section will:
- Display 9 testimonials from the database
- Show in 3 animated scrolling columns
- Use images from Unsplash (as defined in migration)
- Format roles as "Role at Company"

---

**Note:** The component includes fallback data, so it will work even before the migration is applied. Once you apply the migration, it will automatically switch to database data!
