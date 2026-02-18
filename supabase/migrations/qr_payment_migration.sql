-- =====================================================
-- QR Code Payment Migration
-- Run this in Supabase Dashboard > SQL Editor
-- =====================================================

-- 1. Add payment_method column to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'razorpay';

-- 2. Add payment_screenshot_url column to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_screenshot_url TEXT;

-- 3. Update order_status CHECK constraint to include 'payment_pending'
-- First drop the existing constraint, then recreate with new values
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_order_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_order_status_check 
    CHECK (order_status IN ('payment_pending', 'ordered', 'delivered', 'cant_reach', 'cancelled'));

-- 4. Create site_settings table for admin-configurable settings
CREATE TABLE IF NOT EXISTS site_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert default payment method (QR for launch)
INSERT INTO site_settings (key, value) 
VALUES ('payment_method', 'qr')
ON CONFLICT (key) DO NOTHING;

-- Insert UPI settings for dynamic QR generation
INSERT INTO site_settings (key, value) 
VALUES ('upi_id', 'merchant@upi')
ON CONFLICT (key) DO NOTHING;

INSERT INTO site_settings (key, value) 
VALUES ('merchant_name', 'Attar Al Jannah')
ON CONFLICT (key) DO NOTHING;

-- Disable RLS for site_settings (same as other tables)
ALTER TABLE site_settings DISABLE ROW LEVEL SECURITY;

-- 5. Create payment-screenshots storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-screenshots', 'payment-screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for payment-screenshots bucket
-- Allow public read access
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Public Read Payment Screenshots'
    ) THEN
        CREATE POLICY "Public Read Payment Screenshots"
        ON storage.objects FOR SELECT
        USING ( bucket_id = 'payment-screenshots' );
    END IF;
END $$;

-- Allow anonymous uploads (customers aren't authenticated via Supabase Auth)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Anonymous Upload Payment Screenshots'
    ) THEN
        CREATE POLICY "Anonymous Upload Payment Screenshots"
        ON storage.objects FOR INSERT
        TO anon
        WITH CHECK ( bucket_id = 'payment-screenshots' );
    END IF;
END $$;

-- Allow authenticated uploads too
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Authenticated Upload Payment Screenshots'
    ) THEN
        CREATE POLICY "Authenticated Upload Payment Screenshots"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK ( bucket_id = 'payment-screenshots' );
    END IF;
END $$;

-- Allow authenticated delete (for admin cleanup)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Authenticated Delete Payment Screenshots'
    ) THEN
        CREATE POLICY "Authenticated Delete Payment Screenshots"
        ON storage.objects FOR DELETE
        TO authenticated
        USING ( bucket_id = 'payment-screenshots' );
    END IF;
END $$;
