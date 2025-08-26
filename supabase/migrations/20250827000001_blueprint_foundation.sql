-- =====================================================
-- BLUEPRINT FOUNDATION MIGRATION - M1.1
-- =====================================================
-- This migration implements the database foundation for Blueprint compliance
-- Extends clients table, creates properties table, and links quotes to properties
-- Follows established RLS patterns and TypeScript relationship design

-- =====================================================
-- ENUMS AND TYPES
-- =====================================================

-- Client types and status for commercial/residential distinction
CREATE TYPE client_type AS ENUM ('residential', 'commercial');
CREATE TYPE client_status AS ENUM ('lead', 'active', 'inactive', 'archived');

-- Property types for comprehensive classification
CREATE TYPE property_type AS ENUM ('residential', 'commercial', 'municipal', 'industrial');

-- Property access types for service planning
CREATE TYPE property_access AS ENUM ('easy', 'moderate', 'difficult', 'gate_required');

-- =====================================================
-- EXTEND CLIENTS TABLE
-- =====================================================

-- Add commercial fields to existing clients table
ALTER TABLE public.clients 
  ADD COLUMN company_name TEXT,
  ADD COLUMN billing_address TEXT,
  ADD COLUMN client_status client_status DEFAULT 'lead',
  ADD COLUMN primary_contact_person TEXT,
  ADD COLUMN client_type client_type DEFAULT 'residential',
  ADD COLUMN tax_id TEXT,
  ADD COLUMN business_license TEXT,
  ADD COLUMN preferred_communication TEXT CHECK (preferred_communication IN ('email', 'phone', 'text', 'portal')),
  ADD COLUMN service_area TEXT,
  ADD COLUMN credit_terms INTEGER DEFAULT 30, -- Net payment terms in days
  ADD COLUMN credit_limit NUMERIC(10, 2);

-- Add indexes for new client fields
CREATE INDEX idx_clients_company_name ON public.clients(user_id, company_name) WHERE company_name IS NOT NULL;
CREATE INDEX idx_clients_status ON public.clients(user_id, client_status);
CREATE INDEX idx_clients_type ON public.clients(user_id, client_type);

-- Add search capability for commercial fields
DROP INDEX IF EXISTS idx_clients_search;
CREATE INDEX idx_clients_search ON public.clients USING gin(
  to_tsvector('english', 
    name || ' ' || 
    COALESCE(company_name, '') || ' ' ||
    COALESCE(email, '') || ' ' || 
    COALESCE(notes, '') || ' ' ||
    COALESCE(primary_contact_person, '')
  )
);

-- =====================================================
-- PROPERTIES TABLE
-- =====================================================

CREATE TABLE public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  
  -- Basic property information
  property_name TEXT,
  service_address TEXT NOT NULL,
  billing_address TEXT, -- Can differ from service address
  property_type property_type DEFAULT 'residential',
  
  -- Property details for service planning
  square_footage NUMERIC(10, 2),
  lot_size NUMERIC(10, 2),
  property_access property_access DEFAULT 'easy',
  access_instructions TEXT,
  gate_code TEXT,
  parking_location TEXT,
  
  -- Service-specific information
  lawn_area NUMERIC(10, 2),
  landscape_area NUMERIC(10, 2),
  hardscape_area NUMERIC(10, 2),
  special_equipment_needed TEXT[],
  safety_considerations TEXT,
  pet_information TEXT,
  
  -- GPS and location data
  latitude NUMERIC(10, 8),
  longitude NUMERIC(11, 8),
  location_verified BOOLEAN DEFAULT FALSE,
  
  -- Property status and management
  is_active BOOLEAN DEFAULT TRUE,
  service_frequency TEXT, -- weekly, bi-weekly, monthly, seasonal
  preferred_service_time TEXT, -- morning, afternoon, any
  season_start_date DATE,
  season_end_date DATE,
  
  -- Client-specific notes and requirements
  property_notes TEXT,
  client_requirements TEXT,
  billing_notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on properties table
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- RLS Policies for properties
CREATE POLICY "Users can manage their own properties" 
  ON public.properties FOR ALL 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view properties of their clients" 
  ON public.properties FOR SELECT 
  USING (
    auth.uid() = user_id AND 
    client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())
  );

-- Indexes for properties table
CREATE INDEX idx_properties_user_id ON public.properties(user_id);
CREATE INDEX idx_properties_client_id ON public.properties(client_id);
CREATE INDEX idx_properties_active ON public.properties(user_id, is_active) WHERE is_active = TRUE;
CREATE INDEX idx_properties_type ON public.properties(user_id, property_type);
CREATE INDEX idx_properties_service_address ON public.properties(user_id, service_address);
CREATE INDEX idx_properties_location ON public.properties(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Full-text search for properties
CREATE INDEX idx_properties_search ON public.properties USING gin(
  to_tsvector('english', 
    COALESCE(property_name, '') || ' ' ||
    service_address || ' ' ||
    COALESCE(property_notes, '') || ' ' ||
    COALESCE(client_requirements, '')
  )
);

-- =====================================================
-- EXTEND QUOTES TABLE
-- =====================================================

-- Add property relationship to quotes
ALTER TABLE public.quotes 
  ADD COLUMN property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL;

-- Add property-specific quote fields
ALTER TABLE public.quotes
  ADD COLUMN service_address TEXT, -- Denormalized for performance
  ADD COLUMN property_notes TEXT,
  ADD COLUMN assessment_id UUID; -- Future link to assessments

-- Index for property-quote relationship
CREATE INDEX idx_quotes_property_id ON public.quotes(property_id);
CREATE INDEX idx_quotes_service_address ON public.quotes(user_id, service_address) WHERE service_address IS NOT NULL;

-- Update quotes search index to include property information
DROP INDEX IF EXISTS idx_quotes_search;
CREATE INDEX idx_quotes_search ON public.quotes USING gin(
  to_tsvector('english', 
    client_name || ' ' || 
    COALESCE(notes, '') || ' ' || 
    COALESCE(template_name, '') || ' ' ||
    COALESCE(service_address, '') || ' ' ||
    COALESCE(property_notes, '')
  )
);

-- =====================================================
-- PROPERTY ANALYTICS VIEW
-- =====================================================

CREATE VIEW public.property_analytics AS
SELECT 
  p.user_id,
  p.id as property_id,
  p.property_name,
  p.service_address,
  p.property_type,
  p.client_id,
  c.name as client_name,
  c.company_name,
  
  -- Quote statistics
  COUNT(q.id) as total_quotes,
  COUNT(q.id) FILTER (WHERE q.status = 'sent') as sent_quotes,
  COUNT(q.id) FILTER (WHERE q.status = 'accepted') as accepted_quotes,
  COUNT(q.id) FILTER (WHERE q.status = 'declined') as declined_quotes,
  
  -- Financial metrics
  SUM(q.total) as total_quote_value,
  SUM(q.total) FILTER (WHERE q.status = 'accepted') as accepted_value,
  AVG(q.total) as average_quote_value,
  
  -- Performance metrics
  ROUND(
    COUNT(q.id) FILTER (WHERE q.status = 'accepted')::numeric / 
    NULLIF(COUNT(q.id) FILTER (WHERE q.status IN ('accepted', 'declined'))::numeric, 0) * 100, 
    2
  ) as acceptance_rate_percent,
  
  -- Service information
  p.square_footage,
  p.lawn_area,
  p.service_frequency,
  
  -- Activity tracking
  MAX(q.created_at) as last_quote_date,
  p.created_at as property_since,
  p.is_active
  
FROM public.properties p
LEFT JOIN public.clients c ON p.client_id = c.id
LEFT JOIN public.quotes q ON p.id = q.property_id AND q.is_template = false
GROUP BY 
  p.id, p.user_id, p.property_name, p.service_address, p.property_type, 
  p.client_id, c.name, c.company_name, p.square_footage, p.lawn_area, 
  p.service_frequency, p.created_at, p.is_active;

-- =====================================================
-- ENHANCED CLIENT ANALYTICS VIEW
-- =====================================================

-- Extend existing client analytics with property information
DROP VIEW IF EXISTS public.client_analytics;
CREATE VIEW public.client_analytics AS
SELECT 
  c.user_id,
  c.id as client_id,
  c.name as client_name,
  c.company_name,
  c.client_type,
  c.client_status,
  c.email,
  c.phone,
  
  -- Property counts
  COUNT(DISTINCT p.id) as total_properties,
  COUNT(DISTINCT p.id) FILTER (WHERE p.is_active = true) as active_properties,
  
  -- Quote statistics
  COUNT(DISTINCT q.id) as total_quotes,
  COUNT(DISTINCT q.id) FILTER (WHERE q.status = 'accepted') as accepted_quotes,
  COUNT(DISTINCT q.id) FILTER (WHERE q.status = 'declined') as declined_quotes,
  
  -- Financial metrics
  SUM(q.total) as total_quote_value,
  SUM(q.total) FILTER (WHERE q.status = 'accepted') as accepted_value,
  AVG(q.total) as average_quote_value,
  
  -- Performance metrics
  ROUND(
    COUNT(DISTINCT q.id) FILTER (WHERE q.status = 'accepted')::numeric / 
    NULLIF(COUNT(DISTINCT q.id) FILTER (WHERE q.status IN ('accepted', 'declined'))::numeric, 0) * 100, 
    2
  ) as acceptance_rate_percent,
  
  -- Activity tracking
  MAX(q.created_at) as last_quote_date,
  c.created_at as client_since
  
FROM public.clients c
LEFT JOIN public.properties p ON c.id = p.client_id
LEFT JOIN public.quotes q ON c.id = q.client_id AND q.is_template = false
GROUP BY 
  c.id, c.user_id, c.name, c.company_name, c.client_type, c.client_status, 
  c.email, c.phone, c.created_at;

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to auto-populate service address in quotes from property
CREATE OR REPLACE FUNCTION populate_quote_service_address()
RETURNS TRIGGER AS $$
BEGIN
  -- If property_id is provided and service_address is not set
  IF NEW.property_id IS NOT NULL AND (NEW.service_address IS NULL OR NEW.service_address = '') THEN
    SELECT service_address, property_notes
    INTO NEW.service_address, NEW.property_notes
    FROM public.properties 
    WHERE id = NEW.property_id AND user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to populate service address on quote insert/update
CREATE TRIGGER populate_quote_service_address_trigger
  BEFORE INSERT OR UPDATE ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION populate_quote_service_address();

-- Function to create default property for existing clients during migration
CREATE OR REPLACE FUNCTION create_default_property_for_client(client_uuid UUID)
RETURNS UUID AS $$
DECLARE
  property_uuid UUID;
  client_record RECORD;
BEGIN
  -- Get client information
  SELECT * INTO client_record FROM public.clients WHERE id = client_uuid;
  
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  
  -- Create default property using client address
  INSERT INTO public.properties (
    user_id,
    client_id,
    property_name,
    service_address,
    property_type,
    is_active,
    property_notes
  ) VALUES (
    client_record.user_id,
    client_record.id,
    client_record.name || ' - Primary Property',
    COALESCE(client_record.address, 'Address to be determined'),
    CASE 
      WHEN client_record.company_name IS NOT NULL THEN 'commercial'::property_type
      ELSE 'residential'::property_type
    END,
    true,
    'Default property created during Blueprint migration'
  ) RETURNING id INTO property_uuid;
  
  RETURN property_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to link existing quotes to default properties
CREATE OR REPLACE FUNCTION link_quotes_to_default_properties()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER := 0;
  quote_record RECORD;
  default_property_id UUID;
BEGIN
  -- Loop through quotes without property_id
  FOR quote_record IN 
    SELECT id, user_id, client_id, client_name
    FROM public.quotes 
    WHERE property_id IS NULL AND client_id IS NOT NULL
  LOOP
    -- Get or create default property for client
    SELECT p.id INTO default_property_id
    FROM public.properties p
    WHERE p.client_id = quote_record.client_id 
    AND p.user_id = quote_record.user_id
    AND p.property_name LIKE '% - Primary Property'
    LIMIT 1;
    
    -- If no default property exists, create one
    IF default_property_id IS NULL THEN
      default_property_id := create_default_property_for_client(quote_record.client_id);
    END IF;
    
    -- Update quote with property_id
    IF default_property_id IS NOT NULL THEN
      UPDATE public.quotes 
      SET property_id = default_property_id
      WHERE id = quote_record.id;
      updated_count := updated_count + 1;
    END IF;
  END LOOP;
  
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add triggers for updated_at columns on new tables
CREATE TRIGGER update_properties_updated_at 
  BEFORE UPDATE ON public.properties 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- DATA MIGRATION
-- =====================================================

-- Create default properties for existing clients with addresses
DO $$
DECLARE
  client_record RECORD;
  property_id UUID;
BEGIN
  FOR client_record IN 
    SELECT id, user_id, name, address, company_name
    FROM public.clients 
    WHERE address IS NOT NULL AND address != ''
  LOOP
    -- Create default property for each client with an address
    property_id := create_default_property_for_client(client_record.id);
    
    IF property_id IS NOT NULL THEN
      RAISE NOTICE 'Created default property % for client %', property_id, client_record.name;
    END IF;
  END LOOP;
END $$;

-- Link existing quotes to their default properties
SELECT link_quotes_to_default_properties() as quotes_updated;

-- =====================================================
-- REALTIME SUBSCRIPTIONS
-- =====================================================

-- Add properties to realtime subscriptions
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE 
  public.products, 
  public.prices, 
  public.properties;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE public.properties IS 'Property locations and service details for client properties';
COMMENT ON COLUMN public.clients.company_name IS 'Business name for commercial clients';
COMMENT ON COLUMN public.clients.client_status IS 'Current status in sales/service lifecycle';
COMMENT ON COLUMN public.clients.client_type IS 'Residential or commercial classification';
COMMENT ON COLUMN public.clients.primary_contact_person IS 'Main contact for commercial accounts';
COMMENT ON COLUMN public.quotes.property_id IS 'Links quote to specific property location';
COMMENT ON COLUMN public.quotes.service_address IS 'Denormalized service address for performance';
COMMENT ON VIEW public.property_analytics IS 'Property performance metrics and statistics';

-- Migration complete notification
DO $$
BEGIN
  RAISE NOTICE 'Blueprint Foundation Migration completed successfully';
  RAISE NOTICE 'Extended clients table with commercial fields';
  RAISE NOTICE 'Created properties table with comprehensive service planning fields';
  RAISE NOTICE 'Linked quotes to properties with backward compatibility';
  RAISE NOTICE 'Created default properties for existing clients';
  RAISE NOTICE 'Enhanced analytics views with property data';
END $$;