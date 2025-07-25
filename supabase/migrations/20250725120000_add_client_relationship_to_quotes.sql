-- Add client_id column to quotes table and establish relationship with clients
-- This migration maintains backward compatibility while introducing client relationships

-- Add client_id column to quotes table (nullable initially for migration)
ALTER TABLE public.quotes 
ADD COLUMN client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX idx_quotes_client_id ON public.quotes(client_id);

-- Create a function to migrate existing quote client data to clients table
CREATE OR REPLACE FUNCTION migrate_quote_clients_to_clients_table()
RETURNS void AS $$
DECLARE
    quote_record RECORD;
    existing_client_id UUID;
    new_client_id UUID;
BEGIN
    -- Loop through all quotes that don't have a client_id yet
    FOR quote_record IN 
        SELECT id, user_id, client_name, client_contact
        FROM public.quotes 
        WHERE client_id IS NULL AND client_name IS NOT NULL
    LOOP
        -- Check if a client with this name already exists for this user
        SELECT id INTO existing_client_id
        FROM public.clients 
        WHERE user_id = quote_record.user_id 
        AND LOWER(name) = LOWER(quote_record.client_name)
        LIMIT 1;
        
        IF existing_client_id IS NOT NULL THEN
            -- Use existing client
            new_client_id := existing_client_id;
        ELSE
            -- Create new client record
            INSERT INTO public.clients (user_id, name, email, phone)
            VALUES (
                quote_record.user_id,
                quote_record.client_name,
                CASE 
                    -- Try to extract email from client_contact if it looks like an email
                    WHEN quote_record.client_contact ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' 
                    THEN quote_record.client_contact
                    ELSE NULL
                END,
                CASE 
                    -- Try to extract phone from client_contact if it looks like a phone number
                    WHEN quote_record.client_contact ~ '^[\+]?[1-9]?[\d\s\-\(\)]{7,15}$' 
                    THEN quote_record.client_contact
                    ELSE NULL
                END
            )
            RETURNING id INTO new_client_id;
        END IF;
        
        -- Update the quote with the client_id
        UPDATE public.quotes 
        SET client_id = new_client_id
        WHERE id = quote_record.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the migration function
SELECT migrate_quote_clients_to_clients_table();

-- Drop the migration function as it's no longer needed
DROP FUNCTION migrate_quote_clients_to_clients_table();

-- Add helpful comments
COMMENT ON COLUMN public.quotes.client_id IS 'Foreign key reference to clients table. When set, this takes precedence over client_name and client_contact fields.';

-- Update the quote_analytics view to include client information
DROP VIEW IF EXISTS public.quote_analytics;

CREATE VIEW public.quote_analytics AS
SELECT 
  q.user_id,
  COUNT(*) as total_quotes,
  COUNT(*) FILTER (WHERE q.status = 'draft') as draft_quotes,
  COUNT(*) FILTER (WHERE q.status = 'sent') as sent_quotes,
  COUNT(*) FILTER (WHERE q.status = 'accepted') as accepted_quotes,
  COUNT(*) FILTER (WHERE q.status = 'declined') as declined_quotes,
  COUNT(*) FILTER (WHERE q.status = 'expired') as expired_quotes,
  COUNT(*) FILTER (WHERE q.status = 'converted') as converted_quotes,
  COUNT(*) FILTER (WHERE q.is_template = true) as template_count,
  SUM(q.total) as total_quote_value,
  SUM(q.total) FILTER (WHERE q.status = 'accepted') as accepted_value,
  AVG(q.total) as average_quote_value,
  ROUND(
    COUNT(*) FILTER (WHERE q.status = 'accepted')::numeric / 
    NULLIF(COUNT(*) FILTER (WHERE q.status IN ('accepted', 'declined'))::numeric, 0) * 100, 
    2
  ) as acceptance_rate_percent,
  COUNT(DISTINCT q.client_id) FILTER (WHERE q.client_id IS NOT NULL) as unique_clients_count
FROM public.quotes q
WHERE q.is_template = false
GROUP BY q.user_id;

-- Enable RLS on the updated view
ALTER VIEW public.quote_analytics SET (security_invoker = true);

-- Create a view for client analytics
CREATE VIEW public.client_analytics AS
SELECT 
  c.user_id,
  c.id as client_id,
  c.name as client_name,
  c.email,
  c.phone,
  COUNT(q.id) as total_quotes,
  COUNT(q.id) FILTER (WHERE q.status = 'accepted') as accepted_quotes,
  COUNT(q.id) FILTER (WHERE q.status = 'declined') as declined_quotes,
  SUM(q.total) as total_quote_value,
  SUM(q.total) FILTER (WHERE q.status = 'accepted') as accepted_value,
  AVG(q.total) as average_quote_value,
  ROUND(
    COUNT(q.id) FILTER (WHERE q.status = 'accepted')::numeric / 
    NULLIF(COUNT(q.id) FILTER (WHERE q.status IN ('accepted', 'declined'))::numeric, 0) * 100, 
    2
  ) as acceptance_rate_percent,
  MAX(q.created_at) as last_quote_date,
  c.created_at as client_since
FROM public.clients c
LEFT JOIN public.quotes q ON c.id = q.client_id AND q.is_template = false
GROUP BY c.id, c.user_id, c.name, c.email, c.phone, c.created_at;

-- Enable RLS on the client analytics view
ALTER VIEW public.client_analytics SET (security_invoker = true);