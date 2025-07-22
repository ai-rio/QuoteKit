-- Story 2.3: Enhanced Quote Creation Interface Database Enhancements

-- Create quote status enum
CREATE TYPE quote_status AS ENUM ('draft', 'final', 'sent', 'approved', 'rejected');

-- Add new columns to quotes table for enhanced functionality
ALTER TABLE public.quotes 
ADD COLUMN status quote_status DEFAULT 'draft',
ADD COLUMN quote_number TEXT,
ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create quote numbering sequence starting from 1000
CREATE SEQUENCE quote_number_seq START 1000;

-- Create function to auto-generate quote numbers
CREATE OR REPLACE FUNCTION generate_quote_number()
RETURNS TEXT AS $$
BEGIN
    RETURN 'Q' || LPAD(nextval('quote_number_seq')::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically assign quote numbers on insert
CREATE OR REPLACE FUNCTION assign_quote_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.quote_number IS NULL THEN
        NEW.quote_number := generate_quote_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER quotes_assign_number_trigger
    BEFORE INSERT ON public.quotes
    FOR EACH ROW
    EXECUTE FUNCTION assign_quote_number();

-- Create trigger to update updated_at on quote changes
CREATE OR REPLACE FUNCTION update_quote_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER quotes_update_timestamp_trigger
    BEFORE UPDATE ON public.quotes
    FOR EACH ROW
    EXECUTE FUNCTION update_quote_updated_at();

-- Create index for quote status and numbering
CREATE INDEX idx_quotes_status ON public.quotes(status);
CREATE INDEX idx_quotes_quote_number ON public.quotes(quote_number);
CREATE INDEX idx_quotes_updated_at ON public.quotes(updated_at);