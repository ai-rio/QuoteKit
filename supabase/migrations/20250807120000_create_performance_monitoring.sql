-- Edge Functions Performance Monitoring System
-- Migration: 20250807120000_create_performance_monitoring.sql
-- Description: Creates tables and functions to monitor performance improvements

-- Performance metrics tracking table
CREATE TABLE IF NOT EXISTS edge_function_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name TEXT NOT NULL,
  operation_type TEXT NOT NULL,
  execution_time_ms INTEGER NOT NULL,
  database_queries INTEGER DEFAULT 0,
  api_calls_made INTEGER DEFAULT 0,
  memory_usage_mb REAL DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  user_id UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance baselines table for comparison
CREATE TABLE IF NOT EXISTS performance_baselines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_name TEXT UNIQUE NOT NULL,
  baseline_response_time_ms INTEGER NOT NULL,
  baseline_api_calls INTEGER NOT NULL,
  baseline_db_queries INTEGER NOT NULL,
  target_response_time_ms INTEGER NOT NULL,
  target_api_calls INTEGER NOT NULL,
  target_db_queries INTEGER NOT NULL,
  improvement_percentage REAL GENERATED ALWAYS AS (
    CASE 
      WHEN baseline_response_time_ms > 0 THEN
        ((baseline_response_time_ms - target_response_time_ms)::REAL / baseline_response_time_ms::REAL) * 100
      ELSE 0 
    END
  ) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cost tracking table
CREATE TABLE IF NOT EXISTS cost_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
  edge_function_invocations INTEGER DEFAULT 0,
  estimated_monthly_cost DECIMAL(10,2) DEFAULT 0,
  actual_monthly_cost DECIMAL(10,2) DEFAULT NULL,
  bandwidth_usage_gb REAL DEFAULT 0,
  storage_usage_gb REAL DEFAULT 0,
  database_usage_hours REAL DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(metric_date)
);

-- Function to record edge function performance
CREATE OR REPLACE FUNCTION record_edge_function_performance(
  p_function_name TEXT,
  p_operation_type TEXT,
  p_execution_time_ms INTEGER,
  p_database_queries INTEGER DEFAULT 0,
  p_api_calls_made INTEGER DEFAULT 0,
  p_memory_usage_mb REAL DEFAULT 0,
  p_error_count INTEGER DEFAULT 0,
  p_user_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  metric_id UUID;
BEGIN
  INSERT INTO edge_function_metrics (
    function_name,
    operation_type,
    execution_time_ms,
    database_queries,
    api_calls_made,
    memory_usage_mb,
    error_count,
    user_id,
    metadata
  ) VALUES (
    p_function_name,
    p_operation_type,
    p_execution_time_ms,
    p_database_queries,
    p_api_calls_made,
    p_memory_usage_mb,
    p_error_count,
    p_user_id,
    p_metadata
  ) RETURNING id INTO metric_id;
  
  RETURN metric_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get performance summary
CREATE OR REPLACE FUNCTION get_performance_summary(
  p_function_name TEXT DEFAULT NULL,
  p_days_back INTEGER DEFAULT 7
) RETURNS TABLE(
  function_name TEXT,
  operation_type TEXT,
  avg_execution_time_ms REAL,
  min_execution_time_ms INTEGER,
  max_execution_time_ms INTEGER,
  total_invocations BIGINT,
  avg_db_queries REAL,
  avg_api_calls REAL,
  error_rate REAL,
  improvement_vs_baseline REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    efm.function_name,
    efm.operation_type,
    AVG(efm.execution_time_ms)::REAL as avg_execution_time_ms,
    MIN(efm.execution_time_ms) as min_execution_time_ms,
    MAX(efm.execution_time_ms) as max_execution_time_ms,
    COUNT(*)::BIGINT as total_invocations,
    AVG(efm.database_queries)::REAL as avg_db_queries,
    AVG(efm.api_calls_made)::REAL as avg_api_calls,
    (COUNT(CASE WHEN efm.error_count > 0 THEN 1 END)::REAL / COUNT(*)::REAL * 100) as error_rate,
    CASE 
      WHEN pb.baseline_response_time_ms IS NOT NULL AND pb.baseline_response_time_ms > 0 THEN
        ((pb.baseline_response_time_ms - AVG(efm.execution_time_ms)::REAL) / pb.baseline_response_time_ms::REAL) * 100
      ELSE NULL
    END as improvement_vs_baseline
  FROM edge_function_metrics efm
  LEFT JOIN performance_baselines pb ON pb.operation_name = efm.function_name
  WHERE 
    efm.created_at >= NOW() - INTERVAL '1 day' * p_days_back
    AND (p_function_name IS NULL OR efm.function_name = p_function_name)
  GROUP BY efm.function_name, efm.operation_type, pb.baseline_response_time_ms
  ORDER BY total_invocations DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update cost metrics
CREATE OR REPLACE FUNCTION update_daily_cost_metrics(
  p_date DATE DEFAULT CURRENT_DATE,
  p_function_invocations INTEGER DEFAULT 0,
  p_bandwidth_usage_gb REAL DEFAULT 0
) RETURNS VOID AS $$
DECLARE
  estimated_cost DECIMAL(10,2);
BEGIN
  -- Calculate estimated cost based on Supabase Edge Functions pricing
  -- $0.00000025 per invocation after first 500K
  estimated_cost := CASE 
    WHEN p_function_invocations <= 500000 THEN 0
    ELSE (p_function_invocations - 500000) * 0.00000025
  END;
  
  -- Add bandwidth costs if applicable
  estimated_cost := estimated_cost + (p_bandwidth_usage_gb * 0.09); -- $0.09 per GB
  
  INSERT INTO cost_metrics (
    metric_date,
    edge_function_invocations,
    estimated_monthly_cost,
    bandwidth_usage_gb
  ) VALUES (
    p_date,
    p_function_invocations,
    estimated_cost,
    p_bandwidth_usage_gb
  )
  ON CONFLICT (metric_date) DO UPDATE SET
    edge_function_invocations = EXCLUDED.edge_function_invocations,
    estimated_monthly_cost = EXCLUDED.estimated_monthly_cost,
    bandwidth_usage_gb = EXCLUDED.bandwidth_usage_gb;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert baseline performance targets
INSERT INTO performance_baselines (
  operation_name,
  baseline_response_time_ms,
  baseline_api_calls,
  baseline_db_queries,
  target_response_time_ms,
  target_api_calls,
  target_db_queries
) VALUES
  ('subscription_status', 800, 5, 10, 400, 1, 4),
  ('quote_generation', 2500, 8, 15, 1200, 2, 8),
  ('admin_analytics', 1500, 6, 20, 600, 2, 12),
  ('webhook_processing', 500, 3, 5, 200, 1, 3),
  ('quote_pdf_generation', 3000, 4, 8, 1200, 1, 4),
  ('bulk_quote_operations', 5000, 12, 25, 2000, 2, 10)
ON CONFLICT (operation_name) DO UPDATE SET
  baseline_response_time_ms = EXCLUDED.baseline_response_time_ms,
  baseline_api_calls = EXCLUDED.baseline_api_calls,
  baseline_db_queries = EXCLUDED.baseline_db_queries,
  target_response_time_ms = EXCLUDED.target_response_time_ms,
  target_api_calls = EXCLUDED.target_api_calls,
  target_db_queries = EXCLUDED.target_db_queries,
  updated_at = NOW();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_edge_function_metrics_function_name ON edge_function_metrics(function_name);
CREATE INDEX IF NOT EXISTS idx_edge_function_metrics_created_at ON edge_function_metrics(created_at);
CREATE INDEX IF NOT EXISTS idx_edge_function_metrics_user_id ON edge_function_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_cost_metrics_date ON cost_metrics(metric_date);

-- RLS Policies
ALTER TABLE edge_function_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_baselines ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_metrics ENABLE ROW LEVEL SECURITY;

-- Admin users can view all performance metrics
CREATE POLICY "Admin users can view performance metrics" ON edge_function_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Users can view their own performance metrics
CREATE POLICY "Users can view own performance metrics" ON edge_function_metrics
  FOR SELECT USING (user_id = auth.uid());

-- Admin users can view all baselines and costs
CREATE POLICY "Admin users can view baselines" ON performance_baselines
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admin users can view cost metrics" ON cost_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION record_edge_function_performance TO authenticated;
GRANT EXECUTE ON FUNCTION get_performance_summary TO authenticated;
GRANT EXECUTE ON FUNCTION update_daily_cost_metrics TO authenticated;

COMMENT ON TABLE edge_function_metrics IS 'Tracks performance metrics for Edge Functions to measure improvements';
COMMENT ON TABLE performance_baselines IS 'Stores baseline and target performance metrics for comparison';
COMMENT ON TABLE cost_metrics IS 'Tracks daily cost metrics for Edge Functions usage';