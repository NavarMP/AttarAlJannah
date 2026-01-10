-- =====================================================
-- Admin Users Setup
-- Add email and password hash to users table
-- =====================================================

-- Add email and encrypted_password columns if they don't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS encrypted_password TEXT;

-- Create unique index on email for admin users
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE email IS NOT NULL;

-- Create or update admin user with email
-- NOTE: You'll need to set a password through Supabase Auth UI or use bcrypt
INSERT INTO users (name, phone, email, role, address)
VALUES ('Admin User', '9999999999', 'admin@attaraljannah.com', 'admin', 'Admin Office')
ON CONFLICT (phone) 
DO UPDATE SET 
  email = EXCLUDED.email,
  role = 'admin';

-- =====================================================
-- IMPORTANT: Set Admin Password
-- =====================================================
-- Go to Supabase Dashboard → Authentication → Users
-- 1. Create a new user with email: admin@attaraljannah.com
-- 2. Set a strong password
-- 3. The auth.users table will be linked to our users table via email

-- =====================================================
-- Optional: Create additional admin users
-- =====================================================
-- INSERT INTO users (name, phone, email, role, address)
-- VALUES ('Another Admin', '9999999998', 'admin2@attaraljannah.com', 'admin', 'Admin Office 2')
-- ON CONFLICT (phone) DO NOTHING;
