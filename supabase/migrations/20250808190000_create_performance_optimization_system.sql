-- Sprint 4: Performance Optimization System
-- Migration: 20250808190000_create_performance_optimization_system.sql
-- Description: Creates comprehensive performance optimization and monitoring infrastructure

-- =====================================================
-- PERFORMANCE OPTIMIZATION TABLES
-- =====================================================

-- Performance optimization results
CREATE TABLE IF NOT EXISTS performance_optimizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  optimization_id TEXT NOT NULL UNIQUE,
  function_name TEXT NOT NULL,
  optimization_type TEXT NOT NULL CHECK (optimization_type IN (
    'cold_start',
    'warm_up',
    'memory_optimization',
    'connection_optimization',
    'cache_optimization',
    'query_optimization',
    'comprehensive'
  )),
  optimizations_applied JSONB NOT NULL DEFAULT '[]',
  results JSONB NOT NULL DEFAULT '{}',
  performance_before JSONB DEFAULT '{}',
  performance_after JSONB DEFAULT '{}',
  improvement_percentage REAL DEFAULT NULL,
  auto_applied BOOLEAN NOT NULL DEFAULT FALSE,
  execution_time_ms INTEGER NOT NULL DEFAULT 0,
  memory_usage_mb REAL DEFAULT NULL,
  success_rate REAL DEFAULT NULL CHECK (success_rate >= 0 AND success_rate <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance benchmarks
CREATE TABLE IF NOT EXISTS performance_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  benchmark_id TEXT NOT NULL UNIQUE,
  function_name TEXT NOT NULL,
  benchmark_type TEXT NOT NULL CHECK (benchmark_type IN (
    'cold_start',
    'warm_start', 
    'memory_stress',
    'connection_stress',
    'load_test',
    'comprehensive'
  )),
  config JSONB NOT NULL DEFAULT '{}',
  results JSONB NOT NULL DEFAULT '{}',
  performance_score INTEGER CHECK (performance_score >= 0 AND performance_score <= 100),
  baseline_comparison JSONB DEFAULT '{}',
  execution_time_ms INTEGER NOT NULL DEFAULT 0,
  test_duration_ms INTEGER NOT NULL DEFAULT 0,
  concurrency_level INTEGER NOT NULL DEFAULT 1,
  success_rate REAL DEFAULT NULL CHECK (success_rate >= 0 AND success_rate <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cold start optimization tracking
CREATE TABLE IF NOT EXISTS cold_start_optimizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  optimization_id TEXT NOT NULL UNIQUE,
  function_name TEXT NOT NULL,
  cold_start_time_before_ms INTEGER NOT NULL DEFAULT 0,
  cold_start_time_after_ms INTEGER NOT NULL DEFAULT 0,
  optimization_techniques JSONB NOT NULL DEFAULT '[]',
  preloaded_modules JSONB DEFAULT '[]',
  connection_prewarming BOOLEAN NOT NULL DEFAULT FALSE,
  memory_optimization BOOLEAN NOT NULL DEFAULT FALSE,
  execution_context_reuse BOOLEAN NOT NULL DEFAULT FALSE,
  improvement_ms INTEGER GENERATED ALWAYS AS (cold_start_time_before_ms - cold_start_time_after_ms) STORED,
  improvement_percentage REAL GENERATED ALWAYS AS (
    CASE 
      WHEN cold_start_time_before_ms > 0 
      THEN ((cold_start_time_before_ms - cold_start_time_after_ms)::REAL / cold_start_time_before_ms) * 100
      ELSE 0 
    END
  ) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Memory optimization tracking
CREATE TABLE IF NOT EXISTS memory_optimizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  optimization_id TEXT NOT NULL UNIQUE,
  function_name TEXT NOT NULL,
  memory_before_mb REAL NOT NULL DEFAULT 0,
  memory_after_mb REAL NOT NULL DEFAULT 0,
  optimization_techniques JSONB NOT NULL DEFAULT '[]',
  garbage_collection_performed BOOLEAN NOT NULL DEFAULT FALSE,
  cache_cleared BOOLEAN NOT NULL DEFAULT FALSE,
  module_unloading BOOLEAN NOT NULL DEFAULT FALSE,
  memory_saved_mb REAL GENERATED ALWAYS AS (memory_before_mb - memory_after_mb) STORED,
  memory_efficiency_score INTEGER CHECK (memory_efficiency_score >= 0 AND memory_efficiency_score <= 100),
  peak_memory_usage_mb REAL DEFAULT NULL,
  average_memory_usage_mb REAL DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance alerts and thresholds
CREATE TABLE IF NOT EXISTS performance_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id TEXT NOT NULL UNIQUE,
  function_name TEXT NOT NULL,
  alert_type TEXT NOT NULL CHECK (alert_type IN (
    'slow_cold_start',
    'high_memory_usage',
    'slow_execution',
    'high_error_rate',
    'performance_degradation',
    'optimization_opportunity'
  )),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  metric_name TEXT NOT NULL,
  threshold_value REAL NOT NULL,
  actual_value REAL NOT NULL,
  message TEXT NOT NULL,
  alert_details JSONB DEFAULT '{}',
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ DEFAULT NULL,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  alert_status TEXT NOT NULL DEFAULT 'active' CHECK (alert_status IN (
    'active',
    'acknowledged', 
    'resolved',
    'suppressed'
  )),
  auto_resolved BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance recommendations
CREATE TABLE IF NOT EXISTS performance_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_id TEXT NOT NULL UNIQUE,
  function_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'cold_start',
    'memory',
    'connections',
    'caching',
    'query_optimization',
    'architecture'
  )),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  recommended_actions JSONB NOT NULL DEFAULT '[]',
  expected_impact TEXT DEFAULT NULL,
  implementation_effort TEXT DEFAULT 'medium' CHECK (implementation_effort IN ('low', 'medium', 'high')),
  supporting_data JSONB DEFAULT '{}',
  current_performance JSONB DEFAULT '{}',
  expected_performance JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'reviewed',
    'approved',
    'implemented',
    'rejected',
    'obsolete'
  )),
  auto_generated BOOLEAN NOT NULL DEFAULT FALSE,
  confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ DEFAULT NULL,
  implemented_at TIMESTAMPTZ DEFAULT NULL
);

-- Performance baseline data
CREATE TABLE IF NOT EXISTS performance_baselines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name TEXT NOT NULL,
  environment TEXT NOT NULL CHECK (environment IN ('development', 'staging', 'production')),
  baseline_type TEXT NOT NULL CHECK (baseline_type IN (
    'cold_start',
    'warm_start',
    'memory_usage',
    'connection_time',
    'execution_time'
  )),
  baseline_value REAL NOT NULL,
  measurement_unit TEXT NOT NULL,
  confidence_interval JSONB DEFAULT '{}',
  sample_size INTEGER NOT NULL DEFAULT 1,
  measurement_period TSTZRANGE NOT NULL,
  conditions JSONB DEFAULT '{}',
  statistical_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(function_name, environment, baseline_type)
);

-- Performance test results
CREATE TABLE IF NOT EXISTS performance_test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id TEXT NOT NULL UNIQUE,
  function_name TEXT NOT NULL,
  test_type TEXT NOT NULL CHECK (test_type IN (
    'load_test',
    'stress_test',
    'spike_test',
    'volume_test',
    'endurance_test'
  )),
  test_config JSONB NOT NULL DEFAULT '{}',
  test_results JSONB NOT NULL DEFAULT '{}',
  performance_metrics JSONB NOT NULL DEFAULT '{}',
  pass_fail_criteria JSONB DEFAULT '{}',
  test_passed BOOLEAN DEFAULT NULL,
  test_duration_ms INTEGER NOT NULL DEFAULT 0,
  concurrent_users INTEGER NOT NULL DEFAULT 1,
  total_requests INTEGER NOT NULL DEFAULT 0,
  successful_requests INTEGER NOT NULL DEFAULT 0,
  failed_requests INTEGER NOT NULL DEFAULT 0,
  average_response_time_ms REAL DEFAULT NULL,
  p95_response_time_ms REAL DEFAULT NULL,
  throughput_rps REAL DEFAULT NULL,
  error_rate REAL DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function warm-up tracking
CREATE TABLE IF NOT EXISTS function_warmup_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name TEXT NOT NULL,
  warmup_strategy TEXT NOT NULL CHECK (warmup_strategy IN (
    'scheduled',
    'on_demand',
    'traffic_based',
    'predictive'
  )),
  warmup_frequency INTEGER NOT NULL DEFAULT 300, -- seconds
  last_warmup TIMESTAMPTZ DEFAULT NULL,
  warmup_duration_ms INTEGER DEFAULT NULL,
  warmup_success BOOLEAN DEFAULT NULL,
  warmup_details JSONB DEFAULT '{}',
  next_warmup TIMESTAMPTZ DEFAULT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(function_name)
);

-- =====================================================
-- PERFORMANCE FUNCTIONS AND PROCEDURES
-- =====================================================

-- Function to calculate performance improvement
CREATE OR REPLACE FUNCTION calculate_performance_improvement(
  p_before_value REAL,
  p_after_value REAL,
  p_improvement_direction TEXT DEFAULT 'lower' -- 'lower' means lower is better, 'higher' means higher is better
) RETURNS REAL AS $$
BEGIN
  IF p_before_value = 0 OR p_before_value IS NULL OR p_after_value IS NULL THEN
    RETURN NULL;
  END IF;
  
  IF p_improvement_direction = 'lower' THEN
    -- For metrics like execution time, memory usage where lower is better
    RETURN ((p_before_value - p_after_value) / p_before_value) * 100;
  ELSE
    -- For metrics like throughput where higher is better
    RETURN ((p_after_value - p_before_value) / p_before_value) * 100;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get performance baseline for comparison
CREATE OR REPLACE FUNCTION get_performance_baseline(
  p_function_name TEXT,
  p_environment TEXT,
  p_baseline_type TEXT
) RETURNS REAL AS $$
DECLARE
  baseline_value REAL;
BEGIN
  SELECT baseline_value INTO baseline_value
  FROM performance_baselines
  WHERE function_name = p_function_name
    AND environment = p_environment
    AND baseline_type = p_baseline_type;
  
  RETURN baseline_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update performance baseline
CREATE OR REPLACE FUNCTION update_performance_baseline(
  p_function_name TEXT,
  p_environment TEXT,
  p_baseline_type TEXT,
  p_baseline_value REAL,
  p_measurement_unit TEXT,
  p_sample_size INTEGER DEFAULT 1
) RETURNS VOID AS $$
BEGIN
  INSERT INTO performance_baselines (
    function_name,
    environment,
    baseline_type,
    baseline_value,
    measurement_unit,
    sample_size,
    measurement_period
  ) VALUES (
    p_function_name,
    p_environment,
    p_baseline_type,
    p_baseline_value,
    p_measurement_unit,
    p_sample_size,
    tstzrange(NOW() - INTERVAL '1 hour', NOW())
  )
  ON CONFLICT (function_name, environment, baseline_type) DO UPDATE SET
    baseline_value = EXCLUDED.baseline_value,
    measurement_unit = EXCLUDED.measurement_unit,
    sample_size = EXCLUDED.sample_size,
    measurement_period = EXCLUDED.measurement_period,
    created_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check performance thresholds and generate alerts
CREATE OR REPLACE FUNCTION check_performance_thresholds(
  p_function_name TEXT,
  p_metric_name TEXT,
  p_metric_value REAL
) RETURNS VOID AS $$
DECLARE
  threshold_record RECORD;
  alert_severity TEXT;
BEGIN
  -- Define performance thresholds
  FOR threshold_record IN
    SELECT 
      'slow_cold_start' as alert_type,
      'Cold Start Time' as metric_name,
      500.0 as warning_threshold,
      1000.0 as critical_threshold,
      'ms' as unit
    WHERE p_metric_name = 'cold_start_time_ms'
    
    UNION ALL
    
    SELECT 
      'high_memory_usage' as alert_type,
      'Memory Usage' as metric_name,
      100.0 as warning_threshold,
      150.0 as critical_threshold,
      'MB' as unit
    WHERE p_metric_name = 'memory_usage_mb'
    
    UNION ALL
    
    SELECT 
      'slow_execution' as alert_type,
      'Execution Time' as metric_name,
      5000.0 as warning_threshold,
      10000.0 as critical_threshold,
      'ms' as unit
    WHERE p_metric_name = 'execution_time_ms'
  LOOP
    -- Determine alert severity
    IF p_metric_value >= threshold_record.critical_threshold THEN
      alert_severity := 'critical';
    ELSIF p_metric_value >= threshold_record.warning_threshold THEN
      alert_severity := 'high';
    ELSE
      CONTINUE; -- No alert needed
    END IF;
    
    -- Create alert if one doesn't already exist for this function and metric
    INSERT INTO performance_alerts (
      alert_id,
      function_name,
      alert_type,
      severity,
      metric_name,
      threshold_value,
      actual_value,
      message,
      alert_details
    ) VALUES (
      threshold_record.alert_type || '_' || p_function_name || '_' || extract(epoch from now()),
      p_function_name,
      threshold_record.alert_type,
      alert_severity,
      threshold_record.metric_name,
      CASE WHEN alert_severity = 'critical' 
           THEN threshold_record.critical_threshold 
           ELSE threshold_record.warning_threshold 
      END,
      p_metric_value,
      format('%s exceeded threshold for %s: %.2f%s (threshold: %.2f%s)',
        threshold_record.metric_name,
        p_function_name,
        p_metric_value,
        threshold_record.unit,
        CASE WHEN alert_severity = 'critical' 
             THEN threshold_record.critical_threshold 
             ELSE threshold_record.warning_threshold 
        END,
        threshold_record.unit
      ),
      jsonb_build_object(
        'metric_name', p_metric_name,
        'threshold_type', alert_severity,
        'measurement_unit', threshold_record.unit
      )
    )
    ON CONFLICT (alert_id) DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate performance recommendations
CREATE OR REPLACE FUNCTION generate_performance_recommendations(
  p_function_name TEXT
) RETURNS VOID AS $$
DECLARE
  performance_data RECORD;
  recommendation_count INTEGER := 0;
BEGIN
  -- Get recent performance data for the function
  SELECT 
    AVG(CASE WHEN efp.metadata->>'is_cold_start' = 'true' 
        THEN efp.execution_time_ms END) as avg_cold_start_time,
    AVG(efp.execution_time_ms) as avg_execution_time,
    AVG(efp.memory_usage_mb) as avg_memory_usage,
    COUNT(*) as total_requests,
    COUNT(*) FILTER (WHERE efp.error_count > 0) as error_requests
  INTO performance_data
  FROM edge_function_performance efp
  WHERE efp.function_name = p_function_name
    AND efp.created_at >= NOW() - INTERVAL '24 hours';
  
  -- Cold start optimization recommendation
  IF performance_data.avg_cold_start_time > 500 THEN
    INSERT INTO performance_recommendations (
      recommendation_id,
      function_name,
      category,
      priority,
      title,
      description,
      recommended_actions,
      expected_impact,
      supporting_data,
      auto_generated,
      confidence_score
    ) VALUES (
      'cold_start_opt_' || p_function_name || '_' || extract(epoch from now()),
      p_function_name,
      'cold_start',
      CASE WHEN performance_data.avg_cold_start_time > 1000 THEN 'high' ELSE 'medium' END,
      'Optimize Cold Start Performance',
      format('Average cold start time is %.0fms, which exceeds recommended threshold', 
        performance_data.avg_cold_start_time),
      '["Enable module preloading", "Implement connection pre-warming", "Add execution context reuse", "Optimize memory layout"]',
      format('Reduce cold start time by 30-50%% (from %.0fms to ~%.0fms)', 
        performance_data.avg_cold_start_time, performance_data.avg_cold_start_time * 0.6),
      jsonb_build_object(
        'current_cold_start_time', performance_data.avg_cold_start_time,
        'target_cold_start_time', 500,
        'sample_size', performance_data.total_requests
      ),
      true,
      85
    )
    ON CONFLICT (recommendation_id) DO NOTHING;
    
    recommendation_count := recommendation_count + 1;
  END IF;
  
  -- Memory optimization recommendation
  IF performance_data.avg_memory_usage > 100 THEN
    INSERT INTO performance_recommendations (
      recommendation_id,
      function_name,
      category,
      priority,
      title,
      description,
      recommended_actions,
      expected_impact,
      supporting_data,
      auto_generated,
      confidence_score
    ) VALUES (
      'memory_opt_' || p_function_name || '_' || extract(epoch from now()),
      p_function_name,
      'memory',
      'medium',
      'Optimize Memory Usage',
      format('Average memory usage is %.1fMB, consider memory optimization', 
        performance_data.avg_memory_usage),
      '["Implement garbage collection", "Clear unnecessary caches", "Optimize data structures", "Enable memory pooling"]',
      'Reduce memory usage by 20-30% and improve performance',
      jsonb_build_object(
        'current_memory_usage', performance_data.avg_memory_usage,
        'target_memory_usage', 80,
        'sample_size', performance_data.total_requests
      ),
      true,
      75
    )
    ON CONFLICT (recommendation_id) DO NOTHING;
    
    recommendation_count := recommendation_count + 1;
  END IF;
  
  -- Error rate recommendation
  IF performance_data.total_requests > 0 AND 
     (performance_data.error_requests::REAL / performance_data.total_requests) > 0.02 THEN
    INSERT INTO performance_recommendations (
      recommendation_id,
      function_name,
      category,
      priority,
      title,
      description,
      recommended_actions,
      expected_impact,
      supporting_data,
      auto_generated,
      confidence_score
    ) VALUES (
      'error_rate_opt_' || p_function_name || '_' || extract(epoch from now()),
      p_function_name,
      'architecture',
      'high',
      'Address High Error Rate',
      format('Error rate is %.1f%%, which may indicate performance issues', 
        (performance_data.error_requests::REAL / performance_data.total_requests) * 100),
      '["Review error handling", "Implement retry logic", "Add circuit breakers", "Optimize database queries"]',
      'Reduce error rate and improve system reliability',
      jsonb_build_object(
        'current_error_rate', (performance_data.error_requests::REAL / performance_data.total_requests) * 100,
        'target_error_rate', 1.0,
        'total_requests', performance_data.total_requests,
        'error_requests', performance_data.error_requests
      ),
      true,
      90
    )
    ON CONFLICT (recommendation_id) DO NOTHING;
    
    recommendation_count := recommendation_count + 1;
  END IF;
  
  -- Log recommendation generation
  INSERT INTO performance_optimizations (
    optimization_id,
    function_name,
    optimization_type,
    optimizations_applied,
    results,
    auto_applied
  ) VALUES (
    'rec_gen_' || p_function_name || '_' || extract(epoch from now()),
    p_function_name,
    'comprehensive',
    jsonb_build_array('recommendation_generation'),
    jsonb_build_object(
      'recommendations_generated', recommendation_count,
      'analysis_date', NOW()
    ),
    true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup old performance data
CREATE OR REPLACE FUNCTION cleanup_performance_data()
RETURNS VOID AS $$
BEGIN
  -- Clean up old optimization records (keep 6 months)
  DELETE FROM performance_optimizations 
  WHERE created_at < NOW() - INTERVAL '6 months';
  
  -- Clean up old benchmark results (keep 1 year)
  DELETE FROM performance_benchmarks 
  WHERE created_at < NOW() - INTERVAL '1 year';
  
  -- Clean up resolved alerts (keep 3 months)
  DELETE FROM performance_alerts 
  WHERE alert_status = 'resolved' 
    AND resolved_at < NOW() - INTERVAL '3 months';
  
  -- Clean up implemented recommendations (keep 1 year)
  DELETE FROM performance_recommendations 
  WHERE status = 'implemented' 
    AND implemented_at < NOW() - INTERVAL '1 year';
  
  -- Clean up old test results (keep 6 months)
  DELETE FROM performance_test_results 
  WHERE created_at < NOW() - INTERVAL '6 months';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to schedule function warm-ups
CREATE OR REPLACE FUNCTION schedule_function_warmup(
  p_function_name TEXT,
  p_strategy TEXT DEFAULT 'scheduled',
  p_frequency INTEGER DEFAULT 300
) RETURNS VOID AS $$
BEGIN
  INSERT INTO function_warmup_tracking (
    function_name,
    warmup_strategy,
    warmup_frequency,
    next_warmup,
    enabled
  ) VALUES (
    p_function_name,
    p_strategy,
    p_frequency,
    NOW() + INTERVAL '1 second' * p_frequency,
    true
  )
  ON CONFLICT (function_name) DO UPDATE SET
    warmup_strategy = EXCLUDED.warmup_strategy,
    warmup_frequency = EXCLUDED.warmup_frequency,
    next_warmup = NOW() + INTERVAL '1 second' * EXCLUDED.warmup_frequency,
    enabled = EXCLUDED.enabled,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Performance optimizations indexes
CREATE INDEX IF NOT EXISTS idx_performance_optimizations_id ON performance_optimizations(optimization_id);
CREATE INDEX IF NOT EXISTS idx_performance_optimizations_function ON performance_optimizations(function_name);
CREATE INDEX IF NOT EXISTS idx_performance_optimizations_type ON performance_optimizations(optimization_type);
CREATE INDEX IF NOT EXISTS idx_performance_optimizations_created ON performance_optimizations(created_at DESC);

-- Performance benchmarks indexes
CREATE INDEX IF NOT EXISTS idx_performance_benchmarks_id ON performance_benchmarks(benchmark_id);
CREATE INDEX IF NOT EXISTS idx_performance_benchmarks_function ON performance_benchmarks(function_name);
CREATE INDEX IF NOT EXISTS idx_performance_benchmarks_type ON performance_benchmarks(benchmark_type);
CREATE INDEX IF NOT EXISTS idx_performance_benchmarks_score ON performance_benchmarks(performance_score DESC);

-- Cold start optimizations indexes
CREATE INDEX IF NOT EXISTS idx_cold_start_optimizations_function ON cold_start_optimizations(function_name);
CREATE INDEX IF NOT EXISTS idx_cold_start_optimizations_improvement ON cold_start_optimizations(improvement_percentage DESC);

-- Memory optimizations indexes
CREATE INDEX IF NOT EXISTS idx_memory_optimizations_function ON memory_optimizations(function_name);
CREATE INDEX IF NOT EXISTS idx_memory_optimizations_saved ON memory_optimizations(memory_saved_mb DESC);

-- Performance alerts indexes
CREATE INDEX IF NOT EXISTS idx_performance_alerts_function ON performance_alerts(function_name);
CREATE INDEX IF NOT EXISTS idx_performance_alerts_type ON performance_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_performance_alerts_status ON performance_alerts(alert_status);
CREATE INDEX IF NOT EXISTS idx_performance_alerts_severity ON performance_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_performance_alerts_triggered ON performance_alerts(triggered_at DESC);

-- Performance recommendations indexes
CREATE INDEX IF NOT EXISTS idx_performance_recommendations_function ON performance_recommendations(function_name);
CREATE INDEX IF NOT EXISTS idx_performance_recommendations_category ON performance_recommendations(category);
CREATE INDEX IF NOT EXISTS idx_performance_recommendations_priority ON performance_recommendations(priority);
CREATE INDEX IF NOT EXISTS idx_performance_recommendations_status ON performance_recommendations(status);

-- Performance baselines indexes
CREATE INDEX IF NOT EXISTS idx_performance_baselines_function_env ON performance_baselines(function_name, environment);
CREATE INDEX IF NOT EXISTS idx_performance_baselines_type ON performance_baselines(baseline_type);

-- Performance test results indexes
CREATE INDEX IF NOT EXISTS idx_performance_test_results_function ON performance_test_results(function_name);
CREATE INDEX IF NOT EXISTS idx_performance_test_results_type ON performance_test_results(test_type);
CREATE INDEX IF NOT EXISTS idx_performance_test_results_passed ON performance_test_results(test_passed);

-- Function warmup tracking indexes
CREATE INDEX IF NOT EXISTS idx_function_warmup_tracking_next ON function_warmup_tracking(next_warmup) WHERE enabled = true;
CREATE INDEX IF NOT EXISTS idx_function_warmup_tracking_strategy ON function_warmup_tracking(warmup_strategy);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on performance tables
ALTER TABLE performance_optimizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE cold_start_optimizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_optimizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_baselines ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE function_warmup_tracking ENABLE ROW LEVEL SECURITY;

-- Admin-only access policies for performance data
CREATE POLICY "Admins can manage performance optimizations" ON performance_optimizations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Service role can manage performance data" ON performance_optimizations
  FOR ALL USING (auth.role() = 'service_role');

-- Apply similar policies to all performance tables
DO $$ 
DECLARE
  table_name TEXT;
  table_names TEXT[] := ARRAY[
    'performance_benchmarks',
    'cold_start_optimizations',
    'memory_optimizations',
    'performance_alerts',
    'performance_recommendations',
    'performance_baselines',
    'performance_test_results',
    'function_warmup_tracking'
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
-- TRIGGERS FOR AUTOMATION
-- =====================================================

-- Trigger to automatically check performance thresholds
CREATE OR REPLACE FUNCTION trigger_check_performance_thresholds()
RETURNS TRIGGER AS $$
BEGIN
  -- Check cold start time
  IF NEW.metadata->>'is_cold_start' = 'true' THEN
    PERFORM check_performance_thresholds(
      NEW.function_name, 
      'cold_start_time_ms', 
      NEW.execution_time_ms
    );
  END IF;
  
  -- Check execution time
  PERFORM check_performance_thresholds(
    NEW.function_name, 
    'execution_time_ms', 
    NEW.execution_time_ms
  );
  
  -- Check memory usage
  IF NEW.memory_usage_mb IS NOT NULL THEN
    PERFORM check_performance_thresholds(
      NEW.function_name, 
      'memory_usage_mb', 
      NEW.memory_usage_mb
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_performance_threshold_check
  AFTER INSERT ON edge_function_performance
  FOR EACH ROW
  EXECUTE FUNCTION trigger_check_performance_thresholds();

-- Trigger to generate recommendations based on performance patterns
CREATE OR REPLACE FUNCTION trigger_generate_recommendations()
RETURNS TRIGGER AS $$
BEGIN
  -- Generate recommendations for functions with consistent performance issues
  IF random() < 0.1 THEN -- 10% chance to avoid too frequent recommendations
    PERFORM generate_performance_recommendations(NEW.function_name);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_performance_recommendations
  AFTER INSERT ON edge_function_performance
  FOR EACH ROW
  WHEN (NEW.execution_time_ms > 1000 OR NEW.error_count > 0)
  EXECUTE FUNCTION trigger_generate_recommendations();

-- =====================================================
-- INITIAL DATA AND CONFIGURATION
-- =====================================================

-- Insert default performance baselines for common functions
INSERT INTO performance_baselines (
  function_name, 
  environment, 
  baseline_type, 
  baseline_value, 
  measurement_unit,
  measurement_period,
  sample_size
) VALUES
  ('migration-controller', 'production', 'cold_start', 500.0, 'ms', tstzrange(NOW() - INTERVAL '1 day', NOW()), 100),
  ('production-validator', 'production', 'cold_start', 400.0, 'ms', tstzrange(NOW() - INTERVAL '1 day', NOW()), 100),
  ('security-hardening', 'production', 'cold_start', 300.0, 'ms', tstzrange(NOW() - INTERVAL '1 day', NOW()), 100),
  ('performance-optimizer', 'production', 'cold_start', 350.0, 'ms', tstzrange(NOW() - INTERVAL '1 day', NOW()), 100),
  ('monitoring-alerting', 'production', 'cold_start', 450.0, 'ms', tstzrange(NOW() - INTERVAL '1 day', NOW()), 100)
ON CONFLICT (function_name, environment, baseline_type) DO NOTHING;

-- Schedule warm-up for critical functions
SELECT schedule_function_warmup('migration-controller', 'scheduled', 300);
SELECT schedule_function_warmup('production-validator', 'scheduled', 600);
SELECT schedule_function_warmup('security-hardening', 'scheduled', 600);
SELECT schedule_function_warmup('monitoring-alerting', 'scheduled', 300);

-- Grant permissions
GRANT EXECUTE ON FUNCTION calculate_performance_improvement TO authenticated;
GRANT EXECUTE ON FUNCTION get_performance_baseline TO authenticated;
GRANT EXECUTE ON FUNCTION update_performance_baseline TO authenticated;
GRANT EXECUTE ON FUNCTION check_performance_thresholds TO authenticated;
GRANT EXECUTE ON FUNCTION generate_performance_recommendations TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_performance_data TO authenticated;
GRANT EXECUTE ON FUNCTION schedule_function_warmup TO authenticated;

-- Comments
COMMENT ON TABLE performance_optimizations IS 'Performance optimization results and tracking';
COMMENT ON TABLE performance_benchmarks IS 'Performance benchmark results and analysis';
COMMENT ON TABLE cold_start_optimizations IS 'Cold start optimization tracking and results';
COMMENT ON TABLE memory_optimizations IS 'Memory optimization tracking and efficiency metrics';
COMMENT ON TABLE performance_alerts IS 'Performance alerts and threshold violations';
COMMENT ON TABLE performance_recommendations IS 'Automated performance optimization recommendations';
COMMENT ON TABLE performance_baselines IS 'Performance baseline measurements for comparison';
COMMENT ON TABLE performance_test_results IS 'Load testing and performance test results';
COMMENT ON TABLE function_warmup_tracking IS 'Function warm-up scheduling and tracking';