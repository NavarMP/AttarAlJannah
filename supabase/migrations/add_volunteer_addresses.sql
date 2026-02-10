-- Migration: Add address fields to volunteers table
-- Purpose: Enable location-based automatic order assignment
-- Date: 2026-02-10

-- Add address columns (all optional)
ALTER TABLE volunteers
ADD COLUMN IF NOT EXISTS house_building TEXT,
ADD COLUMN IF NOT EXISTS town TEXT,
ADD COLUMN IF NOT EXISTS pincode TEXT,
ADD COLUMN IF NOT EXISTS post TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS district TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS location_link TEXT;

-- Create index for fast location-based queries
-- Only index non-null values (volunteers who provided address)
CREATE INDEX IF NOT EXISTS idx_volunteers_location 
ON volunteers(town, post, house_building) 
WHERE town IS NOT NULL AND post IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN volunteers.house_building IS 'Optional: House/Building name for delivery location matching';
COMMENT ON COLUMN volunteers.town IS 'Optional: Town/Locality for delivery location matching';
COMMENT ON COLUMN volunteers.pincode IS 'Optional: 6-digit pincode';
COMMENT ON COLUMN volunteers.post IS 'Optional: Post office name for delivery location matching';
COMMENT ON COLUMN volunteers.city IS 'Optional: City name (auto-populated from pincode)';
COMMENT ON COLUMN volunteers.district IS 'Optional: District name';
COMMENT ON COLUMN volunteers.state IS 'Optional: State name';
COMMENT ON COLUMN volunteers.location_link IS 'Optional: Google Maps link for exact location';
