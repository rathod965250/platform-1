-- ============================================================
-- ONBOARDING LOOKUP TABLES
-- ============================================================
-- These tables provide lookup options for the onboarding form
-- with real-time synchronization support

-- ============================================================
-- COLLEGES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS colleges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  location TEXT,
  type TEXT CHECK (type IN ('university', 'college', 'institute', 'other')),
  is_active BOOLEAN DEFAULT true,
  is_user_submitted BOOLEAN DEFAULT false,
  submitted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_colleges_name ON colleges(name);
CREATE INDEX idx_colleges_active ON colleges(is_active);
CREATE INDEX idx_colleges_order ON colleges(display_order);
CREATE INDEX idx_colleges_submitted_by ON colleges(submitted_by);
CREATE INDEX idx_colleges_user_submitted ON colleges(is_user_submitted);

-- ============================================================
-- COMPANIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT CHECK (category IN ('it_services', 'tech_giants', 'finance', 'consulting', 'consumer_goods', 'startups', 'other')),
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  is_user_submitted BOOLEAN DEFAULT false,
  submitted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_companies_name ON companies(name);
CREATE INDEX idx_companies_category ON companies(category);
CREATE INDEX idx_companies_active ON companies(is_active);
CREATE INDEX idx_companies_order ON companies(display_order);
CREATE INDEX idx_companies_submitted_by ON companies(submitted_by);
CREATE INDEX idx_companies_user_submitted ON companies(is_user_submitted);

-- ============================================================
-- GRADUATION_YEARS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS graduation_years (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  year INTEGER NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_graduation_years_year ON graduation_years(year);
CREATE INDEX idx_graduation_years_active ON graduation_years(is_active);
CREATE INDEX idx_graduation_years_order ON graduation_years(display_order);

-- ============================================================
-- COURSES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  code TEXT,
  degree_type TEXT CHECK (degree_type IN ('bachelor', 'master', 'diploma', 'certificate', 'other')),
  is_active BOOLEAN DEFAULT true,
  is_user_submitted BOOLEAN DEFAULT false,
  submitted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_courses_name ON courses(name);
CREATE INDEX idx_courses_degree_type ON courses(degree_type);
CREATE INDEX idx_courses_active ON courses(is_active);
CREATE INDEX idx_courses_order ON courses(display_order);
CREATE INDEX idx_courses_submitted_by ON courses(submitted_by);
CREATE INDEX idx_courses_user_submitted ON courses(is_user_submitted);

-- ============================================================
-- UPDATE TRIGGERS
-- ============================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at (with IF NOT EXISTS handling)
DO $$
BEGIN
  -- Drop triggers if they exist
  DROP TRIGGER IF EXISTS update_colleges_updated_at ON colleges;
  DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
  DROP TRIGGER IF EXISTS update_courses_updated_at ON courses;
  
  -- Create triggers
  CREATE TRIGGER update_colleges_updated_at
    BEFORE UPDATE ON colleges
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

  CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON companies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

  CREATE TRIGGER update_courses_updated_at
    BEFORE UPDATE ON courses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
END $$;

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- Enable RLS on all lookup tables
ALTER TABLE colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE graduation_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Colleges policies - public read, admin write, users can add
CREATE POLICY "Anyone can view active colleges" ON colleges
  FOR SELECT USING (is_active = true);

CREATE POLICY "Authenticated users can submit colleges" ON colleges
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    submitted_by = auth.uid() AND
    is_user_submitted = true
  );

-- Create a security definer function to check admin role without RLS recursion
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  -- This function bypasses RLS (SECURITY DEFINER) so it won't cause recursion
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin() TO anon;

CREATE POLICY "Admins can manage all colleges" ON colleges
  FOR ALL USING (is_admin());

-- Companies policies - public read, admin write, users can add
CREATE POLICY "Anyone can view active companies" ON companies
  FOR SELECT USING (is_active = true);

CREATE POLICY "Authenticated users can submit companies" ON companies
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    submitted_by = auth.uid() AND
    is_user_submitted = true
  );

CREATE POLICY "Admins can manage all companies" ON companies
  FOR ALL USING (is_admin());

-- Graduation years policies - public read, admin write
CREATE POLICY "Anyone can view active graduation years" ON graduation_years
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage graduation years" ON graduation_years
  FOR ALL USING (is_admin());

-- Courses policies - public read, admin write, users can add
CREATE POLICY "Anyone can view active courses" ON courses
  FOR SELECT USING (is_active = true);

CREATE POLICY "Authenticated users can submit courses" ON courses
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    submitted_by = auth.uid() AND
    is_user_submitted = true
  );

CREATE POLICY "Admins can manage all courses" ON courses
  FOR ALL USING (is_admin());

-- ============================================================
-- INITIAL DATA
-- ============================================================

-- Insert common graduation years (next 10 years)
INSERT INTO graduation_years (year, is_active, display_order)
SELECT 
  generate_series(EXTRACT(YEAR FROM NOW())::INTEGER, (EXTRACT(YEAR FROM NOW())::INTEGER + 9)) AS year,
  true AS is_active,
  generate_series(EXTRACT(YEAR FROM NOW())::INTEGER, (EXTRACT(YEAR FROM NOW())::INTEGER + 9)) AS display_order
ON CONFLICT (year) DO NOTHING;

-- Insert common companies
INSERT INTO companies (name, category, is_active, is_user_submitted, display_order) VALUES
  ('TCS', 'it_services', true, false, 1),
  ('Infosys', 'it_services', true, false, 2),
  ('Wipro', 'it_services', true, false, 3),
  ('Accenture', 'it_services', true, false, 4),
  ('Cognizant', 'it_services', true, false, 5),
  ('HCL', 'it_services', true, false, 6),
  ('Tech Mahindra', 'it_services', true, false, 7),
  ('Microsoft', 'tech_giants', true, false, 8),
  ('Google', 'tech_giants', true, false, 9),
  ('Amazon', 'tech_giants', true, false, 10),
  ('Apple', 'tech_giants', true, false, 11),
  ('Meta', 'tech_giants', true, false, 12),
  ('Oracle', 'tech_giants', true, false, 13),
  ('IBM', 'tech_giants', true, false, 14),
  ('Goldman Sachs', 'finance', true, false, 15),
  ('Morgan Stanley', 'finance', true, false, 16),
  ('JP Morgan', 'finance', true, false, 17),
  ('Deloitte', 'consulting', true, false, 18),
  ('PwC', 'consulting', true, false, 19),
  ('KPMG', 'consulting', true, false, 20),
  ('Unilever', 'consumer_goods', true, false, 21),
  ('Procter & Gamble', 'consumer_goods', true, false, 22),
  ('Nestle', 'consumer_goods', true, false, 23),
  ('Flipkart', 'startups', true, false, 24),
  ('Swiggy', 'startups', true, false, 25),
  ('Zomato', 'startups', true, false, 26),
  ('Paytm', 'startups', true, false, 27),
  ('Razorpay', 'startups', true, false, 28)
ON CONFLICT (name) DO NOTHING;

-- Insert common colleges
INSERT INTO colleges (name, location, type, is_active, is_user_submitted, display_order) VALUES
  ('IIT Delhi', 'Delhi', 'institute', true, false, 1),
  ('IIT Bombay', 'Mumbai', 'institute', true, false, 2),
  ('IIT Madras', 'Chennai', 'institute', true, false, 3),
  ('IIT Kanpur', 'Kanpur', 'institute', true, false, 4),
  ('IIT Kharagpur', 'Kharagpur', 'institute', true, false, 5),
  ('NIT Warangal', 'Warangal', 'institute', true, false, 6),
  ('NIT Trichy', 'Trichy', 'institute', true, false, 7),
  ('BITS Pilani', 'Pilani', 'university', true, false, 8),
  ('IIIT Hyderabad', 'Hyderabad', 'institute', true, false, 9),
  ('IIIT Bangalore', 'Bangalore', 'institute', true, false, 10)
ON CONFLICT (name) DO NOTHING;

-- Insert common courses
INSERT INTO courses (name, code, degree_type, is_active, is_user_submitted, display_order) VALUES
  ('Computer Science Engineering', 'CSE', 'bachelor', true, false, 1),
  ('Information Technology', 'IT', 'bachelor', true, false, 2),
  ('Electronics and Communication Engineering', 'ECE', 'bachelor', true, false, 3),
  ('Mechanical Engineering', 'ME', 'bachelor', true, false, 4),
  ('Electrical Engineering', 'EE', 'bachelor', true, false, 5),
  ('Civil Engineering', 'CE', 'bachelor', true, false, 6),
  ('Master of Computer Applications', 'MCA', 'master', true, false, 7),
  ('Master of Technology', 'MTech', 'master', true, false, 8),
  ('Master of Business Administration', 'MBA', 'master', true, false, 9)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- ENABLE REALTIME
-- ============================================================

-- Enable Realtime for all lookup tables (with error handling)
DO $$
BEGIN
  -- Try to add colleges to realtime publication
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE colleges;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Table colleges already in realtime publication or publication does not exist';
  END;

  -- Try to add companies to realtime publication
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE companies;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Table companies already in realtime publication or publication does not exist';
  END;

  -- Try to add graduation_years to realtime publication
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE graduation_years;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Table graduation_years already in realtime publication or publication does not exist';
  END;

  -- Try to add courses to realtime publication
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE courses;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Table courses already in realtime publication or publication does not exist';
  END;
END $$;

-- ============================================================
-- ADD COURSE_ID COLUMN TO PROFILES
-- ============================================================

-- Add course_id column to profiles table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'course_id'
  ) THEN
    ALTER TABLE profiles 
    ADD COLUMN course_id UUID REFERENCES courses(id) ON DELETE SET NULL;
    
    CREATE INDEX IF NOT EXISTS idx_profiles_course_id ON profiles(course_id);
  END IF;
END $$;

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON TABLE colleges IS 'Lookup table for colleges and universities with user submission support';
COMMENT ON TABLE companies IS 'Lookup table for target companies with user submission support';
COMMENT ON TABLE graduation_years IS 'Lookup table for graduation years';
COMMENT ON TABLE courses IS 'Lookup table for courses and degrees with user submission support';

