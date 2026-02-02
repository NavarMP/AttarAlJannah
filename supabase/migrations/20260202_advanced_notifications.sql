-- Advanced Notification System Database Migration
-- Date: 2026-02-02
-- Description: Adds priority, scheduling, preferences, and multi-channel support

-- ============================================================================
-- 1. Enhance notifications table
-- ============================================================================

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS category VARCHAR(50),
  ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS template_id UUID,
  ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP,
  ADD COLUMN IF NOT EXISTS sent_via TEXT[] DEFAULT ARRAY['push'],
  ADD COLUMN IF NOT EXISTS delivery_status VARCHAR(20) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS read_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS clicked_at TIMESTAMP;

-- Add constraints
ALTER TABLE notifications
  ADD CONSTRAINT chk_priority CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  ADD CONSTRAINT chk_delivery_status CHECK (delivery_status IN ('pending', 'sent', 'failed', 'delivered'));

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(category);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled ON notifications(scheduled_for) 
  WHERE scheduled_for IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_delivery_status ON notifications(delivery_status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) 
  WHERE is_read = FALSE;

-- ============================================================================
-- 2. Create notification_templates table
-- ============================================================================

CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  title_template TEXT NOT NULL,
  message_template TEXT NOT NULL,
  action_url_template TEXT,
  priority VARCHAR(20) DEFAULT 'medium',
  variables JSONB DEFAULT '[]'::jsonb,
  is_system BOOLEAN DEFAULT FALSE,
  created_by UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT chk_template_priority CHECK (priority IN ('critical', 'high', 'medium', 'low'))
);

-- Add index
CREATE INDEX IF NOT EXISTS idx_templates_category ON notification_templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_system ON notification_templates(is_system);

-- Seed system templates
INSERT INTO notification_templates (category, name, title_template, message_template, priority, action_url_template, is_system, variables)
VALUES
  ('order', 'Delivery Delay', 'Order Delayed', 'Your order #{order_id} is delayed due to {reason}. New ETA: {new_eta}', 'high', '/track/{order_id}', true, '["order_id", "reason", "new_eta"]'::jsonb),
  ('order', 'Stock Ready', 'Order Ready!', 'Good news! Your order #{order_id} is ready for delivery.', 'medium', '/track/{order_id}', true, '["order_id"]'::jsonb),
  ('system', 'Holiday Notice', 'Holiday Schedule', 'Our delivery service will be {status} on {date}. Plan accordingly!', 'medium', NULL, true, '["status", "date"]'::jsonb),
  ('order', 'Payment Reminder', 'Payment Pending', 'Please complete payment for order #{order_id}. Amount: ₹{amount}', 'high', '/track/{order_id}', true, '["order_id", "amount"]'::jsonb),
  ('system', 'New Product', 'New Product Launch', 'Exciting news! {product_name} is now available. {description}', 'low', '/order', true, '["product_name", "description"]'::jsonb)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 3. Create scheduled_notifications table
-- ============================================================================

CREATE TABLE IF NOT EXISTS scheduled_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  priority VARCHAR(20) DEFAULT 'medium',
  
  -- Scheduling
  scheduled_for TIMESTAMP NOT NULL,
  recurrence VARCHAR(20) DEFAULT 'once',
  recurrence_end_date TIMESTAMP,
  next_execution TIMESTAMP,
  
  -- Targeting
  target_type VARCHAR(20) NOT NULL,
  target_role VARCHAR(20),
  target_user_ids UUID[],
  target_filters JSONB,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending',
  sent_at TIMESTAMP,
  sent_count INTEGER DEFAULT 0,
  last_error TEXT,
  
  -- Metadata
  created_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT chk_sched_priority CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  CONSTRAINT chk_sched_status CHECK (status IN ('pending', 'sent', 'cancelled', 'failed', 'processing')),
  CONSTRAINT chk_sched_recurrence CHECK (recurrence IN ('once', 'daily', 'weekly', 'monthly')),
  CONSTRAINT chk_sched_target_type CHECK (target_type IN ('all', 'role', 'individual', 'filtered'))
);

-- Add indexes for job processing
CREATE INDEX IF NOT EXISTS idx_scheduled_pending ON scheduled_notifications(scheduled_for, status) 
  WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_scheduled_next_exec ON scheduled_notifications(next_execution) 
  WHERE status = 'pending' AND next_execution IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_scheduled_created_by ON scheduled_notifications(created_by);

-- ============================================================================
-- 4. Update customers table for preferences
-- ============================================================================

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
    "order_created": true,
    "payment_updates": true,
    "order_confirmed": true,
    "delivery_updates": true,
    "order_delivered": true,
    "promotions": true,
    "new_products": false,
    "tips_and_guides": false,
    "system_announcements": true,
    "push_notifications": true,
    "email_notifications": false,
    "sms_notifications": false
  }'::jsonb,
  ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Add index for email lookups
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email) WHERE email IS NOT NULL;

-- ============================================================================
-- 5. Update volunteers table for preferences
-- ============================================================================

ALTER TABLE volunteers
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
    "order_updates": true,
    "delivery_assignments": true,
    "zone_updates": true,
    "challenge_milestones": true,
    "commission_updates": true,
    "system_announcements": true,
    "push_notifications": true,
    "email_notifications": false,
    "sms_notifications": false
  }'::jsonb,
  ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Add index for email lookups
CREATE INDEX IF NOT EXISTS idx_volunteers_email ON volunteers(email) WHERE email IS NOT NULL;

-- ============================================================================
-- 6. Create notification analytics view (optional, for future use)
-- ============================================================================

CREATE OR REPLACE VIEW notification_analytics AS
SELECT 
  DATE_TRUNC('day', created_at) as date,
  category,
  priority,
  user_role,
  COUNT(*) as total_sent,
  COUNT(CASE WHEN is_read = true THEN 1 END) as total_read,
  COUNT(CASE WHEN clicked_at IS NOT NULL THEN 1 END) as total_clicked,
  ROUND(AVG(EXTRACT(EPOCH FROM (read_at - created_at)))) as avg_read_time_seconds
FROM notifications
WHERE created_at > NOW() - INTERVAL '90 days'
GROUP BY DATE_TRUNC('day', created_at), category, priority, user_role
ORDER BY date DESC;

-- ============================================================================
-- 7. Create helper function for calculating next execution time
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_next_execution(
  current_execution TIMESTAMP,
  recurrence_type VARCHAR
)
RETURNS TIMESTAMP AS $$
BEGIN
  CASE recurrence_type
    WHEN 'daily' THEN
      RETURN current_execution + INTERVAL '1 day';
    WHEN 'weekly' THEN
      RETURN current_execution + INTERVAL '1 week';
    WHEN 'monthly' THEN
      RETURN current_execution + INTERVAL '1 month';
    ELSE
      RETURN NULL;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 8. Add RLS policies for new tables
-- ============================================================================

-- notification_templates: Only admins can create/edit, everyone can read system templates
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System templates are viewable by everyone"
  ON notification_templates FOR SELECT
  USING (is_system = true);

-- scheduled_notifications: Only admins can manage
ALTER TABLE scheduled_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can manage scheduled notifications"
  ON scheduled_notifications FOR ALL
  USING (auth.uid() IN (SELECT auth_id FROM volunteers WHERE role = 'admin'));

-- ============================================================================
-- Migration complete
-- ============================================================================

COMMENT ON TABLE notification_templates IS 'Stores reusable notification templates with variable support';
COMMENT ON TABLE scheduled_notifications IS 'Manages scheduled and recurring notifications';
COMMENT ON COLUMN customers.notification_preferences IS 'Customer notification opt-in/opt-out preferences';
COMMENT ON COLUMN volunteers.notification_preferences IS 'Volunteer notification opt-in/opt-out preferences';
