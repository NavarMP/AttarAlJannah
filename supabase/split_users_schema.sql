-- =====================================================
-- Attar Al Jannah Database Refactor - Split Users
-- =====================================================

-- 1. DROP EXISTING TABLES (Clean Slate)
DROP TABLE IF EXISTS challenge_progress CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS student_stats CASCADE;
DROP TABLE IF EXISTS customer_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;
-- Also drop volunteers/customers if they exist from previous runs
DROP TABLE IF EXISTS volunteers CASCADE;
DROP TABLE IF EXISTS customers CASCADE;

-- =====================================================
-- 2. VOLUNTEERS TABLE (Linked to Supabase Auth)
-- =====================================================
CREATE TABLE volunteers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    -- Link to Supabase Auth (auth.users)
    -- We use a separate ID for business logic, but link to auth for login
    auth_id UUID REFERENCES auth.users(id), 
    volunteer_id TEXT UNIQUE NOT NULL, -- Custom ID/Username for referrals
    name TEXT NOT NULL,
    email TEXT UNIQUE, -- Optional, but good for linking
    phone TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'volunteer', -- verification
    total_sales INTEGER DEFAULT 0,
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
    address TEXT, -- Customers MUST have address
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
    volunteer_id UUID REFERENCES volunteers(id) ON DELETE SET NULL, -- Referral
    
    -- Order Details
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    total_price DECIMAL(10, 2) NOT NULL,
    
    -- Payment & Status
    payment_method TEXT CHECK (payment_method IN ('cod', 'upi')) NOT NULL,
    payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'verified')) DEFAULT 'pending',
    order_status TEXT CHECK (order_status IN ('pending', 'confirmed', 'delivered')) DEFAULT 'pending',
    payment_screenshot_url TEXT,
    
    -- Snapshot of Customer Info (in case customer rec updates)
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
CREATE INDEX idx_orders_status ON orders(order_status);


-- =====================================================
-- 5. VOLUNTEER PROGRESS (Gamification)
-- =====================================================
CREATE TABLE challenge_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    volunteer_id UUID REFERENCES volunteers(id) UNIQUE NOT NULL,
    confirmed_orders INTEGER DEFAULT 0,
    goal INTEGER DEFAULT 20,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- =====================================================
-- 6. UTILITIES (Triggers)
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
-- 7. RLS (Disable for Dev/Simplicity as per instructions)
-- =====================================================
ALTER TABLE volunteers DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_progress DISABLE ROW LEVEL SECURITY;


-- =====================================================
-- 8. SAMPLE/SEED DATA
-- =====================================================
-- Note: Admin is not in any table.

-- Sample Volunteer
-- INSERT INTO volunteers (name, phone, role) VALUES ('Volunteer One', '9876543210', 'volunteer');

