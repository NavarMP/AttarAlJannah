-- ============================================
-- MIGRATION: Phase 3 - Delivery Zones & Scheduling
-- Purpose: Enable zone-based delivery management and scheduling
-- ============================================

-- ============================================
-- PART 1: DELIVERY ZONES
-- ============================================

-- Create delivery zones table
CREATE TABLE IF NOT EXISTS delivery_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    district TEXT,
    state TEXT,
    pincode_start TEXT, -- Starting pincode in range
    pincode_end TEXT,   -- Ending pincode in range (for ranges)
    pincodes TEXT[],    -- Array of specific pincodes
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Junction table for volunteer zone assignments
CREATE TABLE IF NOT EXISTS volunteer_delivery_zones (
    volunteer_id UUID REFERENCES volunteers(id) ON DELETE CASCADE,
    zone_id UUID REFERENCES delivery_zones(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (volunteer_id, zone_id)
);

-- ============================================
-- PART 2: DELIVERY SCHEDULING
-- ============================================

-- Create delivery schedules table
CREATE TABLE IF NOT EXISTS delivery_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    volunteer_id UUID REFERENCES volunteers(id) ON DELETE SET NULL,
    
    -- Scheduling details
    scheduled_date DATE NOT NULL,
    scheduled_time_slot TEXT CHECK (scheduled_time_slot IN ('morning', 'afternoon', 'evening', 'flexible')),
    
    -- Status tracking
    status TEXT CHECK (status IN ('scheduled', 'in_transit', 'delivered', 'rescheduled', 'cancelled')) DEFAULT 'scheduled',
    
    -- Delivery tracking
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    actual_delivery_time TIMESTAMP,
    
    -- Notes and feedback
    notes TEXT,
    reschedule_reason TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- PART 3: HELPER FUNCTIONS
-- ============================================

-- Function to find volunteers for a zone based on pincode
CREATE OR REPLACE FUNCTION get_volunteers_for_pincode(pincode_param TEXT)
RETURNS TABLE (
    volunteer_id UUID,
    volunteer_name TEXT,
    volunteer_phone TEXT,
    zone_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.id,
        v.name,
        v.phone,
        dz.name
    FROM volunteers v
    INNER JOIN volunteer_delivery_zones vdz ON v.id = vdz.volunteer_id
    INNER JOIN delivery_zones dz ON vdz.zone_id = dz.id
    WHERE 
        dz.is_active = TRUE
        AND (
            -- Check if pincode is in pincodes array
            pincode_param = ANY(dz.pincodes)
            OR
            -- Check if pincode is in range (if range is defined)
            (dz.pincode_start IS NOT NULL AND dz.pincode_end IS NOT NULL
             AND pincode_param >= dz.pincode_start AND pincode_param <= dz.pincode_end)
        );
END;
$$ LANGUAGE plpgsql;

-- Function to get delivery schedule analytics
CREATE OR REPLACE FUNCTION get_delivery_analytics(
    start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    total_scheduled INTEGER,
    completed_deliveries INTEGER,
    in_transit INTEGER,
    rescheduled INTEGER,
    cancelled INTEGER,
    avg_delivery_time_hours NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_scheduled,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END)::INTEGER as completed_deliveries,
        COUNT(CASE WHEN status = 'in_transit' THEN 1 END)::INTEGER as in_transit,
        COUNT(CASE WHEN status = 'rescheduled' THEN 1 END)::INTEGER as rescheduled,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END)::INTEGER as cancelled,
        AVG(
            CASE 
                WHEN started_at IS NOT NULL AND completed_at IS NOT NULL 
                THEN EXTRACT(EPOCH FROM (completed_at - started_at)) / 3600
            END
        )::NUMERIC as avg_delivery_time_hours
    FROM delivery_schedules
    WHERE scheduled_date BETWEEN start_date AND end_date;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PART 4: INDEXES FOR PERFORMANCE
-- ============================================

-- Zones indexes
CREATE INDEX IF NOT EXISTS idx_delivery_zones_active ON delivery_zones(is_active);
CREATE INDEX IF NOT EXISTS idx_delivery_zones_district ON delivery_zones(district);
CREATE INDEX IF NOT EXISTS idx_delivery_zones_pincodes ON delivery_zones USING GIN(pincodes);

-- Volunteer zones indexes
CREATE INDEX IF NOT EXISTS idx_volunteer_zones_volunteer ON volunteer_delivery_zones(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_zones_zone ON volunteer_delivery_zones(zone_id);

-- Schedules indexes
CREATE INDEX IF NOT EXISTS idx_delivery_schedules_order ON delivery_schedules(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_schedules_volunteer ON delivery_schedules(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_delivery_schedules_date ON delivery_schedules(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_delivery_schedules_status ON delivery_schedules(status);

-- ============================================
-- PART 5: TRIGGERS FOR AUTO-UPDATE
-- ============================================

-- Trigger to update 'updated_at' on zones
CREATE OR REPLACE FUNCTION update_zone_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_zone_timestamp
    BEFORE UPDATE ON delivery_zones
    FOR EACH ROW
    EXECUTE FUNCTION update_zone_timestamp();

-- Trigger to update 'updated_at' on schedules
CREATE TRIGGER trigger_update_schedule_timestamp
    BEFORE UPDATE ON delivery_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_zone_timestamp();

-- ============================================
-- PART 6: SAMPLE DATA (OPTIONAL - COMMENT OUT IN PRODUCTION)
-- ============================================

-- Sample zones for testing
-- INSERT INTO delivery_zones (name, description, district, state, pincodes) VALUES
-- ('Kozhikode Central', 'Central Kozhikode area', 'Kozhikode', 'Kerala', ARRAY['673001', '673002', '673003']),
-- ('Malappuram East', 'Eastern Malappuram', 'Malappuram', 'Kerala', ARRAY['676101', '676102']),
-- ('Kannur South', 'Southern Kannur region', 'Kannur', 'Kerala', ARRAY['670001', '670002']);

-- ============================================
-- USAGE EXAMPLES
-- ============================================

-- Find volunteers for a specific pincode:
--   SELECT * FROM get_volunteers_for_pincode('673001');

-- Get delivery analytics for last 30 days:
--   SELECT * FROM get_delivery_analytics();

-- Get delivery analytics for custom date range:
--   SELECT * FROM get_delivery_analytics('2024-01-01', '2024-01-31');

-- ============================================
-- ROLLBACK SCRIPT (if needed)
-- ============================================
-- DROP TRIGGER IF EXISTS trigger_update_schedule_timestamp ON delivery_schedules;
-- DROP TRIGGER IF EXISTS trigger_update_zone_timestamp ON delivery_zones;
-- DROP FUNCTION IF EXISTS update_zone_timestamp();
-- DROP FUNCTION IF EXISTS get_delivery_analytics(DATE, DATE);
-- DROP FUNCTION IF EXISTS get_volunteers_for_pincode(TEXT);
-- DROP TABLE IF EXISTS delivery_schedules;
-- DROP TABLE IF EXISTS volunteer_delivery_zones;
-- DROP TABLE IF EXISTS delivery_zones;
-- ============================================
