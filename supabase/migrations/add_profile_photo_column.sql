-- Migration: Add profile_photo column to volunteers table
-- Run this in Supabase SQL Editor or via psql

ALTER TABLE volunteers 
ADD COLUMN IF NOT EXISTS profile_photo TEXT;

-- Optional: Add a comment to document the column
COMMENT ON COLUMN volunteers.profile_photo IS 'URL to profile photo in Supabase Storage (profile-photos bucket)';

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'volunteers' 
  AND column_name = 'profile_photo';
