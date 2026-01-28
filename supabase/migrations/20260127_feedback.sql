-- =====================================================
-- Feedback Table Migration
-- Creates the feedback table with multiple rating fields
-- =====================================================

-- Create feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_role TEXT DEFAULT 'anonymous',
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  category TEXT CHECK (category IN ('bug', 'feature_request', 'compliment', 'complaint', 'product_review', 'other')) NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Multiple rating fields (1-5 stars each)
  rating_packing INTEGER CHECK (rating_packing >= 1 AND rating_packing <= 5),
  rating_delivery INTEGER CHECK (rating_delivery >= 1 AND rating_delivery <= 5),
  rating_ordering INTEGER CHECK (rating_ordering >= 1 AND rating_ordering <= 5),
  rating_overall INTEGER CHECK (rating_overall >= 1 AND rating_overall <= 5) NOT NULL,
  
  -- File uploads
  product_photo_url TEXT,
  screenshot_url TEXT,
  
  -- Metadata
  page_url TEXT,
  status TEXT CHECK (status IN ('new', 'in_progress', 'resolved', 'closed')) DEFAULT 'new',
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  
  -- Admin fields
  admin_notes TEXT,
  admin_reply TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_feedback_email ON feedback(email);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_priority ON feedback(priority);
CREATE INDEX IF NOT EXISTS idx_feedback_category ON feedback(category);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);

-- Composite index for admin dashboard filtering
CREATE INDEX IF NOT EXISTS idx_feedback_status_priority_created 
  ON feedback(status, priority, created_at DESC);

-- =====================================================
-- Automatic Updated At Trigger
-- =====================================================

-- Create trigger for feedback table
DROP TRIGGER IF EXISTS update_feedback_updated_at ON feedback;
CREATE TRIGGER update_feedback_updated_at 
  BEFORE UPDATE ON feedback
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Notification Trigger for Admin Replies
-- =====================================================

-- Function to notify user when admin replies to feedback
CREATE OR REPLACE FUNCTION notify_feedback_reply()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify if admin_reply was added/updated and user is not anonymous
  IF NEW.admin_reply IS NOT NULL 
     AND NEW.admin_reply != COALESCE(OLD.admin_reply, '') 
     AND NEW.user_id IS NOT NULL THEN
    
    -- Create notification for user
    INSERT INTO notifications (user_id, user_role, type, title, message, action_url, metadata)
    VALUES (
      NEW.user_id,
      NEW.user_role,
      'admin_action',
      'Response to Your Feedback',
      'An admin has replied to your feedback: "' || LEFT(NEW.subject, 50) || '"',
      '/feedback/' || NEW.id,
      jsonb_build_object('feedback_id', NEW.id, 'subject', NEW.subject)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for feedback replies
DROP TRIGGER IF EXISTS trigger_notify_feedback_reply ON feedback;
CREATE TRIGGER trigger_notify_feedback_reply
  AFTER UPDATE ON feedback
  FOR EACH ROW
  WHEN (NEW.admin_reply IS NOT NULL)
  EXECUTE FUNCTION notify_feedback_reply();

-- =====================================================
-- Row Level Security (RLS)
-- =====================================================

-- Disable RLS for development (enable in production with proper policies)
ALTER TABLE feedback DISABLE ROW LEVEL SECURITY;

-- Production RLS policies (commented out for development):
/*
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Anyone can submit feedback
CREATE POLICY "Anyone can submit feedback"
  ON feedback
  FOR INSERT
  WITH CHECK (true);

-- Users can view their own feedback
CREATE POLICY "Users can view own feedback"
  ON feedback
  FOR SELECT
  USING (user_id = auth.uid() OR user_id IS NULL);

-- Only admins can view all feedback
CREATE POLICY "Admins can view all feedback"
  ON feedback
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Only admins can update feedback
CREATE POLICY "Admins can update feedback"
  ON feedback
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Only admins can delete feedback
CREATE POLICY "Admins can delete feedback"
  ON feedback
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );
*/

-- =====================================================
-- Helper Functions
-- =====================================================

-- Function to calculate average ratings
CREATE OR REPLACE FUNCTION get_feedback_stats()
RETURNS TABLE (
  total_feedback BIGINT,
  avg_rating_packing NUMERIC,
  avg_rating_delivery NUMERIC,
  avg_rating_ordering NUMERIC,
  avg_rating_overall NUMERIC,
  feedback_by_status JSONB,
  feedback_by_category JSONB,
  feedback_by_priority JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_feedback,
    ROUND(AVG(f.rating_packing), 2) as avg_rating_packing,
    ROUND(AVG(f.rating_delivery), 2) as avg_rating_delivery,
    ROUND(AVG(f.rating_ordering), 2) as avg_rating_ordering,
    ROUND(AVG(f.rating_overall), 2) as avg_rating_overall,
    (SELECT jsonb_object_agg(status, count) FROM (
      SELECT status, COUNT(*) as count FROM feedback GROUP BY status
    ) s) as feedback_by_status,
    (SELECT jsonb_object_agg(category, count) FROM (
      SELECT category, COUNT(*) as count FROM feedback GROUP BY category
    ) c) as feedback_by_category,
    (SELECT jsonb_object_agg(priority, count) FROM (
      SELECT priority, COUNT(*) as count FROM feedback GROUP BY priority
    ) p) as feedback_by_priority
  FROM feedback f;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Verification Query
-- =====================================================

-- Verify table creation
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'feedback'
ORDER BY ordinal_position;

-- Test the stats function
SELECT * FROM get_feedback_stats();
