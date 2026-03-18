-- Migration: Add RLS policies for notifications table
-- Run this in Supabase SQL Editor

-- Enable RLS on notifications table if not already enabled
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (for fresh start)
DROP POLICY IF EXISTS "Service role can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Users can read own notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can do everything" ON notifications;
DROP POLICY IF EXISTS "Public notifications readable by all" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;

-- Allow service role (and anyone with service role key) to insert/update/delete
-- This is critical for automatic notifications from the app
CREATE POLICY "Service role can insert notifications" 
    ON notifications FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can update notifications" 
    ON notifications FOR UPDATE USING (true);

CREATE POLICY "Service role can delete notifications" 
    ON notifications FOR DELETE USING (true);

-- Allow users to read their own notifications
-- This uses auth.uid() which works for Supabase Auth users
CREATE POLICY "Users can read own notifications" 
    ON notifications FOR SELECT USING (
        auth.uid() = user_id 
        OR user_role = 'public'
        OR user_role = 'admin'
    );

-- Allow authenticated users to update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" 
    ON notifications FOR UPDATE USING (
        auth.uid() = user_id
    );

-- Allow users to delete their own notifications
CREATE POLICY "Users can delete own notifications" 
    ON notifications FOR DELETE USING (
        auth.uid() = user_id
    );

-- Enable realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Note: For Simple Auth users (volunteers/customers with UUIDs stored in localStorage),
-- the API uses service role client which bypasses RLS, so they will still work.
-- The RLS policies above are for Supabase Auth users.
