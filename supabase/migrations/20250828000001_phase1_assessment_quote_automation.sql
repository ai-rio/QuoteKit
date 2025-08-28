-- =====================================================
-- PHASE 1: ASSESSMENT-QUOTE AUTOMATION - DATABASE FUNCTIONS (CORRECTED)
-- =====================================================
-- This migration implements Phase 1 database automation for the UI optimization roadmap
-- Compatible with existing QuoteKit schema (JSONB quote_data approach)

-- =====================================================
-- SCHEMA EXTENSIONS FOR WORKFLOW AUTOMATION
-- =====================================================

-- Add workflow status tracking to assessments table
ALTER TABLE public.property_assessments 
  ADD COLUMN IF NOT EXISTS quote_generated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS workflow_status TEXT DEFAULT 'pending' CHECK (
    workflow_status IN ('pending', 'processing', 'completed', 'error')
  ),
  ADD COLUMN IF NOT EXISTS workflow_error_message TEXT,
  ADD COLUMN IF NOT EXISTS auto_quote_enabled BOOLEAN DEFAULT TRUE;

-- Add assessment-based tracking to quotes table
ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS assessment_based BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS pricing_explanation JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS condition_adjustments JSONB DEFAULT '{}';

-- Note: Line items are stored in quote_data JSONB column, not separate table

-- =====================================================
-- SUPPORTING TABLES FOR AUTOMATION
-- =====================================================

-- Assessment workflow audit log
CREATE TABLE IF NOT EXISTS public.assessment_workflow_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES public.property_assessments(id) ON DELETE CASCADE,
  workflow_step TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('started', 'completed', 'failed')),
  duration_ms INTEGER,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_logs_assessment ON public.assessment_workflow_logs(assessment_id, created_at);

-- =====================================================
-- CORE AUTOMATION FUNCTIONS
-- =====================================================

-- Function: Automated assessment-to-quote generation
CREATE OR REPLACE FUNCTION public.trigger_quote_workflow_from_assessment(
  assessment_id UUID,
  override_auto_quote BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  assessment_record RECORD;
  quote_id UUID;
  base_price NUMERIC(10,2);
  adjusted_price NUMERIC(10,2);
  pricing_explanation JSONB;
  condition_adjustments JSONB;
  workflow_result JSONB;
  start_time TIMESTAMPTZ;
  end_time TIMESTAMPTZ;
  property_size INTEGER;
BEGIN
  start_time := NOW();
  
  -- Log workflow start
  INSERT INTO public.assessment_workflow_logs (
    assessment_id, workflow_step, status
  ) VALUES (assessment_id, 'quote_generation', 'started');

  -- Get assessment with property data
  SELECT a.*, p.property_size, p.lot_size, p.client_id, p.client_name, p.street_address, p.city, p.state, p.zip_code
  INTO assessment_record
  FROM public.property_assessments a
  JOIN public.properties p ON a.property_id = p.id
  WHERE a.id = assessment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Assessment not found: %', assessment_id;
  END IF;

  -- Update assessment workflow status
  UPDATE public.property_assessments 
  SET workflow_status = 'processing'
  WHERE id = assessment_id;

  -- Calculate base price and adjustments
  property_size := COALESCE(assessment_record.property_size, assessment_record.lot_size, 5000);
  base_price := property_size * 0.15;
  adjusted_price := base_price;

  -- Apply condition-based adjustments
  adjusted_price := adjusted_price * CASE assessment_record.lawn_condition
    WHEN 'excellent' THEN 0.9
    WHEN 'good' THEN 1.0
    WHEN 'fair' THEN 1.2
    WHEN 'poor' THEN 1.4
    WHEN 'severe' THEN 1.6
    ELSE 1.0
  END;

  adjusted_price := adjusted_price * CASE assessment_record.soil_condition
    WHEN 'excellent' THEN 1.0
    WHEN 'good' THEN 1.1
    WHEN 'compacted' THEN 1.25
    WHEN 'poor' THEN 1.3
    WHEN 'severely_damaged' THEN 1.5
    ELSE 1.0
  END;

  -- Build pricing explanation
  pricing_explanation := jsonb_build_object(
    'base_calculation', jsonb_build_object(
      'property_size_sqft', property_size,
      'base_rate_per_sqft', 0.15,
      'base_price', base_price
    ),
    'lawn_condition', assessment_record.lawn_condition,
    'soil_condition', assessment_record.soil_condition,
    'final_price', adjusted_price
  );

  -- Generate basic quote data
  condition_adjustments := jsonb_build_object(
    'lawn_multiplier', CASE assessment_record.lawn_condition
      WHEN 'poor' THEN 1.4
      WHEN 'severe' THEN 1.6
      ELSE 1.0
    END,
    'soil_multiplier', CASE assessment_record.soil_condition
      WHEN 'compacted' THEN 1.25
      WHEN 'poor' THEN 1.3
      ELSE 1.0
    END
  );

  -- Generate quote
  INSERT INTO public.quotes (
    user_id,
    client_id,
    client_name,
    property_id,
    assessment_id,
    service_address,
    quote_number,
    quote_data,
    subtotal,
    tax_rate,
    markup_rate,
    total,
    status,
    assessment_based,
    pricing_explanation,
    condition_adjustments,
    expires_at
  ) VALUES (
    assessment_record.user_id,
    assessment_record.client_id,
    COALESCE(assessment_record.client_name, 'Assessment Client'),
    assessment_record.property_id,
    assessment_id,
    COALESCE(
      assessment_record.street_address || ', ' || assessment_record.city || ', ' || assessment_record.state || ' ' || assessment_record.zip_code,
      'Property Address'
    ),
    'QT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0'),
    jsonb_build_object('items', jsonb_build_array(
      jsonb_build_object(
        'id', gen_random_uuid(),
        'description', 'Lawn Care Service - ' || property_size || ' sq ft',
        'quantity', 1,
        'unit_price', adjusted_price,
        'total', adjusted_price,
        'assessment_based', true
      )
    )),
    adjusted_price,
    8.25, -- Default tax rate
    25.0, -- Default markup
    ROUND(adjusted_price * 1.0825 * 1.25, 2), -- Total with tax and markup
    'draft',
    TRUE,
    pricing_explanation,
    condition_adjustments,
    NOW() + INTERVAL '30 days'
  )
  RETURNING id INTO quote_id;

  -- Update assessment with quote generation details
  UPDATE public.property_assessments 
  SET 
    workflow_status = 'completed',
    quote_generated_at = NOW()
  WHERE id = assessment_id;

  end_time := NOW();

  -- Log successful completion
  INSERT INTO public.assessment_workflow_logs (
    assessment_id, workflow_step, status, duration_ms, metadata
  ) VALUES (
    assessment_id, 
    'quote_generation', 
    'completed',
    EXTRACT(EPOCH FROM (end_time - start_time)) * 1000,
    jsonb_build_object('quote_id', quote_id, 'total_amount', adjusted_price)
  );

  workflow_result := jsonb_build_object(
    'success', true,
    'quote_id', quote_id,
    'assessment_id', assessment_id,
    'total_amount', adjusted_price,
    'pricing_explanation', pricing_explanation,
    'condition_adjustments', condition_adjustments,
    'processing_time_ms', EXTRACT(EPOCH FROM (end_time - start_time)) * 1000
  );

  RETURN workflow_result;

EXCEPTION
  WHEN OTHERS THEN
    -- Update assessment with error status
    UPDATE public.property_assessments 
    SET 
      workflow_status = 'error',
      workflow_error_message = SQLERRM
    WHERE id = assessment_id;

    -- Log error
    INSERT INTO public.assessment_workflow_logs (
      assessment_id, workflow_step, status, error_message
    ) VALUES (
      assessment_id, 'quote_generation', 'failed', SQLERRM
    );

    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'assessment_id', assessment_id
    );
END;
$$;

-- Function: Get workflow status for dashboard
CREATE OR REPLACE FUNCTION public.get_assessment_workflow_status(user_id UUID)
RETURNS TABLE(
  total_assessments BIGINT,
  pending_quotes BIGINT,
  processing_quotes BIGINT,
  completed_quotes BIGINT,
  failed_workflows BIGINT,
  avg_processing_time_seconds NUMERIC(10,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_assessments,
    COUNT(*) FILTER (WHERE workflow_status = 'pending')::BIGINT as pending_quotes,
    COUNT(*) FILTER (WHERE workflow_status = 'processing')::BIGINT as processing_quotes,
    COUNT(*) FILTER (WHERE workflow_status = 'completed')::BIGINT as completed_quotes,
    COUNT(*) FILTER (WHERE workflow_status = 'error')::BIGINT as failed_workflows,
    COALESCE(AVG(
      CASE 
        WHEN workflow_status = 'completed' AND quote_generated_at IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (quote_generated_at - updated_at))
        ELSE NULL 
      END
    ), 0)::NUMERIC(10,2) as avg_processing_time_seconds
  FROM public.property_assessments
  WHERE property_assessments.user_id = get_assessment_workflow_status.user_id
    AND assessment_status = 'completed'
    AND created_at >= NOW() - INTERVAL '30 days';
END;
$$;

-- =====================================================
-- RLS POLICIES FOR NEW TABLES
-- =====================================================

-- RLS for assessment_workflow_logs
ALTER TABLE public.assessment_workflow_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own workflow logs"
ON public.assessment_workflow_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.property_assessments
    WHERE id = assessment_workflow_logs.assessment_id
    AND user_id = auth.uid()
  )
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_property_assessments_workflow ON public.property_assessments(user_id, workflow_status, assessment_status);
CREATE INDEX IF NOT EXISTS idx_quotes_assessment_based ON public.quotes(user_id, assessment_based) WHERE assessment_based = TRUE;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION public.trigger_quote_workflow_from_assessment(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_assessment_workflow_status(UUID) TO authenticated;