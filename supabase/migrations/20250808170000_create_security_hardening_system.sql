-- Sprint 4: Security Hardening System
-- Migration: 20250808170000_create_security_hardening_system.sql
-- Description: Creates comprehensive security hardening infrastructure for production deployment

-- =====================================================
-- SECURITY HARDENING TABLES
-- =====================================================

-- Security scan reports
CREATE TABLE IF NOT EXISTS security_scan_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id TEXT NOT NULL UNIQUE,
  security_score INTEGER NOT NULL CHECK (security_score >= 0 AND security_score <= 100),
  total_tests INTEGER NOT NULL DEFAULT 0,
  passed_tests INTEGER NOT NULL DEFAULT 0,
  failed_tests INTEGER NOT NULL DEFAULT 0,
  warning_tests INTEGER NOT NULL DEFAULT 0,
  critical_issues INTEGER NOT NULL DEFAULT 0,
  high_issues INTEGER NOT NULL DEFAULT 0,
  medium_issues INTEGER NOT NULL DEFAULT 0,
  low_issues INTEGER NOT NULL DEFAULT 0,
  scan_results JSONB NOT NULL DEFAULT '[]',
  execution_time_ms INTEGER NOT NULL DEFAULT 0,
  scan_type TEXT NOT NULL DEFAULT 'comprehensive' CHECK (scan_type IN (
    'comprehensive', 
    'authentication', 
    'authorization', 
    'input_validation', 
    'data_protection', 
    'network_security', 
    'compliance'
  )),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Security incidents tracking
CREATE TABLE IF NOT EXISTS security_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'suspicious_activity',
    'failed_authentication',
    'unauthorized_access',
    'data_breach_attempt',
    'injection_attempt',
    'rate_limit_exceeded',
    'privilege_escalation',
    'configuration_change'
  )),
  threat_level TEXT NOT NULL CHECK (threat_level IN ('low', 'medium', 'high', 'critical')),
  source_ip INET DEFAULT NULL,
  user_agent TEXT DEFAULT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  function_name TEXT NOT NULL,
  request_path TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  response_action TEXT NOT NULL CHECK (response_action IN (
    'allowed', 
    'blocked', 
    'rate_limited', 
    'logged_only', 
    'escalated',
    'error_logged'
  )),
  resolved BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_at TIMESTAMPTZ DEFAULT NULL,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolution_notes TEXT DEFAULT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rate limiting tracking
CREATE TABLE IF NOT EXISTS rate_limit_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_ip INET NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  last_request TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  blocked_until TIMESTAMPTZ DEFAULT NULL,
  violation_count INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_ip)
);

-- Security configuration
CREATE TABLE IF NOT EXISTS security_configuration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_category TEXT NOT NULL CHECK (config_category IN (
    'rate_limiting',
    'ip_filtering',
    'threat_detection',
    'authentication',
    'data_protection',
    'compliance'
  )),
  config_key TEXT NOT NULL,
  config_value JSONB NOT NULL DEFAULT '{}',
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  last_modified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  last_modified_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(config_category, config_key)
);

-- Vulnerability assessments
CREATE TABLE IF NOT EXISTS vulnerability_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id TEXT NOT NULL UNIQUE,
  assessment_type TEXT NOT NULL CHECK (assessment_type IN (
    'automated_scan',
    'penetration_test',
    'code_review',
    'dependency_audit',
    'configuration_audit'
  )),
  severity TEXT NOT NULL CHECK (severity IN ('informational', 'low', 'medium', 'high', 'critical')),
  vulnerability_type TEXT NOT NULL,
  description TEXT NOT NULL,
  affected_component TEXT NOT NULL,
  remediation_steps JSONB NOT NULL DEFAULT '[]',
  cvss_score REAL DEFAULT NULL CHECK (cvss_score >= 0 AND cvss_score <= 10),
  cve_references JSONB DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'false_positive', 'accepted_risk')),
  discovered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ DEFAULT NULL,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'verified', 'false_positive')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Compliance tracking
CREATE TABLE IF NOT EXISTS compliance_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  framework TEXT NOT NULL CHECK (framework IN (
    'SOC2',
    'GDPR',
    'CCPA',
    'HIPAA',
    'PCI_DSS',
    'ISO_27001'
  )),
  control_id TEXT NOT NULL,
  control_description TEXT NOT NULL,
  implementation_status TEXT NOT NULL CHECK (implementation_status IN (
    'not_implemented',
    'partially_implemented',
    'implemented',
    'not_applicable'
  )),
  compliance_score INTEGER CHECK (compliance_score >= 0 AND compliance_score <= 100),
  evidence_links JSONB DEFAULT '[]',
  responsible_team TEXT DEFAULT NULL,
  last_audit_date TIMESTAMPTZ DEFAULT NULL,
  next_audit_due TIMESTAMPTZ DEFAULT NULL,
  findings JSONB DEFAULT '[]',
  remediation_plan JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(framework, control_id)
);

-- Audit log for security events
CREATE TABLE IF NOT EXISTS security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  event_category TEXT NOT NULL CHECK (event_category IN (
    'authentication',
    'authorization',
    'data_access',
    'configuration_change',
    'system_event',
    'security_event'
  )),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT DEFAULT NULL,
  source_ip INET DEFAULT NULL,
  user_agent TEXT DEFAULT NULL,
  resource_type TEXT DEFAULT NULL,
  resource_id TEXT DEFAULT NULL,
  action_performed TEXT NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('success', 'failure', 'partial')),
  details JSONB DEFAULT '{}',
  risk_level TEXT DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  function_name TEXT DEFAULT NULL,
  request_id TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Threat intelligence data
CREATE TABLE IF NOT EXISTS threat_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  indicator_type TEXT NOT NULL CHECK (indicator_type IN (
    'ip_address',
    'domain',
    'url',
    'file_hash',
    'email',
    'user_agent',
    'attack_pattern'
  )),
  indicator_value TEXT NOT NULL,
  threat_type TEXT NOT NULL CHECK (threat_type IN (
    'malware',
    'phishing',
    'c2',
    'scanner',
    'bot',
    'credential_stuffing',
    'ddos',
    'injection'
  )),
  confidence_level TEXT NOT NULL CHECK (confidence_level IN ('low', 'medium', 'high', 'very_high')),
  severity TEXT NOT NULL CHECK (severity IN ('informational', 'low', 'medium', 'high', 'critical')),
  description TEXT DEFAULT NULL,
  source TEXT NOT NULL,
  first_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  false_positive BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(indicator_type, indicator_value)
);

-- Security metrics aggregation
CREATE TABLE IF NOT EXISTS security_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
  metric_type TEXT NOT NULL CHECK (metric_type IN (
    'security_score',
    'incident_count',
    'vulnerability_count',
    'compliance_score',
    'threat_detection_rate',
    'false_positive_rate'
  )),
  metric_value REAL NOT NULL,
  metric_details JSONB DEFAULT '{}',
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(metric_date, metric_type)
);

-- =====================================================
-- SECURITY FUNCTIONS AND PROCEDURES
-- =====================================================

-- Function to check RLS status on tables
CREATE OR REPLACE FUNCTION check_rls_status()
RETURNS TABLE(
  table_schema TEXT,
  table_name TEXT,
  rls_enabled BOOLEAN,
  policy_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.table_schema::TEXT,
    t.table_name::TEXT,
    COALESCE(c.relrowsecurity, false) as rls_enabled,
    COUNT(p.polname)::INTEGER as policy_count
  FROM information_schema.tables t
  LEFT JOIN pg_class c ON c.relname = t.table_name
  LEFT JOIN pg_policy p ON p.polrelid = c.oid
  WHERE t.table_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
    AND t.table_type = 'BASE TABLE'
    AND t.table_schema IN ('public', 'auth')
  GROUP BY t.table_schema, t.table_name, c.relrowsecurity
  ORDER BY t.table_schema, t.table_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate security score
CREATE OR REPLACE FUNCTION calculate_security_score(p_scan_id TEXT)
RETURNS INTEGER AS $$
DECLARE
  scan_data RECORD;
  score INTEGER;
BEGIN
  SELECT 
    total_tests,
    passed_tests,
    failed_tests,
    warning_tests,
    critical_issues,
    high_issues
  INTO scan_data
  FROM security_scan_reports
  WHERE scan_id = p_scan_id;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Calculate weighted score
  -- Critical failures: -20 points each
  -- High failures: -10 points each
  -- Other failures: -5 points each
  -- Warnings: -2 points each
  -- Pass: +1 point each
  
  score := GREATEST(0, LEAST(100,
    (scan_data.passed_tests * 1) +
    (scan_data.warning_tests * -2) +
    ((scan_data.failed_tests - scan_data.critical_issues - scan_data.high_issues) * -5) +
    (scan_data.high_issues * -10) +
    (scan_data.critical_issues * -20)
  ));
  
  RETURN score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get security status overview
CREATE OR REPLACE FUNCTION get_security_status_overview()
RETURNS JSONB AS $$
DECLARE
  overview JSONB;
  latest_scan RECORD;
  active_incidents INTEGER;
  open_vulnerabilities INTEGER;
  compliance_scores JSONB;
BEGIN
  -- Get latest security scan
  SELECT * INTO latest_scan
  FROM security_scan_reports
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Get active incidents count
  SELECT COUNT(*) INTO active_incidents
  FROM security_incidents
  WHERE resolved = false
    AND threat_level IN ('high', 'critical')
    AND created_at >= NOW() - INTERVAL '24 hours';
  
  -- Get open vulnerabilities count
  SELECT COUNT(*) INTO open_vulnerabilities
  FROM vulnerability_assessments
  WHERE status = 'open'
    AND severity IN ('high', 'critical');
  
  -- Get compliance scores
  SELECT jsonb_object_agg(framework, avg_score) INTO compliance_scores
  FROM (
    SELECT 
      framework,
      ROUND(AVG(compliance_score)) as avg_score
    FROM compliance_tracking
    WHERE implementation_status IN ('implemented', 'partially_implemented')
    GROUP BY framework
  ) scores;
  
  overview := jsonb_build_object(
    'last_scan', CASE 
      WHEN latest_scan.scan_id IS NOT NULL THEN
        jsonb_build_object(
          'scan_id', latest_scan.scan_id,
          'security_score', latest_scan.security_score,
          'critical_issues', latest_scan.critical_issues,
          'high_issues', latest_scan.high_issues,
          'scan_date', latest_scan.created_at
        )
      ELSE NULL
    END,
    'active_incidents', active_incidents,
    'open_vulnerabilities', open_vulnerabilities,
    'compliance_scores', COALESCE(compliance_scores, '{}'::jsonb),
    'overall_status', CASE
      WHEN latest_scan.critical_issues > 0 OR active_incidents > 0 OR open_vulnerabilities > 5 THEN 'critical'
      WHEN latest_scan.high_issues > 2 OR active_incidents > 0 OR open_vulnerabilities > 2 THEN 'high'
      WHEN latest_scan.security_score < 80 OR open_vulnerabilities > 0 THEN 'medium'
      ELSE 'low'
    END,
    'last_updated', NOW()
  );
  
  RETURN overview;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
  p_event_type TEXT,
  p_threat_level TEXT,
  p_user_id UUID,
  p_source_ip INET,
  p_function_name TEXT,
  p_details JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  incident_id UUID;
BEGIN
  INSERT INTO security_incidents (
    incident_id,
    event_type,
    threat_level,
    user_id,
    source_ip,
    function_name,
    request_path,
    payload,
    response_action,
    resolved
  ) VALUES (
    gen_random_uuid(),
    p_event_type,
    p_threat_level,
    p_user_id,
    p_source_ip,
    p_function_name,
    COALESCE(p_details->>'request_path', ''),
    p_details,
    COALESCE(p_details->>'response_action', 'logged_only'),
    false
  ) RETURNING id INTO incident_id;
  
  RETURN incident_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update security metrics
CREATE OR REPLACE FUNCTION update_security_metrics() 
RETURNS VOID AS $$
DECLARE
  metric_date DATE := CURRENT_DATE;
  latest_scan RECORD;
  incident_count INTEGER;
  vuln_count INTEGER;
  avg_compliance REAL;
BEGIN
  -- Get latest security scan score
  SELECT security_score INTO latest_scan
  FROM security_scan_reports
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Count recent incidents
  SELECT COUNT(*) INTO incident_count
  FROM security_incidents
  WHERE DATE(created_at) = metric_date;
  
  -- Count open vulnerabilities
  SELECT COUNT(*) INTO vuln_count
  FROM vulnerability_assessments
  WHERE status = 'open';
  
  -- Calculate average compliance score
  SELECT AVG(compliance_score) INTO avg_compliance
  FROM compliance_tracking
  WHERE implementation_status IN ('implemented', 'partially_implemented');
  
  -- Insert/update security metrics
  INSERT INTO security_metrics (metric_date, metric_type, metric_value) VALUES
    (metric_date, 'security_score', COALESCE(latest_scan.security_score, 0)),
    (metric_date, 'incident_count', incident_count),
    (metric_date, 'vulnerability_count', vuln_count),
    (metric_date, 'compliance_score', COALESCE(avg_compliance, 0))
  ON CONFLICT (metric_date, metric_type) DO UPDATE SET
    metric_value = EXCLUDED.metric_value,
    calculated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup old security data
CREATE OR REPLACE FUNCTION cleanup_security_data()
RETURNS VOID AS $$
BEGIN
  -- Clean up old resolved incidents (keep 1 year)
  DELETE FROM security_incidents 
  WHERE resolved = true 
    AND resolved_at < NOW() - INTERVAL '1 year';
  
  -- Clean up old rate limit tracking (keep 7 days)
  DELETE FROM rate_limit_tracking 
  WHERE last_request < NOW() - INTERVAL '7 days';
  
  -- Clean up old audit logs (keep 2 years)
  DELETE FROM security_audit_log 
  WHERE created_at < NOW() - INTERVAL '2 years';
  
  -- Clean up old security metrics (keep 3 years)
  DELETE FROM security_metrics 
  WHERE calculated_at < NOW() - INTERVAL '3 years';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Security scan reports indexes
CREATE INDEX IF NOT EXISTS idx_security_scan_reports_scan_id ON security_scan_reports(scan_id);
CREATE INDEX IF NOT EXISTS idx_security_scan_reports_created ON security_scan_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_scan_reports_score ON security_scan_reports(security_score);
CREATE INDEX IF NOT EXISTS idx_security_scan_reports_critical ON security_scan_reports(critical_issues DESC);

-- Security incidents indexes
CREATE INDEX IF NOT EXISTS idx_security_incidents_incident_id ON security_incidents(incident_id);
CREATE INDEX IF NOT EXISTS idx_security_incidents_event_type ON security_incidents(event_type);
CREATE INDEX IF NOT EXISTS idx_security_incidents_threat_level ON security_incidents(threat_level);
CREATE INDEX IF NOT EXISTS idx_security_incidents_resolved ON security_incidents(resolved);
CREATE INDEX IF NOT EXISTS idx_security_incidents_source_ip ON security_incidents(source_ip);
CREATE INDEX IF NOT EXISTS idx_security_incidents_user_id ON security_incidents(user_id);
CREATE INDEX IF NOT EXISTS idx_security_incidents_created ON security_incidents(created_at DESC);

-- Rate limiting indexes
CREATE INDEX IF NOT EXISTS idx_rate_limit_tracking_ip ON rate_limit_tracking(client_ip);
CREATE INDEX IF NOT EXISTS idx_rate_limit_tracking_last_request ON rate_limit_tracking(last_request DESC);

-- Security configuration indexes
CREATE INDEX IF NOT EXISTS idx_security_configuration_category ON security_configuration(config_category);
CREATE INDEX IF NOT EXISTS idx_security_configuration_enabled ON security_configuration(enabled);

-- Vulnerability assessments indexes
CREATE INDEX IF NOT EXISTS idx_vulnerability_assessments_id ON vulnerability_assessments(assessment_id);
CREATE INDEX IF NOT EXISTS idx_vulnerability_assessments_type ON vulnerability_assessments(assessment_type);
CREATE INDEX IF NOT EXISTS idx_vulnerability_assessments_severity ON vulnerability_assessments(severity);
CREATE INDEX IF NOT EXISTS idx_vulnerability_assessments_status ON vulnerability_assessments(status);
CREATE INDEX IF NOT EXISTS idx_vulnerability_assessments_component ON vulnerability_assessments(affected_component);

-- Compliance tracking indexes
CREATE INDEX IF NOT EXISTS idx_compliance_tracking_framework ON compliance_tracking(framework);
CREATE INDEX IF NOT EXISTS idx_compliance_tracking_status ON compliance_tracking(implementation_status);
CREATE INDEX IF NOT EXISTS idx_compliance_tracking_score ON compliance_tracking(compliance_score);

-- Audit log indexes
CREATE INDEX IF NOT EXISTS idx_security_audit_log_event_type ON security_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_category ON security_audit_log(event_category);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_user_id ON security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_timestamp ON security_audit_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_risk_level ON security_audit_log(risk_level);

-- Threat intelligence indexes
CREATE INDEX IF NOT EXISTS idx_threat_intelligence_type ON threat_intelligence(indicator_type);
CREATE INDEX IF NOT EXISTS idx_threat_intelligence_value ON threat_intelligence(indicator_value);
CREATE INDEX IF NOT EXISTS idx_threat_intelligence_active ON threat_intelligence(is_active);
CREATE INDEX IF NOT EXISTS idx_threat_intelligence_severity ON threat_intelligence(severity);

-- Security metrics indexes
CREATE INDEX IF NOT EXISTS idx_security_metrics_date ON security_metrics(metric_date DESC);
CREATE INDEX IF NOT EXISTS idx_security_metrics_type ON security_metrics(metric_type);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on security tables
ALTER TABLE security_scan_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_configuration ENABLE ROW LEVEL SECURITY;
ALTER TABLE vulnerability_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE threat_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_metrics ENABLE ROW LEVEL SECURITY;

-- Admin-only access policies for security data
CREATE POLICY "Admins can manage security scan reports" ON security_scan_reports
  FOR ALL USING (
    public.is_admin()
  );

CREATE POLICY "Service role can manage security data" ON security_scan_reports
  FOR ALL USING (auth.role() = 'service_role');

-- Apply similar policies to all security tables
DO $$ 
DECLARE
  table_name TEXT;
  table_names TEXT[] := ARRAY[
    'security_incidents',
    'rate_limit_tracking',
    'security_configuration',
    'vulnerability_assessments',
    'compliance_tracking',
    'security_audit_log',
    'threat_intelligence',
    'security_metrics'
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

-- Special policy for users to view their own security incidents
CREATE POLICY "Users can view own security incidents" ON security_incidents
  FOR SELECT USING (user_id = auth.uid());

-- =====================================================
-- TRIGGERS FOR AUTOMATION
-- =====================================================

-- Trigger to automatically update security metrics daily
CREATE OR REPLACE FUNCTION trigger_update_security_metrics()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_security_metrics();
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to log high-severity incidents to audit log
CREATE OR REPLACE FUNCTION trigger_log_security_incident()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.threat_level IN ('high', 'critical') THEN
    INSERT INTO security_audit_log (
      event_type,
      event_category,
      user_id,
      source_ip,
      action_performed,
      result,
      details,
      risk_level,
      function_name
    ) VALUES (
      NEW.event_type,
      'security_event',
      NEW.user_id,
      NEW.source_ip,
      NEW.event_type,
      CASE WHEN NEW.response_action = 'blocked' THEN 'success' ELSE 'failure' END,
      jsonb_build_object(
        'incident_id', NEW.incident_id,
        'threat_level', NEW.threat_level,
        'function_name', NEW.function_name
      ),
      NEW.threat_level,
      NEW.function_name
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply triggers
CREATE TRIGGER trigger_security_incident_audit
  AFTER INSERT ON security_incidents
  FOR EACH ROW
  EXECUTE FUNCTION trigger_log_security_incident();

-- =====================================================
-- INITIAL SECURITY CONFIGURATION
-- =====================================================

-- Insert default security configurations
INSERT INTO security_configuration (
  config_category, 
  config_key, 
  config_value, 
  enabled
) VALUES
  ('rate_limiting', 'global_settings', 
   '{"requestsPerMinute": 100, "burstLimit": 200, "blockDuration": 300}', true),
  ('threat_detection', 'global_settings', 
   '{"sqlInjectionDetection": true, "xssDetection": true, "commandInjectionDetection": true}', true),
  ('authentication', 'security_settings', 
   '{"requireMFA": false, "sessionTimeout": 14400, "maxFailedAttempts": 5, "accountLockoutDuration": 900}', true),
  ('data_protection', 'encryption_settings', 
   '{"encryptionAtRest": true, "encryptionInTransit": true, "dataAnonymization": false, "piiDetection": true}', true),
  ('compliance', 'frameworks', 
   '{"SOC2": true, "GDPR": true, "CCPA": true, "PCI_DSS": false, "HIPAA": false}', true)
ON CONFLICT (config_category, config_key) DO NOTHING;

-- Insert default compliance controls
INSERT INTO compliance_tracking (framework, control_id, control_description, implementation_status) VALUES
  ('SOC2', 'CC1.1', 'Entity demonstrates commitment to integrity and ethical values', 'implemented'),
  ('SOC2', 'CC2.1', 'Entity defines objectives and communicates them', 'implemented'),
  ('SOC2', 'CC3.1', 'Entity specifies objectives with sufficient clarity', 'implemented'),
  ('SOC2', 'CC6.1', 'Entity implements logical access security software', 'implemented'),
  ('SOC2', 'CC6.2', 'Entity implements access controls for data and systems', 'implemented'),
  ('GDPR', 'Art25', 'Data protection by design and by default', 'partially_implemented'),
  ('GDPR', 'Art32', 'Security of processing', 'implemented'),
  ('GDPR', 'Art33', 'Notification of data breach to supervisory authority', 'implemented'),
  ('GDPR', 'Art35', 'Data protection impact assessment', 'partially_implemented'),
  ('CCPA', 'Sec1798.100', 'Right to know about personal information collected', 'implemented'),
  ('CCPA', 'Sec1798.105', 'Right to delete personal information', 'implemented'),
  ('CCPA', 'Sec1798.110', 'Right to know about personal information sold or disclosed', 'implemented')
ON CONFLICT (framework, control_id) DO NOTHING;

-- Grant permissions
GRANT EXECUTE ON FUNCTION check_rls_status TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_security_score TO authenticated;
GRANT EXECUTE ON FUNCTION get_security_status_overview TO authenticated;
GRANT EXECUTE ON FUNCTION log_security_event TO authenticated;
GRANT EXECUTE ON FUNCTION update_security_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_security_data TO authenticated;

-- Comments
COMMENT ON TABLE security_scan_reports IS 'Comprehensive security scan results and analysis reports';
COMMENT ON TABLE security_incidents IS 'Security incidents tracking with threat level classification';
COMMENT ON TABLE rate_limit_tracking IS 'Rate limiting enforcement and tracking by client IP';
COMMENT ON TABLE security_configuration IS 'Security configuration settings for various categories';
COMMENT ON TABLE vulnerability_assessments IS 'Vulnerability assessment results and remediation tracking';
COMMENT ON TABLE compliance_tracking IS 'Compliance framework requirements and implementation status';
COMMENT ON TABLE security_audit_log IS 'Comprehensive audit log for security-related events';
COMMENT ON TABLE threat_intelligence IS 'Threat intelligence indicators and IOCs';
COMMENT ON TABLE security_metrics IS 'Aggregated security metrics for reporting and analysis';