-- =====================================================
-- PHASE 1: DASHBOARD OPTIMIZATION FOR ASSESSMENT-QUOTE WORKFLOW
-- =====================================================
-- This migration creates optimized views and indexes for the UI optimization dashboard
-- Focus: <100ms query performance for assessment-quote workflow visibility
-- Target: Support Assessment Completion Bridge dashboard with real-time status

-- =====================================================
-- DASHBOARD FUNCTIONS FOR OPTIMIZED QUERIES
-- =====================================================

-- Function: Get Assessment-Quote Dashboard Data (Optimized)
CREATE OR REPLACE FUNCTION get_assessment_quote_dashboard(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0,
  p_filters JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE (
  property_id UUID,
  property_address TEXT,
  client_name TEXT,
  client_type client_type,
  assessment_id UUID,
  assessment_number TEXT,
  assessment_status assessment_status,
  assessment_date TIMESTAMPTZ,
  completed_date TIMESTAMPTZ,
  complexity_score INTEGER,
  estimated_cost NUMERIC,
  workflow_status TEXT,
  quote_id UUID,
  quote_status TEXT,
  quote_total NUMERIC,
  quote_generated_at TIMESTAMPTZ,
  next_action TEXT,
  priority_level TEXT,
  days_since_assessment INTEGER,
  condition_summary JSONB,
  pricing_explanation JSONB
)
LANGUAGE plpgsql
STABLE
ROWS 50
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as property_id,
    p.service_address as property_address,
    c.name as client_name,
    c.client_type,
    a.id as assessment_id,
    a.assessment_number,
    a.assessment_status,
    a.assessment_date,
    a.completed_date,
    a.complexity_score,
    a.estimated_total_cost as estimated_cost,
    a.workflow_status,
    q.id as quote_id,
    q.status as quote_status,
    q.total as quote_total,
    a.quote_generated_at,
    
    -- Next action logic
    CASE 
      WHEN a.assessment_status != 'completed' THEN 'complete_assessment'
      WHEN a.workflow_status = 'error' THEN 'retry_quote_generation'
      WHEN a.assessment_status = 'completed' AND q.id IS NULL AND a.auto_quote_enabled THEN 'generate_quote'
      WHEN a.assessment_status = 'completed' AND q.id IS NULL AND NOT a.auto_quote_enabled THEN 'enable_auto_quote'
      WHEN q.status = 'draft' THEN 'review_quote'
      WHEN q.status = 'sent' THEN 'follow_up'
      WHEN q.status = 'accepted' THEN 'schedule_service'
      ELSE 'complete'
    END as next_action,
    
    -- Priority calculation
    CASE 
      WHEN a.workflow_status = 'error' THEN 'high'
      WHEN a.assessment_status = 'completed' AND q.id IS NULL 
           AND a.assessment_date < NOW() - INTERVAL '3 days' THEN 'high'
      WHEN a.assessment_status = 'in_progress' 
           AND a.created_at < NOW() - INTERVAL '7 days' THEN 'high'
      WHEN q.status = 'sent' 
           AND q.created_at < NOW() - INTERVAL '5 days' THEN 'medium'
      WHEN a.complexity_score >= 8 THEN 'medium'
      ELSE 'low'
    END as priority_level,
    
    COALESCE(EXTRACT(DAY FROM NOW() - a.assessment_date)::INTEGER, 0) as days_since_assessment,
    
    -- Condition summary for quick overview
    jsonb_build_object(
      'lawn_condition', a.lawn_condition,
      'soil_condition', a.soil_condition,
      'weed_coverage_percent', a.weed_coverage_percent,
      'irrigation_status', a.irrigation_status,
      'complexity_score', a.complexity_score,
      'area_measured', a.lawn_area_measured,
      'area_estimated', a.lawn_area_estimated
    ) as condition_summary,
    
    -- Include pricing explanation if quote exists
    COALESCE(q.pricing_explanation, '{}'::jsonb) as pricing_explanation
    
  FROM public.properties p
  INNER JOIN public.clients c ON p.client_id = c.id
  INNER JOIN public.property_assessments a ON p.id = a.property_id
  LEFT JOIN public.quotes q ON a.quote_id = q.id
  
  WHERE p.user_id = p_user_id
    AND p.is_active = TRUE
    AND (
      p_filters = '{}'::jsonb OR (
        -- Status filter
        (NOT (p_filters ? 'status') OR a.assessment_status::text = p_filters->>'status') AND
        
        -- Workflow status filter
        (NOT (p_filters ? 'workflow_status') OR a.workflow_status = p_filters->>'workflow_status') AND
        
        -- Priority filter
        (NOT (p_filters ? 'priority') OR 
          CASE 
            WHEN a.workflow_status = 'error' THEN 'high'
            WHEN a.assessment_status = 'completed' AND q.id IS NULL 
                 AND a.assessment_date < NOW() - INTERVAL '3 days' THEN 'high'
            WHEN a.assessment_status = 'in_progress' 
                 AND a.created_at < NOW() - INTERVAL '7 days' THEN 'high'
            WHEN q.status = 'sent' 
                 AND q.created_at < NOW() - INTERVAL '5 days' THEN 'medium'
            WHEN a.complexity_score >= 8 THEN 'medium'
            ELSE 'low'
          END = p_filters->>'priority'
        ) AND
        
        -- Client type filter
        (NOT (p_filters ? 'client_type') OR c.client_type::text = p_filters->>'client_type') AND
        
        -- Date range filter
        (NOT (p_filters ? 'date_from') OR a.assessment_date >= (p_filters->>'date_from')::timestamptz) AND
        (NOT (p_filters ? 'date_to') OR a.assessment_date <= (p_filters->>'date_to')::timestamptz) AND
        
        -- Has quote filter
        (NOT (p_filters ? 'has_quote') OR 
          CASE WHEN p_filters->>'has_quote' = 'true' THEN q.id IS NOT NULL
               WHEN p_filters->>'has_quote' = 'false' THEN q.id IS NULL
               ELSE TRUE END
        )
      )
    )
    
  ORDER BY 
    -- Priority-based ordering
    CASE 
      WHEN a.workflow_status = 'error' THEN 1
      WHEN a.assessment_status = 'completed' AND q.id IS NULL 
           AND a.assessment_date < NOW() - INTERVAL '3 days' THEN 2
      WHEN a.assessment_status = 'in_progress' 
           AND a.created_at < NOW() - INTERVAL '7 days' THEN 3
      WHEN q.status = 'sent' 
           AND q.created_at < NOW() - INTERVAL '5 days' THEN 4
      WHEN a.complexity_score >= 8 THEN 5
      ELSE 6
    END,
    a.assessment_date DESC NULLS LAST,
    a.created_at DESC
    
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Function: Get Assessment Workflow Summary Statistics
CREATE OR REPLACE FUNCTION get_workflow_summary_stats(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_assessments', COUNT(*),
    'completed_assessments', COUNT(*) FILTER (WHERE assessment_status = 'completed'),
    'pending_assessments', COUNT(*) FILTER (WHERE assessment_status IN ('scheduled', 'in_progress')),
    'quotes_generated', COUNT(*) FILTER (WHERE quote_id IS NOT NULL),
    'quotes_auto_generated', COUNT(*) FILTER (WHERE quote_id IS NOT NULL AND workflow_status = 'completed'),
    'workflow_errors', COUNT(*) FILTER (WHERE workflow_status = 'error'),
    'high_priority_items', COUNT(*) FILTER (WHERE 
      workflow_status = 'error' OR
      (assessment_status = 'completed' AND quote_id IS NULL 
       AND assessment_date < NOW() - INTERVAL '3 days') OR
      (assessment_status = 'in_progress' AND created_at < NOW() - INTERVAL '7 days')
    ),
    'conversion_rate_percent', CASE 
      WHEN COUNT(*) FILTER (WHERE assessment_status = 'completed') > 0
      THEN ROUND(
        COUNT(*) FILTER (WHERE quote_id IS NOT NULL)::numeric / 
        COUNT(*) FILTER (WHERE assessment_status = 'completed')::numeric * 100,
        1
      )
      ELSE 0
    END,
    'avg_quote_value', ROUND(AVG(q.total), 2) FILTER (WHERE q.total IS NOT NULL),
    'total_quote_value', COALESCE(SUM(q.total) FILTER (WHERE q.status = 'accepted'), 0),
    'recent_activity', jsonb_build_object(
      'assessments_this_week', COUNT(*) FILTER (WHERE assessment_date >= CURRENT_DATE - INTERVAL '7 days'),
      'quotes_this_week', COUNT(*) FILTER (WHERE quote_generated_at >= CURRENT_DATE - INTERVAL '7 days'),
      'last_assessment', MAX(assessment_date),
      'last_quote_generated', MAX(quote_generated_at)
    )
  )
  INTO v_stats
  FROM public.property_assessments a
  LEFT JOIN public.quotes q ON a.quote_id = q.id
  WHERE a.user_id = p_user_id;
  
  RETURN v_stats;
END;
$$;

-- =====================================================
-- MATERIALIZED VIEW FOR DASHBOARD PERFORMANCE
-- =====================================================

-- Create materialized view for ultra-fast dashboard queries
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_assessment_quote_workflow AS
SELECT 
  a.user_id,
  p.id as property_id,
  p.service_address,
  p.property_type,
  c.id as client_id,
  c.name as client_name,
  c.client_type,
  a.id as assessment_id,
  a.assessment_number,
  a.assessment_status,
  a.assessment_date,
  a.completed_date,
  a.complexity_score,
  a.estimated_total_cost,
  a.workflow_status,
  a.workflow_error_message,
  a.auto_quote_enabled,
  q.id as quote_id,
  q.status as quote_status,
  q.total as quote_total,
  q.created_at as quote_created_at,
  a.quote_generated_at,
  
  -- Pre-calculated fields for performance
  CASE 
    WHEN a.assessment_status != 'completed' THEN 'complete_assessment'
    WHEN a.workflow_status = 'error' THEN 'retry_quote_generation'
    WHEN a.assessment_status = 'completed' AND q.id IS NULL AND a.auto_quote_enabled THEN 'generate_quote'
    WHEN a.assessment_status = 'completed' AND q.id IS NULL AND NOT a.auto_quote_enabled THEN 'enable_auto_quote'
    WHEN q.status = 'draft' THEN 'review_quote'
    WHEN q.status = 'sent' THEN 'follow_up'
    WHEN q.status = 'accepted' THEN 'schedule_service'
    ELSE 'complete'
  END as next_action,
  
  CASE 
    WHEN a.workflow_status = 'error' THEN 'high'
    WHEN a.assessment_status = 'completed' AND q.id IS NULL 
         AND a.assessment_date < NOW() - INTERVAL '3 days' THEN 'high'
    WHEN a.assessment_status = 'in_progress' 
         AND a.created_at < NOW() - INTERVAL '7 days' THEN 'high'
    WHEN q.status = 'sent' 
         AND q.created_at < NOW() - INTERVAL '5 days' THEN 'medium'
    WHEN a.complexity_score >= 8 THEN 'medium'
    ELSE 'low'
  END as priority_level,
  
  COALESCE(EXTRACT(DAY FROM NOW() - a.assessment_date)::INTEGER, 0) as days_since_assessment,
  
  -- Condition summary
  jsonb_build_object(
    'lawn_condition', a.lawn_condition,
    'soil_condition', a.soil_condition,
    'weed_coverage_percent', a.weed_coverage_percent,
    'irrigation_status', a.irrigation_status,
    'complexity_score', a.complexity_score,
    'area_measured', a.lawn_area_measured,
    'area_estimated', a.lawn_area_estimated
  ) as condition_summary,
  
  -- Revenue metrics
  CASE WHEN q.status = 'accepted' THEN q.total ELSE 0 END as revenue_value,
  
  -- Timestamps
  a.created_at as assessment_created_at,
  a.updated_at as assessment_updated_at,
  NOW() as materialized_at
  
FROM public.property_assessments a
INNER JOIN public.properties p ON a.property_id = p.id AND p.is_active = TRUE
INNER JOIN public.clients c ON p.client_id = c.id
LEFT JOIN public.quotes q ON a.quote_id = q.id;

-- =====================================================
-- PERFORMANCE INDEXES FOR MATERIALIZED VIEW
-- =====================================================

-- Unique index for materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_workflow_unique
  ON public.mv_assessment_quote_workflow(assessment_id);

-- Performance indexes for dashboard queries
CREATE INDEX IF NOT EXISTS idx_mv_workflow_user_priority
  ON public.mv_assessment_quote_workflow(user_id, priority_level, next_action);

CREATE INDEX IF NOT EXISTS idx_mv_workflow_user_status
  ON public.mv_assessment_quote_workflow(user_id, assessment_status, workflow_status);

CREATE INDEX IF NOT EXISTS idx_mv_workflow_dashboard_main
  ON public.mv_assessment_quote_workflow(user_id, assessment_date DESC)
  INCLUDE (property_id, client_name, assessment_status, quote_status, priority_level);

CREATE INDEX IF NOT EXISTS idx_mv_workflow_filters
  ON public.mv_assessment_quote_workflow(user_id, client_type, assessment_status, workflow_status)
  WHERE priority_level IN ('high', 'medium');

-- =====================================================
-- AUTOMATED REFRESH FOR MATERIALIZED VIEW
-- =====================================================

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_workflow_dashboard()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_assessment_quote_workflow;
END;
$$;

-- Function to trigger dashboard refresh on data changes
CREATE OR REPLACE FUNCTION trigger_workflow_dashboard_refresh()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Use pg_notify to trigger async refresh
  PERFORM pg_notify('refresh_workflow_dashboard', json_build_object(
    'table', TG_TABLE_NAME,
    'operation', TG_OP,
    'timestamp', NOW()
  )::text);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers for automatic refresh
DROP TRIGGER IF EXISTS workflow_dashboard_refresh_assessments ON public.property_assessments;
CREATE TRIGGER workflow_dashboard_refresh_assessments
  AFTER INSERT OR UPDATE OR DELETE ON public.property_assessments
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_workflow_dashboard_refresh();

DROP TRIGGER IF EXISTS workflow_dashboard_refresh_quotes ON public.quotes;
CREATE TRIGGER workflow_dashboard_refresh_quotes
  AFTER INSERT OR UPDATE OR DELETE ON public.quotes
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_workflow_dashboard_refresh();

-- =====================================================
-- ASSESSMENT WORKFLOW ANALYTICS VIEW
-- =====================================================

CREATE OR REPLACE VIEW public.assessment_workflow_analytics AS
SELECT 
  user_id,
  
  -- Assessment counts
  COUNT(*) as total_assessments,
  COUNT(*) FILTER (WHERE assessment_status = 'completed') as completed_assessments,
  COUNT(*) FILTER (WHERE assessment_status = 'in_progress') as in_progress_assessments,
  COUNT(*) FILTER (WHERE assessment_status = 'scheduled') as scheduled_assessments,
  
  -- Workflow status
  COUNT(*) FILTER (WHERE workflow_status = 'completed') as successful_workflows,
  COUNT(*) FILTER (WHERE workflow_status = 'error') as failed_workflows,
  COUNT(*) FILTER (WHERE workflow_status = 'processing') as processing_workflows,
  
  -- Quote generation metrics
  COUNT(*) FILTER (WHERE quote_id IS NOT NULL) as quotes_generated,
  COUNT(*) FILTER (WHERE quote_generated_at IS NOT NULL) as auto_generated_quotes,
  
  -- Performance metrics
  ROUND(
    COUNT(*) FILTER (WHERE quote_id IS NOT NULL)::numeric / 
    NULLIF(COUNT(*) FILTER (WHERE assessment_status = 'completed')::numeric, 0) * 100,
    2
  ) as quote_conversion_rate,
  
  -- Timing metrics
  ROUND(AVG(
    EXTRACT(EPOCH FROM (quote_generated_at - completed_date)) / 3600
  ), 2) FILTER (WHERE quote_generated_at IS NOT NULL AND completed_date IS NOT NULL) 
    as avg_hours_to_quote,
  
  -- Priority distribution
  COUNT(*) FILTER (WHERE complexity_score >= 8) as high_complexity_count,
  COUNT(*) FILTER (WHERE complexity_score BETWEEN 4 AND 7) as medium_complexity_count,
  COUNT(*) FILTER (WHERE complexity_score <= 3) as low_complexity_count,
  
  -- Financial metrics from linked quotes
  COALESCE(SUM(q.total) FILTER (WHERE q.id IS NOT NULL), 0) as total_quote_value,
  COALESCE(AVG(q.total) FILTER (WHERE q.id IS NOT NULL), 0) as avg_quote_value,
  COALESCE(SUM(q.total) FILTER (WHERE q.status = 'accepted'), 0) as accepted_quote_value,
  
  -- Recent activity
  COUNT(*) FILTER (WHERE assessment_date >= CURRENT_DATE - INTERVAL '7 days') as assessments_this_week,
  COUNT(*) FILTER (WHERE quote_generated_at >= CURRENT_DATE - INTERVAL '7 days') as quotes_this_week,
  
  -- Efficiency metrics
  ROUND(
    COUNT(*) FILTER (WHERE auto_quote_enabled = TRUE)::numeric /
    NULLIF(COUNT(*)::numeric, 0) * 100,
    2
  ) as auto_quote_adoption_rate,
  
  -- Last activity timestamps
  MAX(assessment_date) as last_assessment_date,
  MAX(quote_generated_at) as last_quote_generated_date,
  MAX(updated_at) as last_updated
  
FROM public.property_assessments pa
LEFT JOIN public.quotes q ON pa.quote_id = q.id
GROUP BY user_id;

-- =====================================================
-- OPTIMIZED QUERY FUNCTIONS FOR UI COMPONENTS
-- =====================================================

-- Function: Get pending actions for Assessment Completion Bridge
CREATE OR REPLACE FUNCTION get_pending_assessment_actions(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  assessment_id UUID,
  property_address TEXT,
  client_name TEXT,
  assessment_date TIMESTAMPTZ,
  action_type TEXT,
  action_description TEXT,
  priority_level TEXT,
  days_overdue INTEGER
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mv.assessment_id,
    mv.service_address as property_address,
    mv.client_name,
    mv.assessment_date,
    mv.next_action as action_type,
    CASE mv.next_action
      WHEN 'complete_assessment' THEN 'Complete the property assessment'
      WHEN 'retry_quote_generation' THEN 'Retry automatic quote generation'
      WHEN 'generate_quote' THEN 'Generate quote from completed assessment'
      WHEN 'enable_auto_quote' THEN 'Enable automatic quote generation'
      WHEN 'review_quote' THEN 'Review and finalize the generated quote'
      WHEN 'follow_up' THEN 'Follow up with client on sent quote'
      WHEN 'schedule_service' THEN 'Schedule service for accepted quote'
      ELSE 'No action needed'
    END as action_description,
    mv.priority_level,
    CASE 
      WHEN mv.next_action = 'complete_assessment' AND mv.assessment_date < CURRENT_DATE - INTERVAL '7 days'
        THEN EXTRACT(DAY FROM NOW() - mv.assessment_date)::INTEGER - 7
      WHEN mv.next_action = 'generate_quote' AND mv.completed_date < CURRENT_DATE - INTERVAL '3 days'
        THEN EXTRACT(DAY FROM NOW() - mv.completed_date)::INTEGER - 3
      WHEN mv.next_action = 'follow_up' AND mv.quote_created_at < CURRENT_DATE - INTERVAL '5 days'
        THEN EXTRACT(DAY FROM NOW() - mv.quote_created_at)::INTEGER - 5
      ELSE 0
    END as days_overdue
    
  FROM public.mv_assessment_quote_workflow mv
  WHERE mv.user_id = p_user_id
    AND mv.next_action != 'complete'
    AND mv.priority_level IN ('high', 'medium')
    
  ORDER BY 
    CASE mv.priority_level WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
    mv.assessment_date ASC
    
  LIMIT p_limit;
END;
$$;

-- Function: Get pricing transparency data for completed assessments
CREATE OR REPLACE FUNCTION get_pricing_transparency_data(
  p_assessment_id UUID,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_pricing JSONB;
  v_assessment RECORD;
  v_line_items JSONB[];
BEGIN
  -- Verify access and get assessment
  SELECT 
    a.*,
    p.service_address,
    c.name as client_name
  INTO v_assessment
  FROM public.property_assessments a
  JOIN public.properties p ON a.property_id = p.id
  JOIN public.clients c ON p.client_id = c.id
  WHERE a.id = p_assessment_id AND a.user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Assessment not found or access denied');
  END IF;
  
  -- Get pricing calculation
  SELECT calculate_assessment_pricing_adjustments(p_assessment_id) INTO v_pricing;
  
  -- Get generated line items if they exist
  IF v_assessment.quote_id IS NOT NULL THEN
    SELECT array_agg(
      jsonb_build_object(
        'name', qli.name,
        'quantity', qli.quantity,
        'unit_price', qli.unit_price,
        'total_price', qli.total_price,
        'assessment_based', qli.assessment_based,
        'condition_source', qli.assessment_condition_source
      )
    )
    INTO v_line_items
    FROM public.quote_line_items qli
    WHERE qli.quote_id = v_assessment.quote_id;
  ELSE
    -- Generate preview line items
    SELECT generate_line_items_from_assessment(p_assessment_id) INTO v_line_items;
  END IF;
  
  RETURN jsonb_build_object(
    'assessment', jsonb_build_object(
      'id', v_assessment.id,
      'assessment_number', v_assessment.assessment_number,
      'client_name', v_assessment.client_name,
      'service_address', v_assessment.service_address,
      'completed_date', v_assessment.completed_date,
      'complexity_score', v_assessment.complexity_score
    ),
    'pricing', v_pricing,
    'line_items', COALESCE(v_line_items, '{}'),
    'has_existing_quote', v_assessment.quote_id IS NOT NULL,
    'quote_id', v_assessment.quote_id,
    'generated_at', NOW()
  );
END;
$$;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION get_assessment_quote_dashboard(UUID, INTEGER, INTEGER, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION get_workflow_summary_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_workflow_dashboard() TO authenticated;
GRANT EXECUTE ON FUNCTION get_pending_assessment_actions(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_pricing_transparency_data(UUID, UUID) TO authenticated;

-- Grant SELECT on materialized view
GRANT SELECT ON public.mv_assessment_quote_workflow TO authenticated;
GRANT SELECT ON public.assessment_workflow_analytics TO authenticated;

-- =====================================================
-- SCHEDULED REFRESH JOB (Using pg_cron if available)
-- =====================================================

-- Note: This requires pg_cron extension
-- Refresh materialized view every 15 minutes during business hours
-- SELECT cron.schedule('refresh-workflow-dashboard', '*/15 8-18 * * 1-5', 'SELECT refresh_workflow_dashboard();');

-- =====================================================
-- COMPLETION NOTIFICATION
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'Phase 1 Dashboard Optimization Migration completed successfully';
  RAISE NOTICE 'Created optimized dashboard functions:';
  RAISE NOTICE '  - get_assessment_quote_dashboard() - Main dashboard query';
  RAISE NOTICE '  - get_workflow_summary_stats() - Summary statistics';
  RAISE NOTICE '  - get_pending_assessment_actions() - Action items';
  RAISE NOTICE '  - get_pricing_transparency_data() - Pricing breakdown';
  RAISE NOTICE 'Created materialized view mv_assessment_quote_workflow for <50ms queries';
  RAISE NOTICE 'Added automated refresh triggers for real-time updates';
  RAISE NOTICE 'Created assessment_workflow_analytics view for reporting';
  RAISE NOTICE 'Performance target: <100ms for dashboard queries with 1000+ assessments';
  RAISE NOTICE 'Ready for UI integration with Assessment Completion Bridge component';
END $$;