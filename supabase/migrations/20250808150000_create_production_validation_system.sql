-- Sprint 4: Production Validation System
-- Migration: 20250808150000_create_production_validation_system.sql
-- Description: Creates comprehensive production deployment validation infrastructure

-- =====================================================
-- PRODUCTION VALIDATION TABLES
-- =====================================================

-- Production validation reports
CREATE TABLE IF NOT EXISTS production_validation_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  validation_id TEXT NOT NULL UNIQUE,
  overall_status TEXT NOT NULL CHECK (overall_status IN ('pass', 'fail', 'warning')),
  overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  category_scores JSONB NOT NULL DEFAULT '{}',
  total_tests INTEGER NOT NULL DEFAULT 0,
  passed_tests INTEGER NOT NULL DEFAULT 0,
  failed_tests INTEGER NOT NULL DEFAULT 0,
  warning_tests INTEGER NOT NULL DEFAULT 0,
  skipped_tests INTEGER NOT NULL DEFAULT 0,
  critical_issues_count INTEGER NOT NULL DEFAULT 0,
  deployment_ready BOOLEAN NOT NULL DEFAULT FALSE,
  estimated_risk TEXT NOT NULL CHECK (estimated_risk IN ('low', 'medium', 'high', 'critical')),
  validation_results JSONB NOT NULL DEFAULT '[]',
  recommendations JSONB NOT NULL DEFAULT '[]',
  execution_time_ms INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Performance test results
CREATE TABLE IF NOT EXISTS performance_test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  validation_id TEXT NOT NULL REFERENCES production_validation_reports(validation_id) ON DELETE CASCADE,
  function_name TEXT NOT NULL,
  test_type TEXT NOT NULL CHECK (test_type IN (
    'response_time', 
    'throughput', 
    'cold_start', 
    'concurrent_requests', 
    'memory_usage', 
    'error_rate'
  )),
  baseline_value REAL NOT NULL,
  actual_value REAL NOT NULL,
  target_value REAL NOT NULL,
  improvement_percent REAL GENERATED ALWAYS AS (
    CASE 
      WHEN baseline_value > 0 THEN
        ((baseline_value - actual_value) / baseline_value) * 100
      ELSE NULL 
    END
  ) STORED,
  status TEXT NOT NULL CHECK (status IN ('pass', 'fail', 'warning', 'skip')),
  test_duration_ms INTEGER NOT NULL DEFAULT 0,
  sample_size INTEGER DEFAULT 1,
  test_details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Security validation results
CREATE TABLE IF NOT EXISTS security_validation_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  validation_id TEXT NOT NULL REFERENCES production_validation_reports(validation_id) ON DELETE CASCADE,
  security_category TEXT NOT NULL CHECK (security_category IN (
    'authentication', 
    'authorization', 
    'input_validation', 
    'cors_configuration', 
    'environment_security', 
    'rls_policies',
    'data_encryption'
  )),
  test_name TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
  status TEXT NOT NULL CHECK (status IN ('pass', 'fail', 'warning', 'skip')),
  vulnerability_details JSONB DEFAULT '{}',
  remediation_steps JSONB DEFAULT '[]',
  compliance_standards JSONB DEFAULT '[]', -- OWASP, SOC2, etc.
  test_evidence JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Load testing results
CREATE TABLE IF NOT EXISTS load_testing_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  validation_id TEXT NOT NULL REFERENCES production_validation_reports(validation_id) ON DELETE CASCADE,
  function_name TEXT NOT NULL,
  test_scenario TEXT NOT NULL,
  concurrent_users INTEGER NOT NULL DEFAULT 1,
  test_duration_seconds INTEGER NOT NULL DEFAULT 60,
  total_requests INTEGER NOT NULL DEFAULT 0,
  successful_requests INTEGER NOT NULL DEFAULT 0,
  failed_requests INTEGER NOT NULL DEFAULT 0,
  avg_response_time_ms REAL NOT NULL DEFAULT 0,
  min_response_time_ms REAL NOT NULL DEFAULT 0,
  max_response_time_ms REAL NOT NULL DEFAULT 0,
  p95_response_time_ms REAL NOT NULL DEFAULT 0,
  p99_response_time_ms REAL NOT NULL DEFAULT 0,
  requests_per_second REAL NOT NULL DEFAULT 0,
  error_rate REAL NOT NULL DEFAULT 0,
  cpu_usage_percent REAL DEFAULT NULL,
  memory_usage_mb REAL DEFAULT NULL,
  database_connections INTEGER DEFAULT NULL,
  test_status TEXT NOT NULL CHECK (test_status IN ('completed', 'failed', 'timeout', 'cancelled')),
  performance_degradation BOOLEAN DEFAULT FALSE,
  bottlenecks_identified JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Deployment readiness checks
CREATE TABLE IF NOT EXISTS deployment_readiness_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  validation_id TEXT NOT NULL REFERENCES production_validation_reports(validation_id) ON DELETE CASCADE,
  check_category TEXT NOT NULL CHECK (check_category IN (
    'code_quality', 
    'test_coverage', 
    'documentation', 
    'monitoring', 
    'alerting', 
    'backup_recovery', 
    'rollback_procedures',
    'compliance'
  )),
  check_name TEXT NOT NULL,
  required_for_deployment BOOLEAN NOT NULL DEFAULT TRUE,
  status TEXT NOT NULL CHECK (status IN ('pass', 'fail', 'warning', 'skip', 'not_applicable')),
  check_result JSONB DEFAULT '{}',
  automated BOOLEAN NOT NULL DEFAULT TRUE,
  last_checked TIMESTAMPTZ DEFAULT NOW(),
  next_check_due TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cost validation tracking
CREATE TABLE IF NOT EXISTS cost_validation_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  validation_id TEXT NOT NULL REFERENCES production_validation_reports(validation_id) ON DELETE CASCADE,
  cost_category TEXT NOT NULL CHECK (cost_category IN (
    'edge_functions', 
    'database', 
    'storage', 
    'bandwidth', 
    'external_apis', 
    'monitoring'
  )),
  baseline_cost_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
  projected_cost_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
  actual_cost_monthly DECIMAL(10,2) DEFAULT NULL,
  cost_reduction_percent REAL GENERATED ALWAYS AS (
    CASE 
      WHEN baseline_cost_monthly > 0 AND projected_cost_monthly > 0 THEN
        ((baseline_cost_monthly - projected_cost_monthly) / baseline_cost_monthly) * 100
      ELSE NULL 
    END
  ) STORED,
  cost_target_met BOOLEAN GENERATED ALWAYS AS (
    CASE 
      WHEN baseline_cost_monthly > 0 AND projected_cost_monthly > 0 THEN
        projected_cost_monthly <= baseline_cost_monthly * 0.4 -- 60% reduction target
      ELSE FALSE 
    END
  ) STORED,
  usage_metrics JSONB DEFAULT '{}',
  cost_breakdown JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Business metrics validation
CREATE TABLE IF NOT EXISTS business_metrics_validation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  validation_id TEXT NOT NULL REFERENCES production_validation_reports(validation_id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL,
  metric_category TEXT NOT NULL CHECK (metric_category IN (
    'performance', 
    'user_experience', 
    'reliability', 
    'scalability', 
    'cost_efficiency'
  )),
  baseline_value REAL NOT NULL,
  current_value REAL DEFAULT NULL,
  target_value REAL NOT NULL,
  improvement_percent REAL GENERATED ALWAYS AS (
    CASE 
      WHEN baseline_value > 0 AND current_value IS NOT NULL THEN
        ((current_value - baseline_value) / baseline_value) * 100
      ELSE NULL 
    END
  ) STORED,
  target_achieved BOOLEAN GENERATED ALWAYS AS (
    CASE 
      WHEN current_value IS NOT NULL THEN
        current_value >= target_value
      ELSE FALSE 
    END
  ) STORED,
  measurement_unit TEXT NOT NULL DEFAULT 'percent',
  data_source TEXT DEFAULT NULL,
  validation_method TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PRODUCTION VALIDATION FUNCTIONS
-- =====================================================

-- Function to get comprehensive validation status
CREATE OR REPLACE FUNCTION get_production_validation_status(
  p_validation_id TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE(
  validation_id TEXT,
  overall_status TEXT,
  overall_score INTEGER,
  deployment_ready BOOLEAN,
  estimated_risk TEXT,
  critical_issues INTEGER,
  performance_score INTEGER,
  security_score INTEGER,
  reliability_score INTEGER,
  business_score INTEGER,
  created_at TIMESTAMPTZ,
  validation_summary JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pvr.validation_id,
    pvr.overall_status,
    pvr.overall_score,
    pvr.deployment_ready,
    pvr.estimated_risk,
    pvr.critical_issues_count,
    (pvr.category_scores->>'performance')::INTEGER as performance_score,
    (pvr.category_scores->>'security')::INTEGER as security_score,
    (pvr.category_scores->>'reliability')::INTEGER as reliability_score,
    (pvr.category_scores->>'business_metrics')::INTEGER as business_score,
    pvr.created_at,
    jsonb_build_object(
      'total_tests', pvr.total_tests,
      'passed_tests', pvr.passed_tests,
      'failed_tests', pvr.failed_tests,
      'warning_tests', pvr.warning_tests,
      'execution_time_ms', pvr.execution_time_ms,
      'recommendations_count', jsonb_array_length(pvr.recommendations)
    ) as validation_summary
  FROM production_validation_reports pvr
  WHERE (p_validation_id IS NULL OR pvr.validation_id = p_validation_id)
  ORDER BY pvr.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate deployment readiness score
CREATE OR REPLACE FUNCTION calculate_deployment_readiness_score(p_validation_id TEXT)
RETURNS JSONB AS $$
DECLARE
  readiness_score INTEGER;
  critical_failures INTEGER;
  blocking_issues JSONB;
  recommendations JSONB;
BEGIN
  -- Count critical failures
  SELECT COUNT(*) INTO critical_failures
  FROM deployment_readiness_checks
  WHERE validation_id = p_validation_id
    AND required_for_deployment = TRUE
    AND status = 'fail';

  -- Calculate overall readiness score
  SELECT 
    CASE 
      WHEN COUNT(*) = 0 THEN 0
      ELSE ROUND((COUNT(*) FILTER (WHERE status = 'pass')::REAL / COUNT(*)::REAL) * 100)
    END INTO readiness_score
  FROM deployment_readiness_checks
  WHERE validation_id = p_validation_id
    AND required_for_deployment = TRUE;

  -- Get blocking issues
  SELECT jsonb_agg(
    jsonb_build_object(
      'check_name', check_name,
      'category', check_category,
      'result', check_result
    )
  ) INTO blocking_issues
  FROM deployment_readiness_checks
  WHERE validation_id = p_validation_id
    AND required_for_deployment = TRUE
    AND status = 'fail';

  -- Generate recommendations
  recommendations := jsonb_build_array();
  IF critical_failures > 0 THEN
    recommendations := recommendations || jsonb_build_array(
      format('Resolve %s critical deployment blockers before proceeding', critical_failures)
    );
  END IF;
  
  IF readiness_score < 90 THEN
    recommendations := recommendations || jsonb_build_array(
      'Improve deployment readiness score to above 90% before production deployment'
    );
  END IF;

  RETURN jsonb_build_object(
    'readiness_score', readiness_score,
    'critical_failures', critical_failures,
    'deployment_ready', critical_failures = 0 AND readiness_score >= 90,
    'blocking_issues', COALESCE(blocking_issues, '[]'::jsonb),
    'recommendations', recommendations
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate cost targets
CREATE OR REPLACE FUNCTION validate_cost_targets(p_validation_id TEXT)
RETURNS JSONB AS $$
DECLARE
  total_baseline DECIMAL(10,2);
  total_projected DECIMAL(10,2);
  cost_reduction REAL;
  target_met BOOLEAN;
  category_breakdown JSONB;
BEGIN
  -- Calculate total costs
  SELECT 
    SUM(baseline_cost_monthly),
    SUM(projected_cost_monthly)
  INTO total_baseline, total_projected
  FROM cost_validation_tracking
  WHERE validation_id = p_validation_id;

  -- Calculate cost reduction percentage
  cost_reduction := CASE 
    WHEN total_baseline > 0 THEN
      ((total_baseline - total_projected) / total_baseline) * 100
    ELSE 0
  END;

  -- Check if 60% cost reduction target is met
  target_met := cost_reduction >= 60;

  -- Get category breakdown
  SELECT jsonb_object_agg(
    cost_category,
    jsonb_build_object(
      'baseline', baseline_cost_monthly,
      'projected', projected_cost_monthly,
      'reduction_percent', cost_reduction_percent,
      'target_met', cost_target_met
    )
  ) INTO category_breakdown
  FROM cost_validation_tracking
  WHERE validation_id = p_validation_id;

  RETURN jsonb_build_object(
    'total_baseline_monthly', total_baseline,
    'total_projected_monthly', total_projected,
    'total_reduction_percent', cost_reduction,
    'target_met', target_met,
    'category_breakdown', COALESCE(category_breakdown, '{}'::jsonb),
    'savings_monthly', total_baseline - total_projected
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate performance report
CREATE OR REPLACE FUNCTION generate_performance_report(p_validation_id TEXT)
RETURNS JSONB AS $$
DECLARE
  performance_summary JSONB;
  function_performance JSONB;
  load_test_summary JSONB;
BEGIN
  -- Get performance test summary
  SELECT jsonb_build_object(
    'total_tests', COUNT(*),
    'passed_tests', COUNT(*) FILTER (WHERE status = 'pass'),
    'failed_tests', COUNT(*) FILTER (WHERE status = 'fail'),
    'average_improvement', ROUND(AVG(improvement_percent), 2)
  ) INTO performance_summary
  FROM performance_test_results
  WHERE validation_id = p_validation_id;

  -- Get function-specific performance
  SELECT jsonb_object_agg(
    function_name,
    jsonb_build_object(
      'response_time', jsonb_build_object(
        'actual', actual_value,
        'target', target_value,
        'improvement', improvement_percent,
        'status', status
      )
    )
  ) INTO function_performance
  FROM performance_test_results
  WHERE validation_id = p_validation_id
    AND test_type = 'response_time';

  -- Get load testing summary
  SELECT jsonb_build_object(
    'total_load_tests', COUNT(*),
    'successful_tests', COUNT(*) FILTER (WHERE test_status = 'completed'),
    'average_rps', ROUND(AVG(requests_per_second), 2),
    'average_response_time', ROUND(AVG(avg_response_time_ms), 2),
    'peak_concurrent_users', MAX(concurrent_users)
  ) INTO load_test_summary
  FROM load_testing_results
  WHERE validation_id = p_validation_id;

  RETURN jsonb_build_object(
    'performance_summary', COALESCE(performance_summary, '{}'::jsonb),
    'function_performance', COALESCE(function_performance, '{}'::jsonb),
    'load_test_summary', COALESCE(load_test_summary, '{}'::jsonb)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check security compliance
CREATE OR REPLACE FUNCTION check_security_compliance(p_validation_id TEXT)
RETURNS JSONB AS $$
DECLARE
  security_score INTEGER;
  critical_vulnerabilities INTEGER;
  compliance_status JSONB;
  vulnerability_summary JSONB;
BEGIN
  -- Calculate security score
  SELECT 
    CASE 
      WHEN COUNT(*) = 0 THEN 100
      ELSE ROUND((COUNT(*) FILTER (WHERE status = 'pass')::REAL / COUNT(*)::REAL) * 100)
    END INTO security_score
  FROM security_validation_results
  WHERE validation_id = p_validation_id;

  -- Count critical vulnerabilities
  SELECT COUNT(*) INTO critical_vulnerabilities
  FROM security_validation_results
  WHERE validation_id = p_validation_id
    AND status = 'fail'
    AND severity IN ('critical', 'high');

  -- Get compliance status by category
  SELECT jsonb_object_agg(
    security_category,
    jsonb_build_object(
      'tests', COUNT(*),
      'passed', COUNT(*) FILTER (WHERE status = 'pass'),
      'failed', COUNT(*) FILTER (WHERE status = 'fail'),
      'score', CASE 
        WHEN COUNT(*) = 0 THEN 100
        ELSE ROUND((COUNT(*) FILTER (WHERE status = 'pass')::REAL / COUNT(*)::REAL) * 100)
      END
    )
  ) INTO compliance_status
  FROM security_validation_results
  WHERE validation_id = p_validation_id
  GROUP BY security_category;

  -- Get vulnerability summary
  SELECT jsonb_agg(
    jsonb_build_object(
      'category', security_category,
      'test_name', test_name,
      'severity', severity,
      'status', status,
      'remediation_steps', remediation_steps
    )
  ) INTO vulnerability_summary
  FROM security_validation_results
  WHERE validation_id = p_validation_id
    AND status = 'fail';

  RETURN jsonb_build_object(
    'security_score', security_score,
    'critical_vulnerabilities', critical_vulnerabilities,
    'compliance_ready', critical_vulnerabilities = 0 AND security_score >= 95,
    'compliance_status', COALESCE(compliance_status, '{}'::jsonb),
    'vulnerabilities', COALESCE(vulnerability_summary, '[]'::jsonb)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Production validation reports indexes
CREATE INDEX IF NOT EXISTS idx_production_validation_reports_id ON production_validation_reports(validation_id);
CREATE INDEX IF NOT EXISTS idx_production_validation_reports_status ON production_validation_reports(overall_status);
CREATE INDEX IF NOT EXISTS idx_production_validation_reports_ready ON production_validation_reports(deployment_ready);
CREATE INDEX IF NOT EXISTS idx_production_validation_reports_created ON production_validation_reports(created_at DESC);

-- Performance test results indexes
CREATE INDEX IF NOT EXISTS idx_performance_test_results_validation_id ON performance_test_results(validation_id);
CREATE INDEX IF NOT EXISTS idx_performance_test_results_function ON performance_test_results(function_name);
CREATE INDEX IF NOT EXISTS idx_performance_test_results_type ON performance_test_results(test_type);
CREATE INDEX IF NOT EXISTS idx_performance_test_results_status ON performance_test_results(status);

-- Security validation results indexes
CREATE INDEX IF NOT EXISTS idx_security_validation_results_validation_id ON security_validation_results(validation_id);
CREATE INDEX IF NOT EXISTS idx_security_validation_results_category ON security_validation_results(security_category);
CREATE INDEX IF NOT EXISTS idx_security_validation_results_severity ON security_validation_results(severity);
CREATE INDEX IF NOT EXISTS idx_security_validation_results_status ON security_validation_results(status);

-- Load testing results indexes
CREATE INDEX IF NOT EXISTS idx_load_testing_results_validation_id ON load_testing_results(validation_id);
CREATE INDEX IF NOT EXISTS idx_load_testing_results_function ON load_testing_results(function_name);
CREATE INDEX IF NOT EXISTS idx_load_testing_results_status ON load_testing_results(test_status);

-- Deployment readiness checks indexes
CREATE INDEX IF NOT EXISTS idx_deployment_readiness_checks_validation_id ON deployment_readiness_checks(validation_id);
CREATE INDEX IF NOT EXISTS idx_deployment_readiness_checks_required ON deployment_readiness_checks(required_for_deployment);
CREATE INDEX IF NOT EXISTS idx_deployment_readiness_checks_status ON deployment_readiness_checks(status);

-- Cost validation tracking indexes
CREATE INDEX IF NOT EXISTS idx_cost_validation_tracking_validation_id ON cost_validation_tracking(validation_id);
CREATE INDEX IF NOT EXISTS idx_cost_validation_tracking_category ON cost_validation_tracking(cost_category);

-- Business metrics validation indexes
CREATE INDEX IF NOT EXISTS idx_business_metrics_validation_validation_id ON business_metrics_validation(validation_id);
CREATE INDEX IF NOT EXISTS idx_business_metrics_validation_category ON business_metrics_validation(metric_category);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE production_validation_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_validation_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE load_testing_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE deployment_readiness_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_validation_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_metrics_validation ENABLE ROW LEVEL SECURITY;

-- Admin-only access policies
CREATE POLICY "Admins can manage validation reports" ON production_validation_reports
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Service role can manage validation reports" ON production_validation_reports
  FOR ALL USING (auth.role() = 'service_role');

-- Apply similar policies to all validation tables
DO $$ 
DECLARE
  table_name TEXT;
  table_names TEXT[] := ARRAY[
    'performance_test_results',
    'security_validation_results', 
    'load_testing_results',
    'deployment_readiness_checks',
    'cost_validation_tracking',
    'business_metrics_validation'
  ];
BEGIN
  FOREACH table_name IN ARRAY table_names LOOP
    EXECUTE format('
      CREATE POLICY "Admins can view %1$s" ON %1$s
        FOR SELECT USING (
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
-- INITIAL DATA AND VALIDATION TEMPLATES
-- =====================================================

-- Insert default performance benchmarks
INSERT INTO performance_test_results (
  validation_id, function_name, test_type, baseline_value, actual_value, target_value, status
) VALUES 
  ('template', 'subscription-status', 'response_time', 500, 200, 200, 'pass'),
  ('template', 'quote-processor', 'response_time', 2500, 1200, 1200, 'pass'),
  ('template', 'quote-pdf-generator', 'response_time', 1800, 800, 800, 'pass'),
  ('template', 'webhook-handler', 'response_time', 500, 200, 200, 'pass'),
  ('template', 'batch-processor', 'response_time', 5000, 2000, 2000, 'pass'),
  ('template', 'webhook-monitor', 'response_time', 800, 300, 300, 'pass')
ON CONFLICT DO NOTHING;

-- Insert default security validation checks
INSERT INTO security_validation_results (
  validation_id, security_category, test_name, severity, status
) VALUES
  ('template', 'authentication', 'JWT Token Validation', 'critical', 'pass'),
  ('template', 'authorization', 'Admin Role Verification', 'critical', 'pass'),
  ('template', 'input_validation', 'SQL Injection Prevention', 'high', 'pass'),
  ('template', 'input_validation', 'XSS Prevention', 'high', 'pass'),
  ('template', 'cors_configuration', 'CORS Policy Validation', 'medium', 'pass'),
  ('template', 'environment_security', 'Secret Management', 'critical', 'pass'),
  ('template', 'rls_policies', 'Row Level Security', 'high', 'pass'),
  ('template', 'data_encryption', 'Data at Rest Encryption', 'medium', 'pass')
ON CONFLICT DO NOTHING;

-- Insert default deployment readiness checks
INSERT INTO deployment_readiness_checks (
  validation_id, check_category, check_name, required_for_deployment, status
) VALUES
  ('template', 'code_quality', 'TypeScript Type Safety', true, 'pass'),
  ('template', 'test_coverage', 'Unit Test Coverage >80%', true, 'pass'),
  ('template', 'documentation', 'API Documentation Complete', false, 'pass'),
  ('template', 'monitoring', 'Health Check Endpoints', true, 'pass'),
  ('template', 'alerting', 'Error Rate Alerting', true, 'pass'),
  ('template', 'backup_recovery', 'Database Backup Verified', true, 'pass'),
  ('template', 'rollback_procedures', 'Rollback Plan Tested', true, 'pass'),
  ('template', 'compliance', 'Security Compliance', true, 'pass')
ON CONFLICT DO NOTHING;

-- Insert default cost validation tracking
INSERT INTO cost_validation_tracking (
  validation_id, cost_category, baseline_cost_monthly, projected_cost_monthly
) VALUES
  ('template', 'edge_functions', 0.00, 10.00),
  ('template', 'database', 25.00, 25.00),
  ('template', 'storage', 5.00, 3.00),
  ('template', 'bandwidth', 15.00, 8.00),
  ('template', 'external_apis', 10.00, 10.00),
  ('template', 'monitoring', 15.00, 8.00)
ON CONFLICT DO NOTHING;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_production_validation_status TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_deployment_readiness_score TO authenticated;
GRANT EXECUTE ON FUNCTION validate_cost_targets TO authenticated;
GRANT EXECUTE ON FUNCTION generate_performance_report TO authenticated;
GRANT EXECUTE ON FUNCTION check_security_compliance TO authenticated;

-- Comments
COMMENT ON TABLE production_validation_reports IS 'Comprehensive production deployment validation reports';
COMMENT ON TABLE performance_test_results IS 'Performance testing results against Sprint 3 benchmarks';
COMMENT ON TABLE security_validation_results IS 'Security validation and vulnerability assessment results';
COMMENT ON TABLE load_testing_results IS 'Load testing results for scalability validation';
COMMENT ON TABLE deployment_readiness_checks IS 'Production deployment readiness validation checks';
COMMENT ON TABLE cost_validation_tracking IS 'Cost optimization target validation and tracking';
COMMENT ON TABLE business_metrics_validation IS 'Business impact metrics validation against targets';