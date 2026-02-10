-- Migration: Add status column to volunteers table
-- Date: 2026-02-09
-- Purpose: Support volunteer self-signup with admin approval workflow

-- Add status column to volunteers table
ALTER TABLE volunteers 
ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('pending', 'active', 'suspended')) DEFAULT 'active';

-- Create index for faster status-based queries
CREATE INDEX IF NOT EXISTS idx_volunteers_status ON volunteers(status);

-- Update existing volunteers to have 'active' status
UPDATE volunteers 
SET status = 'active' 
WHERE status IS NULL;

-- Make the column NOT NULL after setting defaults
ALTER TABLE volunteers 
ALTER COLUMN status SET NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN volunteers.status IS 'Volunteer account status: pending (awaiting approval), active (can log in), suspended (blocked)';
