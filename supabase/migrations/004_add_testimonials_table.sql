-- Create testimonials table
CREATE TABLE IF NOT EXISTS testimonials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  text TEXT NOT NULL,
  image_url TEXT NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) DEFAULT 5,
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for better query performance
CREATE INDEX idx_testimonials_active_featured ON testimonials(is_active, is_featured);
CREATE INDEX idx_testimonials_display_order ON testimonials(display_order);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_testimonials_updated_at
  BEFORE UPDATE ON testimonials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample testimonials data for aptitude test platform
INSERT INTO testimonials (text, image_url, name, role, company, rating, is_featured, display_order) VALUES
('CrackAtom transformed my aptitude test preparation completely. The AI-powered practice sessions helped me identify my weak areas and improve systematically. I scored 95th percentile in my placement test!', 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face', 'Priya Sharma', 'Software Engineer', 'TCS', 5, true, 1),
('The personalized learning path was exactly what I needed. Within 3 weeks, my problem-solving speed doubled and accuracy improved by 40%. Highly recommend CrackAtom!', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face', 'Rahul Kumar', 'Data Analyst', 'Infosys', 5, true, 2),
('I was struggling with quantitative aptitude for months. CrackAtom''s adaptive algorithm made practice sessions so effective that I cleared 4 company tests in a row!', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face', 'Anita Desai', 'Business Analyst', 'Wipro', 5, true, 3),
('The mock tests felt exactly like real placement exams. The detailed analytics helped me understand my performance patterns. Got placed in my dream company!', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face', 'Arjun Patel', 'Product Manager', 'Microsoft', 5, false, 4),
('CrackAtom''s logical reasoning modules are outstanding. The step-by-step explanations helped me master complex problems. My confidence skyrocketed!', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face', 'Sneha Gupta', 'Consultant', 'Deloitte', 5, false, 5),
('From scoring 60% to 92% in just 6 weeks! The AI recommendations were spot-on and the progress tracking kept me motivated throughout my preparation journey.', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&crop=face', 'Vikram Singh', 'Financial Analyst', 'Goldman Sachs', 5, false, 6),
('The verbal ability section was my weakness, but CrackAtom''s targeted practice made it my strength. The platform adapts perfectly to your learning style.', 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=400&h=400&fit=crop&crop=face', 'Meera Reddy', 'Marketing Executive', 'Unilever', 5, false, 7),
('Best investment I made for my career! The comprehensive question bank and real-time performance analysis gave me the edge I needed in competitive exams.', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face', 'Karthik Nair', 'Software Developer', 'Amazon', 5, false, 8),
('CrackAtom''s approach to aptitude preparation is revolutionary. The personalized feedback and adaptive difficulty made learning enjoyable and highly effective.', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=face', 'Divya Joshi', 'Data Scientist', 'Google', 5, false, 9);

-- Enable Row Level Security (RLS)
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access to active testimonials
CREATE POLICY "Public read access for active testimonials" ON testimonials
  FOR SELECT USING (is_active = true);

-- Create policy for authenticated users to manage testimonials (admin only)
CREATE POLICY "Admin full access to testimonials" ON testimonials
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Enable Realtime for testimonials table
ALTER PUBLICATION supabase_realtime ADD TABLE testimonials;