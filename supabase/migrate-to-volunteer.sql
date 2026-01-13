-- =====================================================
-- MIGRATION SCRIPT: Student to Volunteer System
-- Run this on existing databases to migrate data
-- =====================================================

-- IMPORTANT: Backup your database before running this script!

-- Step 1: Update users table role enum
-- This allows both 'student' and 'volunteer' temporarily
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('admin', 'student', 'volunteer', 'customer'));

-- Step 2: Migrate existing student users to volunteer
UPDATE users 
SET role = 'volunteer' 
WHERE role = 'student';

-- Step 3: Update the constraint to remove 'student' (optional - can keep for legacy)
ALTER TABLE users DROP CONSTRAINT users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('admin', 'volunteer', 'customer'));

-- Step 4: Rename challenge_progress columns
-- First, rename student_id to volunteer_id
ALTER TABLE challenge_progress 
  RENAME COLUMN student_id TO volunteer_id;

-- Step 5: Rename verified_sales to confirmed_orders
ALTER TABLE challenge_progress 
  RENAME COLUMN verified_sales TO confirmed_orders;

-- Step 6: Drop old index and create new ones
DROP INDEX IF EXISTS idx_challenge_progress_student_id;
CREATE INDEX IF NOT EXISTS idx_challenge_progress_volunteer_id ON challenge_progress(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_challenge_progress_confirmed_orders ON challenge_progress(confirmed_orders DESC);

-- Step 7: Update sample data (optional)
UPDATE users 
SET name = REPLACE(name, 'Student', 'Volunteer'), 
    address = REPLACE(address, 'Student', 'Volunteer')
WHERE role = 'volunteer' AND name LIKE '%Student%';

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check users table
SELECT role, COUNT(*) FROM users GROUP BY role;

-- Check challenge_progress structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'challenge_progress';

-- Check indexes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'challenge_progress';

COMMIT;
