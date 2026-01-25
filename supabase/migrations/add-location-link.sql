-- Add location_link column to orders table
-- This allows customers to optionally share their Google Maps location link for precise delivery

ALTER TABLE orders ADD COLUMN IF NOT EXISTS location_link TEXT;

-- Add comment to the column
COMMENT ON COLUMN orders.location_link IS 'Optional Google Maps or similar location link for precise delivery location';
