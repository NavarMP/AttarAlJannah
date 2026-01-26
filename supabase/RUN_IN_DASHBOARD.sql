-- =====================================================
-- RUN THIS IN SUPABASE DASHBOARD SQL EDITOR
-- Steps: Dashboard → SQL Editor → New Query → Paste & Run
-- =====================================================

-- 1. Fix foreign key constraints for cascade deletion
-- =====================================================

-- Fix challenge_progress foreign key (volunteer_id, not student_id)
ALTER TABLE challenge_progress 
DROP CONSTRAINT IF EXISTS challenge_progress_volunteer_id_fkey;

ALTER TABLE challenge_progress 
ADD CONSTRAINT challenge_progress_volunteer_id_fkey 
FOREIGN KEY (volunteer_id) 
REFERENCES users(id) 
ON DELETE CASCADE;

-- Fix orders referred_by foreign key
ALTER TABLE orders 
DROP CONSTRAINT IF EXISTS orders_referred_by_fkey;

ALTER TABLE orders 
ADD CONSTRAINT orders_referred_by_fkey 
FOREIGN KEY (referred_by) 
REFERENCES users(id) 
ON DELETE SET NULL;

-- 2. Setup admin user for Supabase Auth
-- =====================================================

-- Remove password fields (no longer needed with Supabase Auth)
ALTER TABLE users DROP COLUMN IF EXISTS password_hash;
ALTER TABLE users DROP COLUMN IF EXISTS password;

-- Add email column if it doesn't exist (needed for Supabase Auth mapping)
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;

-- Add unique constraint on email for admin lookup
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique ON users(email) WHERE email IS NOT NULL;

-- Create or update admin user entry for role verification
-- The actual authentication happens in Supabase Auth
DELETE FROM users WHERE user_role = 'admin';

INSERT INTO users (
    email,
    name,
    phone,
    user_role,
    created_at
) VALUES (
    'navarmp@gmail.com',     -- IMPORTANT: Must match Supabase Auth email
    'Navar MP',
    '0000000000',            -- Dummy phone for admin
    'admin',
    NOW()
)
ON CONFLICT (phone) DO UPDATE SET
    email = 'navarmp@gmail.com',
    user_role = 'admin',
    name = 'Navar MP';

-- =====================================================
-- VERIFICATION QUERIES (Check results after running)
-- =====================================================

-- Check foreign keys are properly set
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('challenge_progress', 'orders');

-- Check admin user was created
SELECT id, email, name, user_role FROM users WHERE email = 'navarmp@gmail.com';

-- =====================================================
-- NEXT STEPS
-- =====================================================
-- 1. After running this SQL, go to:
--    Supabase Dashboard → Authentication → Users
-- 2. Click "Add user"
-- 3. Enter:
--    - Email: navarmp@gmail.com  (MUST match above)
--    - Password: (your secure password)
--    - Auto Confirm User: ✅ ENABLE
-- 4. Click "Create user"
-- 5. Test login at /admin/login
