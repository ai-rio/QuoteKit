-- Story 2.6: Quotes Management & History Database Enhancements

-- Update quote status enum to match Story 2.6 requirements
-- First, create the new enum values
ALTER TYPE quote_status ADD VALUE IF NOT EXISTS 'accepted';
ALTER TYPE quote_status ADD VALUE IF NOT EXISTS 'declined'; 
ALTER TYPE quote_status ADD VALUE IF NOT EXISTS 'expired';
ALTER TYPE quote_status ADD VALUE IF NOT EXISTS 'converted';

-- Since we can't remove enum values directly, we need to recreate the enum
-- This is safer to do by creating a new enum and migrating

-- Create new quote status enum with correct values
CREATE TYPE quote_status_v2 AS ENUM ('draft', 'sent', 'accepted', 'declined', 'expired', 'converted');

-- Add new columns to quotes table for Story 2.6 functionality
ALTER TABLE public.quotes 
ADD COLUMN sent_at TIMESTAMPTZ,
ADD COLUMN expires_at TIMESTAMPTZ,
ADD COLUMN follow_up_date TIMESTAMPTZ,
ADD COLUMN notes TEXT,
ADD COLUMN is_template BOOLEAN DEFAULT FALSE,
ADD COLUMN template_name TEXT;

-- Migrate existing status values to new enum
-- We'll update the column type in a transaction
BEGIN;

-- Add temporary column with new enum type
ALTER TABLE public.quotes ADD COLUMN status_v2 quote_status_v2;

-- Migrate existing status values
UPDATE public.quotes SET status_v2 = 
  CASE 
    WHEN status = 'draft' THEN 'draft'::quote_status_v2
    WHEN status = 'final' THEN 'sent'::quote_status_v2  -- Map 'final' to 'sent'
    WHEN status = 'sent' THEN 'sent'::quote_status_v2
    WHEN status = 'approved' THEN 'accepted'::quote_status_v2  -- Map 'approved' to 'accepted'
    WHEN status = 'rejected' THEN 'declined'::quote_status_v2  -- Map 'rejected' to 'declined'
    ELSE 'draft'::quote_status_v2
  END;

-- Drop the old status column and rename the new one
ALTER TABLE public.quotes DROP COLUMN status;
ALTER TABLE public.quotes RENAME COLUMN status_v2 TO status;

-- Set default value for status column
ALTER TABLE public.quotes ALTER COLUMN status SET DEFAULT 'draft'::quote_status_v2;

-- Drop the old enum type
DROP TYPE quote_status;

-- Rename the new enum type
ALTER TYPE quote_status_v2 RENAME TO quote_status;

COMMIT;

-- Create Clients table for client relationship management
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for clients table
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for clients
CREATE POLICY "Users can manage their own clients" 
  ON public.clients FOR ALL 
  USING (auth.uid() = user_id);

-- Add trigger for clients updated_at
CREATE TRIGGER clients_update_timestamp_trigger
    BEFORE UPDATE ON public.clients
    FOR EACH ROW
    EXECUTE FUNCTION update_quote_updated_at();

-- Create indexes for better query performance
CREATE INDEX idx_quotes_is_template ON public.quotes(is_template) WHERE is_template = true;
CREATE INDEX idx_quotes_status_created ON public.quotes(status, created_at);
CREATE INDEX idx_quotes_template_name ON public.quotes(template_name) WHERE template_name IS NOT NULL;
CREATE INDEX idx_quotes_sent_at ON public.quotes(sent_at) WHERE sent_at IS NOT NULL;
CREATE INDEX idx_quotes_expires_at ON public.quotes(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_quotes_follow_up ON public.quotes(follow_up_date) WHERE follow_up_date IS NOT NULL;

-- Full-text search index for quotes (client names and notes)
CREATE INDEX idx_quotes_search_fts ON public.quotes 
  USING gin(to_tsvector('english', client_name || ' ' || COALESCE(notes, '') || ' ' || COALESCE(template_name, '')));

-- Indexes for clients table
CREATE INDEX idx_clients_name ON public.clients(name);
CREATE INDEX idx_clients_email ON public.clients(email);
CREATE INDEX idx_clients_user_id ON public.clients(user_id);

-- Full-text search index for clients
CREATE INDEX idx_clients_search_fts ON public.clients 
  USING gin(to_tsvector('english', name || ' ' || COALESCE(email, '') || ' ' || COALESCE(notes, '')));

-- Function to update quote template metadata when saving as template
CREATE OR REPLACE FUNCTION update_template_metadata()
RETURNS TRIGGER AS $$
BEGIN
  -- If is_template is being set to true and template_name is null, generate a default name
  IF NEW.is_template = true AND NEW.template_name IS NULL THEN
    NEW.template_name := 'Template for ' || NEW.client_name;
  END IF;
  
  -- If is_template is being set to false, clear template_name
  IF NEW.is_template = false THEN
    NEW.template_name := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for template metadata management
CREATE TRIGGER quotes_template_metadata_trigger
    BEFORE INSERT OR UPDATE ON public.quotes
    FOR EACH ROW
    EXECUTE FUNCTION update_template_metadata();

-- Create a view for quote analytics (useful for dashboard)
CREATE VIEW public.quote_analytics AS
SELECT 
  user_id,
  COUNT(*) as total_quotes,
  COUNT(*) FILTER (WHERE status = 'draft') as draft_quotes,
  COUNT(*) FILTER (WHERE status = 'sent') as sent_quotes,
  COUNT(*) FILTER (WHERE status = 'accepted') as accepted_quotes,
  COUNT(*) FILTER (WHERE status = 'declined') as declined_quotes,
  COUNT(*) FILTER (WHERE status = 'expired') as expired_quotes,
  COUNT(*) FILTER (WHERE status = 'converted') as converted_quotes,
  COUNT(*) FILTER (WHERE is_template = true) as template_count,
  SUM(total) as total_quote_value,
  SUM(total) FILTER (WHERE status = 'accepted') as accepted_value,
  AVG(total) as average_quote_value,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'accepted')::numeric / 
    NULLIF(COUNT(*) FILTER (WHERE status IN ('accepted', 'declined'))::numeric, 0) * 100, 
    2
  ) as acceptance_rate_percent
FROM public.quotes 
WHERE is_template = false
GROUP BY user_id;

-- Enable RLS on the view
ALTER VIEW public.quote_analytics SET (security_invoker = true);

-- Comment on tables and columns for documentation
COMMENT ON TABLE public.clients IS 'Client relationship management for quote tracking and business development';
COMMENT ON COLUMN public.quotes.status IS 'Quote lifecycle status: draft, sent, accepted, declined, expired, converted';
COMMENT ON COLUMN public.quotes.sent_at IS 'Timestamp when quote was sent to client';
COMMENT ON COLUMN public.quotes.expires_at IS 'Quote expiration date for time-limited offers';
COMMENT ON COLUMN public.quotes.follow_up_date IS 'Scheduled follow-up date with client';
COMMENT ON COLUMN public.quotes.notes IS 'Internal notes about the quote or client interaction';
COMMENT ON COLUMN public.quotes.is_template IS 'Flag indicating if quote is saved as a reusable template';
COMMENT ON COLUMN public.quotes.template_name IS 'Human-readable name for quote templates';
COMMENT ON VIEW public.quote_analytics IS 'Aggregated quote statistics per user for dashboard and reporting';