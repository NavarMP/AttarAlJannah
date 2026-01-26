-- Migration: Setup Admin User for Supabase Authentication
-- This prepares the system to use Supabase Auth for admin login

-- Step 1: Remove password_hash column (no longer needed)
ALTER TABLE users DROP COLUMN IF EXISTS password_hash;

-- Step 2: Ensure admin entry exists in users table for role tracking
-- Note: The actual authentication will be handled by Supabase Authentication
-- This table entry is just for role verification

-- Delete existing admin entries (cleanup)
DELETE FROM users WHERE user_role = 'admin';

-- Insert admin role entry (without password)
-- The actual user should be created in Supabase Authentication
INSERT INTO users (
    email,
    name,
    user_role,
    phone,
    created_at,
    updated_at
) VALUES (
    'navarmp@gmail.com',      -- Your admin email (MUST match Supabase Auth user)
    'Navar MP',               -- Admin name
    'admin',                  -- Role for authorization check
    '0000000000',             -- Dummy phone
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    user_role = 'admin',
    name = 'Navar MP',
    updated_at = NOW();

-- IMPORTANT: After running this migration
-- 1. Go to Supabase Dashboard → Authentication → Users
-- 2. Click "Add user" (or use existing user)
-- 3. Set email to: navarmp@gmail.com
-- 4. Set password to your desired admin password
-- 5. Enable "Auto Confirm User"
-- 6. Click "Create user"
-- 
-- The admin login will now:
-- 1. Authenticate via Supabase Auth
-- 2. Check user_role in users table
-- 3. Grant access only if user_role = 'admin'
