-- Sprint 4: Connection Pooling Optimization System
-- Migration: 20250808180000_create_connection_pooling_system.sql
-- Description: Creates database schema for connection pooling optimization and monitoring

-- =====================================================
-- CONNECTION POOLING TABLES
-- =====================================================

-- Connection pool configuration
CREATE TABLE IF NOT EXISTS connection_pool_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  environment TEXT NOT NULL CHECK (environment IN ('development', 'staging', 'production')),
  max_connections INTEGER NOT NULL DEFAULT 20 CHECK (max_connections > 0),
  min_connections INTEGER NOT NULL DEFAULT 2 CHECK (min_connections >= 0),
  idle_timeout_ms INTEGER NOT NULL DEFAULT 300000 CHECK (idle_timeout_ms > 0),
  connection_timeout_ms INTEGER NOT NULL DEFAULT 30000 CHECK (connection_timeout_ms > 0),
  health_check_interval_ms INTEGER NOT NULL DEFAULT 60000 CHECK (health_check_interval_ms > 0),
  acquire_timeout_ms INTEGER NOT NULL DEFAULT 10000 CHECK (acquire_timeout_ms > 0),
  max_retries INTEGER NOT NULL DEFAULT 3 CHECK (max_retries >= 0),
  retry_delay_ms INTEGER NOT NULL DEFAULT 1000 CHECK (retry_delay_ms > 0),
  enable_health_check BOOLEAN NOT NULL DEFAULT TRUE,
  enable_metrics BOOLEAN NOT NULL DEFAULT TRUE,
  config_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(environment),
  CONSTRAINT min_max_connections_check CHECK (min_connections <= max_connections)
);

-- Connection pool metrics tracking
CREATE TABLE IF NOT EXISTS connection_pool_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  environment TEXT NOT NULL,
  total_connections INTEGER NOT NULL DEFAULT 0,
  active_connections INTEGER NOT NULL DEFAULT 0,
  idle_connections INTEGER NOT NULL DEFAULT 0,
  pending_acquisitions INTEGER NOT NULL DEFAULT 0,
  pool_utilization REAL NOT NULL DEFAULT 0 CHECK (pool_utilization >= 0 AND pool_utilization <= 100),
  total_queries INTEGER NOT NULL DEFAULT 0,
  avg_response_time_ms REAL NOT NULL DEFAULT 0,
  connection_acquisition_time_ms REAL NOT NULL DEFAULT 0,
  error_rate REAL NOT NULL DEFAULT 0 CHECK (error_rate >= 0 AND error_rate <= 100),
  successful_queries INTEGER NOT NULL DEFAULT 0,
  failed_queries INTEGER NOT NULL DEFAULT 0,
  connection_errors INTEGER NOT NULL DEFAULT 0,
  timeout_errors INTEGER NOT NULL DEFAULT 0,
  health_check_score REAL DEFAULT 100 CHECK (health_check_score >= 0 AND health_check_score <= 100),
  memory_usage_mb REAL DEFAULT NULL,
  cpu_usage_percent REAL DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Connection pool optimizations tracking
CREATE TABLE IF NOT EXISTS connection_pool_optimizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  optimization_id TEXT NOT NULL UNIQUE,
  environment TEXT NOT NULL,
  current_stats JSONB NOT NULL DEFAULT '{}',
  usage_analysis JSONB NOT NULL DEFAULT '{}',
  optimizations JSONB NOT NULL DEFAULT '[]',
  auto_applied BOOLEAN NOT NULL DEFAULT FALSE,
  performance_impact JSONB DEFAULT '{}',
  recommendation_score INTEGER CHECK (recommendation_score >= 0 AND recommendation_score <= 100),
  implementation_status TEXT DEFAULT 'pending' CHECK (implementation_status IN (
    'pending', 
    'implemented', 
    'rejected', 
    'failed'
  )),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  implemented_at TIMESTAMPTZ DEFAULT NULL
);

-- Connection pool benchmarks
CREATE TABLE IF NOT EXISTS connection_pool_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  benchmark_id TEXT NOT NULL UNIQUE,
  environment TEXT NOT NULL,
  test_config JSONB NOT NULL DEFAULT '{}',
  results JSONB NOT NULL DEFAULT '{}',
  baseline_metrics JSONB DEFAULT '{}',
  performance_improvement REAL DEFAULT NULL, -- percentage
  execution_time_ms INTEGER NOT NULL DEFAULT 0,
  test_type TEXT NOT NULL DEFAULT 'performance' CHECK (test_type IN (
    'performance', 
    'stress', 
    'load', 
    'concurrency', 
    'endurance'
  )),
  test_status TEXT NOT NULL DEFAULT 'completed' CHECK (test_status IN (
    'running', 
    'completed', 
    'failed', 
    'cancelled'
  )),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Connection pool configuration changes audit
CREATE TABLE IF NOT EXISTS connection_pool_config_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  environment TEXT NOT NULL,
  change_type TEXT NOT NULL,
  parameter_name TEXT NOT NULL,
  old_value TEXT DEFAULT NULL,
  new_value TEXT NOT NULL,
  reason TEXT DEFAULT NULL,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  change_impact TEXT DEFAULT NULL,
  rollback_info JSONB DEFAULT '{}',
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Connection health monitoring
CREATE TABLE IF NOT EXISTS connection_health_monitoring (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  environment TEXT NOT NULL,
  connection_id TEXT NOT NULL,
  health_score INTEGER NOT NULL DEFAULT 100 CHECK (health_score >= 0 AND health_score <= 100),
  last_health_check TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  health_status TEXT NOT NULL DEFAULT 'healthy' CHECK (health_status IN (
    'healthy', 
    'degraded', 
    'unhealthy', 
    'unknown'
  )),
  response_time_ms INTEGER DEFAULT NULL,
  error_count INTEGER NOT NULL DEFAULT 0,
  query_count INTEGER NOT NULL DEFAULT 0,
  connection_age_ms INTEGER DEFAULT NULL,
  last_used TIMESTAMPTZ DEFAULT NULL,
  health_details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pool performance alerts
CREATE TABLE IF NOT EXISTS connection_pool_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id TEXT NOT NULL UNIQUE,
  environment TEXT NOT NULL,
  alert_type TEXT NOT NULL CHECK (alert_type IN (
    'high_utilization',
    'slow_acquisition',
    'high_error_rate',
    'connection_failure',
    'health_degradation',
    'configuration_warning'
  )),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  message TEXT NOT NULL,
  metric_value REAL DEFAULT NULL,
  threshold_value REAL DEFAULT NULL,
  alert_details JSONB DEFAULT '{}',
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ DEFAULT NULL,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolution_notes TEXT DEFAULT NULL,
  alert_status TEXT NOT NULL DEFAULT 'active' CHECK (alert_status IN (
    'active', 
    'acknowledged', 
    'resolved', 
    'suppressed'
  )),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Connection pool recommendations
CREATE TABLE IF NOT EXISTS connection_pool_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_id TEXT NOT NULL UNIQUE,
  environment TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'capacity', 
    'performance', 
    'reliability', 
    'cost_optimization', 
    'security'
  )),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  recommended_action TEXT NOT NULL,
  expected_impact TEXT DEFAULT NULL,
  implementation_effort TEXT DEFAULT 'medium' CHECK (implementation_effort IN ('low', 'medium', 'high')),
  supporting_data JSONB DEFAULT '{}',
  implementation_steps JSONB DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 
    'reviewed', 
    'approved', 
    'implemented', 
    'rejected'
  )),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ DEFAULT NULL,
  implemented_at TIMESTAMPTZ DEFAULT NULL
);

-- =====================================================
-- CONNECTION POOLING FUNCTIONS
-- =====================================================

-- Function to get current pool status
CREATE OR REPLACE FUNCTION get_connection_pool_status(p_environment TEXT DEFAULT NULL)
RETURNS TABLE(
  environment TEXT,
  current_config JSONB,
  latest_metrics JSONB,
  health_score INTEGER,
  active_alerts INTEGER,
  pending_recommendations INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cpc.environment,
    jsonb_build_object(
      'max_connections', cpc.max_connections,
      'min_connections', cpc.min_connections,
      'idle_timeout_ms', cpc.idle_timeout_ms,
      'connection_timeout_ms', cpc.connection_timeout_ms,
      'health_check_enabled', cpc.enable_health_check
    ) as current_config,
    jsonb_build_object(
      'total_connections', COALESCE(cpm.total_connections, 0),
      'active_connections', COALESCE(cpm.active_connections, 0),
      'idle_connections', COALESCE(cpm.idle_connections, 0),
      'pool_utilization', COALESCE(cpm.pool_utilization, 0),
      'avg_response_time_ms', COALESCE(cpm.avg_response_time_ms, 0),
      'error_rate', COALESCE(cpm.error_rate, 0)
    ) as latest_metrics,
    COALESCE(cpm.health_check_score, 100)::INTEGER as health_score,
    (
      SELECT COUNT(*)::INTEGER
      FROM connection_pool_alerts cpa
      WHERE cpa.environment = cpc.environment
        AND cpa.alert_status = 'active'
    ) as active_alerts,
    (
      SELECT COUNT(*)::INTEGER
      FROM connection_pool_recommendations cpr
      WHERE cpr.environment = cpc.environment
        AND cpr.status = 'pending'
    ) as pending_recommendations
  FROM connection_pool_config cpc
  LEFT JOIN LATERAL (
    SELECT *
    FROM connection_pool_metrics cpm_inner
    WHERE cpm_inner.environment = cpc.environment
    ORDER BY created_at DESC
    LIMIT 1
  ) cpm ON true
  WHERE (p_environment IS NULL OR cpc.environment = p_environment)
  ORDER BY cpc.environment;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate pool performance score
CREATE OR REPLACE FUNCTION calculate_pool_performance_score(
  p_environment TEXT,
  p_hours_back INTEGER DEFAULT 24
)
RETURNS INTEGER AS $$
DECLARE
  performance_score INTEGER;
  avg_utilization REAL;
  avg_response_time REAL;
  avg_error_rate REAL;
  avg_acquisition_time REAL;
BEGIN
  -- Get average metrics for the specified time period
  SELECT 
    AVG(pool_utilization),
    AVG(avg_response_time_ms),
    AVG(error_rate),
    AVG(connection_acquisition_time_ms)
  INTO avg_utilization, avg_response_time, avg_error_rate, avg_acquisition_time
  FROM connection_pool_metrics
  WHERE environment = p_environment
    AND created_at >= NOW() - INTERVAL '1 hour' * p_hours_back;
  
  -- Initialize score
  performance_score := 100;
  
  -- Deduct points based on utilization (optimal range: 40-70%)
  IF avg_utilization IS NOT NULL THEN
    IF avg_utilization > 90 THEN
      performance_score := performance_score - 25;
    ELSIF avg_utilization > 80 THEN
      performance_score := performance_score - 15;
    ELSIF avg_utilization < 20 THEN
      performance_score := performance_score - 10; -- Under-utilization
    END IF;
  END IF;
  
  -- Deduct points for slow response times
  IF avg_response_time IS NOT NULL THEN
    IF avg_response_time > 1000 THEN
      performance_score := performance_score - 20;
    ELSIF avg_response_time > 500 THEN
      performance_score := performance_score - 10;
    END IF;
  END IF;
  
  -- Deduct points for high error rates
  IF avg_error_rate IS NOT NULL THEN
    IF avg_error_rate > 5 THEN
      performance_score := performance_score - 25;
    ELSIF avg_error_rate > 1 THEN
      performance_score := performance_score - 10;
    END IF;
  END IF;
  
  -- Deduct points for slow connection acquisition
  IF avg_acquisition_time IS NOT NULL THEN
    IF avg_acquisition_time > 500 THEN
      performance_score := performance_score - 15;
    ELSIF avg_acquisition_time > 200 THEN
      performance_score := performance_score - 5;
    END IF;
  END IF;
  
  RETURN GREATEST(0, performance_score);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate pool recommendations
CREATE OR REPLACE FUNCTION generate_pool_recommendations(p_environment TEXT)
RETURNS VOID AS $$
DECLARE
  latest_metrics RECORD;
  config_record RECORD;
  recommendation_count INTEGER := 0;
BEGIN
  -- Get latest metrics and config
  SELECT * INTO latest_metrics
  FROM connection_pool_metrics
  WHERE environment = p_environment
  ORDER BY created_at DESC
  LIMIT 1;
  
  SELECT * INTO config_record
  FROM connection_pool_config
  WHERE environment = p_environment;
  
  IF latest_metrics IS NULL OR config_record IS NULL THEN
    RETURN;
  END IF;
  
  -- High utilization recommendation
  IF latest_metrics.pool_utilization > 85 THEN
    INSERT INTO connection_pool_recommendations (
      recommendation_id,
      environment,
      category,
      priority,
      title,
      description,
      recommended_action,
      expected_impact,
      supporting_data
    ) VALUES (
      'high_util_' || extract(epoch from now()),
      p_environment,
      'capacity',
      'high',
      'Increase Pool Size',
      format('Pool utilization is %.1f%%, approaching capacity', latest_metrics.pool_utilization),
      format('Increase max_connections from %s to %s', config_record.max_connections, config_record.max_connections + CEIL(config_record.max_connections * 0.3)),
      'Reduced connection wait times and improved performance',
      jsonb_build_object(
        'current_utilization', latest_metrics.pool_utilization,
        'current_max_connections', config_record.max_connections,
        'recommended_max_connections', config_record.max_connections + CEIL(config_record.max_connections * 0.3)
      )
    )
    ON CONFLICT (recommendation_id) DO NOTHING;
    
    recommendation_count := recommendation_count + 1;
  END IF;
  
  -- Slow response time recommendation
  IF latest_metrics.avg_response_time_ms > 500 THEN
    INSERT INTO connection_pool_recommendations (
      recommendation_id,
      environment,
      category,
      priority,
      title,
      description,
      recommended_action,
      expected_impact,
      supporting_data
    ) VALUES (
      'slow_response_' || extract(epoch from now()),
      p_environment,
      'performance',
      'medium',
      'Optimize Connection Performance',
      format('Average response time is %.1fms, above optimal range', latest_metrics.avg_response_time_ms),
      'Review query efficiency and consider increasing min_connections',
      'Faster database operations and improved user experience',
      jsonb_build_object(
        'current_response_time', latest_metrics.avg_response_time_ms,
        'target_response_time', 200,
        'current_min_connections', config_record.min_connections
      )
    )
    ON CONFLICT (recommendation_id) DO NOTHING;
    
    recommendation_count := recommendation_count + 1;
  END IF;
  
  -- High error rate recommendation
  IF latest_metrics.error_rate > 2 THEN
    INSERT INTO connection_pool_recommendations (
      recommendation_id,
      environment,
      category,
      priority,
      title,
      description,
      recommended_action,
      expected_impact,
      supporting_data
    ) VALUES (
      'high_error_rate_' || extract(epoch from now()),
      p_environment,
      'reliability',
      'high',
      'Address High Error Rate',
      format('Connection error rate is %.2f%%, indicating reliability issues', latest_metrics.error_rate),
      'Investigate connection timeouts, increase retry limits, and review database health',
      'Improved system reliability and reduced failed operations',
      jsonb_build_object(
        'current_error_rate', latest_metrics.error_rate,
        'target_error_rate', 1.0,
        'recent_errors', latest_metrics.failed_queries
      )
    )
    ON CONFLICT (recommendation_id) DO NOTHING;
    
    recommendation_count := recommendation_count + 1;
  END IF;
  
  -- Log recommendation generation
  INSERT INTO connection_pool_config_changes (
    environment,
    change_type,
    parameter_name,
    new_value,
    reason,
    applied_at
  ) VALUES (
    p_environment,
    'recommendation_generation',
    'recommendation_count',
    recommendation_count::TEXT,
    'Automated recommendation generation based on current metrics',
    NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to trigger alerts based on metrics
CREATE OR REPLACE FUNCTION check_pool_alerts(p_environment TEXT)
RETURNS VOID AS $$
DECLARE
  latest_metrics RECORD;
  alert_count INTEGER := 0;
BEGIN
  -- Get latest metrics
  SELECT * INTO latest_metrics
  FROM connection_pool_metrics
  WHERE environment = p_environment
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF latest_metrics IS NULL THEN
    RETURN;
  END IF;
  
  -- High utilization alert
  IF latest_metrics.pool_utilization > 90 THEN
    INSERT INTO connection_pool_alerts (
      alert_id,
      environment,
      alert_type,
      severity,
      message,
      metric_value,
      threshold_value,
      alert_details
    ) VALUES (
      'high_util_' || latest_metrics.id,
      p_environment,
      'high_utilization',
      'high',
      format('Pool utilization reached %.1f%%', latest_metrics.pool_utilization),
      latest_metrics.pool_utilization,
      90,
      jsonb_build_object(
        'active_connections', latest_metrics.active_connections,
        'total_connections', latest_metrics.total_connections,
        'pending_acquisitions', latest_metrics.pending_acquisitions
      )
    )
    ON CONFLICT (alert_id) DO NOTHING;
    
    alert_count := alert_count + 1;
  END IF;
  
  -- Slow acquisition alert
  IF latest_metrics.connection_acquisition_time_ms > 1000 THEN
    INSERT INTO connection_pool_alerts (
      alert_id,
      environment,
      alert_type,
      severity,
      message,
      metric_value,
      threshold_value,
      alert_details
    ) VALUES (
      'slow_acq_' || latest_metrics.id,
      p_environment,
      'slow_acquisition',
      'medium',
      format('Connection acquisition time is %.1fms', latest_metrics.connection_acquisition_time_ms),
      latest_metrics.connection_acquisition_time_ms,
      1000,
      jsonb_build_object(
        'avg_response_time', latest_metrics.avg_response_time_ms,
        'pending_acquisitions', latest_metrics.pending_acquisitions
      )
    )
    ON CONFLICT (alert_id) DO NOTHING;
    
    alert_count := alert_count + 1;
  END IF;
  
  -- High error rate alert
  IF latest_metrics.error_rate > 5 THEN
    INSERT INTO connection_pool_alerts (
      alert_id,
      environment,
      alert_type,
      severity,
      message,
      metric_value,
      threshold_value,
      alert_details
    ) VALUES (
      'high_err_' || latest_metrics.id,
      p_environment,
      'high_error_rate',
      'critical',
      format('Error rate reached %.2f%%', latest_metrics.error_rate),
      latest_metrics.error_rate,
      5,
      jsonb_build_object(
        'failed_queries', latest_metrics.failed_queries,
        'total_queries', latest_metrics.total_queries,
        'connection_errors', latest_metrics.connection_errors
      )
    )
    ON CONFLICT (alert_id) DO NOTHING;
    
    alert_count := alert_count + 1;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup old connection pool data
CREATE OR REPLACE FUNCTION cleanup_connection_pool_data()
RETURNS VOID AS $$
BEGIN
  -- Clean up old metrics (keep 90 days)
  DELETE FROM connection_pool_metrics 
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  -- Clean up resolved alerts (keep 30 days)
  DELETE FROM connection_pool_alerts 
  WHERE alert_status = 'resolved' 
    AND resolved_at < NOW() - INTERVAL '30 days';
  
  -- Clean up old benchmarks (keep 1 year)
  DELETE FROM connection_pool_benchmarks 
  WHERE created_at < NOW() - INTERVAL '1 year';
  
  -- Clean up implemented recommendations (keep 6 months)
  DELETE FROM connection_pool_recommendations 
  WHERE status = 'implemented' 
    AND implemented_at < NOW() - INTERVAL '6 months';
  
  -- Clean up old health monitoring data (keep 30 days)
  DELETE FROM connection_health_monitoring 
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Connection pool configuration indexes
CREATE INDEX IF NOT EXISTS idx_connection_pool_config_environment ON connection_pool_config(environment);
CREATE INDEX IF NOT EXISTS idx_connection_pool_config_updated ON connection_pool_config(updated_at DESC);

-- Connection pool metrics indexes
CREATE INDEX IF NOT EXISTS idx_connection_pool_metrics_environment ON connection_pool_metrics(environment);
CREATE INDEX IF NOT EXISTS idx_connection_pool_metrics_created ON connection_pool_metrics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_connection_pool_metrics_utilization ON connection_pool_metrics(pool_utilization DESC);
CREATE INDEX IF NOT EXISTS idx_connection_pool_metrics_error_rate ON connection_pool_metrics(error_rate DESC);

-- Connection pool optimizations indexes
CREATE INDEX IF NOT EXISTS idx_connection_pool_optimizations_id ON connection_pool_optimizations(optimization_id);
CREATE INDEX IF NOT EXISTS idx_connection_pool_optimizations_env ON connection_pool_optimizations(environment);
CREATE INDEX IF NOT EXISTS idx_connection_pool_optimizations_status ON connection_pool_optimizations(implementation_status);

-- Connection pool benchmarks indexes
CREATE INDEX IF NOT EXISTS idx_connection_pool_benchmarks_id ON connection_pool_benchmarks(benchmark_id);
CREATE INDEX IF NOT EXISTS idx_connection_pool_benchmarks_env ON connection_pool_benchmarks(environment);
CREATE INDEX IF NOT EXISTS idx_connection_pool_benchmarks_type ON connection_pool_benchmarks(test_type);

-- Connection pool alerts indexes
CREATE INDEX IF NOT EXISTS idx_connection_pool_alerts_id ON connection_pool_alerts(alert_id);
CREATE INDEX IF NOT EXISTS idx_connection_pool_alerts_env ON connection_pool_alerts(environment);
CREATE INDEX IF NOT EXISTS idx_connection_pool_alerts_status ON connection_pool_alerts(alert_status);
CREATE INDEX IF NOT EXISTS idx_connection_pool_alerts_severity ON connection_pool_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_connection_pool_alerts_triggered ON connection_pool_alerts(triggered_at DESC);

-- Connection pool recommendations indexes
CREATE INDEX IF NOT EXISTS idx_connection_pool_recommendations_id ON connection_pool_recommendations(recommendation_id);
CREATE INDEX IF NOT EXISTS idx_connection_pool_recommendations_env ON connection_pool_recommendations(environment);
CREATE INDEX IF NOT EXISTS idx_connection_pool_recommendations_status ON connection_pool_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_connection_pool_recommendations_priority ON connection_pool_recommendations(priority);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE connection_pool_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE connection_pool_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE connection_pool_optimizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE connection_pool_benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE connection_pool_config_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE connection_health_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE connection_pool_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE connection_pool_recommendations ENABLE ROW LEVEL SECURITY;

-- Admin-only access policies
CREATE POLICY "Admins can manage connection pool config" ON connection_pool_config
  FOR ALL USING (
    public.is_admin()
  );

CREATE POLICY "Service role can manage connection pool data" ON connection_pool_config
  FOR ALL USING (auth.role() = 'service_role');

-- Apply similar policies to all connection pool tables
DO $$ 
DECLARE
  table_name TEXT;
  table_names TEXT[] := ARRAY[
    'connection_pool_metrics',
    'connection_pool_optimizations',
    'connection_pool_benchmarks',
    'connection_pool_config_changes',
    'connection_health_monitoring',
    'connection_pool_alerts',
    'connection_pool_recommendations'
  ];
BEGIN
  FOREACH table_name IN ARRAY table_names LOOP
    EXECUTE format('
      CREATE POLICY "Admins can manage %1$s" ON %1$s
        FOR ALL USING (
          EXISTS (
            SELECT 1 WHERE public.is_admin()
          )
        );
      
      CREATE POLICY "Service role can manage %1$s" ON %1$s
        FOR ALL USING (auth.role() = ''service_role'');
    ', table_name);
  END LOOP;
END $$;

-- =====================================================
-- TRIGGERS FOR AUTOMATION
-- =====================================================

-- Trigger to generate recommendations when metrics are inserted
CREATE OR REPLACE FUNCTION trigger_generate_recommendations()
RETURNS TRIGGER AS $$
BEGIN
  -- Generate recommendations for high utilization or error rates
  IF NEW.pool_utilization > 80 OR NEW.error_rate > 2 THEN
    PERFORM generate_pool_recommendations(NEW.environment);
  END IF;
  
  -- Check for alerts
  PERFORM check_pool_alerts(NEW.environment);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_pool_metrics_analysis
  AFTER INSERT ON connection_pool_metrics
  FOR EACH ROW
  EXECUTE FUNCTION trigger_generate_recommendations();

-- =====================================================
-- INITIAL CONFIGURATION DATA
-- =====================================================

-- Insert default configurations for each environment
INSERT INTO connection_pool_config (
  environment,
  max_connections,
  min_connections,
  idle_timeout_ms,
  connection_timeout_ms,
  health_check_interval_ms,
  acquire_timeout_ms,
  max_retries,
  retry_delay_ms
) VALUES
  ('development', 5, 1, 300000, 10000, 30000, 5000, 3, 1000),
  ('staging', 10, 2, 300000, 15000, 60000, 8000, 3, 1000),
  ('production', 25, 5, 600000, 30000, 60000, 10000, 3, 1000)
ON CONFLICT (environment) DO NOTHING;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_connection_pool_status TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_pool_performance_score TO authenticated;
GRANT EXECUTE ON FUNCTION generate_pool_recommendations TO authenticated;
GRANT EXECUTE ON FUNCTION check_pool_alerts TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_connection_pool_data TO authenticated;

-- Comments
COMMENT ON TABLE connection_pool_config IS 'Connection pool configuration settings by environment';
COMMENT ON TABLE connection_pool_metrics IS 'Real-time connection pool performance metrics';
COMMENT ON TABLE connection_pool_optimizations IS 'Pool optimization recommendations and implementations';
COMMENT ON TABLE connection_pool_benchmarks IS 'Performance benchmark results for pool tuning';
COMMENT ON TABLE connection_pool_config_changes IS 'Audit log of configuration changes';
COMMENT ON TABLE connection_health_monitoring IS 'Individual connection health tracking';
COMMENT ON TABLE connection_pool_alerts IS 'Pool performance alerts and notifications';
COMMENT ON TABLE connection_pool_recommendations IS 'Automated pool optimization recommendations';