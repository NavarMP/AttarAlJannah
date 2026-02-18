-- Comprehensive Schema Fix
-- Adds potentially missing columns for order assignment and status

-- 1. Add delivery_volunteer_id if missing (FK to volunteers)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'delivery_volunteer_id'
    ) THEN
        ALTER TABLE orders ADD COLUMN delivery_volunteer_id UUID REFERENCES volunteers(id);
    END IF;
END $$;

-- 2. Add delivery_status if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'delivery_status'
    ) THEN
        ALTER TABLE orders ADD COLUMN delivery_status TEXT DEFAULT 'pending';
    END IF;
END $$;

-- 3. Grant permissions to ensure API can access them
GRANT ALL ON orders TO service_role;
GRANT ALL ON orders TO anon;
GRANT ALL ON orders TO authenticated;

-- 4. Reload PostgREST schema cache to recognize new columns immediately
NOTIFY pgrst, 'reload schema';
