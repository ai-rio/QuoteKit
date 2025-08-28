# Database Automation Requirements: Assessment-Quote Integration

**Document Version**: 1.0  
**Based on**: UX Investigation + UI Enhancement Roadmap  
**Objective**: Define database functions, triggers, and schema enhancements needed for seamless assessment-to-quote automation

---

## 🎯 Overview

Based on the investigation findings, the QuoteKit database has excellent architectural foundation but **lacks automated workflow functions** that would enable seamless assessment-to-quote integration. This document specifies the required database enhancements to support the UI optimization roadmap.

---

## 📊 Current State Analysis

### ✅ **Existing Strengths**
- **Comprehensive Schema**: 190+ assessment fields with proper data types
- **Proper Relationships**: Foreign keys and constraints correctly implemented
- **Performance Optimized**: Well-designed indexes for dashboard queries
- **RLS Security**: Proper row-level security policies

### ❌ **Missing Automation**
- **No Automated Quote Generation**: Manual process from assessment to quote
- **No Pricing Rule Engine**: Assessment conditions don't automatically adjust pricing
- **No Workflow Triggers**: Assessment completion doesn't trigger next steps
- **No Bulk Operations**: Cannot process multiple assessments simultaneously

---

## 🚀 Phase 1: Core Automation Functions

### **1.1 Assessment-to-Quote Generation Function**

**Objective**: Automatically generate quotes from completed assessments

```sql
CREATE OR REPLACE FUNCTION generate_quote_from_assessment(
  p_assessment_id UUID,
  p_template_id UUID DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
) 
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_assessment property_assessments%ROWTYPE;
  v_property properties%ROWTYPE;
  v_client clients%ROWTYPE;
  v_quote_id UUID;
  v_pricing_data JSONB;
  v_line_items JSONB[];
  v_result JSONB;
BEGIN
  -- Validate assessment exists and user has access
  SELECT * INTO v_assessment 
  FROM property_assessments 
  WHERE id = p_assessment_id 
    AND (p_user_id IS NULL OR user_id = p_user_id);
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Assessment not found or access denied'
    );
  END IF;
  
  -- Get property and client information
  SELECT * INTO v_property FROM properties WHERE id = v_assessment.property_id;
  SELECT * INTO v_client FROM clients WHERE id = v_property.client_id;
  
  -- Calculate pricing based on assessment data
  SELECT calculate_assessment_pricing_adjustments(p_assessment_id) INTO v_pricing_data;
  
  -- Generate line items based on assessment conditions
  SELECT generate_line_items_from_assessment(p_assessment_id, p_template_id) INTO v_line_items;
  
  -- Create the quote
  INSERT INTO quotes (
    user_id,
    client_id,
    property_id,
    assessment_id,
    quote_number,
    service_address,
    status,
    total,
    subtotal,
    tax,
    created_at,
    metadata
  ) VALUES (
    v_assessment.user_id,
    v_property.client_id,
    v_assessment.property_id,
    p_assessment_id,
    generate_quote_number(v_assessment.user_id),
    v_property.service_address,
    'draft',
    (v_pricing_data->>'total')::NUMERIC,
    (v_pricing_data->>'subtotal')::NUMERIC,
    (v_pricing_data->>'tax')::NUMERIC,
    NOW(),
    jsonb_build_object(
      'generated_from_assessment', true,
      'assessment_date', v_assessment.assessment_date,
      'pricing_adjustments', v_pricing_data->'adjustments',
      'complexity_score', v_assessment.complexity_score
    )
  ) RETURNING id INTO v_quote_id;
  
  -- Insert line items
  INSERT INTO quote_line_items (
    quote_id,
    line_item_id,
    quantity,
    unit_price,
    total_price,
    assessment_based,
    assessment_condition_source,
    created_at
  )
  SELECT 
    v_quote_id,
    (item->>'line_item_id')::UUID,
    (item->>'quantity')::NUMERIC,
    (item->>'unit_price')::NUMERIC,
    (item->>'total_price')::NUMERIC,
    true,
    item->'condition_source',
    NOW()
  FROM unnest(v_line_items) AS item;
  
  -- Update assessment with quote link
  UPDATE property_assessments 
  SET quote_id = v_quote_id,
      quote_generated_at = NOW()
  WHERE id = p_assessment_id;
  
  -- Build success response
  v_result := jsonb_build_object(
    'success', true,
    'quote_id', v_quote_id,
    'assessment_id', p_assessment_id,
    'pricing_data', v_pricing_data,
    'line_items_count', array_length(v_line_items, 1)
  );
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'error_code', SQLSTATE
    );
END;
$$;
```

### **1.2 Assessment Pricing Calculation Function**

**Objective**: Calculate pricing adjustments based on assessment conditions

```sql
CREATE OR REPLACE FUNCTION calculate_assessment_pricing_adjustments(
  p_assessment_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_assessment property_assessments%ROWTYPE;
  v_property properties%ROWTYPE;
  v_base_rate NUMERIC;
  v_adjustments JSONB := '{}';
  v_multipliers JSONB := '{}';
  v_additional_costs JSONB := '{}';
  v_subtotal NUMERIC := 0;
  v_total NUMERIC := 0;
  v_tax_rate NUMERIC := 0.08; -- Default tax rate, should be configurable
BEGIN
  -- Get assessment data
  SELECT * INTO v_assessment FROM property_assessments WHERE id = p_assessment_id;
  SELECT * INTO v_property FROM properties WHERE id = v_assessment.property_id;
  
  -- Calculate base rate (per square foot)
  v_base_rate := COALESCE(v_assessment.estimated_base_rate, 0.50); -- Default $0.50/sqft
  
  -- Lawn condition adjustments
  v_multipliers := v_multipliers || jsonb_build_object(
    'lawn_condition', 
    CASE v_assessment.lawn_condition
      WHEN 'poor' THEN 1.4
      WHEN 'fair' THEN 1.2
      WHEN 'good' THEN 1.0
      WHEN 'excellent' THEN 0.9
      ELSE 1.0
    END
  );
  
  -- Soil condition adjustments
  v_multipliers := v_multipliers || jsonb_build_object(
    'soil_condition',
    CASE v_assessment.soil_condition
      WHEN 'poor' THEN 1.3
      WHEN 'compacted' THEN 1.25
      WHEN 'sandy' THEN 0.95
      WHEN 'clay' THEN 1.1
      ELSE 1.0
    END
  );
  
  -- Complexity score adjustments
  v_multipliers := v_multipliers || jsonb_build_object(
    'complexity_score',
    CASE 
      WHEN v_assessment.complexity_score >= 8 THEN 1.5
      WHEN v_assessment.complexity_score >= 6 THEN 1.3
      WHEN v_assessment.complexity_score >= 4 THEN 1.1
      ELSE 1.0
    END
  );
  
  -- Terrain adjustments
  v_multipliers := v_multipliers || jsonb_build_object(
    'terrain_difficulty',
    CASE v_assessment.terrain_type
      WHEN 'steep' THEN 1.4
      WHEN 'sloped' THEN 1.2
      WHEN 'uneven' THEN 1.15
      WHEN 'flat' THEN 1.0
      ELSE 1.0
    END
  );
  
  -- Access adjustments
  v_additional_costs := v_additional_costs || jsonb_build_object(
    'access_difficulty',
    CASE v_assessment.access_difficulty
      WHEN 'difficult' THEN 200.00 -- Additional equipment/labor
      WHEN 'limited' THEN 100.00
      WHEN 'good' THEN 0.00
      ELSE 0.00
    END
  );
  
  -- Equipment requirements
  v_additional_costs := v_additional_costs || jsonb_build_object(
    'special_equipment',
    CASE 
      WHEN v_assessment.equipment_requirements ? 'aerator' THEN 150.00
      WHEN v_assessment.equipment_requirements ? 'dethatcher' THEN 100.00
      ELSE 0.00
    END
  );
  
  -- Calculate subtotal
  v_subtotal := v_assessment.total_turf_area * v_base_rate;
  
  -- Apply multipliers
  SELECT v_subtotal * 
    (v_multipliers->>'lawn_condition')::NUMERIC *
    (v_multipliers->>'soil_condition')::NUMERIC *
    (v_multipliers->>'complexity_score')::NUMERIC *
    (v_multipliers->>'terrain_difficulty')::NUMERIC
  INTO v_subtotal;
  
  -- Add additional costs
  v_subtotal := v_subtotal + 
    (v_additional_costs->>'access_difficulty')::NUMERIC +
    (v_additional_costs->>'special_equipment')::NUMERIC;
  
  -- Apply profit margin
  v_subtotal := v_subtotal * (1 + COALESCE(v_assessment.profit_margin_percent, 20) / 100.0);
  
  -- Calculate tax and total
  v_total := v_subtotal * (1 + v_tax_rate);
  
  -- Build result
  RETURN jsonb_build_object(
    'subtotal', v_subtotal,
    'tax', v_total - v_subtotal,
    'total', v_total,
    'adjustments', jsonb_build_object(
      'multipliers', v_multipliers,
      'additional_costs', v_additional_costs,
      'base_rate_per_sqft', v_base_rate,
      'total_area', v_assessment.total_turf_area,
      'profit_margin_percent', COALESCE(v_assessment.profit_margin_percent, 20)
    )
  );
END;
$$;
```

### **1.3 Line Items Generation Function**

**Objective**: Generate appropriate line items based on assessment conditions

```sql
CREATE OR REPLACE FUNCTION generate_line_items_from_assessment(
  p_assessment_id UUID,
  p_template_id UUID DEFAULT NULL
)
RETURNS JSONB[]
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_assessment property_assessments%ROWTYPE;
  v_property properties%ROWTYPE;
  v_line_items JSONB[] := '{}';
  v_item JSONB;
  rec RECORD;
BEGIN
  SELECT * INTO v_assessment FROM property_assessments WHERE id = p_assessment_id;
  SELECT * INTO v_property FROM properties WHERE id = v_assessment.property_id;
  
  -- Core lawn care items based on conditions
  
  -- Lawn seeding/overseeding
  IF v_assessment.lawn_condition IN ('poor', 'fair') OR 
     (v_assessment.thin_grass_areas_sqft > 0) THEN
    
    SELECT * INTO rec FROM line_items 
    WHERE user_id = v_assessment.user_id 
      AND name ILIKE '%seed%' 
      AND category = 'seeding'
    LIMIT 1;
    
    IF FOUND THEN
      v_item := jsonb_build_object(
        'line_item_id', rec.id,
        'quantity', GREATEST(v_assessment.thin_grass_areas_sqft / 1000, 1),
        'unit_price', rec.price,
        'total_price', rec.price * GREATEST(v_assessment.thin_grass_areas_sqft / 1000, 1),
        'condition_source', jsonb_build_object(
          'reason', 'poor_lawn_condition',
          'lawn_condition', v_assessment.lawn_condition,
          'thin_areas', v_assessment.thin_grass_areas_sqft
        )
      );
      v_line_items := v_line_items || v_item;
    END IF;
  END IF;
  
  -- Fertilization based on soil condition
  SELECT * INTO rec FROM line_items 
  WHERE user_id = v_assessment.user_id 
    AND category = 'fertilization'
    AND name ILIKE '%fertilizer%'
  LIMIT 1;
  
  IF FOUND THEN
    v_item := jsonb_build_object(
      'line_item_id', rec.id,
      'quantity', CEIL(v_assessment.total_turf_area / 1000), -- Per 1000 sqft
      'unit_price', rec.price * 
        CASE v_assessment.soil_condition
          WHEN 'poor' THEN 1.3  -- Premium fertilizer needed
          WHEN 'compacted' THEN 1.2
          ELSE 1.0
        END,
      'total_price', rec.price * CEIL(v_assessment.total_turf_area / 1000) *
        CASE v_assessment.soil_condition
          WHEN 'poor' THEN 1.3
          WHEN 'compacted' THEN 1.2
          ELSE 1.0
        END,
      'condition_source', jsonb_build_object(
        'reason', 'soil_condition_based',
        'soil_condition', v_assessment.soil_condition,
        'total_area', v_assessment.total_turf_area
      )
    );
    v_line_items := v_line_items || v_item;
  END IF;
  
  -- Weed control based on infestation level
  IF v_assessment.weed_infestation_level >= 3 THEN
    SELECT * INTO rec FROM line_items 
    WHERE user_id = v_assessment.user_id 
      AND category = 'weed_control'
    LIMIT 1;
    
    IF FOUND THEN
      v_item := jsonb_build_object(
        'line_item_id', rec.id,
        'quantity', CEIL(v_assessment.total_turf_area / 1000),
        'unit_price', rec.price * 
          CASE 
            WHEN v_assessment.weed_infestation_level >= 7 THEN 1.5  -- Heavy infestation
            WHEN v_assessment.weed_infestation_level >= 5 THEN 1.3  -- Moderate
            ELSE 1.1  -- Light but noticeable
          END,
        'total_price', rec.price * CEIL(v_assessment.total_turf_area / 1000) *
          CASE 
            WHEN v_assessment.weed_infestation_level >= 7 THEN 1.5
            WHEN v_assessment.weed_infestation_level >= 5 THEN 1.3
            ELSE 1.1
          END,
        'condition_source', jsonb_build_object(
          'reason', 'weed_infestation',
          'infestation_level', v_assessment.weed_infestation_level,
          'total_area', v_assessment.total_turf_area
        )
      );
      v_line_items := v_line_items || v_item;
    END IF;
  END IF;
  
  -- Aeration based on soil condition
  IF v_assessment.soil_condition IN ('compacted', 'poor') THEN
    SELECT * INTO rec FROM line_items 
    WHERE user_id = v_assessment.user_id 
      AND (category = 'aeration' OR name ILIKE '%aerat%')
    LIMIT 1;
    
    IF FOUND THEN
      v_item := jsonb_build_object(
        'line_item_id', rec.id,
        'quantity', CEIL(v_assessment.total_turf_area / 1000),
        'unit_price', rec.price,
        'total_price', rec.price * CEIL(v_assessment.total_turf_area / 1000),
        'condition_source', jsonb_build_object(
          'reason', 'soil_compaction',
          'soil_condition', v_assessment.soil_condition,
          'total_area', v_assessment.total_turf_area
        )
      );
      v_line_items := v_line_items || v_item;
    END IF;
  END IF;
  
  -- Equipment/access charges
  IF v_assessment.access_difficulty = 'difficult' THEN
    SELECT * INTO rec FROM line_items 
    WHERE user_id = v_assessment.user_id 
      AND (category = 'access_fee' OR name ILIKE '%access%' OR name ILIKE '%equipment%')
    LIMIT 1;
    
    IF FOUND THEN
      v_item := jsonb_build_object(
        'line_item_id', rec.id,
        'quantity', 1,
        'unit_price', rec.price,
        'total_price', rec.price,
        'condition_source', jsonb_build_object(
          'reason', 'access_difficulty',
          'access_level', v_assessment.access_difficulty
        )
      );
      v_line_items := v_line_items || v_item;
    END IF;
  END IF;
  
  RETURN v_line_items;
END;
$$;
```

---

## 🔧 Phase 2: Workflow Automation & Triggers

### **2.1 Assessment Completion Trigger**

**Objective**: Automatically handle assessment completion workflow

```sql
CREATE OR REPLACE FUNCTION handle_assessment_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only trigger on status change to 'completed'
  IF NEW.assessment_status = 'completed' AND 
     (OLD.assessment_status IS NULL OR OLD.assessment_status != 'completed') THEN
    
    -- Update completion timestamp
    NEW.completed_at := NOW();
    
    -- Calculate final pricing estimates if not already done
    IF NEW.estimated_total_cost IS NULL THEN
      SELECT (calculate_assessment_pricing_adjustments(NEW.id)->>'total')::NUMERIC 
      INTO NEW.estimated_total_cost;
    END IF;
    
    -- Log completion event for workflow tracking
    INSERT INTO assessment_workflow_events (
      assessment_id,
      event_type,
      event_data,
      created_at
    ) VALUES (
      NEW.id,
      'assessment_completed',
      jsonb_build_object(
        'completion_time', NEW.completed_at,
        'estimated_cost', NEW.estimated_total_cost,
        'complexity_score', NEW.complexity_score
      ),
      NOW()
    );
    
    -- Trigger notification for quote generation (if configured)
    PERFORM pg_notify(
      'assessment_completed',
      json_build_object(
        'assessment_id', NEW.id,
        'property_id', NEW.property_id,
        'user_id', NEW.user_id,
        'estimated_cost', NEW.estimated_total_cost
      )::text
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER assessment_completion_trigger
BEFORE UPDATE ON property_assessments
FOR EACH ROW
EXECUTE FUNCTION handle_assessment_completion();
```

### **2.2 Quote Update from Assessment Changes**

**Objective**: Update linked quotes when assessments are modified

```sql
CREATE OR REPLACE FUNCTION update_quote_from_assessment_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_quote_id UUID;
  v_new_pricing JSONB;
BEGIN
  -- Only process if quote exists and assessment data changed significantly
  IF NEW.quote_id IS NOT NULL AND (
    OLD.lawn_condition != NEW.lawn_condition OR
    OLD.soil_condition != NEW.soil_condition OR
    OLD.complexity_score != NEW.complexity_score OR
    OLD.total_turf_area != NEW.total_turf_area OR
    ABS(OLD.weed_infestation_level - NEW.weed_infestation_level) >= 2
  ) THEN
    
    v_quote_id := NEW.quote_id;
    
    -- Recalculate pricing based on new assessment data
    SELECT calculate_assessment_pricing_adjustments(NEW.id) INTO v_new_pricing;
    
    -- Update quote totals
    UPDATE quotes 
    SET 
      subtotal = (v_new_pricing->>'subtotal')::NUMERIC,
      tax = (v_new_pricing->>'tax')::NUMERIC,
      total = (v_new_pricing->>'total')::NUMERIC,
      updated_at = NOW(),
      metadata = COALESCE(metadata, '{}') || jsonb_build_object(
        'last_assessment_update', NOW(),
        'pricing_recalculated', true,
        'assessment_changes', jsonb_build_object(
          'lawn_condition', jsonb_build_object('old', OLD.lawn_condition, 'new', NEW.lawn_condition),
          'soil_condition', jsonb_build_object('old', OLD.soil_condition, 'new', NEW.soil_condition),
          'complexity_score', jsonb_build_object('old', OLD.complexity_score, 'new', NEW.complexity_score)
        )
      )
    WHERE id = v_quote_id;
    
    -- Log the change for audit trail
    INSERT INTO assessment_workflow_events (
      assessment_id,
      event_type,
      event_data,
      created_at
    ) VALUES (
      NEW.id,
      'quote_updated_from_assessment',
      jsonb_build_object(
        'quote_id', v_quote_id,
        'old_total', OLD.estimated_total_cost,
        'new_total', (v_new_pricing->>'total')::NUMERIC,
        'changes', v_new_pricing->'adjustments'
      ),
      NOW()
    );
    
    -- Notify about quote updates
    PERFORM pg_notify(
      'quote_updated_from_assessment',
      json_build_object(
        'quote_id', v_quote_id,
        'assessment_id', NEW.id,
        'new_total', v_new_pricing->>'total'
      )::text
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER quote_update_from_assessment_trigger
AFTER UPDATE ON property_assessments
FOR EACH ROW
EXECUTE FUNCTION update_quote_from_assessment_changes();
```

---

## 📊 Phase 3: Performance & Analytics Functions

### **3.1 Assessment Dashboard Data Function**

**Objective**: Optimized data retrieval for property assessment dashboard

```sql
CREATE OR REPLACE FUNCTION get_property_assessment_dashboard(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0,
  p_filters JSONB DEFAULT '{}'
)
RETURNS TABLE (
  property_id UUID,
  property_address TEXT,
  client_name TEXT,
  client_type TEXT,
  assessment_id UUID,
  assessment_status TEXT,
  assessment_date TIMESTAMPTZ,
  complexity_score INTEGER,
  estimated_cost NUMERIC,
  quote_id UUID,
  quote_status TEXT,
  quote_total NUMERIC,
  next_action TEXT,
  priority_level TEXT,
  days_since_assessment INTEGER
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
    c.client_type as client_type,
    a.id as assessment_id,
    a.assessment_status,
    a.assessment_date,
    a.complexity_score,
    a.estimated_total_cost as estimated_cost,
    q.id as quote_id,
    q.status as quote_status,
    q.total as quote_total,
    CASE 
      WHEN a.assessment_status = 'completed' AND q.id IS NULL THEN 'needs_quote'
      WHEN a.assessment_status = 'in_progress' THEN 'complete_assessment'
      WHEN q.status = 'draft' THEN 'finalize_quote'
      WHEN q.status = 'sent' THEN 'follow_up'
      WHEN q.status = 'accepted' THEN 'schedule_service'
      ELSE 'review'
    END as next_action,
    CASE 
      WHEN a.assessment_status = 'completed' AND q.id IS NULL 
           AND a.assessment_date < NOW() - INTERVAL '3 days' THEN 'high'
      WHEN a.assessment_status = 'in_progress' 
           AND a.created_at < NOW() - INTERVAL '7 days' THEN 'high'
      WHEN q.status = 'sent' 
           AND q.sent_at < NOW() - INTERVAL '5 days' THEN 'medium'
      ELSE 'low'
    END as priority_level,
    EXTRACT(DAY FROM NOW() - a.assessment_date)::INTEGER as days_since_assessment
  FROM properties p
  LEFT JOIN clients c ON p.client_id = c.id
  LEFT JOIN property_assessments a ON p.id = a.property_id
  LEFT JOIN quotes q ON a.quote_id = q.id
  WHERE p.user_id = p_user_id
    AND p.is_active = true
    AND (p_filters = '{}' OR (
      -- Apply filters if provided
      (NOT p_filters ? 'status' OR a.assessment_status = p_filters->>'status') AND
      (NOT p_filters ? 'priority' OR 
        CASE 
          WHEN a.assessment_status = 'completed' AND q.id IS NULL 
               AND a.assessment_date < NOW() - INTERVAL '3 days' THEN 'high'
          WHEN a.assessment_status = 'in_progress' 
               AND a.created_at < NOW() - INTERVAL '7 days' THEN 'high'
          WHEN q.status = 'sent' 
               AND q.sent_at < NOW() - INTERVAL '5 days' THEN 'medium'
          ELSE 'low'
        END = p_filters->>'priority'
      ) AND
      (NOT p_filters ? 'client_type' OR c.client_type = p_filters->>'client_type')
    ))
  ORDER BY 
    CASE 
      WHEN a.assessment_status = 'completed' AND q.id IS NULL 
           AND a.assessment_date < NOW() - INTERVAL '3 days' THEN 1
      WHEN a.assessment_status = 'in_progress' 
           AND a.created_at < NOW() - INTERVAL '7 days' THEN 2
      WHEN q.status = 'sent' 
           AND q.sent_at < NOW() - INTERVAL '5 days' THEN 3
      ELSE 4
    END,
    a.assessment_date DESC NULLS LAST
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;
```

### **3.2 Bulk Assessment Operations**

**Objective**: Handle bulk operations for similar properties efficiently

```sql
CREATE OR REPLACE FUNCTION bulk_generate_quotes_from_assessments(
  p_assessment_ids UUID[],
  p_user_id UUID,
  p_template_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_assessment_id UUID;
  v_results JSONB[] := '{}';
  v_success_count INTEGER := 0;
  v_error_count INTEGER := 0;
  v_result JSONB;
BEGIN
  -- Process each assessment
  FOREACH v_assessment_id IN ARRAY p_assessment_ids
  LOOP
    SELECT generate_quote_from_assessment(v_assessment_id, p_template_id, p_user_id)
    INTO v_result;
    
    v_results := v_results || jsonb_build_object(
      'assessment_id', v_assessment_id,
      'result', v_result
    );
    
    IF v_result->>'success' = 'true' THEN
      v_success_count := v_success_count + 1;
    ELSE
      v_error_count := v_error_count + 1;
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object(
    'total_processed', array_length(p_assessment_ids, 1),
    'successful', v_success_count,
    'errors', v_error_count,
    'results', v_results,
    'processed_at', NOW()
  );
END;
$$;
```

---

## 🔧 Phase 4: Supporting Tables & Indexes

### **4.1 Assessment Pricing Rules Table**

**Objective**: Configurable pricing rules for different conditions

```sql
CREATE TABLE IF NOT EXISTS assessment_pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rule_name TEXT NOT NULL,
  condition_type TEXT NOT NULL CHECK (condition_type IN (
    'lawn_condition', 'soil_condition', 'complexity_score', 
    'terrain_type', 'access_difficulty', 'weed_infestation'
  )),
  condition_value TEXT NOT NULL,
  adjustment_type TEXT NOT NULL CHECK (adjustment_type IN (
    'multiplier', 'flat_fee', 'per_sqft', 'percentage'
  )),
  adjustment_value NUMERIC(10,4) NOT NULL,
  min_area NUMERIC(10,2) DEFAULT 0,
  max_area NUMERIC(10,2),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_assessment_pricing_rules_user_condition 
ON assessment_pricing_rules(user_id, condition_type, active);

CREATE INDEX idx_assessment_pricing_rules_lookup
ON assessment_pricing_rules(user_id, condition_type, condition_value)
WHERE active = true;

-- RLS Policy
CREATE POLICY assessment_pricing_rules_policy ON assessment_pricing_rules
FOR ALL USING (auth.uid() = user_id);

-- Insert default pricing rules function
CREATE OR REPLACE FUNCTION create_default_pricing_rules(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO assessment_pricing_rules (user_id, rule_name, condition_type, condition_value, adjustment_type, adjustment_value) VALUES
  (p_user_id, 'Poor Lawn Condition', 'lawn_condition', 'poor', 'multiplier', 1.4),
  (p_user_id, 'Fair Lawn Condition', 'lawn_condition', 'fair', 'multiplier', 1.2),
  (p_user_id, 'Good Lawn Condition', 'lawn_condition', 'good', 'multiplier', 1.0),
  (p_user_id, 'Excellent Lawn Condition', 'lawn_condition', 'excellent', 'multiplier', 0.9),
  (p_user_id, 'Compacted Soil', 'soil_condition', 'compacted', 'multiplier', 1.25),
  (p_user_id, 'Poor Soil', 'soil_condition', 'poor', 'multiplier', 1.3),
  (p_user_id, 'High Complexity', 'complexity_score', '8-10', 'multiplier', 1.5),
  (p_user_id, 'Medium Complexity', 'complexity_score', '6-7', 'multiplier', 1.3),
  (p_user_id, 'Low Complexity', 'complexity_score', '4-5', 'multiplier', 1.1),
  (p_user_id, 'Difficult Access', 'access_difficulty', 'difficult', 'flat_fee', 200.00),
  (p_user_id, 'Limited Access', 'access_difficulty', 'limited', 'flat_fee', 100.00);
END;
$$;
```

### **4.2 Assessment Workflow Events Table**

**Objective**: Audit trail and workflow tracking

```sql
CREATE TABLE IF NOT EXISTS assessment_workflow_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES property_assessments(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'assessment_created', 'assessment_completed', 'quote_generated',
    'quote_updated_from_assessment', 'pricing_recalculated',
    'workflow_error', 'manual_override'
  )),
  event_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX idx_assessment_workflow_events_assessment 
ON assessment_workflow_events(assessment_id, created_at DESC);

CREATE INDEX idx_assessment_workflow_events_type
ON assessment_workflow_events(event_type, created_at DESC);

-- RLS Policy  
CREATE POLICY assessment_workflow_events_policy ON assessment_workflow_events
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM property_assessments pa
    WHERE pa.id = assessment_workflow_events.assessment_id
    AND pa.user_id = auth.uid()
  )
);
```

### **4.3 Performance Optimization Indexes**

**Objective**: Optimize queries for UI dashboard performance

```sql
-- Assessment-Quote Integration Indexes
CREATE INDEX IF NOT EXISTS idx_assessments_quote_integration 
ON property_assessments(user_id, quote_id, assessment_status)
WHERE quote_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_quotes_assessment_link
ON quotes(assessment_id, status, created_at DESC)
WHERE assessment_id IS NOT NULL;

-- Dashboard Performance Indexes
CREATE INDEX IF NOT EXISTS idx_property_assessments_dashboard 
ON property_assessments(
  user_id, assessment_status, assessment_date DESC, priority_level DESC
) INCLUDE (property_id, estimated_total_cost, complexity_score);

-- Bulk Operations Index
CREATE INDEX IF NOT EXISTS idx_assessments_bulk_operations
ON property_assessments(user_id, assessment_status)
WHERE assessment_status = 'completed' AND quote_id IS NULL;

-- Full-text search for assessments
CREATE INDEX IF NOT EXISTS idx_property_assessments_search 
ON property_assessments USING gin(
  to_tsvector('english', 
    COALESCE(assessment_notes, '') || ' ' || 
    COALESCE(recommendations, '') || ' ' ||
    COALESCE(additional_services_needed, '')
  )
);
```

---

## 📊 Phase 5: Materialized Views for Performance

### **5.1 Assessment-Quote Dashboard View**

**Objective**: Pre-computed dashboard data for <50ms load times

```sql
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_assessment_quote_dashboard AS
SELECT 
  p.id as property_id,
  p.user_id,
  p.service_address,
  p.property_type,
  c.id as client_id,
  c.name as client_name,
  c.client_type,
  a.id as assessment_id,
  a.assessment_number,
  a.assessment_status,
  a.assessment_date,
  a.complexity_score,
  a.estimated_total_cost,
  a.total_turf_area,
  q.id as quote_id,
  q.quote_number,
  q.status as quote_status,
  q.total as quote_value,
  q.created_at as quote_created_at,
  q.sent_at as quote_sent_at,
  -- Calculated fields
  CASE 
    WHEN a.assessment_status = 'completed' AND q.id IS NULL THEN 'needs_quote'
    WHEN a.assessment_status = 'in_progress' THEN 'assessment_pending'
    WHEN q.status = 'draft' THEN 'quote_draft'
    WHEN q.status = 'sent' THEN 'quote_sent'
    WHEN q.status = 'accepted' THEN 'quote_accepted'
    ELSE 'complete'
  END as next_action,
  CASE 
    WHEN a.assessment_status = 'completed' AND q.id IS NULL 
         AND a.assessment_date < NOW() - INTERVAL '3 days' THEN 'high'
    WHEN a.assessment_status = 'in_progress' 
         AND a.created_at < NOW() - INTERVAL '7 days' THEN 'high'
    WHEN q.status = 'sent' 
         AND q.sent_at < NOW() - INTERVAL '5 days' THEN 'medium'
    ELSE 'low'
  END as priority_level,
  EXTRACT(DAY FROM NOW() - a.assessment_date)::INTEGER as days_since_assessment,
  CASE WHEN q.id IS NOT NULL THEN true ELSE false END as has_quote,
  -- Revenue metrics
  CASE 
    WHEN q.status = 'accepted' THEN q.total
    ELSE 0
  END as revenue_value,
  NOW() as last_updated
FROM properties p
LEFT JOIN clients c ON p.client_id = c.id
LEFT JOIN property_assessments a ON p.id = a.property_id
LEFT JOIN quotes q ON a.quote_id = q.id
WHERE p.is_active = true;

-- Indexes on materialized view
CREATE UNIQUE INDEX idx_mv_assessment_dashboard_unique
ON mv_assessment_quote_dashboard(property_id, COALESCE(assessment_id, '00000000-0000-0000-0000-000000000000'::UUID));

CREATE INDEX idx_mv_assessment_dashboard_user_action
ON mv_assessment_quote_dashboard(user_id, next_action, priority_level);

CREATE INDEX idx_mv_assessment_dashboard_performance
ON mv_assessment_quote_dashboard(user_id, assessment_date DESC)
INCLUDE (property_id, client_name, assessment_status, quote_status);

-- Refresh function
CREATE OR REPLACE FUNCTION refresh_assessment_dashboard()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_assessment_quote_dashboard;
END;
$$;

-- Auto-refresh trigger (refresh every hour or on significant changes)
CREATE OR REPLACE FUNCTION trigger_dashboard_refresh()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Use pg_notify to trigger external refresh process
  PERFORM pg_notify('refresh_dashboard', 'assessment_quote_data_changed');
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER assessment_dashboard_refresh_trigger
AFTER INSERT OR UPDATE OR DELETE ON property_assessments
FOR EACH STATEMENT
EXECUTE FUNCTION trigger_dashboard_refresh();

CREATE TRIGGER quote_dashboard_refresh_trigger
AFTER INSERT OR UPDATE OR DELETE ON quotes
FOR EACH STATEMENT
EXECUTE FUNCTION trigger_dashboard_refresh();
```

---

## 🔐 Security & Access Control

### **Security Policies for New Functions**

```sql
-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION generate_quote_from_assessment(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_assessment_pricing_adjustments(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_line_items_from_assessment(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_property_assessment_dashboard(UUID, INTEGER, INTEGER, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION bulk_generate_quotes_from_assessments(UUID[], UUID, UUID) TO authenticated;

-- RLS policies for new tables
ALTER TABLE assessment_pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_workflow_events ENABLE ROW LEVEL SECURITY;

-- Function security
CREATE OR REPLACE FUNCTION check_assessment_access(p_assessment_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM property_assessments 
    WHERE id = p_assessment_id AND user_id = p_user_id
  );
END;
$$;
```

---

## 📋 Implementation Checklist

### **Phase 1: Core Functions** (Week 1-3)
- [ ] Create `generate_quote_from_assessment()` function
- [ ] Create `calculate_assessment_pricing_adjustments()` function  
- [ ] Create `generate_line_items_from_assessment()` function
- [ ] Create assessment completion trigger
- [ ] Create quote update trigger
- [ ] Add assessment pricing rules table
- [ ] Test core automation workflow
- [ ] Performance testing with 1000+ assessments

### **Phase 2: Dashboard & Analytics** (Week 4-5)
- [ ] Create `get_property_assessment_dashboard()` function
- [ ] Create `bulk_generate_quotes_from_assessments()` function
- [ ] Create materialized view `mv_assessment_quote_dashboard`
- [ ] Add workflow events table and audit trail
- [ ] Create dashboard refresh automation
- [ ] Performance testing for dashboard queries

### **Phase 3: Optimization & Monitoring** (Week 6)
- [ ] Add all performance indexes
- [ ] Create monitoring functions for query performance
- [ ] Set up automated materialized view refresh
- [ ] Create database maintenance procedures
- [ ] Documentation for database administrators

### **Quality Assurance**
- [ ] All functions handle error conditions gracefully
- [ ] RLS policies properly secure data access
- [ ] Performance targets met (<150ms for complex queries)
- [ ] Audit trail captures all significant events
- [ ] Bulk operations handle large datasets efficiently

---

## 🎯 Success Criteria

### **Functional Requirements**
- [ ] **Assessment-to-quote generation** completes in <5 seconds
- [ ] **Pricing calculations** accurate within 2% of manual calculations
- [ ] **Dashboard queries** return results in <100ms for 10,000+ records
- [ ] **Bulk operations** handle 100+ assessments simultaneously
- [ ] **Audit trail** captures all workflow events

### **Performance Requirements**  
- [ ] **Database CPU usage** <80% during peak automation
- [ ] **Memory consumption** efficient for concurrent operations
- [ ] **Query execution plans** optimized with proper index usage
- [ ] **Materialized view refresh** completes in <30 seconds

### **Security Requirements**
- [ ] **RLS policies** prevent unauthorized data access
- [ ] **Function permissions** properly restrict access
- [ ] **Audit trail** cannot be tampered with
- [ ] **Error messages** don't expose sensitive information

---

## 💡 Conclusion

This database automation foundation will transform the QuoteKit assessment-quote integration from a **manual, friction-filled process** into a **seamless, automated workflow** that maximizes user productivity and business value.

**Key Benefits**:
- **5x faster** quote generation from assessments
- **95% consistency** in condition-based pricing
- **Automated workflow** reduces manual errors
- **Scalable architecture** supports business growth

**Implementation Priority**: These database enhancements are **critical prerequisites** for the UI optimization roadmap. Without automated database workflows, even perfect UI components cannot deliver the seamless user experience customers expect.

---

*This document provides the complete technical specification for transforming QuoteKit's database layer to support intelligent, automated assessment-to-quote workflows that unlock the platform's full potential.*