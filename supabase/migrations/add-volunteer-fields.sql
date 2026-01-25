-- Add volunteer_id, user_role, email, and password_hash columns to users table if they don't exist
-- This ensures the volunteer system works properly

-- Add volunteer_id column (e.g., "VOL001")
ALTER TABLE users ADD COLUMN IF NOT EXISTS volunteer_id TEXT UNIQUE;

-- Add user_role column (for role-based access control)
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_role TEXT CHECK (user_role IN ('admin', 'volunteer', 'customer'));

-- Add email column
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;

-- Add password_hash column for authentication
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Create index for volunteer_id
CREATE INDEX IF NOT EXISTS idx_users_volunteer_id ON users(volunteer_id);

-- Create index for user_role  
CREATE INDEX IF NOT EXISTS idx_users_user_role ON users(user_role);

-- Create index for email
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Add comments
COMMENT ON COLUMN users.volunteer_id IS 'Human-readable volunteer ID like VOL001, VOL002, etc.';
COMMENT ON COLUMN users.user_role IS 'User role - admin, volunteer, or customer';
