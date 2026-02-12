-- =====================================================
-- Attar Al Jannah Database Schema
-- =====================================================

-- 1. DROP EXISTING TABLES (Clean Slate)
DROP TABLE IF EXISTS delivery_requests CASCADE;
DROP TABLE IF EXISTS challenge_progress CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS student_stats CASCADE;
DROP TABLE IF EXISTS customer_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS volunteers CASCADE;
DROP TABLE IF EXISTS customers CASCADE;

-- =====================================================
-- 2. VOLUNTEERS TABLE (Linked to Supabase Auth)
-- =====================================================
CREATE TABLE volunteers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    -- Link to Supabase Auth (auth.users)
    auth_id UUID REFERENCES auth.users(id), 
    volunteer_id TEXT UNIQUE NOT NULL, -- Custom ID/Username for referrals
    name TEXT NOT NULL,
    email TEXT UNIQUE, -- Optional
    phone TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'volunteer',
    profile_photo TEXT, -- URL to profile photo in Supabase Storage
    total_sales INTEGER DEFAULT 0,
    
    -- Delivery & Commission tracking
    delivery_commission_per_bottle DECIMAL(10, 2) DEFAULT 10.00, -- ₹10 per bottle delivered
    total_deliveries INTEGER DEFAULT 0,
    total_delivery_commission DECIMAL(10, 2) DEFAULT 0,
    total_referral_commission DECIMAL(10, 2) DEFAULT 0, -- Separate from delivery commission
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for fast lookups
CREATE INDEX idx_volunteers_phone ON volunteers(phone);
CREATE INDEX idx_volunteers_auth_id ON volunteers(auth_id);
CREATE INDEX idx_volunteers_volunteer_id ON volunteers(volunteer_id);


-- =====================================================
-- 3. CUSTOMERS TABLE (Phone-based identity)
-- =====================================================
CREATE TABLE customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    address TEXT,
    total_orders INTEGER DEFAULT 0,
    last_order_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_customers_phone ON customers(phone);


-- =====================================================
-- 4. ORDERS TABLE
-- =====================================================
CREATE TABLE orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Relationships
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    volunteer_id UUID REFERENCES volunteers(id) ON DELETE SET NULL, -- Referral volunteer
    delivery_volunteer_id UUID REFERENCES volunteers(id) ON DELETE SET NULL, -- Delivery assigned volunteer
    
    -- Order Details
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    total_price DECIMAL(10, 2) NOT NULL,
    delivery_fee DECIMAL(10, 2) DEFAULT 0,
    
    -- Payment & Status (Razorpay only, no payment_method field needed)
    payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'verified')) DEFAULT 'pending',
    razorpay_order_id TEXT, -- Razorpay order ID
    razorpay_payment_id TEXT, -- Razorpay payment ID
    
    -- Order Status (updated: no 'pending', renamed 'confirmed' to 'ordered')
    order_status TEXT CHECK (order_status IN ('ordered', 'delivered', 'cant_reach', 'cancelled')) DEFAULT 'ordered',
    
    -- Delivery method
    delivery_method TEXT CHECK (delivery_method IN ('volunteer', 'post', 'courier', 'pickup')),
    
    -- Snapshot of Customer Info (in case customer record updates)
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    whatsapp_number TEXT NOT NULL,
    customer_address TEXT NOT NULL,
    
    -- Meta
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_volunteer_id ON orders(volunteer_id);
CREATE INDEX idx_orders_delivery_volunteer_id ON orders(delivery_volunteer_id);
CREATE INDEX idx_orders_status ON orders(order_status);


-- =====================================================
-- 5. DELIVERY REQUESTS (Volunteer delivery duty requests)
-- =====================================================
CREATE TABLE delivery_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
    volunteer_id UUID REFERENCES volunteers(id) ON DELETE CASCADE NOT NULL,
    status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    responded_at TIMESTAMP WITH TIME ZONE,
    responded_by UUID REFERENCES volunteers(id), -- Admin who approved/rejected
    notes TEXT,
    UNIQUE(order_id, volunteer_id) -- Prevent duplicate requests from same volunteer for same order
);

CREATE INDEX idx_delivery_requests_order_id ON delivery_requests(order_id);
CREATE INDEX idx_delivery_requests_volunteer_id ON delivery_requests(volunteer_id);
CREATE INDEX idx_delivery_requests_status ON delivery_requests(status);


-- =====================================================
-- 6. VOLUNTEER PROGRESS (Gamification)
-- =====================================================
CREATE TABLE challenge_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    volunteer_id UUID REFERENCES volunteers(id) UNIQUE NOT NULL,
    confirmed_orders INTEGER DEFAULT 0, -- Keep for now, will calculate dynamically from orders
    goal INTEGER DEFAULT 20,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- =====================================================
-- 7. UTILITIES (Triggers)
-- =====================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_challenge_progress_updated_at BEFORE UPDATE ON challenge_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- =====================================================
-- 8. RLS (Disable for Dev/Simplicity)
-- =====================================================
ALTER TABLE volunteers DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_requests DISABLE ROW LEVEL SECURITY;
