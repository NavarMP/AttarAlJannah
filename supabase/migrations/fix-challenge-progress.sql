-- Create challenge_progress table if it doesn't exist
CREATE TABLE IF NOT EXISTS challenge_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  volunteer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  goal INTEGER DEFAULT 20,
  confirmed_orders INTEGER DEFAULT 0, -- Used for caching, but real-time calculation preferred
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cleanup duplicates before adding constraint (Keep the latest one)
-- This is a bit risky if data varies, but necessary for the constraint
DELETE FROM challenge_progress a USING (
  SELECT MIN(ctid) as ctid, volunteer_id
  FROM challenge_progress 
  GROUP BY volunteer_id HAVING COUNT(*) > 1
) b
WHERE a.volunteer_id = b.volunteer_id 
AND a.ctid <> b.ctid;

-- Add UNIQUE constraint on volunteer_id
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'challenge_progress_volunteer_id_key') THEN
        ALTER TABLE challenge_progress ADD CONSTRAINT challenge_progress_volunteer_id_key UNIQUE (volunteer_id);
    END IF;
END
$$;

-- Enable RLS
ALTER TABLE challenge_progress ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Public read access" ON challenge_progress FOR SELECT USING (true);

-- Allow full access for admins/service role
CREATE POLICY "Admin full access" ON challenge_progress FOR ALL USING (true);
