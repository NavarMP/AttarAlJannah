-- =====================================================
-- Payment Screenshot Verification Migration
-- Run this in Supabase Dashboard > SQL Editor
-- =====================================================

-- 1. Add screenshot verification columns to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS screenshot_verified BOOLEAN;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS screenshot_verification_details JSONB;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS extracted_transaction_id TEXT;

-- 2. Create unique index on extracted_transaction_id for duplicate detection
-- (partial index: only where it's not null)
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_extracted_txn_id
ON orders (extracted_transaction_id)
WHERE extracted_transaction_id IS NOT NULL;
