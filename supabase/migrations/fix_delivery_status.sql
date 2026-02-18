-- Add missing delivery_status column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_status TEXT DEFAULT 'pending';

-- Fix potential RLS issue for this new column
GRANT ALL ON orders TO service_role;
