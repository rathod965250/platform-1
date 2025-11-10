-- Create table to track device and browser information for test attempts
-- This helps analyze user behavior, optimize platform performance, and ensure compatibility

-- Create enum for device types
CREATE TYPE device_type AS ENUM ('mobile', 'tablet', 'desktop', 'unknown');

-- Create table for test device information
CREATE TABLE IF NOT EXISTS test_device_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign keys
  test_attempt_id UUID REFERENCES test_attempts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
  
  -- Device information
  device_type device_type NOT NULL DEFAULT 'unknown',
  screen_width INTEGER,
  screen_height INTEGER,
  pixel_ratio DECIMAL(3,2),
  
  -- Browser information
  browser_name VARCHAR(100),
  browser_version VARCHAR(50),
  user_agent TEXT,
  
  -- Operating system
  os_name VARCHAR(100),
  os_version VARCHAR(50),
  
  -- Additional context
  is_mobile BOOLEAN DEFAULT false,
  is_tablet BOOLEAN DEFAULT false,
  is_desktop BOOLEAN DEFAULT true,
  
  -- Network information (optional)
  connection_type VARCHAR(50), -- e.g., '4g', 'wifi', 'ethernet'
  
  -- Timezone information
  timezone VARCHAR(100),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_screen_dimensions CHECK (screen_width > 0 AND screen_height > 0),
  CONSTRAINT valid_pixel_ratio CHECK (pixel_ratio > 0)
);

-- Create indexes for better query performance
CREATE INDEX idx_test_device_info_user_id ON test_device_info(user_id);
CREATE INDEX idx_test_device_info_test_id ON test_device_info(test_id);
CREATE INDEX idx_test_device_info_test_attempt_id ON test_device_info(test_attempt_id);
CREATE INDEX idx_test_device_info_device_type ON test_device_info(device_type);
CREATE INDEX idx_test_device_info_browser_name ON test_device_info(browser_name);
CREATE INDEX idx_test_device_info_created_at ON test_device_info(created_at);

-- Create composite index for common queries
CREATE INDEX idx_test_device_info_device_browser ON test_device_info(device_type, browser_name);

-- Enable Row Level Security
ALTER TABLE test_device_info ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view their own device info
CREATE POLICY "Users can view their own device info"
  ON test_device_info
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own device info
CREATE POLICY "Users can insert their own device info"
  ON test_device_info
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all device info
CREATE POLICY "Admins can view all device info"
  ON test_device_info
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can update device info
CREATE POLICY "Admins can update device info"
  ON test_device_info
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_test_device_info_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_test_device_info_updated_at
  BEFORE UPDATE ON test_device_info
  FOR EACH ROW
  EXECUTE FUNCTION update_test_device_info_updated_at();

-- Create function to get device statistics
CREATE OR REPLACE FUNCTION get_device_statistics(
  start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  device_type device_type,
  browser_name VARCHAR(100),
  count BIGINT,
  avg_screen_width NUMERIC,
  avg_screen_height NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tdi.device_type,
    tdi.browser_name,
    COUNT(*)::BIGINT as count,
    ROUND(AVG(tdi.screen_width), 0) as avg_screen_width,
    ROUND(AVG(tdi.screen_height), 0) as avg_screen_height
  FROM test_device_info tdi
  WHERE tdi.created_at BETWEEN start_date AND end_date
  GROUP BY tdi.device_type, tdi.browser_name
  ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_device_statistics TO authenticated;

-- Add helpful comments
COMMENT ON TABLE test_device_info IS 'Stores device and browser information for test attempts to analyze user behavior and optimize platform compatibility';
COMMENT ON COLUMN test_device_info.device_type IS 'Type of device: mobile, tablet, desktop, or unknown';
COMMENT ON COLUMN test_device_info.browser_name IS 'Name of the browser (e.g., Chrome, Firefox, Safari)';
COMMENT ON COLUMN test_device_info.user_agent IS 'Full user agent string for detailed analysis';
COMMENT ON COLUMN test_device_info.screen_width IS 'Screen width in pixels';
COMMENT ON COLUMN test_device_info.screen_height IS 'Screen height in pixels';
COMMENT ON COLUMN test_device_info.connection_type IS 'Network connection type (e.g., 4g, wifi, ethernet)';
