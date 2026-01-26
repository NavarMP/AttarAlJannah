-- Restore password_hash column for volunteers
-- Required because volunteers use custom auth, not Supabase Auth

ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Verify it exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'password_hash';
