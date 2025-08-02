-- Add tables for Step 2.3 Edge Case Handling
-- This migration adds comprehensive tables for tracking and managing billing edge cases

-- =====================================================
-- EDGE CASE TRACKING TABLES
-- =====================================================

-- Main edge case events tracking
CREATE TABLE IF NOT EXISTS edge_case_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  event_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id TEXT,
  subscription_id TEXT,
  invoice_id TEXT,
  payment_method_id TEXT,
  handler_used TEXT NOT NULL,
  success BOOLEAN NOT NULL DEFAULT FALSE,
  actions TEXT[],
  next_steps TEXT[],
  error_message TEXT,
  context_metadata JSONB,
  result_metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment method failures tracking
CREATE TABLE IF NOT EXISTS payment_method_failures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_method_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  failure_type TEXT NOT NULL CHECK (failure_type IN ('expired', 'declined', 'invalid', 'authentication_required', 'processing_error')),
  failure_code TEXT,
  failure_message TEXT,
  retryable BOOLEAN DEFAULT FALSE,
  occurred_at TIMESTAMPTZ NOT NULL,
  resolved_at TIMESTAMPTZ,
  resolution_method TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment disputes tracking
CREATE TABLE IF NOT EXISTS payment_disputes (
  id TEXT PRIMARY KEY, -- Stripe dispute ID
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  charge_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL,
  evidence_due_by TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  last_event_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dispute evidence submissions
CREATE TABLE IF NOT EXISTS dispute_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id TEXT NOT NULL REFERENCES payment_disputes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  evidence_data JSONB NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscription changes tracking (for proration and plan changes)
CREATE TABLE IF NOT EXISTS subscription_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id TEXT,
  change_type TEXT NOT NULL CHECK (change_type IN ('plan_change', 'payment_succeeded', 'payment_failed', 'proration', 'cancellation', 'reactivation')),
  old_value JSONB,
  new_value JSONB,
  timestamp TIMESTAMPTZ NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User notifications for edge cases
CREATE TABLE IF NOT EXISTS user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- Admin alerts for critical edge cases
CREATE TABLE IF NOT EXISTS admin_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  resolved BOOLEAN DEFAULT FALSE,
  resolved_by TEXT,
  resolved_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Edge case analytics
CREATE TABLE IF NOT EXISTS edge_case_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  total_events INTEGER NOT NULL DEFAULT 0,
  successful_events INTEGER NOT NULL DEFAULT 0,
  success_rate NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  handler_breakdown JSONB,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scheduled follow-ups for edge cases
CREATE TABLE IF NOT EXISTS scheduled_follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  event_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  handler_used TEXT NOT NULL,
  next_steps TEXT[],
  scheduled_for TIMESTAMPTZ NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhook events tracking (for idempotency and debugging)
CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Edge case events indexes
CREATE INDEX IF NOT EXISTS idx_edge_case_events_user_id ON edge_case_events(user_id);
CREATE INDEX IF NOT EXISTS idx_edge_case_events_event_type ON edge_case_events(event_type);
CREATE INDEX IF NOT EXISTS idx_edge_case_events_created_at ON edge_case_events(created_at);
CREATE INDEX IF NOT EXISTS idx_edge_case_events_success ON edge_case_events(success);

-- Payment method failures indexes
CREATE INDEX IF NOT EXISTS idx_payment_method_failures_user_id ON payment_method_failures(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_method_failures_payment_method_id ON payment_method_failures(payment_method_id);
CREATE INDEX IF NOT EXISTS idx_payment_method_failures_occurred_at ON payment_method_failures(occurred_at);

-- Payment disputes indexes
CREATE INDEX IF NOT EXISTS idx_payment_disputes_user_id ON payment_disputes(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_disputes_status ON payment_disputes(status);
CREATE INDEX IF NOT EXISTS idx_payment_disputes_evidence_due_by ON payment_disputes(evidence_due_by);

-- Subscription changes indexes
CREATE INDEX IF NOT EXISTS idx_subscription_changes_user_id ON subscription_changes(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_changes_subscription_id ON subscription_changes(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_changes_change_type ON subscription_changes(change_type);
CREATE INDEX IF NOT EXISTS idx_subscription_changes_timestamp ON subscription_changes(timestamp);

-- User notifications indexes
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_read ON user_notifications(read) WHERE read = FALSE;
CREATE INDEX IF NOT EXISTS idx_user_notifications_created_at ON user_notifications(created_at);

-- Admin alerts indexes
CREATE INDEX IF NOT EXISTS idx_admin_alerts_resolved ON admin_alerts(resolved) WHERE resolved = FALSE;
CREATE INDEX IF NOT EXISTS idx_admin_alerts_severity ON admin_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_admin_alerts_created_at ON admin_alerts(created_at);

-- Scheduled follow-ups indexes
CREATE INDEX IF NOT EXISTS idx_scheduled_follow_ups_scheduled_for ON scheduled_follow_ups(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_scheduled_follow_ups_completed ON scheduled_follow_ups(completed) WHERE completed = FALSE;

-- Webhook events indexes
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_stripe_event_id ON stripe_webhook_events(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_processed ON stripe_webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_event_type ON stripe_webhook_events(event_type);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE edge_case_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_method_failures ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispute_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE edge_case_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;

-- Edge case events policies
CREATE POLICY "Users can view their own edge case events" ON edge_case_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage edge case events" ON edge_case_events
  FOR ALL USING (auth.role() = 'service_role');

-- Payment method failures policies
CREATE POLICY "Users can view their own payment method failures" ON payment_method_failures
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage payment method failures" ON payment_method_failures
  FOR ALL USING (auth.role() = 'service_role');

-- Payment disputes policies
CREATE POLICY "Users can view their own disputes" ON payment_disputes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own disputes" ON payment_disputes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage disputes" ON payment_disputes
  FOR ALL USING (auth.role() = 'service_role');

-- Dispute evidence policies
CREATE POLICY "Users can view their own dispute evidence" ON dispute_evidence
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can submit dispute evidence" ON dispute_evidence
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage dispute evidence" ON dispute_evidence
  FOR ALL USING (auth.role() = 'service_role');

-- Subscription changes policies
CREATE POLICY "Users can view their own subscription changes" ON subscription_changes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscription changes" ON subscription_changes
  FOR ALL USING (auth.role() = 'service_role');

-- User notifications policies
CREATE POLICY "Users can view their own notifications" ON user_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON user_notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage notifications" ON user_notifications
  FOR ALL USING (auth.role() = 'service_role');

-- Admin alerts policies (admin only)
CREATE POLICY "Service role can manage admin alerts" ON admin_alerts
  FOR ALL USING (auth.role() = 'service_role');

-- Edge case analytics policies (admin only)
CREATE POLICY "Service role can manage analytics" ON edge_case_analytics
  FOR ALL USING (auth.role() = 'service_role');

-- Scheduled follow-ups policies
CREATE POLICY "Service role can manage follow-ups" ON scheduled_follow_ups
  FOR ALL USING (auth.role() = 'service_role');

-- Webhook events policies (service only)
CREATE POLICY "Service role can manage webhook events" ON stripe_webhook_events
  FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- TRIGGERS FOR UPDATED_AT COLUMNS
-- =====================================================

CREATE TRIGGER update_edge_case_events_updated_at 
  BEFORE UPDATE ON edge_case_events 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_method_failures_updated_at 
  BEFORE UPDATE ON payment_method_failures 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_disputes_updated_at 
  BEFORE UPDATE ON payment_disputes 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_alerts_updated_at 
  BEFORE UPDATE ON admin_alerts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scheduled_follow_ups_updated_at 
  BEFORE UPDATE ON scheduled_follow_ups 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- STORED PROCEDURES FOR EDGE CASE MANAGEMENT
-- =====================================================

-- Function to get edge case summary for a user
CREATE OR REPLACE FUNCTION get_user_edge_case_summary(p_user_id UUID)
RETURNS TABLE (
  total_events INTEGER,
  successful_events INTEGER,
  failed_events INTEGER,
  recent_failures INTEGER,
  unread_notifications INTEGER,
  active_disputes INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*)::INTEGER FROM edge_case_events WHERE user_id = p_user_id),
    (SELECT COUNT(*)::INTEGER FROM edge_case_events WHERE user_id = p_user_id AND success = TRUE),
    (SELECT COUNT(*)::INTEGER FROM edge_case_events WHERE user_id = p_user_id AND success = FALSE),
    (SELECT COUNT(*)::INTEGER FROM edge_case_events WHERE user_id = p_user_id AND success = FALSE AND created_at >= NOW() - INTERVAL '7 days'),
    (SELECT COUNT(*)::INTEGER FROM user_notifications WHERE user_id = p_user_id AND read = FALSE),
    (SELECT COUNT(*)::INTEGER FROM payment_disputes WHERE user_id = p_user_id AND status IN ('warning_needs_response', 'needs_response'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE user_notifications 
  SET read = TRUE, read_at = NOW() 
  WHERE id = p_notification_id AND user_id = p_user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get pending admin alerts
CREATE OR REPLACE FUNCTION get_pending_admin_alerts()
RETURNS TABLE (
  id UUID,
  type TEXT,
  title TEXT,
  message TEXT,
  severity TEXT,
  created_at TIMESTAMPTZ,
  metadata JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.type,
    a.title,
    a.message,
    a.severity,
    a.created_at,
    a.metadata
  FROM admin_alerts a
  WHERE a.resolved = FALSE
  ORDER BY 
    CASE a.severity 
      WHEN 'critical' THEN 1
      WHEN 'high' THEN 2
      WHEN 'medium' THEN 3
      WHEN 'low' THEN 4
    END,
    a.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE edge_case_events IS 'Comprehensive tracking of all billing edge case events and their handling';
COMMENT ON TABLE payment_method_failures IS 'Tracking of payment method failures and recovery attempts';
COMMENT ON TABLE payment_disputes IS 'Payment disputes and chargebacks management';
COMMENT ON TABLE dispute_evidence IS 'Evidence submissions for payment disputes';
COMMENT ON TABLE subscription_changes IS 'Audit trail of subscription modifications and billing events';
COMMENT ON TABLE user_notifications IS 'User notifications for billing events and edge cases';
COMMENT ON TABLE admin_alerts IS 'Administrative alerts for critical billing issues requiring attention';
COMMENT ON TABLE edge_case_analytics IS 'Analytics and reporting for edge case handling performance';
COMMENT ON TABLE scheduled_follow_ups IS 'Scheduled follow-up actions for edge case resolution';
COMMENT ON TABLE stripe_webhook_events IS 'Webhook event tracking for idempotency and debugging';

COMMENT ON FUNCTION get_user_edge_case_summary IS 'Get comprehensive edge case summary for a user';
COMMENT ON FUNCTION mark_notification_read IS 'Mark a user notification as read';
COMMENT ON FUNCTION get_pending_admin_alerts IS 'Get all pending admin alerts ordered by severity';
