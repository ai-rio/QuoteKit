-- Story 2.4: Professional Settings Management Database Enhancements

-- Add missing fields to company_settings table
ALTER TABLE public.company_settings 
ADD COLUMN IF NOT EXISTS company_email TEXT,
ADD COLUMN IF NOT EXISTS logo_file_name TEXT,
ADD COLUMN IF NOT EXISTS preferred_currency TEXT DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS quote_terms TEXT;

-- Create storage bucket for company logos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('company-logos', 'company-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for logo uploads
CREATE POLICY "Users can upload their own logos" ON storage.objects 
FOR INSERT WITH CHECK (
  bucket_id = 'company-logos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own logos" ON storage.objects 
FOR SELECT USING (
  bucket_id = 'company-logos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own logos" ON storage.objects 
FOR UPDATE USING (
  bucket_id = 'company-logos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own logos" ON storage.objects 
FOR DELETE USING (
  bucket_id = 'company-logos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create index for company email lookups
CREATE INDEX IF NOT EXISTS idx_company_settings_email ON public.company_settings(company_email);

-- Add comment for documentation
COMMENT ON TABLE public.company_settings IS 'Enhanced company settings with logo upload support and additional business information fields';
COMMENT ON COLUMN public.company_settings.logo_file_name IS 'Storage filename for uploaded company logo';
COMMENT ON COLUMN public.company_settings.company_email IS 'Business email address for company communications';
COMMENT ON COLUMN public.company_settings.preferred_currency IS 'Default currency for quotes and financial calculations';
COMMENT ON COLUMN public.company_settings.quote_terms IS 'Default terms and conditions for quotes';