-- Re-create admin user in the users table
-- Note: This inserts admin into the 'users' table, NOT Supabase Authentication

-- Delete any existing admin users first (cleanup)
DELETE FROM users WHERE user_role = 'admin';

-- Insert new admin user
INSERT INTO users (
    email, 
    name, 
    user_role, 
    password_hash, 
    phone,
    created_at,
    updated_at
)
VALUES (
    'navarmp@gmail.com',      -- Your email
    'Navar MP',               -- Admin name
    'admin',                  -- Role MUST be 'admin'
    'Admin@123',              -- Your password (stored as plain text - see note below)
    '0000000000',             -- Dummy phone number
    NOW(),
    NOW()
);

-- IMPORTANT NOTES:
-- 1. This admin system uses the 'users' table, NOT Supabase Authentication
-- 2. Password is stored as plain text (line 34-35 in login route.ts)
-- 3. Default password is 'Admin@123' (works for any admin user)
-- 4. You can set password_hash to your custom password, it will be compared directly
-- 
-- SECURITY WARNING:
-- For production, you should:
-- - Hash passwords using bcrypt or similar
-- - Update the login route to verify hashed passwords
-- - Remove the hardcoded 'Admin@123' fallback
