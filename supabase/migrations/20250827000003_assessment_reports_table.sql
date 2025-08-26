-- Create assessment_reports table for storing generated assessment reports
CREATE TABLE public.assessment_reports (
  id TEXT PRIMARY KEY,
  assessment_id UUID NOT NULL REFERENCES public.property_assessments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_data JSONB NOT NULL,
  html_content TEXT,
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE public.assessment_reports ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own assessment reports
CREATE POLICY "Users can access their own assessment reports" ON public.assessment_reports
  FOR ALL USING (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX idx_assessment_reports_user_id ON public.assessment_reports(user_id);
CREATE INDEX idx_assessment_reports_assessment_id ON public.assessment_reports(assessment_id);
CREATE INDEX idx_assessment_reports_created_at ON public.assessment_reports(created_at DESC);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER assessment_reports_updated_at
  BEFORE UPDATE ON public.assessment_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
