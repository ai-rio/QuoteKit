-- Add updated_at column to subscriptions table
-- This column is needed for tracking when subscription records are modified

-- Add the updated_at column with default timestamp
ALTER TABLE public.subscriptions 
ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();

-- Update existing records to set updated_at to current timestamp
UPDATE public.subscriptions 
SET updated_at = NOW() 
WHERE updated_at IS NULL;

-- Make updated_at NOT NULL after setting values
ALTER TABLE public.subscriptions 
ALTER COLUMN updated_at SET NOT NULL;

-- Create trigger to automatically update updated_at when subscription is modified
-- First ensure the update_updated_at_column function exists (it should from previous migrations)
-- Use clock_timestamp() to get real-time updates (NOW() returns same value within transaction)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = clock_timestamp();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to subscriptions table
CREATE TRIGGER update_subscriptions_updated_at 
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add index for better performance on updated_at queries
CREATE INDEX idx_subscriptions_updated_at ON public.subscriptions(updated_at);