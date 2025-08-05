-- Add Usage Tracking System for FreeMium Business Model
-- This migration creates the infrastructure for tracking user feature usage

-- =====================================================
-- USER USAGE TRACKING TABLE
-- =====================================================

-- Create user_usage table to track monthly usage per user
CREATE TABLE IF NOT EXISTS user_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  month_year text NOT NULL, -- Format: 'YYYY-MM'
  quotes_count integer DEFAULT 0 NOT NULL,
  pdf_exports_count integer DEFAULT 0 NOT NULL,
  api_calls_count integer DEFAULT 0 NOT NULL,
  bulk_operations_count integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  -- Ensure one record per user per month
  UNIQUE(user_id, month_year)
);

-- Enable Row Level Security
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;

-- Create policy for users to access only their own usage data
CREATE POLICY "Users can manage their own usage" ON user_usage
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_user_usage_user_month ON user_usage(user_id, month_year);
CREATE INDEX idx_user_usage_month ON user_usage(month_year);
CREATE INDEX idx_user_usage_created_at ON user_usage(created_at);

-- =====================================================
-- USAGE TRACKING FUNCTIONS
-- =====================================================

-- Function to increment usage counters
CREATE OR REPLACE FUNCTION increment_usage(
  p_user_id uuid,
  p_usage_type text,
  p_amount integer DEFAULT 1
) RETURNS void AS $$
DECLARE
  current_month text := to_char(now(), 'YYYY-MM');
BEGIN
  -- Insert or update usage record for current month
  INSERT INTO user_usage (user_id, month_year, quotes_count, pdf_exports_count, api_calls_count, bulk_operations_count)
  VALUES (
    p_user_id, 
    current_month,
    CASE WHEN p_usage_type = 'quotes' THEN p_amount ELSE 0 END,
    CASE WHEN p_usage_type = 'pdf_exports' THEN p_amount ELSE 0 END,
    CASE WHEN p_usage_type = 'api_calls' THEN p_amount ELSE 0 END,
    CASE WHEN p_usage_type = 'bulk_operations' THEN p_amount ELSE 0 END
  )
  ON CONFLICT (user_id, month_year)
  DO UPDATE SET
    quotes_count = CASE 
      WHEN p_usage_type = 'quotes' THEN user_usage.quotes_count + p_amount
      ELSE user_usage.quotes_count 
    END,
    pdf_exports_count = CASE 
      WHEN p_usage_type = 'pdf_exports' THEN user_usage.pdf_exports_count + p_amount
      ELSE user_usage.pdf_exports_count 
    END,
    api_calls_count = CASE 
      WHEN p_usage_type = 'api_calls' THEN user_usage.api_calls_count + p_amount
      ELSE user_usage.api_calls_count 
    END,
    bulk_operations_count = CASE 
      WHEN p_usage_type = 'bulk_operations' THEN user_usage.bulk_operations_count + p_amount
      ELSE user_usage.bulk_operations_count 
    END,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current month usage for a user
CREATE OR REPLACE FUNCTION get_current_usage(p_user_id uuid)
RETURNS TABLE(
  quotes_count integer,
  pdf_exports_count integer,
  api_calls_count integer,
  bulk_operations_count integer
) AS $$
DECLARE
  current_month text := to_char(now(), 'YYYY-MM');
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(u.quotes_count, 0)::integer,
    COALESCE(u.pdf_exports_count, 0)::integer,
    COALESCE(u.api_calls_count, 0)::integer,
    COALESCE(u.bulk_operations_count, 0)::integer
  FROM user_usage u
  WHERE u.user_id = p_user_id AND u.month_year = current_month
  UNION ALL
  SELECT 0, 0, 0, 0
  WHERE NOT EXISTS (
    SELECT 1 FROM user_usage u 
    WHERE u.user_id = p_user_id AND u.month_year = current_month
  )
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has exceeded a usage limit
CREATE OR REPLACE FUNCTION check_usage_limit(
  p_user_id uuid,
  p_usage_type text,
  p_limit integer
) RETURNS boolean AS $$
DECLARE
  current_usage integer;
  current_month text := to_char(now(), 'YYYY-MM');
BEGIN
  -- Get current usage for the specified type
  SELECT 
    CASE 
      WHEN p_usage_type = 'quotes' THEN COALESCE(quotes_count, 0)
      WHEN p_usage_type = 'pdf_exports' THEN COALESCE(pdf_exports_count, 0)
      WHEN p_usage_type = 'api_calls' THEN COALESCE(api_calls_count, 0)
      WHEN p_usage_type = 'bulk_operations' THEN COALESCE(bulk_operations_count, 0)
      ELSE 0
    END
  INTO current_usage
  FROM user_usage
  WHERE user_id = p_user_id AND month_year = current_month;
  
  -- If no record exists, usage is 0
  IF current_usage IS NULL THEN
    current_usage := 0;
  END IF;
  
  -- Return true if limit is exceeded (unlimited = -1)
  RETURN p_limit != -1 AND current_usage >= p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- USAGE HISTORY TABLE (for analytics)
-- =====================================================

-- Create usage history table for long-term analytics
CREATE TABLE IF NOT EXISTS user_usage_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  month_year text NOT NULL,
  quotes_count integer DEFAULT 0 NOT NULL,
  pdf_exports_count integer DEFAULT 0 NOT NULL,
  api_calls_count integer DEFAULT 0 NOT NULL,
  bulk_operations_count integer DEFAULT 0 NOT NULL,
  archived_at timestamptz DEFAULT now() NOT NULL,
  
  -- Ensure one record per user per month
  UNIQUE(user_id, month_year)
);

-- Enable Row Level Security
ALTER TABLE user_usage_history ENABLE ROW LEVEL SECURITY;

-- Create policy for users to access only their own usage history
CREATE POLICY "Users can view their own usage history" ON user_usage_history
  FOR SELECT USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_user_usage_history_user_month ON user_usage_history(user_id, month_year);
CREATE INDEX idx_user_usage_history_archived_at ON user_usage_history(archived_at);

-- =====================================================
-- MONTHLY RESET FUNCTION (for cron job)
-- =====================================================

-- Function to archive current usage and reset counters (run monthly)
CREATE OR REPLACE FUNCTION archive_and_reset_usage() RETURNS void AS $$
DECLARE
  last_month text := to_char(now() - interval '1 month', 'YYYY-MM');
BEGIN
  -- Archive last month's usage to history table
  INSERT INTO user_usage_history (user_id, month_year, quotes_count, pdf_exports_count, api_calls_count, bulk_operations_count)
  SELECT user_id, month_year, quotes_count, pdf_exports_count, api_calls_count, bulk_operations_count
  FROM user_usage
  WHERE month_year = last_month
  ON CONFLICT (user_id, month_year) DO NOTHING;
  
  -- Clean up old usage records (keep current month only)
  DELETE FROM user_usage 
  WHERE month_year < to_char(now(), 'YYYY-MM');
  
  -- Log the operation
  RAISE NOTICE 'Usage archived and reset for month: %', last_month;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SUBSCRIPTION ENHANCEMENT
-- =====================================================

-- Add indexes to existing subscription-related tables for better performance
-- (These may already exist, so we use IF NOT EXISTS)

-- Ensure subscriptions table has proper indexes
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_subscriptions_user_status') THEN
    CREATE INDEX idx_subscriptions_user_status ON subscriptions(user_id, status);
  END IF;
END $$;

-- Ensure stripe_prices table has proper indexes  
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_stripe_prices_product') THEN
    CREATE INDEX idx_stripe_prices_product ON stripe_prices(stripe_product_id);
  END IF;
END $$;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant necessary permissions for the functions
GRANT EXECUTE ON FUNCTION increment_usage(uuid, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_usage(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION check_usage_limit(uuid, text, integer) TO authenticated;

-- Grant permissions for service role (for cron jobs)
GRANT EXECUTE ON FUNCTION archive_and_reset_usage() TO service_role;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE user_usage IS 'Tracks monthly feature usage per user for freemium limits';
COMMENT ON TABLE user_usage_history IS 'Historical usage data for analytics and reporting';
COMMENT ON FUNCTION increment_usage(uuid, text, integer) IS 'Increments usage counter for a specific feature';
COMMENT ON FUNCTION get_current_usage(uuid) IS 'Gets current month usage statistics for a user';
COMMENT ON FUNCTION check_usage_limit(uuid, text, integer) IS 'Checks if user has exceeded a usage limit';
COMMENT ON FUNCTION archive_and_reset_usage() IS 'Archives usage data and resets monthly counters (run via cron)';
