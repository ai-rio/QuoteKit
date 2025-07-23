-- Create admin_settings table for storing configuration
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access only
CREATE POLICY "Admin users can manage settings" ON public.admin_settings
  FOR ALL USING (
    (SELECT is_admin(auth.uid()))
  );

-- Create index for faster key lookups
CREATE INDEX IF NOT EXISTS idx_admin_settings_key ON public.admin_settings(key);

-- Add comments
COMMENT ON TABLE public.admin_settings IS 'Stores admin configuration settings like PostHog API keys';
COMMENT ON COLUMN public.admin_settings.key IS 'Unique identifier for the setting (e.g., posthog_config)';
COMMENT ON COLUMN public.admin_settings.value IS 'JSON configuration value';
COMMENT ON COLUMN public.admin_settings.updated_by IS 'Admin user who last updated this setting';