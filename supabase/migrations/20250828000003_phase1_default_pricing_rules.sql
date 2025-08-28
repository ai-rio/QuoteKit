-- =====================================================
-- PHASE 1: DEFAULT PRICING RULES AND USER ONBOARDING
-- =====================================================
-- This migration sets up default pricing rules for new users
-- and ensures existing users get the automation features enabled

-- =====================================================
-- CREATE DEFAULT PRICING RULES FOR EXISTING USERS
-- =====================================================

-- Function to safely create pricing rules (avoid duplicates)
CREATE OR REPLACE FUNCTION create_pricing_rules_safe(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_inserted_count INTEGER := 0;
BEGIN
  -- Insert default pricing rules, ignoring duplicates
  INSERT INTO public.assessment_pricing_rules (
    user_id, rule_name, condition_type, condition_value, 
    adjustment_type, adjustment_value, description, active
  ) 
  SELECT 
    p_user_id,
    rule_name,
    condition_type,
    condition_value,
    adjustment_type,
    adjustment_value,
    description,
    true
  FROM (VALUES
    -- Lawn condition rules
    ('Dead Lawn Premium', 'lawn_condition', 'dead', 'multiplier', 1.6, 'Complete lawn renovation required - includes seeding, soil prep, and intensive care'),
    ('Poor Lawn Restoration', 'lawn_condition', 'poor', 'multiplier', 1.4, 'Significant restoration needed - patching, overseeding, and treatments'),
    ('Patchy Lawn Repair', 'lawn_condition', 'patchy', 'multiplier', 1.2, 'Moderate repair work - spot treatments and overseeding'),
    ('Healthy Lawn Maintenance', 'lawn_condition', 'healthy', 'multiplier', 1.0, 'Standard maintenance rates for healthy turf'),
    ('Pristine Lawn Efficiency', 'lawn_condition', 'pristine', 'multiplier', 0.9, 'Well-maintained lawn allows for efficient service delivery'),
    
    -- Soil condition rules
    ('Contaminated Soil Treatment', 'soil_condition', 'contaminated', 'multiplier', 1.5, 'Soil remediation and special handling required'),
    ('Clay Soil Premium', 'soil_condition', 'clay', 'multiplier', 1.3, 'Heavy clay soil - difficult working conditions, specialized equipment'),
    ('Compacted Soil Treatment', 'soil_condition', 'compacted', 'multiplier', 1.25, 'Aeration and soil improvement needed before treatment'),
    ('Sandy Soil Amendment', 'soil_condition', 'sandy', 'multiplier', 1.1, 'Amendments required for proper water and nutrient retention'),
    ('Good Soil Standard', 'soil_condition', 'good', 'multiplier', 1.0, 'Standard soil conditions - optimal for most treatments'),
    ('Excellent Soil Efficiency', 'soil_condition', 'excellent', 'multiplier', 0.95, 'Premium soil conditions allow for efficient application'),
    
    -- Complexity score rules
    ('Maximum Complexity Premium', 'complexity_score', '9-10', 'multiplier', 1.6, 'Extremely complex project requiring specialized expertise'),
    ('High Complexity Premium', 'complexity_score', '8', 'multiplier', 1.5, 'High complexity - specialized techniques and equipment required'),
    ('Moderate-High Complexity', 'complexity_score', '6-7', 'multiplier', 1.3, 'Above-average complexity - additional planning and care needed'),
    ('Moderate Complexity', 'complexity_score', '4-5', 'multiplier', 1.1, 'Some complexity factors requiring attention'),
    ('Standard Complexity', 'complexity_score', '1-3', 'multiplier', 1.0, 'Straightforward project with standard approaches'),
    
    -- Weed coverage rules  
    ('Heavy Weed Infestation', 'weed_coverage_percent', '75-100', 'multiplier', 1.4, 'Severe weed problem requiring intensive treatment program'),
    ('Moderate Weed Coverage', 'weed_coverage_percent', '50-74', 'multiplier', 1.3, 'Significant weed presence requiring multiple treatments'),
    ('Light-Moderate Weeds', 'weed_coverage_percent', '25-49', 'multiplier', 1.2, 'Noticeable weed coverage requiring targeted treatment'),
    ('Light Weed Presence', 'weed_coverage_percent', '10-24', 'multiplier', 1.1, 'Minor weed issues requiring spot treatment'),
    ('Minimal Weeds', 'weed_coverage_percent', '0-9', 'multiplier', 1.0, 'Well-maintained turf with minimal weed pressure'),
    
    -- Slope grade rules
    ('Steep Slope Premium', 'slope_grade_percent', '30+', 'multiplier', 1.5, 'Steep slopes require specialized equipment and safety measures'),
    ('Moderate Slope Premium', 'slope_grade_percent', '15-29', 'multiplier', 1.3, 'Moderate slopes increase treatment difficulty and time'),
    ('Gentle Slope Adjustment', 'slope_grade_percent', '5-14', 'multiplier', 1.1, 'Gentle slopes require some adjustment to standard methods'),
    ('Level Ground Standard', 'slope_grade_percent', '0-4', 'multiplier', 1.0, 'Level ground allows for standard treatment efficiency')
  ) AS default_rules(rule_name, condition_type, condition_value, adjustment_type, adjustment_value, description)
  
  WHERE NOT EXISTS (
    SELECT 1 FROM public.assessment_pricing_rules 
    WHERE user_id = p_user_id 
      AND condition_type = default_rules.condition_type 
      AND condition_value = default_rules.condition_value
  );
  
  GET DIAGNOSTICS v_inserted_count = ROW_COUNT;
  RETURN v_inserted_count;
END;
$$;

-- =====================================================
-- ENABLE AUTO-QUOTE FOR EXISTING COMPLETED ASSESSMENTS
-- =====================================================

-- Update existing assessments to enable auto-quote generation
UPDATE public.property_assessments 
SET auto_quote_enabled = TRUE,
    workflow_status = CASE 
      WHEN workflow_status IS NULL THEN 'pending'
      ELSE workflow_status
    END
WHERE auto_quote_enabled IS NULL;

-- =====================================================
-- CREATE PRICING RULES FOR ALL EXISTING USERS
-- =====================================================

DO $$
DECLARE
  user_record RECORD;
  rules_created INTEGER;
  total_users INTEGER := 0;
  total_rules INTEGER := 0;
BEGIN
  -- Create default pricing rules for all existing users
  FOR user_record IN 
    SELECT DISTINCT user_id 
    FROM public.property_assessments 
    WHERE user_id IS NOT NULL
  LOOP
    SELECT create_pricing_rules_safe(user_record.user_id) INTO rules_created;
    total_users := total_users + 1;
    total_rules := total_rules + rules_created;
    
    RAISE NOTICE 'Created % pricing rules for user %', rules_created, user_record.user_id;
  END LOOP;
  
  RAISE NOTICE 'Setup complete: % pricing rules created for % users', total_rules, total_users;
END $$;

-- =====================================================
-- TRIGGER TO CREATE DEFAULT RULES FOR NEW USERS
-- =====================================================

-- Function to automatically create pricing rules for new users
CREATE OR REPLACE FUNCTION setup_new_user_pricing_rules()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Create default pricing rules when user creates their first assessment
  IF NOT EXISTS (
    SELECT 1 FROM public.assessment_pricing_rules 
    WHERE user_id = NEW.user_id
  ) THEN
    PERFORM create_pricing_rules_safe(NEW.user_id);
    
    -- Log the setup
    INSERT INTO public.assessment_workflow_events (
      assessment_id, event_type, event_data, created_at, created_by
    ) VALUES (
      NEW.id, 'assessment_created',
      jsonb_build_object(
        'first_assessment_for_user', true,
        'pricing_rules_created', true,
        'auto_quote_enabled', NEW.auto_quote_enabled
      ),
      NOW(), NEW.user_id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user setup
DROP TRIGGER IF EXISTS setup_new_user_on_first_assessment ON public.property_assessments;
CREATE TRIGGER setup_new_user_on_first_assessment
  AFTER INSERT ON public.property_assessments
  FOR EACH ROW
  EXECUTE FUNCTION setup_new_user_pricing_rules();

-- =====================================================
-- CONFIGURATION FUNCTIONS FOR USER CUSTOMIZATION
-- =====================================================

-- Function to update pricing rule
CREATE OR REPLACE FUNCTION update_pricing_rule(
  p_rule_id UUID,
  p_user_id UUID,
  p_adjustment_value NUMERIC,
  p_description TEXT DEFAULT NULL,
  p_active BOOLEAN DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updated BOOLEAN := FALSE;
BEGIN
  UPDATE public.assessment_pricing_rules
  SET 
    adjustment_value = p_adjustment_value,
    description = COALESCE(p_description, description),
    active = COALESCE(p_active, active),
    updated_at = NOW()
  WHERE id = p_rule_id AND user_id = p_user_id;
  
  GET DIAGNOSTICS v_updated = FOUND;
  
  IF v_updated THEN
    RETURN jsonb_build_object(
      'success', true,
      'rule_id', p_rule_id,
      'updated_at', NOW()
    );
  ELSE
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Rule not found or access denied'
    );
  END IF;
END;
$$;

-- Function to get user's pricing rules
CREATE OR REPLACE FUNCTION get_user_pricing_rules(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  rule_name TEXT,
  condition_type TEXT,
  condition_value TEXT,
  adjustment_type TEXT,
  adjustment_value NUMERIC,
  description TEXT,
  active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.rule_name,
    r.condition_type,
    r.condition_value,
    r.adjustment_type,
    r.adjustment_value,
    r.description,
    r.active,
    r.created_at,
    r.updated_at
  FROM public.assessment_pricing_rules r
  WHERE r.user_id = p_user_id
  ORDER BY r.condition_type, r.condition_value;
END;
$$;

-- Function to toggle auto-quote for assessments
CREATE OR REPLACE FUNCTION toggle_auto_quote_generation(
  p_assessment_id UUID,
  p_user_id UUID,
  p_enabled BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updated BOOLEAN := FALSE;
  v_assessment RECORD;
BEGIN
  -- Update the setting
  UPDATE public.property_assessments
  SET auto_quote_enabled = p_enabled,
      updated_at = NOW()
  WHERE id = p_assessment_id AND user_id = p_user_id
  RETURNING * INTO v_assessment;
  
  GET DIAGNOSTICS v_updated = FOUND;
  
  IF NOT v_updated THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Assessment not found or access denied'
    );
  END IF;
  
  -- If enabling auto-quote and assessment is completed without quote, trigger generation
  IF p_enabled AND v_assessment.assessment_status = 'completed' AND v_assessment.quote_id IS NULL THEN
    -- Trigger quote generation
    PERFORM pg_notify(
      'assessment_completed',
      json_build_object(
        'assessment_id', p_assessment_id,
        'property_id', v_assessment.property_id,
        'user_id', p_user_id,
        'auto_quote_enabled', true,
        'trigger_source', 'manual_enable'
      )::text
    );
  END IF;
  
  -- Log the change
  INSERT INTO public.assessment_workflow_events (
    assessment_id, event_type, event_data, created_at, created_by
  ) VALUES (
    p_assessment_id, 'manual_override',
    jsonb_build_object(
      'action', 'toggle_auto_quote',
      'enabled', p_enabled,
      'previous_state', NOT p_enabled
    ),
    NOW(), p_user_id
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'assessment_id', p_assessment_id,
    'auto_quote_enabled', p_enabled,
    'will_trigger_generation', p_enabled AND v_assessment.assessment_status = 'completed' AND v_assessment.quote_id IS NULL
  );
END;
$$;

-- =====================================================
-- BULK OPERATIONS FOR EFFICIENCY
-- =====================================================

-- Function to enable auto-quote for multiple assessments
CREATE OR REPLACE FUNCTION bulk_enable_auto_quote(
  p_assessment_ids UUID[],
  p_user_id UUID,
  p_enabled BOOLEAN DEFAULT TRUE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updated_count INTEGER := 0;
  v_trigger_count INTEGER := 0;
  assessment_id UUID;
BEGIN
  -- Update all assessments
  UPDATE public.property_assessments
  SET auto_quote_enabled = p_enabled,
      updated_at = NOW()
  WHERE id = ANY(p_assessment_ids) 
    AND user_id = p_user_id;
    
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  -- If enabling, trigger quote generation for eligible assessments
  IF p_enabled THEN
    FOR assessment_id IN
      SELECT id FROM public.property_assessments
      WHERE id = ANY(p_assessment_ids)
        AND user_id = p_user_id
        AND assessment_status = 'completed'
        AND quote_id IS NULL
        AND auto_quote_enabled = TRUE
    LOOP
      PERFORM pg_notify(
        'assessment_completed',
        json_build_object(
          'assessment_id', assessment_id,
          'user_id', p_user_id,
          'auto_quote_enabled', true,
          'trigger_source', 'bulk_enable'
        )::text
      );
      v_trigger_count := v_trigger_count + 1;
    END LOOP;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'updated_count', v_updated_count,
    'triggered_generations', v_trigger_count,
    'total_requested', array_length(p_assessment_ids, 1),
    'enabled', p_enabled
  );
END;
$$;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION create_pricing_rules_safe(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_pricing_rule(UUID, UUID, NUMERIC, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_pricing_rules(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION toggle_auto_quote_generation(UUID, UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION bulk_enable_auto_quote(UUID[], UUID, BOOLEAN) TO authenticated;

-- =====================================================
-- VALIDATION QUERIES FOR SETUP VERIFICATION
-- =====================================================

-- Function to validate user setup
CREATE OR REPLACE FUNCTION validate_user_automation_setup(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_pricing_rules_count INTEGER;
  v_assessments_count INTEGER;
  v_auto_enabled_count INTEGER;
  v_quotes_generated INTEGER;
  v_workflow_errors INTEGER;
BEGIN
  -- Count pricing rules
  SELECT COUNT(*) INTO v_pricing_rules_count
  FROM public.assessment_pricing_rules
  WHERE user_id = p_user_id AND active = TRUE;
  
  -- Count assessments
  SELECT COUNT(*) INTO v_assessments_count
  FROM public.property_assessments
  WHERE user_id = p_user_id;
  
  -- Count auto-enabled assessments
  SELECT COUNT(*) INTO v_auto_enabled_count
  FROM public.property_assessments
  WHERE user_id = p_user_id AND auto_quote_enabled = TRUE;
  
  -- Count generated quotes
  SELECT COUNT(*) INTO v_quotes_generated
  FROM public.property_assessments
  WHERE user_id = p_user_id AND quote_id IS NOT NULL;
  
  -- Count workflow errors
  SELECT COUNT(*) INTO v_workflow_errors
  FROM public.property_assessments
  WHERE user_id = p_user_id AND workflow_status = 'error';
  
  RETURN jsonb_build_object(
    'user_id', p_user_id,
    'setup_complete', v_pricing_rules_count > 0,
    'pricing_rules_count', v_pricing_rules_count,
    'total_assessments', v_assessments_count,
    'auto_quote_enabled_count', v_auto_enabled_count,
    'quotes_generated', v_quotes_generated,
    'workflow_errors', v_workflow_errors,
    'automation_adoption_rate', CASE 
      WHEN v_assessments_count > 0 THEN ROUND(v_auto_enabled_count::numeric / v_assessments_count * 100, 1)
      ELSE 0
    END,
    'quote_generation_rate', CASE 
      WHEN v_assessments_count > 0 THEN ROUND(v_quotes_generated::numeric / v_assessments_count * 100, 1)
      ELSE 0
    END,
    'validated_at', NOW()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION validate_user_automation_setup(UUID) TO authenticated;

-- =====================================================
-- COMPLETION NOTIFICATION AND VALIDATION
-- =====================================================

DO $$
DECLARE
  total_users INTEGER;
  total_rules INTEGER;
  total_assessments INTEGER;
  auto_enabled_assessments INTEGER;
BEGIN
  -- Get summary statistics
  SELECT COUNT(DISTINCT user_id) INTO total_users
  FROM public.assessment_pricing_rules;
  
  SELECT COUNT(*) INTO total_rules
  FROM public.assessment_pricing_rules;
  
  SELECT COUNT(*) INTO total_assessments
  FROM public.property_assessments;
  
  SELECT COUNT(*) INTO auto_enabled_assessments
  FROM public.property_assessments
  WHERE auto_quote_enabled = TRUE;
  
  RAISE NOTICE 'Phase 1 Default Pricing Rules Migration completed successfully';
  RAISE NOTICE 'Setup Summary:';
  RAISE NOTICE '  - % users configured with pricing rules', total_users;
  RAISE NOTICE '  - % total pricing rules created', total_rules;
  RAISE NOTICE '  - % assessments enabled for auto-quote generation', auto_enabled_assessments;
  RAISE NOTICE '  - % total assessments in system', total_assessments;
  RAISE NOTICE 'Created user management functions:';
  RAISE NOTICE '  - create_pricing_rules_safe() - Safe rule creation';
  RAISE NOTICE '  - update_pricing_rule() - Rule customization';
  RAISE NOTICE '  - toggle_auto_quote_generation() - Enable/disable automation';
  RAISE NOTICE '  - bulk_enable_auto_quote() - Bulk operations';
  RAISE NOTICE '  - validate_user_automation_setup() - Setup validation';
  RAISE NOTICE 'New user automation: Pricing rules auto-created on first assessment';
  RAISE NOTICE 'Ready for production: Assessment-to-quote automation fully configured';
END $$;