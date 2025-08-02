-- Add missing tables for plan change functionality

-- Create payment_methods table
CREATE TABLE IF NOT EXISTS payment_methods (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_payment_method_id TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'card',
  card_brand TEXT,
  card_last4 TEXT,
  card_exp_month INTEGER,
  card_exp_year INTEGER,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create billing_history table
CREATE TABLE IF NOT EXISTS billing_history (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id TEXT,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'usd',
  status TEXT NOT NULL,
  description TEXT,
  invoice_url TEXT,
  stripe_invoice_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS payment_methods_user_id_idx ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS payment_methods_stripe_payment_method_id_idx ON payment_methods(stripe_payment_method_id);
CREATE INDEX IF NOT EXISTS payment_methods_is_default_idx ON payment_methods(is_default) WHERE is_default = true;

CREATE INDEX IF NOT EXISTS billing_history_user_id_idx ON billing_history(user_id);
CREATE INDEX IF NOT EXISTS billing_history_subscription_id_idx ON billing_history(subscription_id);
CREATE INDEX IF NOT EXISTS billing_history_created_at_idx ON billing_history(created_at);

-- Add RLS policies
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_history ENABLE ROW LEVEL SECURITY;

-- Payment methods policies
CREATE POLICY "Users can view their own payment methods" ON payment_methods
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payment methods" ON payment_methods
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payment methods" ON payment_methods
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own payment methods" ON payment_methods
  FOR DELETE USING (auth.uid() = user_id);

-- Billing history policies
CREATE POLICY "Users can view their own billing history" ON billing_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage billing history" ON billing_history
  FOR ALL USING (auth.role() = 'service_role');
