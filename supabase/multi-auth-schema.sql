-- =====================================================
-- PHASE 1: Multi-User Authentication Schema
-- =====================================================

-- 1. Add user_role to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_role TEXT DEFAULT 'customer';
ALTER TABLE users ADD COLUMN IF NOT EXISTS student_id TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(user_role);
CREATE INDEX IF NOT EXISTS idx_users_student_id ON users(student_id) WHERE student_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_student_id_unique ON users(student_id) WHERE student_id IS NOT NULL;

-- 2. Create customer_profiles table
CREATE TABLE IF NOT EXISTS customer_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT UNIQUE NOT NULL,
  name TEXT,
  email TEXT,
  default_address TEXT,
  saved_addresses JSONB DEFAULT '[]'::jsonb,
  total_orders INTEGER DEFAULT 0,
  last_order_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on phone for fast lookups
CREATE INDEX IF NOT EXISTS idx_customer_profiles_phone ON customer_profiles(phone);

-- 3. Add referral tracking to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS referred_by_student TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS referral_code TEXT;

-- Create index for referral tracking
CREATE INDEX IF NOT EXISTS idx_orders_referral ON orders(referred_by_student) WHERE referred_by_student IS NOT NULL;

-- 4. Create student_stats table (for future Phase 3)
CREATE TABLE IF NOT EXISTS student_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id TEXT UNIQUE NOT NULL,
  total_referrals INTEGER DEFAULT 0,
  this_week_referrals INTEGER DEFAULT 0,
  this_month_referrals INTEGER DEFAULT 0,
  total_sales DECIMAL(10,2) DEFAULT 0,
  rank INTEGER,
  last_referral_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_student FOREIGN KEY (student_id) REFERENCES users(student_id)
);

-- Create index for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_student_stats_rank ON student_stats(rank) WHERE rank IS NOT NULL;

-- 5. Function to auto-update customer profile on new order
CREATE OR REPLACE FUNCTION update_customer_profile_on_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update customer profile
  INSERT INTO customer_profiles (phone, name, total_orders, last_order_at)
  VALUES (NEW.customer_phone, NEW.customer_name, 1, NOW())
  ON CONFLICT (phone)
  DO UPDATE SET
    name = EXCLUDED.name,
    total_orders = customer_profiles.total_orders + 1,
    last_order_at = NOW(),
    updated_at = NOW();
    
  -- Update student stats if referral exists
  IF NEW.referred_by_student IS NOT NULL THEN
    INSERT INTO student_stats (student_id, total_referrals, total_sales, last_referral_at)
    VALUES (NEW.referred_by_student, 1, NEW.total_price, NOW())
    ON CONFLICT (student_id)
    DO UPDATE SET
      total_referrals = student_stats.total_referrals + 1,
      total_sales = student_stats.total_sales + NEW.total_price,
      last_referral_at = NOW(),
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic profile updates
DROP TRIGGER IF EXISTS trigger_update_customer_profile ON orders;
CREATE TRIGGER trigger_update_customer_profile
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_profile_on_order();

-- 6. Sample data for testing (optional)
-- Update existing admin user
UPDATE users 
SET user_role = 'admin', email = 'admin@attaraljannah.com'
WHERE phone = '9999999999';

-- =====================================================
-- IMPORTANT: Enable Supabase Phone Auth
-- =====================================================
-- Go to Supabase Dashboard:
-- 1. Authentication → Providers → Phone
-- 2. Enable Phone provider
-- 3. Choose SMS provider (Twilio or MessageBird)
-- 4. Add provider credentials
-- 5. Save changes

-- For development, you can use test phone numbers:
-- Phone: +1 234 567 8900
-- OTP: 123456 (works in test mode)

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS on customer_profiles
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own profile
CREATE POLICY "Users can view own profile"
  ON customer_profiles
  FOR SELECT
  USING (phone = current_setting('request.jwt.claims', true)::json->>'phone');

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON customer_profiles
  FOR UPDATE
  USING (phone = current_setting('request.jwt.claims', true)::json->>'phone');

-- Allow anyone to insert (for guest orders)
CREATE POLICY "Allow profile creation"
  ON customer_profiles
  FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- Verification Queries
-- =====================================================

-- Check if schema is created correctly
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name IN ('users', 'customer_profiles', 'orders', 'student_stats')
ORDER BY table_name, ordinal_position;

-- Check indexes
SELECT 
  indexname, 
  tablename, 
  indexdef 
FROM pg_indexes 
WHERE tablename IN ('users', 'customer_profiles', 'orders', 'student_stats');

-- Test trigger
-- (After inserting an order, check if customer_profiles is auto-updated)
