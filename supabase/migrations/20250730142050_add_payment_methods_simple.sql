-- Simple Payment Methods Table Addition
-- This solves the account page payment methods display issue
-- No complex data migration - just add the missing table

-- Create payment_methods table for storing Stripe payment method information
CREATE TABLE IF NOT EXISTS payment_methods (
    id text PRIMARY KEY, -- Stripe payment method ID (pm_...)
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    stripe_customer_id text, -- Reference to Stripe customer ID (not enforced FK due to schema complexity)
    type text NOT NULL DEFAULT 'card',
    card_data jsonb, -- Store card information (brand, last4, exp_month, exp_year, etc.)
    is_default boolean DEFAULT false,
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_customer_id ON payment_methods(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_default ON payment_methods(user_id, is_default) WHERE is_default = true;

-- Enable Row Level Security
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own payment methods
CREATE POLICY "Users can only access their own payment methods" ON payment_methods
    FOR ALL USING (auth.uid() = user_id);

-- Service role has full access (for webhook processing)
CREATE POLICY "Service role full access on payment_methods" ON payment_methods
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Function to ensure only one default payment method per user
CREATE OR REPLACE FUNCTION ensure_single_default_payment_method()
RETURNS TRIGGER AS $$
BEGIN
    -- If setting a payment method as default, unset all others for this user
    IF NEW.is_default = true THEN
        UPDATE payment_methods 
        SET is_default = false, updated_at = now()
        WHERE user_id = NEW.user_id 
          AND id != NEW.id 
          AND is_default = true;
    END IF;
    
    -- Update the updated_at timestamp
    NEW.updated_at = now();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for default payment method enforcement
DROP TRIGGER IF EXISTS trigger_ensure_single_default_payment_method ON payment_methods;
CREATE TRIGGER trigger_ensure_single_default_payment_method
    BEFORE INSERT OR UPDATE ON payment_methods
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_default_payment_method();

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update updated_at trigger for payment_methods
DROP TRIGGER IF EXISTS trigger_payment_methods_updated_at ON payment_methods;
CREATE TRIGGER trigger_payment_methods_updated_at
    BEFORE UPDATE ON payment_methods
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions for authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON payment_methods TO authenticated;

-- Add helpful comments
COMMENT ON TABLE payment_methods IS 'Cached payment method data from Stripe for better performance and offline capability';
COMMENT ON COLUMN payment_methods.id IS 'Stripe payment method ID (pm_...)';
COMMENT ON COLUMN payment_methods.card_data IS 'Cached card information from Stripe (brand, last4, exp_month, exp_year, country, funding)';
COMMENT ON COLUMN payment_methods.is_default IS 'Whether this is the default payment method for the user (only one can be true per user)';
COMMENT ON FUNCTION ensure_single_default_payment_method() IS 'Ensures only one payment method can be default per user';

-- Success message
DO $$
BEGIN
    RAISE NOTICE ' Payment methods table added successfully!';
    RAISE NOTICE 'This completes the subscription system fixes:';
    RAISE NOTICE '- Account page can now display payment methods';
    RAISE NOTICE '- Webhook handlers can store payment method data';
    RAISE NOTICE '- Sync button uses proper Next.js patterns';
    RAISE NOTICE '- All React key prop errors are fixed';
END $$;