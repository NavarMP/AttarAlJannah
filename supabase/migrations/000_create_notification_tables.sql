-- Migration: Create notification tables
-- Run this in Supabase SQL Editor to create the necessary tables

-- =====================
-- NOTIFICATIONS TABLE
-- =====================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    user_role TEXT NOT NULL DEFAULT 'public',
    type TEXT NOT NULL DEFAULT 'system_announcement',
    category TEXT NOT NULL DEFAULT 'system',
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    action_url TEXT,
    metadata JSONB DEFAULT '{}',
    priority TEXT NOT NULL DEFAULT 'medium',
    sent_via TEXT[],
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    delivery_status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_role ON notifications(user_role);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- =====================
-- SCHEDULED NOTIFICATIONS TABLE
-- =====================

CREATE TABLE IF NOT EXISTS scheduled_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    action_url TEXT,
    priority TEXT NOT NULL DEFAULT 'medium',
    target_filters JSONB NOT NULL DEFAULT '{}',
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    recurrence TEXT NOT NULL DEFAULT 'once',
    status TEXT NOT NULL DEFAULT 'pending',
    created_by UUID,
    last_sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_status ON scheduled_notifications(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_scheduled_for ON scheduled_notifications(scheduled_for);

-- =====================
-- NOTIFICATION TEMPLATES TABLE
-- =====================

CREATE TABLE IF NOT EXISTS notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL,
    name TEXT NOT NULL,
    title_template TEXT NOT NULL,
    message_template TEXT NOT NULL,
    action_url_template TEXT,
    priority TEXT NOT NULL DEFAULT 'medium',
    variables TEXT[] DEFAULT '{}',
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_templates_category ON notification_templates(category);

-- =====================
-- ENABLE REALTIME (ignore if already added)
-- =====================

-- Check if table is already in publication before adding
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
    ELSE
        RAISE NOTICE 'notifications table already in supabase_realtime publication';
    END IF;
EXCEPTION
    WHEN undefined_table THEN
        NULL; -- Ignore if publication doesn't exist
END $$;

-- =====================
-- RLS POLICIES (drop existing first to avoid duplicates)
-- =====================

-- Drop existing policies
DROP POLICY IF EXISTS "Service role can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Service role can update notifications" ON notifications;
DROP POLICY IF EXISTS "Service role can delete notifications" ON notifications;
DROP POLICY IF EXISTS "Users can read own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
DROP POLICY IF EXISTS "Service role can manage scheduled" ON scheduled_notifications;
DROP POLICY IF EXISTS "Service role can manage templates" ON notification_templates;

-- Service role can do everything (for API operations)
CREATE POLICY "Service role can insert notifications" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can update notifications" ON notifications FOR UPDATE USING (true);
CREATE POLICY "Service role can delete notifications" ON notifications FOR DELETE USING (true);

-- Users can read their own notifications
CREATE POLICY "Users can read own notifications" ON notifications FOR SELECT USING (
    auth.uid() = user_id 
    OR user_role = 'public'
    OR user_role = 'admin'
);

-- Users can update their own notifications
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (
    auth.uid() = user_id
);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications" ON notifications FOR DELETE USING (
    auth.uid() = user_id
);

-- Scheduled notifications - allow all operations for now (can restrict later)
CREATE POLICY "Service role can manage scheduled" ON scheduled_notifications FOR ALL USING (true);

-- Notification templates - allow all operations for now
CREATE POLICY "Service role can manage templates" ON notification_templates FOR ALL USING (true);

-- =====================
-- COMPLETION MESSAGE
-- =====================

DO $$
BEGIN
    RAISE NOTICE 'Notification tables created successfully!';
    
    -- Check if tables were created
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
        RAISE NOTICE '✓ notifications table ready';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'scheduled_notifications') THEN
        RAISE NOTICE '✓ scheduled_notifications table ready';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notification_templates') THEN
        RAISE NOTICE '✓ notification_templates table ready';
    END IF;
END $$;
