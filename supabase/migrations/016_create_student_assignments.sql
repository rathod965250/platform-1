-- ============================================================
-- STUDENT ASSIGNMENTS TABLE
-- ============================================================
-- This table tracks assignments allocated by admins to students
-- ============================================================

CREATE TABLE IF NOT EXISTS student_assignments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  test_id UUID REFERENCES tests(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  assigned_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  due_date TIMESTAMP WITH TIME ZONE,
  instructions TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue')),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(test_id, student_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_student_assignments_student_id ON student_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_assignments_test_id ON student_assignments(test_id);
CREATE INDEX IF NOT EXISTS idx_student_assignments_status ON student_assignments(status);
CREATE INDEX IF NOT EXISTS idx_student_assignments_due_date ON student_assignments(due_date);
CREATE INDEX IF NOT EXISTS idx_student_assignments_assigned_by ON student_assignments(assigned_by);

-- Enable RLS
ALTER TABLE student_assignments ENABLE ROW LEVEL SECURITY;

-- Policy: Students can view their own assignments
CREATE POLICY "Students can view their own assignments" ON student_assignments
  FOR SELECT
  USING (auth.uid() = student_id);

-- Policy: Admins can view all assignments
CREATE POLICY "Admins can view all assignments" ON student_assignments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Admins can insert assignments
CREATE POLICY "Admins can insert assignments" ON student_assignments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Admins can update assignments
CREATE POLICY "Admins can update assignments" ON student_assignments
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Admins can delete assignments
CREATE POLICY "Admins can delete assignments" ON student_assignments
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Students can update their assignment status (e.g., mark as in_progress, completed)
CREATE POLICY "Students can update their assignment status" ON student_assignments
  FOR UPDATE
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_student_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_student_assignments_updated_at
  BEFORE UPDATE ON student_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_student_assignments_updated_at();

-- Function to automatically update status based on due_date and completion
CREATE OR REPLACE FUNCTION update_assignment_status()
RETURNS TRIGGER AS $$
BEGIN
  -- If completed_at is set, status should be 'completed'
  IF NEW.completed_at IS NOT NULL THEN
    NEW.status = 'completed';
  -- If due_date has passed and not completed, status should be 'overdue'
  ELSIF NEW.due_date IS NOT NULL AND NEW.due_date < NOW() AND NEW.completed_at IS NULL THEN
    NEW.status = 'overdue';
  -- If status was 'pending' and test is started, it becomes 'in_progress'
  ELSIF NEW.status = 'pending' AND EXISTS (
    SELECT 1 FROM test_attempts
    WHERE test_attempts.test_id = NEW.test_id
    AND test_attempts.user_id = NEW.student_id
    AND test_attempts.submitted_at IS NULL
  ) THEN
    NEW.status = 'in_progress';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update status
CREATE TRIGGER update_assignment_status_trigger
  BEFORE INSERT OR UPDATE ON student_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_assignment_status();

COMMENT ON TABLE student_assignments IS 'Tracks assignments allocated by admins to students';
COMMENT ON COLUMN student_assignments.status IS 'Assignment status: pending, in_progress, completed, overdue';
COMMENT ON COLUMN student_assignments.due_date IS 'Optional due date for the assignment';

