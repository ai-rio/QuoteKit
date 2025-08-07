-- Sprint 4: Global Optimization System
-- Migration: 20250808160000_create_global_optimization_system.sql
-- Description: Creates global deployment optimization infrastructure for Edge Functions

-- =====================================================
-- GLOBAL OPTIMIZATION TABLES
-- =====================================================

-- Global optimization reports
CREATE TABLE IF NOT EXISTS global_optimization_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  optimization_id TEXT NOT NULL UNIQUE,
  overall_performance JSONB NOT NULL DEFAULT '{}',
  regional_metrics JSONB NOT NULL DEFAULT '[]',
  optimizations JSONB NOT NULL DEFAULT '{}',
  recommendations JSONB NOT NULL DEFAULT '[]',
  configuration_changes JSONB NOT NULL DEFAULT '[]',
  execution_time_ms INTEGER NOT NULL DEFAULT 0,
  auto_applied BOOLEAN NOT NULL DEFAULT FALSE,
  performance_improvement REAL GENERATED ALWAYS AS (
    (overall_performance->>'performanceImprovement')::REAL
  ) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Regional configuration
CREATE TABLE IF NOT EXISTS regional_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region TEXT NOT NULL,
  region_name TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  priority INTEGER NOT NULL DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  latency_threshold INTEGER NOT NULL DEFAULT 1000, -- milliseconds
  error_rate_threshold REAL NOT NULL DEFAULT 1.0, -- percentage
  load_balancing_weight REAL NOT NULL DEFAULT 0.2 CHECK (load_balancing_weight >= 0 AND load_balancing_weight <= 1),
  caching_strategy TEXT NOT NULL DEFAULT 'conservative' CHECK (caching_strategy IN ('aggressive', 'conservative', 'disabled')),
  cold_start_optimization BOOLEAN NOT NULL DEFAULT TRUE,
  connection_pooling JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(region)
);

-- Global optimization configuration
CREATE TABLE IF NOT EXISTS global_optimization_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_type TEXT NOT NULL CHECK (config_type IN (
    'caching', 
    'cold_start', 
    'connection_pooling', 
    'load_balancing', 
    'global_settings'
  )),
  config_key TEXT NOT NULL,
  config_value JSONB NOT NULL DEFAULT '{}',
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  last_modified_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  UNIQUE(config_type, config_key)
);

-- Regional performance metrics
CREATE TABLE IF NOT EXISTS regional_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region TEXT NOT NULL,
  avg_response_time_ms REAL NOT NULL DEFAULT 0,
  error_rate REAL NOT NULL DEFAULT 0,
  throughput_rps REAL NOT NULL DEFAULT 0, -- requests per second
  uptime_percent REAL NOT NULL DEFAULT 100,
  active_connections INTEGER NOT NULL DEFAULT 0,
  cache_hit_rate REAL NOT NULL DEFAULT 0,
  cold_start_rate REAL NOT NULL DEFAULT 0,
  health_status TEXT NOT NULL DEFAULT 'healthy' CHECK (health_status IN ('healthy', 'degraded', 'unhealthy')),
  last_checked TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_points_count INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cache optimization tracking
CREATE TABLE IF NOT EXISTS cache_optimization_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  optimization_id TEXT NOT NULL REFERENCES global_optimization_reports(optimization_id) ON DELETE CASCADE,
  cache_type TEXT NOT NULL CHECK (cache_type IN (
    'function_response', 
    'database_query', 
    'external_api', 
    'computed_results', 
    'static_assets'
  )),
  cache_key_pattern TEXT NOT NULL,
  ttl_seconds INTEGER NOT NULL DEFAULT 3600,
  compression_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  hit_rate_before REAL DEFAULT NULL,
  hit_rate_after REAL DEFAULT NULL,
  performance_impact_ms REAL DEFAULT NULL,
  memory_usage_mb REAL DEFAULT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cold start optimization tracking
CREATE TABLE IF NOT EXISTS cold_start_optimization_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  optimization_id TEXT NOT NULL REFERENCES global_optimization_reports(optimization_id) ON DELETE CASCADE,
  function_name TEXT NOT NULL,
  optimization_type TEXT NOT NULL CHECK (optimization_type IN (
    'warmup', 
    'preload_data', 
    'connection_reuse', 
    'code_optimization', 
    'dependency_optimization'
  )),
  warmup_interval_minutes INTEGER DEFAULT NULL,
  preload_data_items JSONB DEFAULT '[]',
  cold_start_time_before_ms REAL DEFAULT NULL,
  cold_start_time_after_ms REAL DEFAULT NULL,
  improvement_percent REAL GENERATED ALWAYS AS (
    CASE 
      WHEN cold_start_time_before_ms > 0 AND cold_start_time_after_ms IS NOT NULL THEN
        ((cold_start_time_before_ms - cold_start_time_after_ms) / cold_start_time_before_ms) * 100
      ELSE NULL 
    END
  ) STORED,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Connection pool optimization tracking
CREATE TABLE IF NOT EXISTS connection_pool_optimization_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  optimization_id TEXT NOT NULL REFERENCES global_optimization_reports(optimization_id) ON DELETE CASCADE,
  region TEXT NOT NULL,
  pool_type TEXT NOT NULL CHECK (pool_type IN ('database', 'redis', 'external_api')),
  max_connections INTEGER NOT NULL DEFAULT 10,
  idle_timeout_seconds INTEGER NOT NULL DEFAULT 300,
  connection_timeout_seconds INTEGER NOT NULL DEFAULT 30,
  health_check_interval_seconds INTEGER NOT NULL DEFAULT 60,
  connections_before INTEGER DEFAULT NULL,
  connections_after INTEGER DEFAULT NULL,
  avg_wait_time_before_ms REAL DEFAULT NULL,
  avg_wait_time_after_ms REAL DEFAULT NULL,
  performance_improvement_ms REAL GENERATED ALWAYS AS (
    CASE 
      WHEN avg_wait_time_before_ms IS NOT NULL AND avg_wait_time_after_ms IS NOT NULL THEN
        avg_wait_time_before_ms - avg_wait_time_after_ms
      ELSE NULL 
    END
  ) STORED,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Load balancing optimization tracking
CREATE TABLE IF NOT EXISTS load_balancing_optimization_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  optimization_id TEXT NOT NULL REFERENCES global_optimization_reports(optimization_id) ON DELETE CASCADE,
  strategy TEXT NOT NULL CHECK (strategy IN ('round_robin', 'least_connections', 'weighted', 'geographic')),
  regional_weights JSONB NOT NULL DEFAULT '{}',
  health_check_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  failover_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  timeout_ms INTEGER NOT NULL DEFAULT 5000,
  traffic_distribution_before JSONB DEFAULT '{}',
  traffic_distribution_after JSONB DEFAULT '{}',
  performance_variance_before REAL DEFAULT NULL,
  performance_variance_after REAL DEFAULT NULL,
  efficiency_improvement REAL GENERATED ALWAYS AS (
    CASE 
      WHEN performance_variance_before IS NOT NULL AND performance_variance_after IS NOT NULL THEN
        ((performance_variance_before - performance_variance_after) / performance_variance_before) * 100
      ELSE NULL 
    END
  ) STORED,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Global deployment status
CREATE TABLE IF NOT EXISTS global_deployment_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deployment_version TEXT NOT NULL,
  region TEXT NOT NULL,
  function_name TEXT NOT NULL,
  deployment_status TEXT NOT NULL CHECK (deployment_status IN ('deployed', 'deploying', 'failed', 'rolled_back')),
  deployment_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  health_check_passed BOOLEAN DEFAULT NULL,
  performance_validated BOOLEAN DEFAULT NULL,
  rollback_available BOOLEAN NOT NULL DEFAULT TRUE,
  error_message TEXT DEFAULT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(region, function_name, deployment_version)
);

-- =====================================================
-- GLOBAL OPTIMIZATION FUNCTIONS
-- =====================================================

-- Function to get global optimization status
CREATE OR REPLACE FUNCTION get_global_optimization_status(
  p_optimization_id TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE(
  optimization_id TEXT,
  overall_performance JSONB,
  regional_health_score REAL,
  total_optimizations INTEGER,
  performance_improvement REAL,
  recommendations_count INTEGER,
  auto_applied BOOLEAN,
  created_at TIMESTAMPTZ,
  optimization_summary JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    gor.optimization_id,
    gor.overall_performance,
    (
      SELECT AVG(
        CASE 
          WHEN (value->>'healthStatus') = 'healthy' THEN 100
          WHEN (value->>'healthStatus') = 'degraded' THEN 60
          ELSE 20
        END
      )
      FROM jsonb_array_elements(gor.regional_metrics) AS value
    ) as regional_health_score,
    jsonb_array_length(gor.configuration_changes) as total_optimizations,
    gor.performance_improvement,
    jsonb_array_length(gor.recommendations) as recommendations_count,
    gor.auto_applied,
    gor.created_at,
    jsonb_build_object(
      'execution_time_ms', gor.execution_time_ms,
      'caching_optimizations', jsonb_array_length(gor.optimizations->'caching'),
      'cold_start_optimizations', jsonb_array_length(gor.optimizations->'coldStart'),
      'connection_optimizations', jsonb_array_length(gor.optimizations->'connectionPooling'),
      'load_balancing_optimizations', jsonb_array_length(gor.optimizations->'loadBalancing')
    ) as optimization_summary
  FROM global_optimization_reports gor
  WHERE (p_optimization_id IS NULL OR gor.optimization_id = p_optimization_id)
  ORDER BY gor.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate regional performance scores
CREATE OR REPLACE FUNCTION calculate_regional_performance_scores()
RETURNS TABLE(
  region TEXT,
  performance_score INTEGER,
  health_status TEXT,
  performance_grade TEXT,
  improvement_recommendations JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH latest_metrics AS (
    SELECT DISTINCT ON (region) 
      rpm.region,
      rpm.avg_response_time_ms,
      rpm.error_rate,
      rpm.throughput_rps,
      rpm.uptime_percent,
      rpm.cache_hit_rate,
      rpm.health_status
    FROM regional_performance_metrics rpm
    ORDER BY rpm.region, rpm.created_at DESC
  ),
  performance_calculations AS (
    SELECT 
      lm.region,
      lm.health_status,
      -- Calculate composite performance score (0-100)
      GREATEST(0, LEAST(100,
        CASE 
          WHEN lm.avg_response_time_ms <= 500 THEN 100
          WHEN lm.avg_response_time_ms <= 1000 THEN 80
          WHEN lm.avg_response_time_ms <= 2000 THEN 60
          WHEN lm.avg_response_time_ms <= 5000 THEN 40
          ELSE 20
        END * 0.4 +  -- Response time weight: 40%
        CASE 
          WHEN lm.error_rate <= 0.1 THEN 100
          WHEN lm.error_rate <= 1 THEN 80
          WHEN lm.error_rate <= 5 THEN 60
          WHEN lm.error_rate <= 10 THEN 40
          ELSE 20
        END * 0.3 +  -- Error rate weight: 30%
        LEAST(100, lm.uptime_percent) * 0.2 +  -- Uptime weight: 20%
        LEAST(100, lm.cache_hit_rate) * 0.1    -- Cache hit rate weight: 10%
      ))::INTEGER as performance_score,
      lm.avg_response_time_ms,
      lm.error_rate,
      lm.cache_hit_rate
    FROM latest_metrics lm
  )
  SELECT 
    pc.region,
    pc.performance_score,
    pc.health_status,
    CASE 
      WHEN pc.performance_score >= 90 THEN 'A'
      WHEN pc.performance_score >= 80 THEN 'B'
      WHEN pc.performance_score >= 70 THEN 'C'
      WHEN pc.performance_score >= 60 THEN 'D'
      ELSE 'F'
    END as performance_grade,
    jsonb_build_array(
      CASE 
        WHEN pc.avg_response_time_ms > 1000 THEN 
          jsonb_build_object(
            'type', 'response_time',
            'priority', 'high',
            'recommendation', 'Optimize response time - currently ' || pc.avg_response_time_ms || 'ms'
          )
        ELSE NULL
      END,
      CASE 
        WHEN pc.error_rate > 1 THEN 
          jsonb_build_object(
            'type', 'error_rate',
            'priority', 'critical',
            'recommendation', 'Reduce error rate - currently ' || pc.error_rate || '%'
          )
        ELSE NULL
      END,
      CASE 
        WHEN pc.cache_hit_rate < 70 THEN 
          jsonb_build_object(
            'type', 'caching',
            'priority', 'medium',
            'recommendation', 'Improve cache strategy - hit rate is ' || pc.cache_hit_rate || '%'
          )
        ELSE NULL
      END
    ) - NULL as improvement_recommendations -- Remove null elements
  FROM performance_calculations pc
  ORDER BY pc.performance_score DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate optimization recommendations
CREATE OR REPLACE FUNCTION generate_optimization_recommendations(p_region TEXT DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
  recommendations JSONB;
  regional_issues JSONB;
  global_issues JSONB;
BEGIN
  -- Get regional-specific recommendations
  WITH regional_analysis AS (
    SELECT 
      region,
      avg_response_time_ms,
      error_rate,
      cache_hit_rate,
      cold_start_rate
    FROM regional_performance_metrics rpm
    WHERE (p_region IS NULL OR region = p_region)
      AND last_checked >= NOW() - INTERVAL '1 hour'
    ORDER BY last_checked DESC
    LIMIT 1
  )
  SELECT jsonb_agg(
    CASE 
      WHEN avg_response_time_ms > 1000 THEN
        jsonb_build_object(
          'category', 'performance',
          'priority', 'high',
          'title', 'High Response Time',
          'description', 'Average response time is ' || avg_response_time_ms || 'ms',
          'recommendations', jsonb_build_array(
            'Enable aggressive caching',
            'Implement connection pooling',
            'Consider function warming'
          )
        )
      WHEN avg_response_time_ms > 500 THEN
        jsonb_build_object(
          'category', 'performance',
          'priority', 'medium',
          'title', 'Moderate Response Time',
          'description', 'Response time could be improved from ' || avg_response_time_ms || 'ms',
          'recommendations', jsonb_build_array(
            'Optimize cache TTL',
            'Review function efficiency'
          )
        )
    END
  ) INTO regional_issues
  FROM regional_analysis
  WHERE avg_response_time_ms IS NOT NULL;

  -- Get global recommendations
  WITH global_analysis AS (
    SELECT 
      COUNT(DISTINCT region) as active_regions,
      AVG(avg_response_time_ms) as global_avg_response_time,
      AVG(error_rate) as global_error_rate,
      STDDEV(avg_response_time_ms) as response_time_variance
    FROM regional_performance_metrics
    WHERE last_checked >= NOW() - INTERVAL '1 hour'
  )
  SELECT jsonb_build_array(
    CASE 
      WHEN global_avg_response_time > 1000 THEN
        jsonb_build_object(
          'category', 'global_performance',
          'priority', 'high',
          'title', 'Global Performance Degradation',
          'description', 'Global average response time is ' || ROUND(global_avg_response_time) || 'ms',
          'recommendations', jsonb_build_array(
            'Implement global caching strategy',
            'Review regional load distribution',
            'Optimize cold start performance'
          )
        )
    END,
    CASE 
      WHEN response_time_variance > 500 THEN
        jsonb_build_object(
          'category', 'load_balancing',
          'priority', 'medium',
          'title', 'High Performance Variation',
          'description', 'Large variation in regional performance detected',
          'recommendations', jsonb_build_array(
            'Implement weighted load balancing',
            'Review regional capacity',
            'Consider traffic routing optimization'
          )
        )
    END
  ) INTO global_issues
  FROM global_analysis;

  -- Combine recommendations
  recommendations := COALESCE(regional_issues, '[]'::jsonb) || COALESCE(global_issues, '[]'::jsonb);
  
  RETURN jsonb_build_object(
    'timestamp', NOW(),
    'region_scope', COALESCE(p_region, 'global'),
    'recommendations', recommendations,
    'total_count', jsonb_array_length(recommendations)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to apply optimization configuration
CREATE OR REPLACE FUNCTION apply_optimization_config(
  p_config_type TEXT,
  p_config_key TEXT,
  p_config_value JSONB,
  p_enabled BOOLEAN DEFAULT TRUE
) RETURNS BOOLEAN AS $$
DECLARE
  config_applied BOOLEAN := FALSE;
BEGIN
  -- Validate config type
  IF p_config_type NOT IN ('caching', 'cold_start', 'connection_pooling', 'load_balancing', 'global_settings') THEN
    RAISE EXCEPTION 'Invalid config type: %', p_config_type;
  END IF;
  
  -- Apply configuration
  INSERT INTO global_optimization_config (
    config_type,
    config_key,
    config_value,
    enabled,
    applied_at,
    last_modified_at
  ) VALUES (
    p_config_type,
    p_config_key,
    p_config_value,
    p_enabled,
    NOW(),
    NOW()
  )
  ON CONFLICT (config_type, config_key) DO UPDATE SET
    config_value = EXCLUDED.config_value,
    enabled = EXCLUDED.enabled,
    last_modified_at = NOW();
  
  config_applied := TRUE;
  
  -- Log the configuration change
  INSERT INTO regional_performance_metrics (
    region, 
    avg_response_time_ms, 
    error_rate, 
    throughput_rps, 
    health_status, 
    metadata
  ) VALUES (
    'global', 
    0, 
    0, 
    0, 
    'healthy',
    jsonb_build_object(
      'event_type', 'config_change',
      'config_type', p_config_type,
      'config_key', p_config_key,
      'applied', config_applied
    )
  );
  
  RETURN config_applied;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Global optimization reports indexes
CREATE INDEX IF NOT EXISTS idx_global_optimization_reports_id ON global_optimization_reports(optimization_id);
CREATE INDEX IF NOT EXISTS idx_global_optimization_reports_created ON global_optimization_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_global_optimization_reports_improvement ON global_optimization_reports(performance_improvement DESC);

-- Regional configuration indexes
CREATE INDEX IF NOT EXISTS idx_regional_config_region ON regional_config(region);
CREATE INDEX IF NOT EXISTS idx_regional_config_enabled ON regional_config(enabled);
CREATE INDEX IF NOT EXISTS idx_regional_config_priority ON regional_config(priority DESC);

-- Global optimization config indexes
CREATE INDEX IF NOT EXISTS idx_global_optimization_config_type ON global_optimization_config(config_type);
CREATE INDEX IF NOT EXISTS idx_global_optimization_config_enabled ON global_optimization_config(enabled);
CREATE INDEX IF NOT EXISTS idx_global_optimization_config_applied ON global_optimization_config(applied_at);

-- Regional performance metrics indexes
CREATE INDEX IF NOT EXISTS idx_regional_performance_metrics_region ON regional_performance_metrics(region);
CREATE INDEX IF NOT EXISTS idx_regional_performance_metrics_checked ON regional_performance_metrics(last_checked DESC);
CREATE INDEX IF NOT EXISTS idx_regional_performance_metrics_health ON regional_performance_metrics(health_status);
CREATE INDEX IF NOT EXISTS idx_regional_performance_metrics_response_time ON regional_performance_metrics(avg_response_time_ms);

-- Cache optimization tracking indexes
CREATE INDEX IF NOT EXISTS idx_cache_optimization_tracking_optimization_id ON cache_optimization_tracking(optimization_id);
CREATE INDEX IF NOT EXISTS idx_cache_optimization_tracking_type ON cache_optimization_tracking(cache_type);

-- Cold start optimization tracking indexes
CREATE INDEX IF NOT EXISTS idx_cold_start_optimization_tracking_optimization_id ON cold_start_optimization_tracking(optimization_id);
CREATE INDEX IF NOT EXISTS idx_cold_start_optimization_tracking_function ON cold_start_optimization_tracking(function_name);

-- Connection pool optimization tracking indexes
CREATE INDEX IF NOT EXISTS idx_connection_pool_optimization_tracking_optimization_id ON connection_pool_optimization_tracking(optimization_id);
CREATE INDEX IF NOT EXISTS idx_connection_pool_optimization_tracking_region ON connection_pool_optimization_tracking(region);

-- Load balancing optimization tracking indexes
CREATE INDEX IF NOT EXISTS idx_load_balancing_optimization_tracking_optimization_id ON load_balancing_optimization_tracking(optimization_id);
CREATE INDEX IF NOT EXISTS idx_load_balancing_optimization_tracking_strategy ON load_balancing_optimization_tracking(strategy);

-- Global deployment status indexes
CREATE INDEX IF NOT EXISTS idx_global_deployment_status_region ON global_deployment_status(region);
CREATE INDEX IF NOT EXISTS idx_global_deployment_status_function ON global_deployment_status(function_name);
CREATE INDEX IF NOT EXISTS idx_global_deployment_status_status ON global_deployment_status(deployment_status);
CREATE INDEX IF NOT EXISTS idx_global_deployment_status_time ON global_deployment_status(deployment_time DESC);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE global_optimization_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE regional_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_optimization_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE regional_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE cache_optimization_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE cold_start_optimization_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE connection_pool_optimization_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE load_balancing_optimization_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_deployment_status ENABLE ROW LEVEL SECURITY;

-- Admin-only access policies for global optimization
CREATE POLICY "Admins can manage global optimization reports" ON global_optimization_reports
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Service role can manage global optimization" ON global_optimization_reports
  FOR ALL USING (auth.role() = 'service_role');

-- Apply similar policies to all optimization tables
DO $$ 
DECLARE
  table_name TEXT;
  table_names TEXT[] := ARRAY[
    'regional_config',
    'global_optimization_config',
    'regional_performance_metrics',
    'cache_optimization_tracking',
    'cold_start_optimization_tracking',
    'connection_pool_optimization_tracking',
    'load_balancing_optimization_tracking',
    'global_deployment_status'
  ];
BEGIN
  FOREACH table_name IN ARRAY table_names LOOP
    EXECUTE format('
      CREATE POLICY "Admins can manage %1$s" ON %1$s
        FOR ALL USING (
          EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() AND role = ''admin''
          )
        );
      
      CREATE POLICY "Service role can manage %1$s" ON %1$s
        FOR ALL USING (auth.role() = ''service_role'');
    ', table_name);
  END LOOP;
END $$;

-- =====================================================
-- INITIAL REGIONAL CONFIGURATION
-- =====================================================

-- Insert default regional configurations
INSERT INTO regional_config (
  region, 
  region_name, 
  enabled, 
  priority, 
  latency_threshold, 
  error_rate_threshold,
  load_balancing_weight,
  caching_strategy,
  cold_start_optimization,
  connection_pooling
) VALUES
  ('us-east-1', 'US East (N. Virginia)', true, 8, 500, 0.5, 0.3, 'aggressive', true, 
   '{"maxConnections": 20, "idleTimeout": 300, "connectionTimeout": 30}'),
  ('us-west-1', 'US West (N. California)', true, 7, 600, 0.5, 0.25, 'aggressive', true,
   '{"maxConnections": 15, "idleTimeout": 300, "connectionTimeout": 30}'),
  ('eu-west-1', 'Europe (Ireland)', true, 6, 800, 1.0, 0.2, 'conservative', true,
   '{"maxConnections": 15, "idleTimeout": 300, "connectionTimeout": 30}'),
  ('ap-southeast-1', 'Asia Pacific (Singapore)', true, 5, 1000, 1.0, 0.15, 'conservative', true,
   '{"maxConnections": 10, "idleTimeout": 300, "connectionTimeout": 30}'),
  ('ap-northeast-1', 'Asia Pacific (Tokyo)', true, 4, 1200, 1.5, 0.1, 'conservative', true,
   '{"maxConnections": 10, "idleTimeout": 300, "connectionTimeout": 30}')
ON CONFLICT (region) DO NOTHING;

-- Insert default global optimization configurations
INSERT INTO global_optimization_config (
  config_type, 
  config_key, 
  config_value, 
  enabled
) VALUES
  ('caching', 'global_cache_strategy', '{"ttl": 3600, "compressionEnabled": true, "cacheKeys": ["user_settings", "product_catalog", "pricing_data"]}', true),
  ('cold_start', 'function_warming', '{"enabled": true, "warmupInterval": 15, "warmupFunctions": ["subscription-status", "webhook-handler", "quote-processor"]}', true),
  ('connection_pooling', 'database_pool', '{"enabled": true, "poolSize": 20, "maxIdleTime": 300, "healthCheckInterval": 60}', true),
  ('load_balancing', 'strategy', '{"strategy": "weighted", "healthCheckEnabled": true, "failoverEnabled": true, "timeout": 5000}', true),
  ('global_settings', 'performance_targets', '{"responseTime": 500, "errorRate": 0.1, "throughput": 100, "uptime": 99.9}', true)
ON CONFLICT (config_type, config_key) DO NOTHING;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_global_optimization_status TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_regional_performance_scores TO authenticated;
GRANT EXECUTE ON FUNCTION generate_optimization_recommendations TO authenticated;
GRANT EXECUTE ON FUNCTION apply_optimization_config TO authenticated;

-- Comments
COMMENT ON TABLE global_optimization_reports IS 'Comprehensive global optimization reports with regional performance analysis';
COMMENT ON TABLE regional_config IS 'Configuration settings for each supported region';
COMMENT ON TABLE global_optimization_config IS 'Global optimization settings for caching, cold start, etc.';
COMMENT ON TABLE regional_performance_metrics IS 'Real-time performance metrics from each region';
COMMENT ON TABLE cache_optimization_tracking IS 'Cache optimization impact tracking and analysis';
COMMENT ON TABLE cold_start_optimization_tracking IS 'Cold start optimization results and improvements';
COMMENT ON TABLE connection_pool_optimization_tracking IS 'Connection pooling optimization impact tracking';
COMMENT ON TABLE load_balancing_optimization_tracking IS 'Load balancing strategy optimization results';
COMMENT ON TABLE global_deployment_status IS 'Global deployment status tracking across all regions';