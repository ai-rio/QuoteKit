-- =====================================================
-- PROPERTY ASSESSMENT DATABASE - M2.1
-- =====================================================
-- This migration implements a comprehensive property assessment system for lawn care
-- Supports photo/video uploads, detailed condition tracking, and equipment requirements
-- Optimized for <150ms query performance with 1000+ records
-- Links assessments to properties and quotes for complete service workflow

-- =====================================================
-- ENUMS AND TYPES FOR ASSESSMENT SYSTEM
-- =====================================================

-- Overall property condition assessment
CREATE TYPE assessment_overall_condition AS ENUM (
  'excellent',    -- Well-maintained, minimal work required
  'good',         -- Minor touch-ups needed
  'fair',         -- Moderate work required
  'poor',         -- Significant renovation needed
  'critical'      -- Major reconstruction required
);

-- Lawn condition specifically
CREATE TYPE lawn_condition AS ENUM (
  'pristine',     -- Perfect lawn condition
  'healthy',      -- Good condition with minor issues
  'patchy',       -- Some bare spots or weak areas
  'poor',         -- Significant damage or neglect
  'dead'          -- Needs complete renovation
);

-- Soil condition assessment
CREATE TYPE soil_condition AS ENUM (
  'excellent',    -- Rich, well-draining soil
  'good',         -- Adequate for most plants
  'compacted',    -- Needs aeration
  'sandy',        -- Drainage issues, needs amendments
  'clay',         -- Poor drainage, heavy soil
  'contaminated'  -- Requires soil remediation
);

-- Irrigation system status
CREATE TYPE irrigation_status AS ENUM (
  'none',         -- No irrigation system
  'excellent',    -- Fully functional system
  'good',         -- Minor repairs needed
  'needs_repair', -- Major repairs required
  'outdated',     -- Needs full replacement
  'broken'        -- Non-functional
);

-- Assessment completion status
CREATE TYPE assessment_status AS ENUM (
  'scheduled',    -- Assessment appointment set
  'in_progress',  -- Currently being conducted
  'completed',    -- Assessment finished
  'reviewed',     -- Assessment reviewed and approved
  'requires_followup' -- Additional visit needed
);

-- Media types for assessment documentation
CREATE TYPE assessment_media_type AS ENUM (
  'photo',
  'video',
  'document',
  'audio_note',
  '360_photo'
);

-- Equipment categories for lawn care
CREATE TYPE equipment_category AS ENUM (
  'mowing',       -- Mowers, trimmers, edgers
  'landscaping',  -- Shovels, rakes, pruners
  'irrigation',   -- Sprinklers, hoses, timers
  'soil_care',    -- Aerators, spreaders, tillers
  'tree_care',    -- Chain saws, pole pruners
  'cleanup',      -- Blowers, vacuums, bags
  'specialized',  -- Stump grinders, dethatchers
  'safety'        -- Protective equipment, barriers
);

-- =====================================================
-- PROPERTY ASSESSMENTS TABLE
-- =====================================================

CREATE TABLE public.property_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  quote_id UUID REFERENCES public.quotes(id) ON DELETE SET NULL,
  
  -- Assessment metadata
  assessment_number TEXT GENERATED ALWAYS AS (
    'ASS-' || EXTRACT(YEAR FROM created_at) || '-' || 
    LPAD(EXTRACT(DOY FROM created_at)::TEXT, 3, '0') || '-' ||
    SUBSTRING(id::TEXT, 1, 8)
  ) STORED,
  assessment_date TIMESTAMPTZ DEFAULT NOW(),
  scheduled_date TIMESTAMPTZ,
  completed_date TIMESTAMPTZ,
  assessment_status assessment_status DEFAULT 'scheduled',
  
  -- Assessor information
  assessor_name TEXT NOT NULL,
  assessor_contact TEXT,
  weather_conditions TEXT,
  temperature_f INTEGER,
  
  -- Overall property assessment
  overall_condition assessment_overall_condition,
  total_estimated_hours NUMERIC(6, 2), -- Total labor hours estimated
  complexity_score INTEGER CHECK (complexity_score >= 1 AND complexity_score <= 10),
  priority_level INTEGER DEFAULT 5 CHECK (priority_level >= 1 AND priority_level <= 10),
  
  -- Lawn and landscape assessment
  lawn_condition lawn_condition,
  lawn_area_measured NUMERIC(10, 2), -- Actual measured area
  lawn_area_estimated NUMERIC(10, 2), -- Estimated if not measured
  grass_type TEXT,
  weed_coverage_percent INTEGER CHECK (weed_coverage_percent >= 0 AND weed_coverage_percent <= 100),
  bare_spots_count INTEGER DEFAULT 0,
  thatch_thickness_inches NUMERIC(4, 2),
  
  -- Soil and drainage
  soil_condition soil_condition,
  soil_ph NUMERIC(3, 1) CHECK (soil_ph >= 0 AND soil_ph <= 14),
  drainage_quality INTEGER CHECK (drainage_quality >= 1 AND drainage_quality <= 5), -- 1=poor, 5=excellent
  slope_grade_percent NUMERIC(5, 2),
  erosion_issues BOOLEAN DEFAULT FALSE,
  compaction_level INTEGER CHECK (compaction_level >= 1 AND compaction_level <= 5),
  
  -- Existing landscape features
  tree_count INTEGER DEFAULT 0,
  shrub_count INTEGER DEFAULT 0,
  flower_bed_area NUMERIC(10, 2),
  hardscape_area_measured NUMERIC(10, 2),
  existing_mulch_area NUMERIC(10, 2),
  fence_linear_feet NUMERIC(8, 2),
  
  -- Infrastructure and utilities
  irrigation_status irrigation_status DEFAULT 'none',
  irrigation_zones_count INTEGER DEFAULT 0,
  electrical_outlets_available INTEGER DEFAULT 0,
  water_source_access BOOLEAN DEFAULT TRUE,
  utility_lines_marked BOOLEAN DEFAULT FALSE,
  
  -- Access and logistics
  vehicle_access_width_feet NUMERIC(5, 2),
  gate_width_feet NUMERIC(5, 2),
  distance_to_disposal_feet INTEGER,
  parking_available BOOLEAN DEFAULT TRUE,
  neighbor_considerations TEXT,
  
  -- Obstacles and challenges (JSONB for flexibility)
  obstacles JSONB DEFAULT '[]'::jsonb, -- Array of obstacle objects
  special_considerations JSONB DEFAULT '{}'::jsonb, -- Flexible key-value pairs
  
  -- Equipment and material requirements
  equipment_needed equipment_category[] DEFAULT '{}',
  material_requirements JSONB DEFAULT '{}'::jsonb, -- Material types and quantities
  dump_truck_access BOOLEAN DEFAULT TRUE,
  crane_access_needed BOOLEAN DEFAULT FALSE,
  
  -- Safety and compliance
  safety_hazards TEXT[],
  permit_required BOOLEAN DEFAULT FALSE,
  hoa_restrictions TEXT,
  environmental_considerations TEXT,
  
  -- Pricing and estimates
  estimated_material_cost NUMERIC(10, 2),
  estimated_labor_cost NUMERIC(10, 2),
  estimated_equipment_cost NUMERIC(10, 2),
  estimated_disposal_cost NUMERIC(10, 2),
  estimated_total_cost NUMERIC(10, 2),
  profit_margin_percent NUMERIC(5, 2) DEFAULT 20.00,
  
  -- Assessment notes and recommendations
  assessment_notes TEXT,
  recommendations TEXT,
  follow_up_needed BOOLEAN DEFAULT FALSE,
  follow_up_notes TEXT,
  internal_notes TEXT, -- Private notes not shared with client
  
  -- Quality control
  photos_taken_count INTEGER DEFAULT 0,
  measurements_verified BOOLEAN DEFAULT FALSE,
  client_walkthrough_completed BOOLEAN DEFAULT FALSE,
  assessment_reviewed_by TEXT,
  review_date TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on property_assessments table
ALTER TABLE public.property_assessments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for property assessments
CREATE POLICY "Users can manage their own property assessments" 
  ON public.property_assessments FOR ALL 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view assessments for their properties" 
  ON public.property_assessments FOR SELECT 
  USING (
    auth.uid() = user_id AND 
    property_id IN (SELECT id FROM public.properties WHERE user_id = auth.uid())
  );

-- =====================================================
-- ASSESSMENT MEDIA TABLE
-- =====================================================

CREATE TABLE public.assessment_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assessment_id UUID NOT NULL REFERENCES public.property_assessments(id) ON DELETE CASCADE,
  
  -- Media information
  media_type assessment_media_type NOT NULL,
  filename TEXT NOT NULL,
  original_filename TEXT,
  file_size_bytes BIGINT,
  mime_type TEXT,
  
  -- Storage information (Supabase Storage)
  storage_bucket TEXT DEFAULT 'assessment-media',
  storage_path TEXT NOT NULL,
  public_url TEXT,
  
  -- Media metadata
  caption TEXT,
  description TEXT,
  taken_at TIMESTAMPTZ DEFAULT NOW(),
  location_description TEXT, -- Where on the property this was taken
  
  -- Image/video specific metadata (JSONB for flexibility)
  metadata JSONB DEFAULT '{}'::jsonb, -- EXIF data, dimensions, etc.
  
  -- Organization and tagging
  tags TEXT[],
  category TEXT, -- before, during, after, problem_area, solution, etc.
  sort_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE, -- Main photo for assessment
  
  -- Client visibility
  visible_to_client BOOLEAN DEFAULT TRUE,
  requires_approval BOOLEAN DEFAULT FALSE,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  
  -- Processing status
  processing_status TEXT DEFAULT 'uploaded' CHECK (
    processing_status IN ('uploaded', 'processing', 'processed', 'failed')
  ),
  thumbnail_generated BOOLEAN DEFAULT FALSE,
  compressed_generated BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on assessment_media table
ALTER TABLE public.assessment_media ENABLE ROW LEVEL SECURITY;

-- RLS Policies for assessment media
CREATE POLICY "Users can manage their own assessment media" 
  ON public.assessment_media FOR ALL 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view media for their assessments" 
  ON public.assessment_media FOR SELECT 
  USING (
    auth.uid() = user_id AND 
    assessment_id IN (
      SELECT id FROM public.property_assessments WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- PERFORMANCE INDEXES
-- =====================================================

-- Primary lookup indexes for property assessments
CREATE INDEX idx_property_assessments_user_id ON public.property_assessments(user_id);
CREATE INDEX idx_property_assessments_property_id ON public.property_assessments(property_id);
CREATE INDEX idx_property_assessments_quote_id ON public.property_assessments(quote_id) WHERE quote_id IS NOT NULL;

-- Status and date-based queries (most common filters)
CREATE INDEX idx_property_assessments_status_date ON public.property_assessments(user_id, assessment_status, assessment_date);
CREATE INDEX idx_property_assessments_scheduled ON public.property_assessments(user_id, scheduled_date) WHERE scheduled_date IS NOT NULL;
CREATE INDEX idx_property_assessments_completed ON public.property_assessments(user_id, completed_date) WHERE completed_date IS NOT NULL;

-- Performance indexes for common queries
CREATE INDEX idx_property_assessments_complexity ON public.property_assessments(user_id, complexity_score) WHERE complexity_score IS NOT NULL;
CREATE INDEX idx_property_assessments_priority ON public.property_assessments(user_id, priority_level);
CREATE INDEX idx_property_assessments_condition ON public.property_assessments(user_id, overall_condition);

-- Composite index for assessment dashboard queries
CREATE INDEX idx_property_assessments_dashboard ON public.property_assessments(
  user_id, assessment_status, assessment_date DESC, priority_level DESC
);

-- Assessment media indexes
CREATE INDEX idx_assessment_media_user_id ON public.assessment_media(user_id);
CREATE INDEX idx_assessment_media_assessment_id ON public.assessment_media(assessment_id);
CREATE INDEX idx_assessment_media_type ON public.assessment_media(assessment_id, media_type);
CREATE INDEX idx_assessment_media_featured ON public.assessment_media(assessment_id, is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_assessment_media_client_visible ON public.assessment_media(assessment_id, visible_to_client) WHERE visible_to_client = TRUE;

-- Full-text search for assessments
CREATE INDEX idx_property_assessments_search ON public.property_assessments USING gin(
  to_tsvector('english', 
    COALESCE(assessment_notes, '') || ' ' ||
    COALESCE(recommendations, '') || ' ' ||
    COALESCE(assessor_name, '') || ' ' ||
    COALESCE(grass_type, '') || ' ' ||
    COALESCE(internal_notes, '')
  )
);

-- =====================================================
-- ASSESSMENT ANALYTICS VIEW
-- =====================================================

CREATE VIEW public.assessment_analytics AS
SELECT 
  a.user_id,
  a.id as assessment_id,
  a.assessment_number,
  a.assessment_date,
  a.assessment_status,
  a.overall_condition,
  a.complexity_score,
  a.priority_level,
  
  -- Property information
  p.id as property_id,
  p.property_name,
  p.service_address,
  p.property_type,
  
  -- Client information
  c.id as client_id,
  c.name as client_name,
  c.company_name,
  c.client_type,
  
  -- Assessment metrics
  a.total_estimated_hours,
  a.estimated_total_cost,
  a.profit_margin_percent,
  
  -- Property measurements
  a.lawn_area_measured,
  a.hardscape_area_measured,
  a.tree_count,
  a.shrub_count,
  
  -- Condition assessments
  a.lawn_condition,
  a.soil_condition,
  a.irrigation_status,
  a.weed_coverage_percent,
  
  -- Media and documentation
  COUNT(m.id) as media_count,
  COUNT(m.id) FILTER (WHERE m.media_type = 'photo') as photo_count,
  COUNT(m.id) FILTER (WHERE m.media_type = 'video') as video_count,
  COUNT(m.id) FILTER (WHERE m.is_featured = true) as featured_media_count,
  
  -- Quote relationship
  a.quote_id,
  CASE WHEN a.quote_id IS NOT NULL THEN true ELSE false END as has_quote,
  
  -- Timing metrics
  EXTRACT(EPOCH FROM (a.completed_date - a.assessment_date))/3600 as assessment_duration_hours,
  
  -- Follow-up requirements
  a.follow_up_needed,
  a.measurements_verified,
  a.client_walkthrough_completed,
  
  -- Creation tracking
  a.created_at,
  a.updated_at

FROM public.property_assessments a
LEFT JOIN public.properties p ON a.property_id = p.id
LEFT JOIN public.clients c ON p.client_id = c.id
LEFT JOIN public.assessment_media m ON a.id = m.assessment_id
GROUP BY 
  a.id, a.user_id, a.assessment_number, a.assessment_date, a.assessment_status,
  a.overall_condition, a.complexity_score, a.priority_level, a.total_estimated_hours,
  a.estimated_total_cost, a.profit_margin_percent, a.lawn_area_measured,
  a.hardscape_area_measured, a.tree_count, a.shrub_count, a.lawn_condition,
  a.soil_condition, a.irrigation_status, a.weed_coverage_percent, a.quote_id,
  a.follow_up_needed, a.measurements_verified, a.client_walkthrough_completed,
  a.created_at, a.updated_at, a.completed_date,
  p.id, p.property_name, p.service_address, p.property_type,
  c.id, c.name, c.company_name, c.client_type;

-- =====================================================
-- ASSESSMENT SUMMARY VIEW
-- =====================================================

CREATE VIEW public.assessment_summary AS
SELECT 
  user_id,
  
  -- Counts by status
  COUNT(*) as total_assessments,
  COUNT(*) FILTER (WHERE assessment_status = 'scheduled') as scheduled_count,
  COUNT(*) FILTER (WHERE assessment_status = 'in_progress') as in_progress_count,
  COUNT(*) FILTER (WHERE assessment_status = 'completed') as completed_count,
  COUNT(*) FILTER (WHERE assessment_status = 'reviewed') as reviewed_count,
  COUNT(*) FILTER (WHERE assessment_status = 'requires_followup') as followup_required_count,
  
  -- Condition distribution
  COUNT(*) FILTER (WHERE overall_condition = 'excellent') as excellent_condition_count,
  COUNT(*) FILTER (WHERE overall_condition = 'good') as good_condition_count,
  COUNT(*) FILTER (WHERE overall_condition = 'fair') as fair_condition_count,
  COUNT(*) FILTER (WHERE overall_condition = 'poor') as poor_condition_count,
  COUNT(*) FILTER (WHERE overall_condition = 'critical') as critical_condition_count,
  
  -- Complexity metrics
  AVG(complexity_score) as average_complexity,
  MAX(complexity_score) as max_complexity,
  COUNT(*) FILTER (WHERE complexity_score >= 8) as high_complexity_count,
  
  -- Financial metrics
  SUM(estimated_total_cost) as total_estimated_value,
  AVG(estimated_total_cost) as average_assessment_value,
  SUM(estimated_total_cost) FILTER (WHERE quote_id IS NOT NULL) as quoted_value,
  
  -- Performance metrics
  AVG(total_estimated_hours) as average_labor_hours,
  SUM(total_estimated_hours) as total_estimated_hours,
  
  -- Quote conversion
  COUNT(*) FILTER (WHERE quote_id IS NOT NULL) as assessments_with_quotes,
  ROUND(
    COUNT(*) FILTER (WHERE quote_id IS NOT NULL)::numeric / 
    NULLIF(COUNT(*)::numeric, 0) * 100, 
    2
  ) as quote_conversion_rate_percent,
  
  -- Recent activity
  COUNT(*) FILTER (WHERE assessment_date >= CURRENT_DATE - INTERVAL '7 days') as assessments_this_week,
  COUNT(*) FILTER (WHERE assessment_date >= CURRENT_DATE - INTERVAL '30 days') as assessments_this_month,
  MAX(assessment_date) as most_recent_assessment,
  
  -- Media statistics
  SUM((SELECT COUNT(*) FROM public.assessment_media WHERE assessment_id = property_assessments.id)) as total_media_files

FROM public.property_assessments
GROUP BY user_id;

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update assessment media count
CREATE OR REPLACE FUNCTION update_assessment_media_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update photo count in assessment when media is added/removed
  IF TG_OP = 'INSERT' THEN
    UPDATE public.property_assessments 
    SET photos_taken_count = (
      SELECT COUNT(*) FROM public.assessment_media 
      WHERE assessment_id = NEW.assessment_id
    )
    WHERE id = NEW.assessment_id;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.property_assessments 
    SET photos_taken_count = (
      SELECT COUNT(*) FROM public.assessment_media 
      WHERE assessment_id = OLD.assessment_id
    )
    WHERE id = OLD.assessment_id;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update media count
CREATE TRIGGER update_assessment_media_count_trigger
  AFTER INSERT OR DELETE ON public.assessment_media
  FOR EACH ROW
  EXECUTE FUNCTION update_assessment_media_count();

-- Function to auto-set completion date when status changes to completed
CREATE OR REPLACE FUNCTION update_assessment_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Set completed_date when status changes to completed
  IF NEW.assessment_status = 'completed' AND OLD.assessment_status != 'completed' THEN
    NEW.completed_date = COALESCE(NEW.completed_date, NOW());
  END IF;
  
  -- Calculate estimated total cost if not set
  IF NEW.estimated_total_cost IS NULL THEN
    NEW.estimated_total_cost = COALESCE(NEW.estimated_material_cost, 0) + 
                               COALESCE(NEW.estimated_labor_cost, 0) + 
                               COALESCE(NEW.estimated_equipment_cost, 0) + 
                               COALESCE(NEW.estimated_disposal_cost, 0);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for assessment completion
CREATE TRIGGER update_assessment_completion_trigger
  BEFORE UPDATE ON public.property_assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_assessment_completion();

-- Add triggers for updated_at columns
CREATE TRIGGER update_property_assessments_updated_at 
  BEFORE UPDATE ON public.property_assessments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assessment_media_updated_at 
  BEFORE UPDATE ON public.assessment_media 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- STORAGE BUCKET SETUP FOR MEDIA
-- =====================================================

-- Create storage bucket for assessment media (if not exists)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('assessment-media', 'assessment-media', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for assessment media
CREATE POLICY "Users can upload their assessment media"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'assessment-media' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their assessment media"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'assessment-media' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their assessment media"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'assessment-media' AND
    auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'assessment-media' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their assessment media"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'assessment-media' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- =====================================================
-- PERFORMANCE OPTIMIZATION FUNCTIONS
-- =====================================================

-- Function to get assessment dashboard data (optimized single query)
CREATE OR REPLACE FUNCTION get_assessment_dashboard(p_user_id UUID)
RETURNS TABLE (
  assessment_id UUID,
  assessment_number TEXT,
  property_name TEXT,
  client_name TEXT,
  assessment_status assessment_status,
  scheduled_date TIMESTAMPTZ,
  priority_level INTEGER,
  complexity_score INTEGER,
  estimated_total_cost NUMERIC,
  photo_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.assessment_number,
    p.property_name,
    c.name,
    a.assessment_status,
    a.scheduled_date,
    a.priority_level,
    a.complexity_score,
    a.estimated_total_cost,
    COUNT(m.id) as photo_count
  FROM public.property_assessments a
  LEFT JOIN public.properties p ON a.property_id = p.id
  LEFT JOIN public.clients c ON p.client_id = c.id  
  LEFT JOIN public.assessment_media m ON a.id = m.assessment_id AND m.media_type = 'photo'
  WHERE a.user_id = p_user_id
  GROUP BY a.id, a.assessment_number, p.property_name, c.name, 
           a.assessment_status, a.scheduled_date, a.priority_level, 
           a.complexity_score, a.estimated_total_cost
  ORDER BY a.priority_level DESC, a.scheduled_date ASC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- REALTIME SUBSCRIPTIONS
-- =====================================================

-- Add assessment tables to realtime subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE public.property_assessments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.assessment_media;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE public.property_assessments IS 'Comprehensive property assessments for lawn care services with detailed condition tracking';
COMMENT ON TABLE public.assessment_media IS 'Photos, videos, and documents associated with property assessments';

COMMENT ON COLUMN public.property_assessments.assessment_number IS 'Auto-generated unique assessment number for tracking';
COMMENT ON COLUMN public.property_assessments.complexity_score IS 'Assessment complexity rating from 1-10 for pricing and scheduling';
COMMENT ON COLUMN public.property_assessments.obstacles IS 'JSONB array of obstacles with type, description, and impact fields';
COMMENT ON COLUMN public.property_assessments.special_considerations IS 'Flexible JSONB for client-specific requirements and constraints';
COMMENT ON COLUMN public.property_assessments.material_requirements IS 'JSONB with material types, quantities, and specifications';

COMMENT ON VIEW public.assessment_analytics IS 'Detailed assessment metrics with property and client information for reporting';
COMMENT ON VIEW public.assessment_summary IS 'Aggregate assessment statistics by user for dashboard summaries';

COMMENT ON FUNCTION get_assessment_dashboard(UUID) IS 'Optimized function for assessment dashboard queries with <150ms performance target';

-- Migration completion notification
DO $$
BEGIN
  RAISE NOTICE 'Property Assessment System (M2.1) Migration completed successfully';
  RAISE NOTICE 'Created property_assessments table with comprehensive lawn care assessment fields';
  RAISE NOTICE 'Created assessment_media table for photo/video documentation';
  RAISE NOTICE 'Implemented performance indexes targeting <150ms queries for 1000+ records';
  RAISE NOTICE 'Added RLS policies following established security patterns';
  RAISE NOTICE 'Created assessment analytics and summary views';
  RAISE NOTICE 'Configured Supabase Storage bucket for media uploads';
  RAISE NOTICE 'Added automated triggers for data consistency';
  RAISE NOTICE 'Ready for M2.2: Quote-Assessment Integration';
END $$;