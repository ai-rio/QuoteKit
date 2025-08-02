-- =====================================================
-- CLEANUP FEATURE ACCESS MANAGEMENT TABLES
-- =====================================================
-- This migration removes the Feature Access Management tables and sample data
-- that were added for testing purposes

-- Remove sample admin alerts
DELETE FROM admin_alerts WHERE created_at >= '2025-08-02'::date;

-- Remove sample edge case events  
DELETE FROM edge_case_events WHERE created_at >= '2025-08-02'::date;

-- Remove sample billing history
DELETE FROM billing_history WHERE created_at >= '2025-08-02'::date;

-- Remove test users (keep the original admin user)
DELETE FROM public.users WHERE full_name LIKE 'Test User%';
DELETE FROM auth.users WHERE email LIKE 'testuser%@example.com';

-- Log the cleanup
DO $$
BEGIN
  RAISE NOTICE 'Feature Access Management cleanup completed:';
  RAISE NOTICE '- Sample admin alerts removed';
  RAISE NOTICE '- Sample edge case events removed';
  RAISE NOTICE '- Sample billing history removed';
  RAISE NOTICE '- Test users removed';
  RAISE NOTICE 'Core admin user and functionality preserved';
END $$;
