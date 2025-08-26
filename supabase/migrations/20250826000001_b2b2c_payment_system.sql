-- =====================================================
-- B2B2C PAYMENT SYSTEM MIGRATION - S2.1
-- =====================================================
-- This migration adds B2B2C payment functionality to QuoteKit
-- Enables lawn care companies to send invoices to homeowners
-- Leverages existing Stripe infrastructure for payment processing

-- =====================================================
-- EXTEND QUOTES TABLE FOR B2B2C PAYMENTS
-- =====================================================

-- Add B2B2C payment fields to existing quotes table
ALTER TABLE public.quotes 
  ADD COLUMN stripe_invoice_id TEXT,
  ADD COLUMN stripe_customer_id TEXT, -- Homeowner's Stripe customer ID
  ADD COLUMN invoice_status TEXT DEFAULT 'draft' CHECK (invoice_status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  ADD COLUMN invoice_sent_at TIMESTAMPTZ,
  ADD COLUMN payment_received_at TIMESTAMPTZ,
  ADD COLUMN homeowner_email TEXT,
  ADD COLUMN homeowner_name TEXT,
  ADD COLUMN payment_due_date DATE,
  ADD COLUMN payment_terms INTEGER DEFAULT 30; -- Net payment terms in days

-- Add indexes for B2B2C payment queries
CREATE INDEX idx_quotes_stripe_invoice ON public.quotes(user_id, stripe_invoice_id) WHERE stripe_invoice_id IS NOT NULL;
CREATE INDEX idx_quotes_stripe_customer ON public.quotes(user_id, stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX idx_quotes_invoice_status ON public.quotes(user_id, invoice_status);
CREATE INDEX idx_quotes_homeowner_email ON public.quotes(user_id, homeowner_email) WHERE homeowner_email IS NOT NULL;
CREATE INDEX idx_quotes_payment_due ON public.quotes(user_id, payment_due_date) WHERE payment_due_date IS NOT NULL;

-- =====================================================
-- HOMEOWNER PAYMENT TRACKING TABLE
-- =====================================================

CREATE TABLE public.homeowner_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  
  -- Stripe payment information
  stripe_invoice_id TEXT NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  stripe_payment_intent_id TEXT,
  
  -- Payment details
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'usd',
  payment_status TEXT NOT NULL CHECK (payment_status IN ('pending', 'processing', 'succeeded', 'failed', 'cancelled')),
  payment_method_type TEXT, -- card, bank_transfer, etc.
  
  -- Homeowner information
  homeowner_email TEXT NOT NULL,
  homeowner_name TEXT,
  
  -- Payment timeline
  invoice_sent_at TIMESTAMPTZ NOT NULL,
  payment_attempted_at TIMESTAMPTZ,
  payment_completed_at TIMESTAMPTZ,
  
  -- Metadata
  stripe_metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on homeowner_payments table
ALTER TABLE public.homeowner_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for homeowner_payments
CREATE POLICY "Users can manage their own homeowner payments" 
  ON public.homeowner_payments FOR ALL 
  USING (auth.uid() = user_id);

-- Indexes for homeowner_payments table
CREATE INDEX idx_homeowner_payments_user_id ON public.homeowner_payments(user_id);
CREATE INDEX idx_homeowner_payments_quote_id ON public.homeowner_payments(quote_id);
CREATE INDEX idx_homeowner_payments_stripe_invoice ON public.homeowner_payments(stripe_invoice_id);
CREATE INDEX idx_homeowner_payments_stripe_customer ON public.homeowner_payments(stripe_customer_id);
CREATE INDEX idx_homeowner_payments_status ON public.homeowner_payments(user_id, payment_status);
CREATE INDEX idx_homeowner_payments_email ON public.homeowner_payments(user_id, homeowner_email);

-- =====================================================
-- B2B2C ANALYTICS VIEW
-- =====================================================

CREATE VIEW public.b2b2c_payment_analytics AS
SELECT 
  q.user_id,
  q.id as quote_id,
  q.quote_number,
  q.client_name,
  q.service_address,
  q.total as quote_amount,
  
  -- Payment information
  q.stripe_invoice_id,
  q.stripe_customer_id,
  q.invoice_status,
  q.homeowner_email,
  q.homeowner_name,
  q.invoice_sent_at,
  q.payment_received_at,
  q.payment_due_date,
  q.payment_terms,
  
  -- Payment tracking
  hp.payment_status,
  hp.payment_method_type,
  hp.payment_attempted_at,
  hp.payment_completed_at,
  
  -- Calculated fields
  CASE 
    WHEN q.payment_due_date IS NOT NULL AND q.payment_due_date < CURRENT_DATE AND q.invoice_status != 'paid'
    THEN true 
    ELSE false 
  END as is_overdue,
  
  CASE 
    WHEN q.payment_due_date IS NOT NULL 
    THEN q.payment_due_date - CURRENT_DATE 
    ELSE NULL 
  END as days_until_due,
  
  CASE 
    WHEN q.invoice_sent_at IS NOT NULL AND q.payment_received_at IS NOT NULL
    THEN q.payment_received_at - q.invoice_sent_at
    ELSE NULL
  END as payment_duration,
  
  -- Property and client context
  p.property_name,
  p.property_type,
  c.company_name,
  c.client_type,
  
  -- Timestamps
  q.created_at as quote_created_at,
  q.updated_at as quote_updated_at
  
FROM public.quotes q
LEFT JOIN public.homeowner_payments hp ON q.id = hp.quote_id
LEFT JOIN public.properties p ON q.property_id = p.id
LEFT JOIN public.clients c ON q.client_id = c.id
WHERE q.homeowner_email IS NOT NULL; -- Only B2B2C quotes

-- =====================================================
-- FUNCTIONS FOR B2B2C OPERATIONS
-- =====================================================

-- Function to calculate payment due date
CREATE OR REPLACE FUNCTION calculate_payment_due_date(
  invoice_sent_date TIMESTAMPTZ,
  payment_terms_days INTEGER DEFAULT 30
)
RETURNS DATE AS $$
BEGIN
  RETURN (invoice_sent_date + (payment_terms_days || ' days')::INTERVAL)::DATE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to update quote payment status
CREATE OR REPLACE FUNCTION update_quote_payment_status(
  quote_uuid UUID,
  new_status TEXT,
  payment_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  quote_exists BOOLEAN;
BEGIN
  -- Check if quote exists and belongs to current user
  SELECT EXISTS(
    SELECT 1 FROM public.quotes 
    WHERE id = quote_uuid AND user_id = auth.uid()
  ) INTO quote_exists;
  
  IF NOT quote_exists THEN
    RETURN FALSE;
  END IF;
  
  -- Update quote status
  UPDATE public.quotes 
  SET 
    invoice_status = new_status,
    payment_received_at = CASE 
      WHEN new_status = 'paid' THEN COALESCE(payment_date, NOW())
      ELSE payment_received_at 
    END,
    updated_at = NOW()
  WHERE id = quote_uuid AND user_id = auth.uid();
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create homeowner payment record
CREATE OR REPLACE FUNCTION create_homeowner_payment_record(
  quote_uuid UUID,
  stripe_invoice_id_param TEXT,
  stripe_customer_id_param TEXT,
  amount_cents_param INTEGER,
  homeowner_email_param TEXT,
  homeowner_name_param TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  payment_uuid UUID;
  quote_user_id UUID;
BEGIN
  -- Get quote user_id for security
  SELECT user_id INTO quote_user_id 
  FROM public.quotes 
  WHERE id = quote_uuid AND user_id = auth.uid();
  
  IF quote_user_id IS NULL THEN
    RAISE EXCEPTION 'Quote not found or access denied';
  END IF;
  
  -- Create payment record
  INSERT INTO public.homeowner_payments (
    user_id,
    quote_id,
    stripe_invoice_id,
    stripe_customer_id,
    amount_cents,
    homeowner_email,
    homeowner_name,
    payment_status,
    invoice_sent_at
  ) VALUES (
    quote_user_id,
    quote_uuid,
    stripe_invoice_id_param,
    stripe_customer_id_param,
    amount_cents_param,
    homeowner_email_param,
    homeowner_name_param,
    'pending',
    NOW()
  ) RETURNING id INTO payment_uuid;
  
  RETURN payment_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS FOR AUTOMATED UPDATES
-- =====================================================

-- Function to auto-calculate payment due date
CREATE OR REPLACE FUNCTION auto_calculate_payment_due_date()
RETURNS TRIGGER AS $$
BEGIN
  -- If invoice was just sent and due date is not set
  IF NEW.invoice_sent_at IS NOT NULL AND OLD.invoice_sent_at IS NULL AND NEW.payment_due_date IS NULL THEN
    NEW.payment_due_date := calculate_payment_due_date(NEW.invoice_sent_at, NEW.payment_terms);
  END IF;
  
  -- Auto-update invoice status based on due date
  IF NEW.payment_due_date IS NOT NULL AND NEW.payment_due_date < CURRENT_DATE AND NEW.invoice_status = 'sent' THEN
    NEW.invoice_status := 'overdue';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate payment due date
CREATE TRIGGER auto_calculate_payment_due_date_trigger
  BEFORE UPDATE ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION auto_calculate_payment_due_date();

-- Add updated_at trigger for homeowner_payments
CREATE TRIGGER update_homeowner_payments_updated_at 
  BEFORE UPDATE ON public.homeowner_payments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- REALTIME SUBSCRIPTIONS
-- =====================================================

-- Add homeowner_payments to realtime subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE public.homeowner_payments;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON COLUMN public.quotes.stripe_invoice_id IS 'Stripe invoice ID for homeowner payment';
COMMENT ON COLUMN public.quotes.stripe_customer_id IS 'Homeowner Stripe customer ID for payment portal';
COMMENT ON COLUMN public.quotes.invoice_status IS 'B2B2C invoice status (draft, sent, paid, overdue, cancelled)';
COMMENT ON COLUMN public.quotes.homeowner_email IS 'Email address of property owner for invoice delivery';
COMMENT ON COLUMN public.quotes.homeowner_name IS 'Name of property owner for personalized invoices';
COMMENT ON COLUMN public.quotes.payment_due_date IS 'Calculated due date based on invoice sent date and terms';

COMMENT ON TABLE public.homeowner_payments IS 'Tracking table for B2B2C homeowner payments via Stripe';
COMMENT ON VIEW public.b2b2c_payment_analytics IS 'Analytics view for B2B2C payment performance and status';

COMMENT ON FUNCTION calculate_payment_due_date IS 'Calculates payment due date based on invoice date and terms';
COMMENT ON FUNCTION update_quote_payment_status IS 'Updates quote payment status with security checks';
COMMENT ON FUNCTION create_homeowner_payment_record IS 'Creates homeowner payment tracking record';

-- Migration complete notification
DO $$
BEGIN
  RAISE NOTICE 'B2B2C Payment System Migration completed successfully';
  RAISE NOTICE 'Extended quotes table with homeowner payment fields';
  RAISE NOTICE 'Created homeowner_payments tracking table';
  RAISE NOTICE 'Added B2B2C analytics view and helper functions';
  RAISE NOTICE 'Configured RLS policies and indexes for performance';
END $$;
