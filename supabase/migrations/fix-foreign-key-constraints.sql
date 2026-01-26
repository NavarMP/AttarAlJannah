-- Fix foreign key constraints to allow deletion of users/volunteers
-- This enables cleaning up test data before launch

-- 1. Fix challenge_progress foreign key
-- Drop existing constraint
ALTER TABLE challenge_progress 
DROP CONSTRAINT IF EXISTS challenge_progress_volunteer_id_fkey;

-- Add new constraint with ON DELETE CASCADE
-- When a user is deleted, their challenge progress is automatically deleted
ALTER TABLE challenge_progress 
ADD CONSTRAINT challenge_progress_volunteer_id_fkey 
FOREIGN KEY (volunteer_id) 
REFERENCES users(id) 
ON DELETE CASCADE;

-- 2. Fix orders referred_by foreign key
-- Drop existing constraint
ALTER TABLE orders 
DROP CONSTRAINT IF EXISTS orders_referred_by_fkey;

-- Add new constraint with ON DELETE SET NULL
-- When a volunteer is deleted, orders keep the order but set referred_by to NULL
ALTER TABLE orders 
ADD CONSTRAINT orders_referred_by_fkey 
FOREIGN KEY (referred_by) 
REFERENCES users(id) 
ON DELETE SET NULL;

-- Verification: Check the new constraints
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('challenge_progress', 'orders');
