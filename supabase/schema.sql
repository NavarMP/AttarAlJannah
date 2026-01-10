-- =====================================================
-- Attar Al Jannah Database Schema
-- Complete setup including WhatsApp number field
-- =====================================================

-- =====================================================
-- 1. USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  role TEXT CHECK (role IN ('admin', 'student', 'customer')) DEFAULT 'customer',
  address TEXT,
  total_sales INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- =====================================================
-- 2. ORDERS TABLE (with WhatsApp number field)
-- =====================================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES users(id),
  referred_by UUID REFERENCES users(id),
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  total_price DECIMAL(10, 2) NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('cod', 'upi')) NOT NULL,
  payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'verified')) DEFAULT 'pending',
  order_status TEXT CHECK (order_status IN ('pending', 'confirmed', 'delivered')) DEFAULT 'pending',
  payment_screenshot_url TEXT,
  
  -- Customer Information
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  whatsapp_number TEXT NOT NULL,
  customer_email TEXT,
  customer_address TEXT NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_referred_by ON orders(referred_by);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- =====================================================
-- 3. CHALLENGE PROGRESS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS challenge_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES users(id) UNIQUE NOT NULL,
  verified_sales INTEGER DEFAULT 0,
  goal INTEGER DEFAULT 20,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_challenge_progress_student_id ON challenge_progress(student_id);

-- =====================================================
-- 4. TIMESTAMP TRIGGERS
-- =====================================================

-- Create function to auto-update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for orders table
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at 
  BEFORE UPDATE ON orders
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for challenge_progress table
DROP TRIGGER IF EXISTS update_challenge_progress_updated_at ON challenge_progress;
CREATE TRIGGER update_challenge_progress_updated_at 
  BEFORE UPDATE ON challenge_progress
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Disable RLS for development (enable in production with proper policies)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_progress DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6. SAMPLE DATA
-- =====================================================

-- Create Admin User
INSERT INTO users (name, phone, role, address)
VALUES ('Admin User', '9999999999', 'admin', 'Admin Office')
ON CONFLICT (phone) DO NOTHING;

-- Create Sample Students
INSERT INTO users (name, phone, role, address)
VALUES 
  ('Student One', '9876543210', 'student', 'Student Address 1'),
  ('Student Two', '9876543211', 'student', 'Student Address 2')
ON CONFLICT (phone) DO NOTHING;

-- Initialize Challenge Progress for Students
INSERT INTO challenge_progress (student_id, verified_sales, goal)
SELECT id, 0, 20
FROM users
WHERE role = 'student'
  AND id NOT IN (SELECT student_id FROM challenge_progress)
ON CONFLICT (student_id) DO NOTHING;

-- =====================================================
-- STORAGE BUCKET SETUP (Run separately in Storage section)
-- =====================================================

/* 
1. Go to Storage in Supabase Dashboard
2. Create new bucket: "payment-screenshots"
3. Make it PUBLIC
4. Run these policies in SQL Editor:

CREATE POLICY "Allow public uploads"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'payment-screenshots');

CREATE POLICY "Allow public reads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'payment-screenshots');
*/

-- =====================================================
-- MIGRATION FOR EXISTING DATABASES
-- =====================================================

-- If you already have an orders table without whatsapp_number:
-- ALTER TABLE orders ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;
-- UPDATE orders SET whatsapp_number = customer_phone WHERE whatsapp_number IS NULL;
-- ALTER TABLE orders ALTER COLUMN whatsapp_number SET NOT NULL;
