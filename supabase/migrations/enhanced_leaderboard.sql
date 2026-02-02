-- ============================================
-- MIGRATION: Enhanced Leaderboard System
-- Purpose: Create materialized view for efficient multi-metric volunteer rankings
--          Supports: Referral Leaders, Delivery Champions, Revenue Generators, Overall Performance
-- ============================================

-- Step 1: Create materialized view for volunteer leaderboard statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS volunteer_leaderboard_stats AS
SELECT 
  v.id,
  v.volunteer_id,
  v.name,
  v.phone,
  v.created_at,
  
  -- Referral metrics (orders where volunteer referred but is NOT doing delivery)
  COALESCE(SUM(CASE 
    WHEN o.volunteer_id = v.id 
    AND (o.is_delivery_duty IS NULL OR o.is_delivery_duty = false)
    AND o.order_status IN ('ordered', 'delivered') 
    THEN o.quantity 
    ELSE 0 
  END), 0) as referred_bottles,
  
  COALESCE(COUNT(CASE 
    WHEN o.volunteer_id = v.id 
    AND (o.is_delivery_duty IS NULL OR o.is_delivery_duty = false)
    AND o.order_status IN ('ordered', 'delivered') 
    THEN 1 
  END), 0) as referred_orders,
  
  v.total_referral_commission,
  
  -- Delivery metrics (orders where volunteer IS doing delivery)
  COALESCE(COUNT(CASE 
    WHEN o.volunteer_id = v.id 
    AND o.is_delivery_duty = true 
    AND o.order_status = 'delivered' 
    THEN 1 
  END), 0) as delivered_orders,
  
  COALESCE(SUM(CASE 
    WHEN o.volunteer_id = v.id 
    AND o.is_delivery_duty = true 
    AND o.order_status = 'delivered' 
    THEN o.quantity 
    ELSE 0 
  END), 0) as delivered_bottles,
  
  v.total_delivery_commission,
  
  -- Overall metrics
  (v.total_referral_commission + v.total_delivery_commission) as total_commission,
  
  -- Composite score for overall performance ranking
  -- Formula: (referred_bottles * 10) + (delivered_orders * 50) + (total_commission * 0.5)
  -- Weights: Referrals are valued at 10 points per bottle, deliveries at 50 points each, commission at 0.5 points per rupee
  (
    (COALESCE(SUM(CASE 
      WHEN o.volunteer_id = v.id 
      AND (o.is_delivery_duty IS NULL OR o.is_delivery_duty = false)
      AND o.order_status IN ('ordered', 'delivered') 
      THEN o.quantity 
      ELSE 0 
    END), 0) * 10) +
    
    (COALESCE(COUNT(CASE 
      WHEN o.volunteer_id = v.id 
      AND o.is_delivery_duty = true 
      AND o.order_status = 'delivered' 
      THEN 1 
    END), 0) * 50) +
    
    ((v.total_referral_commission + v.total_delivery_commission) * 0.5)
  ) / 100 as overall_score
  
FROM volunteers v
LEFT JOIN orders o ON o.volunteer_id = v.id
GROUP BY 
  v.id, 
  v.volunteer_id, 
  v.name, 
  v.phone, 
  v.created_at,
  v.total_referral_commission, 
  v.total_delivery_commission;

-- Step 2: Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_leaderboard_referred_bottles 
  ON volunteer_leaderboard_stats(referred_bottles DESC);
  
CREATE INDEX IF NOT EXISTS idx_leaderboard_delivered_orders 
  ON volunteer_leaderboard_stats(delivered_orders DESC);
  
CREATE INDEX IF NOT EXISTS idx_leaderboard_total_commission 
  ON volunteer_leaderboard_stats(total_commission DESC);
  
CREATE INDEX IF NOT EXISTS idx_leaderboard_overall_score 
  ON volunteer_leaderboard_stats(overall_score DESC);

-- Step 3: Create function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_leaderboard_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW volunteer_leaderboard_stats;
END;
$$;

-- Step 4: Add comment for documentation
COMMENT ON MATERIALIZED VIEW volunteer_leaderboard_stats IS 
  'Aggregated volunteer performance metrics for multi-category leaderboard rankings. Refresh using refresh_leaderboard_stats() function.';

-- Step 5: Initial refresh
SELECT refresh_leaderboard_stats();

-- ============================================
-- USAGE NOTES
-- ============================================
-- To manually refresh the leaderboard (should be done after order updates):
--   SELECT refresh_leaderboard_stats();
--
-- To query by metric:
--   Referral Leaders:  SELECT * FROM volunteer_leaderboard_stats ORDER BY referred_bottles DESC LIMIT 10;
--   Delivery Champions: SELECT * FROM volunteer_leaderboard_stats ORDER BY delivered_orders DESC LIMIT 10;
--   Revenue Generators: SELECT * FROM volunteer_leaderboard_stats ORDER BY total_commission DESC LIMIT 10;
--   Overall Performance: SELECT * FROM volunteer_leaderboard_stats ORDER BY overall_score DESC LIMIT 10;
--
-- ============================================
-- ROLLBACK SCRIPT (if needed)
-- ============================================
-- DROP FUNCTION IF EXISTS refresh_leaderboard_stats();
-- DROP MATERIALIZED VIEW IF EXISTS volunteer_leaderboard_stats;
-- ============================================
