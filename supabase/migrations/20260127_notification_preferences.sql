-- =====================================================
-- Notification Preferences Table Migration
-- Creates the notification_preferences table for user settings
-- =====================================================

-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  notification_types JSONB DEFAULT '{
    "order_update": true,
    "payment_verified": true,
    "challenge_milestone": true,
    "admin_action": true,
    "system_announcement": true
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);

-- =====================================================
-- Automatic Updated At Trigger
-- =====================================================

-- Create trigger for notification_preferences table
DROP TRIGGER IF EXISTS update_notification_preferences_updated_at ON notification_preferences;
CREATE TRIGGER update_notification_preferences_updated_at 
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Default Preferences Function
-- =====================================================

-- Function to create default preferences for new users
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert default preferences for new user
  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-create preferences for new users
DROP TRIGGER IF EXISTS trigger_create_default_notification_preferences ON users;
CREATE TRIGGER trigger_create_default_notification_preferences
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_notification_preferences();

-- =====================================================
-- Backfill Preferences for Existing Users
-- =====================================================

-- Create preferences for all existing users who don't have them
INSERT INTO notification_preferences (user_id)
SELECT id FROM users
WHERE id NOT IN (SELECT user_id FROM notification_preferences)
ON CONFLICT (user_id) DO NOTHING;

-- =====================================================
-- Row Level Security (RLS)
-- =====================================================

-- Disable RLS for development (enable in production with proper policies)
ALTER TABLE notification_preferences DISABLE ROW LEVEL SECURITY;

-- Production RLS policies (commented out for development):
/*
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view their own preferences
CREATE POLICY "Users can view own preferences"
  ON notification_preferences
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can update their own preferences
CREATE POLICY "Users can update own preferences"
  ON notification_preferences
  FOR UPDATE
  USING (user_id = auth.uid());
*/

-- =====================================================
-- Verification Query
-- =====================================================

-- Verify table creation and preferences count
SELECT 
  (SELECT COUNT(*) FROM notification_preferences) as total_preferences,
  (SELECT COUNT(*) FROM users) as total_users;

SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'notification_preferences'
ORDER BY ordinal_position;
