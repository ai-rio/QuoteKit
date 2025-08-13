-- =====================================================
-- ROLLBACK ONBOARDING PROGRESS - M1.2 ROLLBACK
-- =====================================================
-- This script rolls back the onboarding progress changes
-- WARNING: This will permanently delete all onboarding progress data
-- To use: Run this script manually if you need to rollback the onboarding feature

-- Drop the onboarding functions
DROP FUNCTION IF EXISTS public.update_onboarding_progress(JSONB, BOOLEAN);
DROP FUNCTION IF EXISTS public.is_onboarding_complete();

-- Drop the indexes
DROP INDEX IF EXISTS idx_users_onboarding_completed;
DROP INDEX IF EXISTS idx_users_onboarding_incomplete;

-- Remove the onboarding columns (this will delete all onboarding data)
ALTER TABLE public.users DROP COLUMN IF EXISTS onboarding_progress;
ALTER TABLE public.users DROP COLUMN IF EXISTS onboarding_completed_at;