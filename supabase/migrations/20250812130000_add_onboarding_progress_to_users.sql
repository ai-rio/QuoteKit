-- =====================================================
-- ADD ONBOARDING PROGRESS TO USERS TABLE - M1.2
-- =====================================================
-- This migration implements M1.2 database schema requirements by adding
-- onboarding tracking columns to the existing users table

-- Add onboarding_progress JSONB column with default empty object
ALTER TABLE public.users ADD COLUMN onboarding_progress JSONB DEFAULT '{}';

-- Add onboarding_completed_at TIMESTAMP column (nullable until onboarding is complete)
ALTER TABLE public.users ADD COLUMN onboarding_completed_at TIMESTAMP;

-- Add indexes for efficient querying of onboarding data
CREATE INDEX idx_users_onboarding_completed ON public.users(onboarding_completed_at) 
WHERE onboarding_completed_at IS NOT NULL;

CREATE INDEX idx_users_onboarding_incomplete ON public.users(id) 
WHERE onboarding_completed_at IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.users.onboarding_progress IS 'JSONB object tracking user onboarding step completion and progress data';
COMMENT ON COLUMN public.users.onboarding_completed_at IS 'Timestamp when user completed the full onboarding process';

-- Update RLS policies for onboarding data access
-- The existing policies already cover these new columns since they use "FOR SELECT/UPDATE USING (auth.uid() = id)"
-- No additional RLS policies needed as the onboarding data follows the same security model

-- Add a function to update onboarding progress
CREATE OR REPLACE FUNCTION public.update_onboarding_progress(
  progress_data JSONB,
  mark_completed BOOLEAN DEFAULT FALSE
)
RETURNS void AS $$
BEGIN
  -- Update the onboarding progress
  UPDATE public.users 
  SET 
    onboarding_progress = progress_data,
    onboarding_completed_at = CASE 
      WHEN mark_completed THEN NOW() 
      ELSE onboarding_completed_at 
    END,
    updated_at = NOW()
  WHERE id = auth.uid();
  
  -- Raise exception if no rows were updated (user not found or not authenticated)
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unable to update onboarding progress. User not found or not authenticated.';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add a function to check if onboarding is complete
CREATE OR REPLACE FUNCTION public.is_onboarding_complete()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND onboarding_completed_at IS NOT NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on the functions to authenticated users
GRANT EXECUTE ON FUNCTION public.update_onboarding_progress(JSONB, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_onboarding_complete() TO authenticated;