-- =====================================================
-- Delivery Tracking System Migration
-- =====================================================

-- 1. Create delivery_tracking_events table
CREATE TABLE IF NOT EXISTS delivery_tracking_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
    status TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    updated_by TEXT,
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tracking_events_order ON delivery_tracking_events(order_id);
CREATE INDEX IF NOT EXISTS idx_tracking_events_created ON delivery_tracking_events(created_at);

-- 2. Add courier tracking columns to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS courier_name TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS last_tracking_sync TIMESTAMP WITH TIME ZONE;

-- 3. Disable RLS for dev/simplicity (matching existing pattern)
ALTER TABLE delivery_tracking_events DISABLE ROW LEVEL SECURITY;
