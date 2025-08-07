-- Sprint 3: Batch Jobs and Enhanced Webhook Monitoring
-- Migration: 20250808120000_create_batch_jobs_and_webhook_monitoring.sql
-- Description: Creates tables for batch job tracking and enhanced webhook monitoring

-- Batch jobs table for tracking bulk operations
CREATE TABLE IF NOT EXISTS batch_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  operation_type TEXT NOT NULL,
  total_items INTEGER NOT NULL DEFAULT 0,
  processed_items INTEGER NOT NULL DEFAULT 0,
  failed_items INTEGER NOT NULL DEFAULT 0,
  progress_percent INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  request_id TEXT NOT NULL,
  options JSONB DEFAULT '{}',
  error_details JSONB DEFAULT NULL,
  execution_time_ms INTEGER DEFAULT NULL,
  memory_usage_mb REAL DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ DEFAULT NULL
);

-- Enhanced webhook monitoring table
CREATE TABLE IF NOT EXISTS webhook_processing_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  processing_stage TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('started', 'in_progress', 'completed', 'failed', 'timeout', 'retrying')),
  handler_name TEXT,
  execution_time_ms INTEGER,
  database_queries INTEGER DEFAULT 0,
  api_calls_made INTEGER DEFAULT 0,
  error_message TEXT DEFAULT NULL,
  error_stack TEXT DEFAULT NULL,
  retry_attempt INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dead letter queue for failed webhook events
CREATE TABLE IF NOT EXISTS webhook_dead_letter_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL,
  failure_reason TEXT NOT NULL,
  failure_count INTEGER NOT NULL DEFAULT 1,
  first_failed_at TIMESTAMPTZ DEFAULT NOW(),
  last_failed_at TIMESTAMPTZ DEFAULT NOW(),
  last_error_message TEXT,
  last_error_stack TEXT,
  requires_manual_review BOOLEAN DEFAULT FALSE,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ DEFAULT NULL,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolution_notes TEXT DEFAULT NULL,
  metadata JSONB DEFAULT '{}'
);

-- Webhook audit trail for compliance and debugging
CREATE TABLE IF NOT EXISTS webhook_audit_trail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  signature_validated BOOLEAN NOT NULL,
  idempotency_checked BOOLEAN NOT NULL,
  handler_matched BOOLEAN NOT NULL,
  processing_started_at TIMESTAMPTZ NOT NULL,
  processing_completed_at TIMESTAMPTZ DEFAULT NULL,
  total_processing_time_ms INTEGER DEFAULT NULL,
  database_changes JSONB DEFAULT '{}', -- Records what database changes were made
  external_api_calls JSONB DEFAULT '{}', -- Records external API calls made
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- If webhook affects specific user
  ip_address INET DEFAULT NULL,
  user_agent TEXT DEFAULT NULL,
  request_headers JSONB DEFAULT '{}',
  response_status INTEGER DEFAULT NULL,
  response_body_summary TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance benchmarks for Sprint 3 goals
CREATE TABLE IF NOT EXISTS webhook_performance_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  baseline_time_ms INTEGER NOT NULL,
  target_time_ms INTEGER NOT NULL,
  current_avg_time_ms INTEGER DEFAULT NULL,
  improvement_percentage REAL GENERATED ALWAYS AS (
    CASE 
      WHEN baseline_time_ms > 0 AND current_avg_time_ms IS NOT NULL THEN
        ((baseline_time_ms - current_avg_time_ms)::REAL / baseline_time_ms::REAL) * 100
      ELSE NULL 
    END
  ) STORED,
  sample_size INTEGER DEFAULT 0,
  last_calculated_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_type)
);

-- =====================================================
-- FUNCTIONS FOR BATCH PROCESSING
-- =====================================================

-- Function to get batch job status
CREATE OR REPLACE FUNCTION get_batch_job_status(p_job_id UUID)
RETURNS TABLE(
  id UUID,
  operation_type TEXT,
  total_items INTEGER,
  processed_items INTEGER,
  failed_items INTEGER,
  progress_percent INTEGER,
  status TEXT,
  execution_time_ms INTEGER,
  created_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_summary TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bj.id,
    bj.operation_type,
    bj.total_items,
    bj.processed_items,
    bj.failed_items,
    bj.progress_percent,
    bj.status,
    bj.execution_time_ms,
    bj.created_at,
    bj.completed_at,
    CASE 
      WHEN bj.error_details IS NOT NULL THEN
        CONCAT('Failed items: ', bj.failed_items, ' | First error: ', bj.error_details->0->>'error')
      ELSE NULL
    END as error_summary
  FROM batch_jobs bj
  WHERE bj.id = p_job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old batch jobs
CREATE OR REPLACE FUNCTION cleanup_old_batch_jobs(p_days_old INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM batch_jobs 
  WHERE created_at < NOW() - INTERVAL '1 day' * p_days_old
    AND status IN ('completed', 'failed', 'cancelled');
    
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTIONS FOR WEBHOOK MONITORING
-- =====================================================

-- Function to record webhook processing stage
CREATE OR REPLACE FUNCTION record_webhook_stage(
  p_stripe_event_id TEXT,
  p_event_type TEXT,
  p_stage TEXT,
  p_status TEXT,
  p_handler_name TEXT DEFAULT NULL,
  p_execution_time_ms INTEGER DEFAULT NULL,
  p_database_queries INTEGER DEFAULT 0,
  p_api_calls INTEGER DEFAULT 0,
  p_error_message TEXT DEFAULT NULL,
  p_retry_attempt INTEGER DEFAULT 0,
  p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO webhook_processing_logs (
    stripe_event_id,
    event_type,
    processing_stage,
    status,
    handler_name,
    execution_time_ms,
    database_queries,
    api_calls_made,
    error_message,
    retry_attempt,
    metadata
  ) VALUES (
    p_stripe_event_id,
    p_event_type,
    p_stage,
    p_status,
    p_handler_name,
    p_execution_time_ms,
    p_database_queries,
    p_api_calls,
    p_error_message,
    p_retry_attempt,
    p_metadata
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to send webhook to dead letter queue
CREATE OR REPLACE FUNCTION send_to_dead_letter_queue(
  p_stripe_event_id TEXT,
  p_event_type TEXT,
  p_event_data JSONB,
  p_failure_reason TEXT,
  p_error_message TEXT DEFAULT NULL,
  p_error_stack TEXT DEFAULT NULL,
  p_requires_manual_review BOOLEAN DEFAULT FALSE
) RETURNS UUID AS $$
DECLARE
  dlq_id UUID;
  existing_record RECORD;
BEGIN
  -- Check if this event is already in the DLQ
  SELECT * INTO existing_record
  FROM webhook_dead_letter_queue
  WHERE stripe_event_id = p_stripe_event_id AND NOT resolved;
  
  IF existing_record IS NOT NULL THEN
    -- Update existing record
    UPDATE webhook_dead_letter_queue 
    SET 
      failure_count = failure_count + 1,
      last_failed_at = NOW(),
      last_error_message = p_error_message,
      last_error_stack = p_error_stack,
      requires_manual_review = p_requires_manual_review OR requires_manual_review
    WHERE id = existing_record.id
    RETURNING id INTO dlq_id;
  ELSE
    -- Create new record
    INSERT INTO webhook_dead_letter_queue (
      stripe_event_id,
      event_type,
      event_data,
      failure_reason,
      last_error_message,
      last_error_stack,
      requires_manual_review
    ) VALUES (
      p_stripe_event_id,
      p_event_type,
      p_event_data,
      p_failure_reason,
      p_error_message,
      p_error_stack,
      p_requires_manual_review
    ) RETURNING id INTO dlq_id;
  END IF;
  
  RETURN dlq_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get webhook performance summary
CREATE OR REPLACE FUNCTION get_webhook_performance_summary(
  p_event_type TEXT DEFAULT NULL,
  p_days_back INTEGER DEFAULT 7
) RETURNS TABLE(
  event_type TEXT,
  total_events BIGINT,
  avg_processing_time_ms REAL,
  success_rate REAL,
  retry_rate REAL,
  dead_letter_rate REAL,
  improvement_vs_baseline REAL
) AS $$
BEGIN
  RETURN QUERY
  WITH event_stats AS (
    SELECT 
      swe.event_type,
      COUNT(*) as total_events,
      AVG(wpl.execution_time_ms) as avg_time,
      COUNT(CASE WHEN swe.processed = true THEN 1 END)::REAL / COUNT(*)::REAL * 100 as success_rate,
      COUNT(CASE WHEN wpl.retry_attempt > 0 THEN 1 END)::REAL / COUNT(*)::REAL * 100 as retry_rate,
      COUNT(CASE WHEN wdlq.id IS NOT NULL THEN 1 END)::REAL / COUNT(*)::REAL * 100 as dlq_rate
    FROM stripe_webhook_events swe
    LEFT JOIN webhook_processing_logs wpl ON swe.stripe_event_id = wpl.stripe_event_id
    LEFT JOIN webhook_dead_letter_queue wdlq ON swe.stripe_event_id = wdlq.stripe_event_id
    WHERE swe.created_at >= NOW() - INTERVAL '1 day' * p_days_back
      AND (p_event_type IS NULL OR swe.event_type = p_event_type)
    GROUP BY swe.event_type
  )
  SELECT 
    es.event_type,
    es.total_events,
    es.avg_time::REAL,
    es.success_rate,
    es.retry_rate,
    es.dlq_rate,
    CASE 
      WHEN wpb.baseline_time_ms IS NOT NULL AND es.avg_time IS NOT NULL THEN
        ((wpb.baseline_time_ms - es.avg_time) / wpb.baseline_time_ms::REAL) * 100
      ELSE NULL
    END as improvement_vs_baseline
  FROM event_stats es
  LEFT JOIN webhook_performance_benchmarks wpb ON es.event_type = wpb.event_type
  ORDER BY es.total_events DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update performance benchmarks
CREATE OR REPLACE FUNCTION update_webhook_benchmarks() 
RETURNS VOID AS $$
DECLARE
  event_record RECORD;
BEGIN
  FOR event_record IN (
    SELECT 
      swe.event_type,
      AVG(wpl.execution_time_ms) as current_avg,
      COUNT(*) as sample_size
    FROM stripe_webhook_events swe
    JOIN webhook_processing_logs wpl ON swe.stripe_event_id = wpl.stripe_event_id
    WHERE swe.created_at >= NOW() - INTERVAL '7 days'
      AND wpl.execution_time_ms IS NOT NULL
      AND swe.processed = true
    GROUP BY swe.event_type
    HAVING COUNT(*) >= 10 -- Minimum sample size
  ) LOOP
    INSERT INTO webhook_performance_benchmarks (
      event_type,
      baseline_time_ms,
      target_time_ms,
      current_avg_time_ms,
      sample_size,
      last_calculated_at
    ) VALUES (
      event_record.event_type,
      500, -- Default baseline from Sprint 3 requirements
      200, -- Target from Sprint 3 requirements
      event_record.current_avg::INTEGER,
      event_record.sample_size::INTEGER,
      NOW()
    )
    ON CONFLICT (event_type) DO UPDATE SET
      current_avg_time_ms = EXCLUDED.current_avg_time_ms,
      sample_size = EXCLUDED.sample_size,
      last_calculated_at = EXCLUDED.last_calculated_at,
      updated_at = NOW();
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Batch jobs indexes
CREATE INDEX IF NOT EXISTS idx_batch_jobs_user_id ON batch_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_batch_jobs_status ON batch_jobs(status);
CREATE INDEX IF NOT EXISTS idx_batch_jobs_created_at ON batch_jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_batch_jobs_operation_type ON batch_jobs(operation_type);

-- Webhook processing logs indexes
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_id ON webhook_processing_logs(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_type ON webhook_processing_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_status ON webhook_processing_logs(status);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_processing_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_stage ON webhook_processing_logs(processing_stage);

-- Dead letter queue indexes
CREATE INDEX IF NOT EXISTS idx_webhook_dlq_event_id ON webhook_dead_letter_queue(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_dlq_resolved ON webhook_dead_letter_queue(resolved);
CREATE INDEX IF NOT EXISTS idx_webhook_dlq_manual_review ON webhook_dead_letter_queue(requires_manual_review);
CREATE INDEX IF NOT EXISTS idx_webhook_dlq_failure_count ON webhook_dead_letter_queue(failure_count);

-- Audit trail indexes
CREATE INDEX IF NOT EXISTS idx_webhook_audit_event_id ON webhook_audit_trail(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_audit_user_id ON webhook_audit_trail(user_id);
CREATE INDEX IF NOT EXISTS idx_webhook_audit_created_at ON webhook_audit_trail(created_at);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS
ALTER TABLE batch_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_processing_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_dead_letter_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_audit_trail ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_performance_benchmarks ENABLE ROW LEVEL SECURITY;

-- Batch jobs policies
CREATE POLICY "Users can view own batch jobs" ON batch_jobs
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own batch jobs" ON batch_jobs
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own batch jobs" ON batch_jobs
  FOR UPDATE USING (user_id = auth.uid());

-- Admin policies for webhook monitoring
CREATE POLICY "Admins can view webhook logs" ON webhook_processing_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Service role can manage webhook logs" ON webhook_processing_logs
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Admins can view dead letter queue" ON webhook_dead_letter_queue
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Service role can manage dead letter queue" ON webhook_dead_letter_queue
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Admins can view audit trail" ON webhook_audit_trail
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can view own audit entries" ON webhook_audit_trail
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Service role can manage audit trail" ON webhook_audit_trail
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Admins can view performance benchmarks" ON webhook_performance_benchmarks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- SCHEDULED CLEANUP JOBS
-- =====================================================

-- Trigger to automatically cleanup old logs (runs via cron extension if available)
CREATE OR REPLACE FUNCTION cleanup_webhook_monitoring_data()
RETURNS VOID AS $$
BEGIN
  -- Delete old webhook processing logs (keep 90 days)
  DELETE FROM webhook_processing_logs 
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  -- Delete resolved DLQ entries older than 30 days
  DELETE FROM webhook_dead_letter_queue 
  WHERE resolved = true AND resolved_at < NOW() - INTERVAL '30 days';
  
  -- Archive old audit trail entries (keep 1 year)
  DELETE FROM webhook_audit_trail 
  WHERE created_at < NOW() - INTERVAL '1 year';
  
  -- Clean up old batch jobs
  PERFORM cleanup_old_batch_jobs(30);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_batch_job_status TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_batch_jobs TO authenticated;
GRANT EXECUTE ON FUNCTION record_webhook_stage TO authenticated;
GRANT EXECUTE ON FUNCTION send_to_dead_letter_queue TO authenticated;
GRANT EXECUTE ON FUNCTION get_webhook_performance_summary TO authenticated;
GRANT EXECUTE ON FUNCTION update_webhook_benchmarks TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_webhook_monitoring_data TO authenticated;

-- Insert default performance benchmarks for Sprint 3
INSERT INTO webhook_performance_benchmarks (
  event_type,
  baseline_time_ms,
  target_time_ms
) VALUES
  ('customer.subscription.created', 500, 200),
  ('customer.subscription.updated', 500, 200),
  ('customer.subscription.deleted', 400, 150),
  ('checkout.session.completed', 600, 250),
  ('invoice.payment_succeeded', 300, 120),
  ('invoice.payment_failed', 300, 120),
  ('setup_intent.succeeded', 400, 160),
  ('payment_method.attached', 300, 120),
  ('product.created', 200, 80),
  ('product.updated', 200, 80),
  ('price.created', 200, 80),
  ('price.updated', 200, 80)
ON CONFLICT (event_type) DO NOTHING;

-- Comments
COMMENT ON TABLE batch_jobs IS 'Tracks bulk operations with progress and error handling';
COMMENT ON TABLE webhook_processing_logs IS 'Detailed logs of webhook processing stages for debugging';
COMMENT ON TABLE webhook_dead_letter_queue IS 'Failed webhook events requiring manual review or retry';
COMMENT ON TABLE webhook_audit_trail IS 'Complete audit trail of webhook processing for compliance';
COMMENT ON TABLE webhook_performance_benchmarks IS 'Performance targets and current metrics for Sprint 3 goals';