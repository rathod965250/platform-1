-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROFILES TABLE
-- ============================================================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  avatar_url TEXT,
  college TEXT,
  graduation_year INTEGER,
  target_companies TEXT[],
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);

-- ============================================================
-- CATEGORIES TABLE
-- ============================================================
CREATE TABLE categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_order ON categories("order");

-- ============================================================
-- SUBCATEGORIES TABLE
-- ============================================================
CREATE TABLE subcategories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  UNIQUE(category_id, slug)
);

CREATE INDEX idx_subcategories_category_id ON subcategories(category_id);
CREATE INDEX idx_subcategories_slug ON subcategories(slug);

-- ============================================================
-- TESTS TABLE
-- ============================================================
CREATE TABLE tests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  test_type TEXT NOT NULL CHECK (test_type IN ('practice', 'mock', 'company_specific')),
  company_name TEXT,
  duration_minutes INTEGER NOT NULL,
  total_marks INTEGER NOT NULL DEFAULT 0,
  negative_marking BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_tests_slug ON tests(slug);
CREATE INDEX idx_tests_type ON tests(test_type);
CREATE INDEX idx_tests_company ON tests(company_name);
CREATE INDEX idx_tests_published ON tests(is_published);
CREATE INDEX idx_tests_created_by ON tests(created_by);

-- ============================================================
-- QUESTIONS TABLE
-- ============================================================
CREATE TABLE questions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
  subcategory_id UUID REFERENCES subcategories(id) ON DELETE CASCADE NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('mcq', 'true_false', 'fill_blank')),
  question_text TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer TEXT NOT NULL,
  explanation TEXT NOT NULL,
  marks INTEGER NOT NULL DEFAULT 1,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  "order" INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_questions_test_id ON questions(test_id);
CREATE INDEX idx_questions_subcategory_id ON questions(subcategory_id);
CREATE INDEX idx_questions_difficulty ON questions(difficulty);

-- ============================================================
-- PRACTICE SESSIONS TABLE
-- ============================================================
CREATE TABLE practice_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  skipped_count INTEGER NOT NULL DEFAULT 0,
  time_taken_seconds INTEGER NOT NULL DEFAULT 0,
  config JSONB NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_practice_sessions_user_id ON practice_sessions(user_id);
CREATE INDEX idx_practice_sessions_category_id ON practice_sessions(category_id);
CREATE INDEX idx_practice_sessions_completed_at ON practice_sessions(completed_at);

-- ============================================================
-- SESSION ANSWERS TABLE
-- ============================================================
CREATE TABLE session_answers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES practice_sessions(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE NOT NULL,
  user_answer TEXT,
  is_correct BOOLEAN NOT NULL,
  time_taken_seconds INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_session_answers_session_id ON session_answers(session_id);
CREATE INDEX idx_session_answers_question_id ON session_answers(question_id);

-- ============================================================
-- TEST ATTEMPTS TABLE
-- ============================================================
CREATE TABLE test_attempts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  test_id UUID REFERENCES tests(id) ON DELETE CASCADE NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  skipped_count INTEGER NOT NULL DEFAULT 0,
  marked_for_review_count INTEGER NOT NULL DEFAULT 0,
  time_taken_seconds INTEGER NOT NULL DEFAULT 0,
  percentile NUMERIC(5, 2),
  rank INTEGER,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_test_attempts_user_id ON test_attempts(user_id);
CREATE INDEX idx_test_attempts_test_id ON test_attempts(test_id);
CREATE INDEX idx_test_attempts_submitted_at ON test_attempts(submitted_at);
CREATE INDEX idx_test_attempts_score ON test_attempts(score DESC);

-- ============================================================
-- ATTEMPT ANSWERS TABLE
-- ============================================================
CREATE TABLE attempt_answers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  attempt_id UUID REFERENCES test_attempts(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE NOT NULL,
  user_answer TEXT,
  is_correct BOOLEAN NOT NULL,
  is_marked_for_review BOOLEAN DEFAULT FALSE,
  is_skipped BOOLEAN DEFAULT FALSE,
  marks_obtained INTEGER NOT NULL DEFAULT 0,
  time_taken_seconds INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_attempt_answers_attempt_id ON attempt_answers(attempt_id);
CREATE INDEX idx_attempt_answers_question_id ON attempt_answers(question_id);

-- ============================================================
-- USER ANALYTICS TABLE
-- ============================================================
CREATE TABLE user_analytics (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  subcategory_id UUID REFERENCES subcategories(id) ON DELETE CASCADE,
  total_attempts INTEGER DEFAULT 0,
  total_practice_sessions INTEGER DEFAULT 0,
  avg_score NUMERIC(5, 2) DEFAULT 0,
  total_time_spent_seconds INTEGER DEFAULT 0,
  weak_areas JSONB DEFAULT '{}'::jsonb,
  strengths JSONB DEFAULT '{}'::jsonb,
  current_streak_days INTEGER DEFAULT 0,
  last_activity_date DATE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_analytics_user_id ON user_analytics(user_id);
CREATE INDEX idx_user_analytics_category_id ON user_analytics(category_id);

-- ============================================================
-- LEADERBOARD TABLE
-- ============================================================
CREATE TABLE leaderboard (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
  rank INTEGER NOT NULL,
  score INTEGER NOT NULL,
  time_taken INTEGER NOT NULL,
  percentile NUMERIC(5, 2) NOT NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('all', 'weekly', 'monthly')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_leaderboard_user_id ON leaderboard(user_id);
CREATE INDEX idx_leaderboard_test_id ON leaderboard(test_id);
CREATE INDEX idx_leaderboard_period_type ON leaderboard(period_type);
CREATE INDEX idx_leaderboard_rank ON leaderboard(rank);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempt_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Categories policies (public read, admin write)
CREATE POLICY "Anyone can view published categories" ON categories
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert categories" ON categories
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update categories" ON categories
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete categories" ON categories
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Subcategories policies (same as categories)
CREATE POLICY "Anyone can view subcategories" ON subcategories
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert subcategories" ON subcategories
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update subcategories" ON subcategories
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete subcategories" ON subcategories
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Tests policies
CREATE POLICY "Anyone can view published tests" ON tests
  FOR SELECT USING (is_published = true OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can insert tests" ON tests
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update tests" ON tests
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete tests" ON tests
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Questions policies
CREATE POLICY "Anyone can view questions of published tests" ON questions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM tests WHERE tests.id = questions.test_id AND tests.is_published = true)
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can insert questions" ON questions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update questions" ON questions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete questions" ON questions
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Practice sessions policies
CREATE POLICY "Users can view own practice sessions" ON practice_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own practice sessions" ON practice_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Session answers policies
CREATE POLICY "Users can view own session answers" ON session_answers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM practice_sessions WHERE practice_sessions.id = session_answers.session_id AND practice_sessions.user_id = auth.uid())
  );

CREATE POLICY "Users can insert own session answers" ON session_answers
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM practice_sessions WHERE practice_sessions.id = session_answers.session_id AND practice_sessions.user_id = auth.uid())
  );

-- Test attempts policies
CREATE POLICY "Users can view own test attempts" ON test_attempts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own test attempts" ON test_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own test attempts" ON test_attempts
  FOR UPDATE USING (auth.uid() = user_id);

-- Attempt answers policies
CREATE POLICY "Users can view own attempt answers" ON attempt_answers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM test_attempts WHERE test_attempts.id = attempt_answers.attempt_id AND test_attempts.user_id = auth.uid())
  );

CREATE POLICY "Users can insert own attempt answers" ON attempt_answers
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM test_attempts WHERE test_attempts.id = attempt_answers.attempt_id AND test_attempts.user_id = auth.uid())
  );

-- User analytics policies
CREATE POLICY "Users can view own analytics" ON user_analytics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert analytics" ON user_analytics
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update analytics" ON user_analytics
  FOR UPDATE USING (true);

-- Leaderboard policies (public read)
CREATE POLICY "Anyone can view leaderboard" ON leaderboard
  FOR SELECT USING (true);

CREATE POLICY "System can insert leaderboard" ON leaderboard
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update leaderboard" ON leaderboard
  FOR UPDATE USING (true);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Function to create user profile automatically on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'student');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call handle_new_user on auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_analytics_updated_at
  BEFORE UPDATE ON user_analytics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leaderboard_updated_at
  BEFORE UPDATE ON leaderboard
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- SEED DATA
-- ============================================================

-- Insert default categories
INSERT INTO categories (name, slug, description, icon, "order") VALUES
  ('Quantitative Aptitude', 'quantitative-aptitude', 'Mathematical and numerical ability tests', 'Calculator', 1),
  ('Logical Reasoning', 'logical-reasoning', 'Logic and analytical thinking tests', 'Brain', 2),
  ('Verbal Ability', 'verbal-ability', 'English language and comprehension tests', 'BookOpen', 3),
  ('Data Interpretation', 'data-interpretation', 'Data analysis and interpretation tests', 'BarChart3', 4),
  ('Problem Solving', 'problem-solving', 'General problem solving and critical thinking', 'Lightbulb', 5);

-- Get category IDs for subcategories
DO $$
DECLARE
  quant_id UUID;
  logical_id UUID;
  verbal_id UUID;
  data_id UUID;
  problem_id UUID;
BEGIN
  SELECT id INTO quant_id FROM categories WHERE slug = 'quantitative-aptitude';
  SELECT id INTO logical_id FROM categories WHERE slug = 'logical-reasoning';
  SELECT id INTO verbal_id FROM categories WHERE slug = 'verbal-ability';
  SELECT id INTO data_id FROM categories WHERE slug = 'data-interpretation';
  SELECT id INTO problem_id FROM categories WHERE slug = 'problem-solving';

  -- Insert subcategories for Quantitative Aptitude
  INSERT INTO subcategories (category_id, name, slug, "order") VALUES
    (quant_id, 'Arithmetic', 'arithmetic', 1),
    (quant_id, 'Algebra', 'algebra', 2),
    (quant_id, 'Geometry', 'geometry', 3),
    (quant_id, 'Percentages', 'percentages', 4),
    (quant_id, 'Profit & Loss', 'profit-loss', 5),
    (quant_id, 'Time & Work', 'time-work', 6),
    (quant_id, 'Time, Speed & Distance', 'time-speed-distance', 7);

  -- Insert subcategories for Logical Reasoning
  INSERT INTO subcategories (category_id, name, slug, "order") VALUES
    (logical_id, 'Puzzles', 'puzzles', 1),
    (logical_id, 'Series', 'series', 2),
    (logical_id, 'Blood Relations', 'blood-relations', 3),
    (logical_id, 'Coding-Decoding', 'coding-decoding', 4),
    (logical_id, 'Syllogism', 'syllogism', 5);

  -- Insert subcategories for Verbal Ability
  INSERT INTO subcategories (category_id, name, slug, "order") VALUES
    (verbal_id, 'Grammar', 'grammar', 1),
    (verbal_id, 'Vocabulary', 'vocabulary', 2),
    (verbal_id, 'Comprehension', 'comprehension', 3),
    (verbal_id, 'Sentence Correction', 'sentence-correction', 4);

  -- Insert subcategories for Data Interpretation
  INSERT INTO subcategories (category_id, name, slug, "order") VALUES
    (data_id, 'Tables', 'tables', 1),
    (data_id, 'Graphs', 'graphs', 2),
    (data_id, 'Charts', 'charts', 3);

  -- Insert subcategories for Problem Solving
  INSERT INTO subcategories (category_id, name, slug, "order") VALUES
    (problem_id, 'Critical Thinking', 'critical-thinking', 1),
    (problem_id, 'Decision Making', 'decision-making', 2);
END $$;

