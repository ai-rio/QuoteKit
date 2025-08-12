-- Admin Settings Table Creation for Production
-- Run this in your Supabase Dashboard → SQL Editor

-- Create admin_settings table for storing admin configuration
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id BIGSERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  created_by UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
  updated_by UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Only admin users can access admin settings
CREATE POLICY "Admin users can manage admin settings" 
ON public.admin_settings FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_settings_key ON public.admin_settings(key);
CREATE INDEX IF NOT EXISTS idx_admin_settings_updated_at ON public.admin_settings(updated_at);

-- Add trigger function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_admin_settings_updated_at ON public.admin_settings;
CREATE TRIGGER update_admin_settings_updated_at 
  BEFORE UPDATE ON public.admin_settings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verify table was created
SELECT 
  'admin_settings table created successfully' as status,
  COUNT(*) as initial_row_count 
FROM public.admin_settings;