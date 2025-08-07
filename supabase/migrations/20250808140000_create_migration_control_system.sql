-- Sprint 4: Migration Control System
-- Migration: 20250808140000_create_migration_control_system.sql
-- Description: Creates comprehensive zero-downtime migration control infrastructure

-- =====================================================
-- MIGRATION CONTROL TABLES
-- =====================================================

-- Migration configuration table
CREATE TABLE IF NOT EXISTS migration_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  current_state TEXT NOT NULL CHECK (current_state IN (
    'preparation', 
    'traffic_5_percent', 
    'traffic_25_percent', 
    'traffic_50_percent', 
    'traffic_100_percent', 
    'completed', 
    'rolled_back', 
    'failed'
  )),
  target_traffic_percent INTEGER NOT NULL DEFAULT 0 CHECK (target_traffic_percent >= 0 AND target_traffic_percent <= 100),
  actual_traffic_percent INTEGER NOT NULL DEFAULT 0 CHECK (actual_traffic_percent >= 0 AND actual_traffic_percent <= 100),
  health_check_interval INTEGER NOT NULL DEFAULT 30000, -- milliseconds
  rollback_thresholds JSONB NOT NULL DEFAULT '{}',
  enabled_functions JSONB NOT NULL DEFAULT '[]',
  feature_flags JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migration metrics tracking
CREATE TABLE IF NOT EXISTS migration_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  migration_id UUID NOT NULL REFERENCES migration_config(id) ON DELETE CASCADE,
  current_phase TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ DEFAULT NULL,
  progress_percent INTEGER NOT NULL DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  health_score INTEGER NOT NULL DEFAULT 100 CHECK (health_score >= 0 AND health_score <= 100),
  traffic_split_percent INTEGER NOT NULL DEFAULT 0 CHECK (traffic_split_percent >= 0 AND traffic_split_percent <= 100),
  performance_improvement REAL NOT NULL DEFAULT 0,
  error_rate REAL NOT NULL DEFAULT 0,
  rollbacks_triggered INTEGER NOT NULL DEFAULT 0,
  active_alerts JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Edge Function health monitoring
CREATE TABLE IF NOT EXISTS edge_function_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'unhealthy')),
  response_time_ms INTEGER NOT NULL,
  error_rate REAL NOT NULL DEFAULT 0,
  last_checked TIMESTAMPTZ NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(function_name)
);

-- Migration rollbacks tracking
CREATE TABLE IF NOT EXISTS migration_rollbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  migration_id UUID NOT NULL REFERENCES migration_config(id) ON DELETE CASCADE,
  rollback_reason TEXT NOT NULL,
  rolled_back_from TEXT NOT NULL,
  rollback_time TIMESTAMPTZ NOT NULL,
  traffic_at_rollback INTEGER NOT NULL DEFAULT 0,
  recovery_time_ms INTEGER DEFAULT NULL,
  automatic BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Traffic routing configuration
CREATE TABLE IF NOT EXISTS traffic_routing_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  migration_id UUID NOT NULL REFERENCES migration_config(id) ON DELETE CASCADE,
  function_name TEXT NOT NULL,
  legacy_endpoint TEXT NOT NULL,
  edge_function_endpoint TEXT NOT NULL,
  traffic_percentage INTEGER NOT NULL DEFAULT 0 CHECK (traffic_percentage >= 0 AND traffic_percentage <= 100),
  routing_rules JSONB DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(migration_id, function_name)
);

-- Feature flags management
CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_name TEXT NOT NULL,
  flag_key TEXT NOT NULL,
  description TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  target_audience JSONB DEFAULT '{}', -- user segments, percentages, etc.
  conditions JSONB DEFAULT '{}', -- conditions for enabling
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(flag_key)
);

-- Performance benchmarks tracking
CREATE TABLE IF NOT EXISTS migration_performance_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  migration_id UUID NOT NULL REFERENCES migration_config(id) ON DELETE CASCADE,
  function_name TEXT NOT NULL,
  metric_type TEXT NOT NULL CHECK (metric_type IN (
    'response_time', 
    'error_rate', 
    'throughput', 
    'memory_usage', 
    'cold_start_time'
  )),
  baseline_value REAL NOT NULL,
  current_value REAL DEFAULT NULL,
  target_value REAL NOT NULL,
  improvement_percent REAL GENERATED ALWAYS AS (
    CASE 
      WHEN baseline_value > 0 AND current_value IS NOT NULL THEN
        ((baseline_value - current_value) / baseline_value) * 100
      ELSE NULL 
    END
  ) STORED,
  measurement_unit TEXT NOT NULL DEFAULT 'ms',
  sample_size INTEGER DEFAULT 0,
  last_measured_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- MIGRATION CONTROL FUNCTIONS
-- =====================================================

-- Function to get migration status with comprehensive metrics
CREATE OR REPLACE FUNCTION get_migration_status(p_migration_id UUID DEFAULT NULL)
RETURNS TABLE(
  migration_id UUID,
  current_state TEXT,
  progress_percent INTEGER,
  health_score INTEGER,
  traffic_split_percent INTEGER,
  performance_improvement REAL,
  error_rate REAL,
  active_alerts JSONB,
  function_health JSONB,
  rollback_count INTEGER,
  duration_minutes INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mc.id as migration_id,
    mc.current_state,
    mm.progress_percent,
    mm.health_score,
    mm.traffic_split_percent,
    mm.performance_improvement,
    mm.error_rate,
    mm.active_alerts,
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'function_name', efh.function_name,
          'status', efh.status,
          'response_time_ms', efh.response_time_ms,
          'error_rate', efh.error_rate,
          'last_checked', efh.last_checked
        )
      )
      FROM edge_function_health efh
      WHERE efh.last_checked >= NOW() - INTERVAL '5 minutes'
    ) as function_health,
    (
      SELECT COUNT(*)::INTEGER
      FROM migration_rollbacks mr
      WHERE mr.migration_id = mc.id
    ) as rollback_count,
    EXTRACT(EPOCH FROM (COALESCE(mm.end_time, NOW()) - mm.start_time))::INTEGER / 60 as duration_minutes
  FROM migration_config mc
  LEFT JOIN migration_metrics mm ON mc.id = mm.migration_id
  WHERE (p_migration_id IS NULL OR mc.id = p_migration_id)
    AND mc.current_state NOT IN ('completed', 'failed', 'rolled_back')
  ORDER BY mc.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if rollback should be triggered
CREATE OR REPLACE FUNCTION should_trigger_rollback(p_migration_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  config_record migration_config%ROWTYPE;
  health_check RECORD;
  rollback_needed BOOLEAN := FALSE;
BEGIN
  -- Get migration configuration
  SELECT * INTO config_record
  FROM migration_config
  WHERE id = p_migration_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Check error rate threshold
  SELECT AVG(error_rate) as avg_error_rate INTO health_check
  FROM edge_function_health
  WHERE last_checked >= NOW() - INTERVAL '5 minutes';
  
  IF health_check.avg_error_rate > (config_record.rollback_thresholds->>'errorRate')::REAL THEN
    rollback_needed := TRUE;
  END IF;
  
  -- Check response time threshold
  SELECT AVG(response_time_ms) as avg_response_time INTO health_check
  FROM edge_function_health
  WHERE last_checked >= NOW() - INTERVAL '5 minutes';
  
  IF health_check.avg_response_time > (500 * (config_record.rollback_thresholds->>'responseTimeMultiplier')::REAL) THEN
    rollback_needed := TRUE;
  END IF;
  
  -- Check for unhealthy functions
  SELECT COUNT(*) as unhealthy_count INTO health_check
  FROM edge_function_health
  WHERE status = 'unhealthy' 
    AND last_checked >= NOW() - INTERVAL '5 minutes';
  
  IF health_check.unhealthy_count > (config_record.rollback_thresholds->>'failureCount')::INTEGER THEN
    rollback_needed := TRUE;
  END IF;
  
  RETURN rollback_needed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to execute automatic rollback
CREATE OR REPLACE FUNCTION execute_automatic_rollback(
  p_migration_id UUID,
  p_reason TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  config_record migration_config%ROWTYPE;
BEGIN
  -- Get current configuration
  SELECT * INTO config_record
  FROM migration_config
  WHERE id = p_migration_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Update migration to rolled back state
  UPDATE migration_config
  SET 
    current_state = 'rolled_back',
    target_traffic_percent = 0,
    actual_traffic_percent = 0,
    updated_at = NOW()
  WHERE id = p_migration_id;
  
  -- Record rollback event
  INSERT INTO migration_rollbacks (
    migration_id,
    rollback_reason,
    rolled_back_from,
    rollback_time,
    traffic_at_rollback,
    automatic,
    metadata
  ) VALUES (
    p_migration_id,
    p_reason,
    config_record.current_state,
    NOW(),
    config_record.actual_traffic_percent,
    TRUE,
    jsonb_build_object(
      'triggered_by', 'automatic_monitoring',
      'rollback_thresholds', config_record.rollback_thresholds
    )
  );
  
  -- Update metrics
  UPDATE migration_metrics
  SET 
    current_phase = 'rolled_back',
    rollbacks_triggered = rollbacks_triggered + 1,
    updated_at = NOW()
  WHERE migration_id = p_migration_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update performance benchmarks
CREATE OR REPLACE FUNCTION update_migration_performance_benchmarks(
  p_migration_id UUID
) RETURNS VOID AS $$
DECLARE
  health_record RECORD;
BEGIN
  -- Update response time benchmarks
  FOR health_record IN (
    SELECT 
      function_name,
      AVG(response_time_ms) as avg_response_time,
      COUNT(*) as sample_count
    FROM edge_function_health
    WHERE last_checked >= NOW() - INTERVAL '1 hour'
    GROUP BY function_name
  ) LOOP
    INSERT INTO migration_performance_benchmarks (
      migration_id,
      function_name,
      metric_type,
      baseline_value,
      current_value,
      target_value,
      sample_size,
      last_measured_at
    ) VALUES (
      p_migration_id,
      health_record.function_name,
      'response_time',
      500, -- Sprint 3 baseline
      health_record.avg_response_time,
      200, -- Sprint 3 target
      health_record.sample_count,
      NOW()
    )
    ON CONFLICT (migration_id, function_name) 
    WHERE metric_type = 'response_time'
    DO UPDATE SET
      current_value = EXCLUDED.current_value,
      sample_size = EXCLUDED.sample_size,
      last_measured_at = EXCLUDED.last_measured_at;
  END LOOP;
  
  -- Update error rate benchmarks
  FOR health_record IN (
    SELECT 
      function_name,
      AVG(error_rate) as avg_error_rate,
      COUNT(*) as sample_count
    FROM edge_function_health
    WHERE last_checked >= NOW() - INTERVAL '1 hour'
    GROUP BY function_name
  ) LOOP
    INSERT INTO migration_performance_benchmarks (
      migration_id,
      function_name,
      metric_type,
      baseline_value,
      current_value,
      target_value,
      measurement_unit,
      sample_size,
      last_measured_at
    ) VALUES (
      p_migration_id,
      health_record.function_name,
      'error_rate',
      5.0, -- 5% baseline error rate
      health_record.avg_error_rate,
      0.1, -- 0.1% target error rate
      'percent',
      health_record.sample_count,
      NOW()
    )
    ON CONFLICT (migration_id, function_name) 
    WHERE metric_type = 'error_rate'
    DO UPDATE SET
      current_value = EXCLUDED.current_value,
      sample_size = EXCLUDED.sample_size,
      last_measured_at = EXCLUDED.last_measured_at;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for feature flag evaluation
CREATE OR REPLACE FUNCTION evaluate_feature_flag(
  p_flag_key TEXT,
  p_user_id UUID DEFAULT NULL,
  p_context JSONB DEFAULT '{}'
) RETURNS BOOLEAN AS $$
DECLARE
  flag_record feature_flags%ROWTYPE;
  user_context JSONB;
BEGIN
  -- Get feature flag
  SELECT * INTO flag_record
  FROM feature_flags
  WHERE flag_key = p_flag_key;
  
  IF NOT FOUND OR NOT flag_record.is_enabled THEN
    RETURN FALSE;
  END IF;
  
  -- Basic enabled check
  IF flag_record.target_audience = '{}' AND flag_record.conditions = '{}' THEN
    RETURN TRUE;
  END IF;
  
  -- TODO: Implement more sophisticated targeting logic
  -- For now, return the basic enabled status
  RETURN flag_record.is_enabled;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Migration config indexes
CREATE INDEX IF NOT EXISTS idx_migration_config_state ON migration_config(current_state);
CREATE INDEX IF NOT EXISTS idx_migration_config_created ON migration_config(created_at);

-- Migration metrics indexes
CREATE INDEX IF NOT EXISTS idx_migration_metrics_migration_id ON migration_metrics(migration_id);
CREATE INDEX IF NOT EXISTS idx_migration_metrics_phase ON migration_metrics(current_phase);
CREATE INDEX IF NOT EXISTS idx_migration_metrics_created ON migration_metrics(created_at);

-- Edge function health indexes
CREATE INDEX IF NOT EXISTS idx_edge_function_health_name ON edge_function_health(function_name);
CREATE INDEX IF NOT EXISTS idx_edge_function_health_status ON edge_function_health(status);
CREATE INDEX IF NOT EXISTS idx_edge_function_health_checked ON edge_function_health(last_checked);

-- Migration rollbacks indexes
CREATE INDEX IF NOT EXISTS idx_migration_rollbacks_migration_id ON migration_rollbacks(migration_id);
CREATE INDEX IF NOT EXISTS idx_migration_rollbacks_time ON migration_rollbacks(rollback_time);
CREATE INDEX IF NOT EXISTS idx_migration_rollbacks_automatic ON migration_rollbacks(automatic);

-- Traffic routing indexes
CREATE INDEX IF NOT EXISTS idx_traffic_routing_migration_id ON traffic_routing_config(migration_id);
CREATE INDEX IF NOT EXISTS idx_traffic_routing_function ON traffic_routing_config(function_name);
CREATE INDEX IF NOT EXISTS idx_traffic_routing_active ON traffic_routing_config(is_active);

-- Feature flags indexes
CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON feature_flags(flag_key);
CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON feature_flags(is_enabled);

-- Performance benchmarks indexes
CREATE INDEX IF NOT EXISTS idx_migration_benchmarks_migration_id ON migration_performance_benchmarks(migration_id);
CREATE INDEX IF NOT EXISTS idx_migration_benchmarks_function ON migration_performance_benchmarks(function_name);
CREATE INDEX IF NOT EXISTS idx_migration_benchmarks_type ON migration_performance_benchmarks(metric_type);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS
ALTER TABLE migration_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE migration_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE edge_function_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE migration_rollbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE traffic_routing_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE migration_performance_benchmarks ENABLE ROW LEVEL SECURITY;

-- Admin-only policies for migration control
CREATE POLICY "Admins can manage migration config" ON migration_config
  FOR ALL USING (
    public.is_admin()
  );

CREATE POLICY "Service role can manage migration config" ON migration_config
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Admins can view migration metrics" ON migration_metrics
  FOR SELECT USING (
    public.is_admin()
  );

CREATE POLICY "Service role can manage migration metrics" ON migration_metrics
  FOR ALL USING (auth.role() = 'service_role');

-- Similar policies for other tables
CREATE POLICY "Admins can view edge function health" ON edge_function_health
  FOR SELECT USING (
    public.is_admin()
  );

CREATE POLICY "Service role can manage edge function health" ON edge_function_health
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Admins can view migration rollbacks" ON migration_rollbacks
  FOR SELECT USING (
    public.is_admin()
  );

CREATE POLICY "Service role can manage migration rollbacks" ON migration_rollbacks
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Admins can manage traffic routing" ON traffic_routing_config
  FOR ALL USING (
    public.is_admin()
  );

CREATE POLICY "Service role can manage traffic routing" ON traffic_routing_config
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Admins can manage feature flags" ON feature_flags
  FOR ALL USING (
    public.is_admin()
  );

CREATE POLICY "Users can read enabled feature flags" ON feature_flags
  FOR SELECT USING (is_enabled = true);

CREATE POLICY "Service role can manage feature flags" ON feature_flags
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Admins can view performance benchmarks" ON migration_performance_benchmarks
  FOR SELECT USING (
    public.is_admin()
  );

CREATE POLICY "Service role can manage performance benchmarks" ON migration_performance_benchmarks
  FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- AUTOMATED MONITORING TRIGGERS
-- =====================================================

-- Function to check rollback conditions automatically
CREATE OR REPLACE FUNCTION check_rollback_conditions()
RETURNS TRIGGER AS $$
DECLARE
  active_migration UUID;
BEGIN
  -- Get active migration
  SELECT id INTO active_migration
  FROM migration_config
  WHERE current_state NOT IN ('completed', 'failed', 'rolled_back')
  LIMIT 1;
  
  IF active_migration IS NOT NULL THEN
    -- Check if rollback should be triggered
    IF should_trigger_rollback(active_migration) THEN
      PERFORM execute_automatic_rollback(
        active_migration, 
        'Automatic rollback triggered by health check failure'
      );
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for automatic rollback checking
CREATE TRIGGER trigger_check_rollback_conditions
  AFTER INSERT OR UPDATE ON edge_function_health
  FOR EACH ROW
  EXECUTE FUNCTION check_rollback_conditions();

-- =====================================================
-- INITIAL DATA AND CONFIGURATION
-- =====================================================

-- Insert default feature flags for migration control
INSERT INTO feature_flags (flag_name, flag_key, description, is_enabled) VALUES
  ('Edge Functions Migration', 'edge_functions_migration', 'Controls the overall Edge Functions migration process', false),
  ('Subscription Status Migration', 'subscription_status_migration', 'Controls migration of subscription status endpoints', false),
  ('Quote Processor Migration', 'quote_processor_migration', 'Controls migration of quote processing endpoints', false),
  ('PDF Generator Migration', 'pdf_generator_migration', 'Controls migration of PDF generation endpoints', false),
  ('Webhook Handler Migration', 'webhook_handler_migration', 'Controls migration of webhook processing', false),
  ('Batch Processor Migration', 'batch_processor_migration', 'Controls migration of batch operations', false)
ON CONFLICT (flag_key) DO NOTHING;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_migration_status TO authenticated;
GRANT EXECUTE ON FUNCTION should_trigger_rollback TO authenticated;
GRANT EXECUTE ON FUNCTION execute_automatic_rollback TO authenticated;
GRANT EXECUTE ON FUNCTION update_migration_performance_benchmarks TO authenticated;
GRANT EXECUTE ON FUNCTION evaluate_feature_flag TO authenticated;

-- Comments
COMMENT ON TABLE migration_config IS 'Configuration and state management for zero-downtime migrations';
COMMENT ON TABLE migration_metrics IS 'Real-time metrics and progress tracking for migrations';
COMMENT ON TABLE edge_function_health IS 'Health monitoring and status tracking for Edge Functions';
COMMENT ON TABLE migration_rollbacks IS 'Audit log of migration rollbacks with reasons and impact';
COMMENT ON TABLE traffic_routing_config IS 'Configuration for progressive traffic routing during migration';
COMMENT ON TABLE feature_flags IS 'Feature flag management for controlled rollouts';
COMMENT ON TABLE migration_performance_benchmarks IS 'Performance tracking against Sprint 3 targets';

-- Create initial indexes for optimal query performance
CREATE INDEX IF NOT EXISTS idx_migration_status_lookup 
  ON migration_config(current_state, created_at DESC) 
  WHERE current_state NOT IN ('completed', 'failed', 'rolled_back');

CREATE INDEX IF NOT EXISTS idx_health_check_recent 
  ON edge_function_health(last_checked DESC, status);