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
  public.is_admin(auth.uid())
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_settings_key ON public.admin_settings(key);
CREATE INDEX IF NOT EXISTS idx_admin_settings_updated_at ON public.admin_settings(updated_at);

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_admin_settings_updated_at 
  BEFORE UPDATE ON public.admin_settings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();