-- ============================================================
-- NEWSLETTER SUBSCRIPTIONS TABLE
-- ============================================================
-- This table stores newsletter subscriptions from the footer
CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  source TEXT DEFAULT 'footer', -- Track where subscription came from
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Optional: link to user if they're logged in
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX idx_newsletter_subscriptions_email ON newsletter_subscriptions(email);
CREATE INDEX idx_newsletter_subscriptions_is_active ON newsletter_subscriptions(is_active);
CREATE INDEX idx_newsletter_subscriptions_user_id ON newsletter_subscriptions(user_id);
CREATE INDEX idx_newsletter_subscriptions_subscribed_at ON newsletter_subscriptions(subscribed_at DESC);

-- Enable RLS
ALTER TABLE newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Anyone can subscribe (INSERT)
CREATE POLICY "Anyone can subscribe to newsletter" ON newsletter_subscriptions
  FOR INSERT WITH CHECK (true);

-- Only admins can view all subscriptions
CREATE POLICY "Admins can view all newsletter subscriptions" ON newsletter_subscriptions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Users can view their own subscription (if linked to profile)
CREATE POLICY "Users can view own newsletter subscription" ON newsletter_subscriptions
  FOR SELECT USING (
    user_id = auth.uid() OR
    email = (SELECT email FROM profiles WHERE id = auth.uid())
  );

-- Users can update their own subscription
CREATE POLICY "Users can update own newsletter subscription" ON newsletter_subscriptions
  FOR UPDATE USING (
    user_id = auth.uid() OR
    email = (SELECT email FROM profiles WHERE id = auth.uid())
  );

-- Function to update updated_at timestamp
CREATE TRIGGER update_newsletter_subscriptions_updated_at
  BEFORE UPDATE ON newsletter_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

