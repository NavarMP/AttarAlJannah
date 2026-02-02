-- ============================================
-- MIGRATION: Delivery Volunteer Consolidation & Payment Flow Fix
-- Purpose: Consolidate delivery_volunteer_id into volunteer_id field
--          Add is_delivery_duty boolean flag
--          Add payment_pending order status
-- ============================================

-- Step 1: Add is_delivery_duty column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_delivery_duty BOOLEAN DEFAULT FALSE;

-- Step 2: Migrate existing delivery_volunteer_id data
-- For orders that have a delivery volunteer, set volunteer_id and is_delivery_duty=true
UPDATE orders
SET 
  volunteer_id = delivery_volunteer_id,
  is_delivery_duty = TRUE
WHERE delivery_volunteer_id IS NOT NULL;

-- Step 3: Drop the delivery_volunteer_id column
ALTER TABLE orders DROP COLUMN IF EXISTS delivery_volunteer_id;

-- Step 4: Update order_status constraint to include payment_pending
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_order_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_order_status_check 
  CHECK (order_status IN ('payment_pending', 'ordered', 'delivered', 'cant_reach', 'cancelled'));

-- Step 5: Add comment for documentation
COMMENT ON COLUMN orders.is_delivery_duty IS 
  'TRUE if volunteer_id refers to delivery volunteer, FALSE if referral volunteer';
COMMENT ON COLUMN orders.order_status IS 
  'payment_pending: awaiting payment verification, ordered: payment confirmed, delivered: delivered, cant_reach: unable to contact customer, cancelled: order cancelled';

-- Step 6: Create index for common queries
CREATE INDEX IF NOT EXISTS idx_orders_delivery_duty ON orders(volunteer_id, is_delivery_duty) 
  WHERE volunteer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_payment_pending ON orders(order_status)
  WHERE order_status = 'payment_pending';

-- ============================================
-- ROLLBACK SCRIPT (if needed)
-- ============================================
-- To rollback this migration, run:
-- 
-- ALTER TABLE orders ADD COLUMN delivery_volunteer_id UUID REFERENCES volunteers(id);
-- UPDATE orders SET delivery_volunteer_id = volunteer_id WHERE is_delivery_duty = TRUE;
-- UPDATE orders SET volunteer_id = NULL WHERE is_delivery_duty = TRUE;
-- ALTER TABLE orders DROP COLUMN is_delivery_duty;
-- ALTER TABLE orders DROP CONSTRAINT orders_order_status_check;
-- ALTER TABLE orders ADD CONSTRAINT orders_order_status_check 
--   CHECK (order_status IN ('ordered', 'delivered', 'cant_reach', 'cancelled'));
-- ============================================
