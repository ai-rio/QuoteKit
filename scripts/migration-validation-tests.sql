-- =====================================================
-- MIGRATION VALIDATION TEST SUITE
-- =====================================================
-- Comprehensive test suite to validate the security migration
-- Run these tests after applying the migration

-- Enable psql output formatting
\set QUIET on
\pset border 2
\pset format aligned

\echo ''
\echo '=== MIGRATION VALIDATION TEST SUITE ==='
\echo 'Testing security migration: 99999999999999_secure_admin_functions.sql'
\echo ''

-- Test 1: Verify audit log table structure
\echo 'TEST 1: Audit Log Table Structure'
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'admin_audit_log' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

\echo ''
\echo 'Expected columns: id (UUID), user_id (UUID), action (TEXT), ip_address (TEXT), user_agent (TEXT), success (BOOLEAN), error_message (TEXT), timestamp (TIMESTAMPTZ), metadata (JSONB)'
\echo ''

-- Test 2: Verify users table admin columns
\echo 'TEST 2: Users Table Admin Columns'
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND table_schema = 'public'
  AND column_name LIKE '%admin%'
ORDER BY column_name;

\echo ''
\echo 'Expected admin columns: admin_locked_until, admin_login_attempts, admin_verified_at, is_admin, last_admin_login'
\echo ''

-- Test 3: Verify RLS is enabled
\echo 'TEST 3: Row Level Security Status'
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN '✓ ENABLED' 
        ELSE '✗ DISABLED' 
    END as rls_status
FROM pg_tables 
WHERE tablename IN ('admin_audit_log', 'users')
  AND schemaname = 'public';

\echo ''

-- Test 4: Verify RLS policies exist
\echo 'TEST 4: RLS Policies'
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd as command,
    CASE 
        WHEN permissive THEN 'PERMISSIVE' 
        ELSE 'RESTRICTIVE' 
    END as policy_type
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'admin_audit_log';

\echo ''

-- Test 5: Verify security functions exist
\echo 'TEST 5: Security Functions'
SELECT 
    routine_name as function_name,
    routine_type,
    security_type,
    CASE 
        WHEN security_type = 'DEFINER' THEN '✓ SECURE' 
        ELSE '⚠ INVOKER' 
    END as security_status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('verify_admin_access', 'validate_admin_session')
ORDER BY routine_name;

\echo ''

-- Test 6: Verify indexes exist
\echo 'TEST 6: Performance Indexes'
SELECT 
    indexname,
    tablename,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND (indexname LIKE '%admin%' OR tablename = 'admin_audit_log')
ORDER BY tablename, indexname;

\echo ''

-- Test 7: Test function permissions
\echo 'TEST 7: Function Permissions'
SELECT 
    routine_name,
    grantor,
    grantee,
    privilege_type
FROM information_schema.routine_privileges 
WHERE routine_schema = 'public' 
  AND routine_name IN ('verify_admin_access', 'validate_admin_session')
ORDER BY routine_name, grantee;

\echo ''

-- Test 8: Verify old insecure functions are removed
\echo 'TEST 8: Insecure Functions Removal Check'
SELECT 
    COUNT(*) as insecure_functions_count,
    CASE 
        WHEN COUNT(*) = 0 THEN '✓ ALL REMOVED' 
        ELSE '✗ STILL EXISTS' 
    END as removal_status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN (
    'is_admin', 
    'current_user_is_admin', 
    'get_admin_user_details', 
    'can_access_admin_functions'
  );

-- List any remaining insecure functions
SELECT 
    routine_name as remaining_insecure_function,
    '⚠ SECURITY RISK' as warning
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN (
    'is_admin', 
    'current_user_is_admin', 
    'get_admin_user_details', 
    'can_access_admin_functions'
  );

\echo ''

-- Test 9: Test basic function execution (smoke test)
\echo 'TEST 9: Function Execution Smoke Test'
\echo 'Testing validate_admin_session() function...'

-- This should return false for non-admin or unauthenticated user
SELECT 
    public.validate_admin_session() as session_valid,
    CASE 
        WHEN public.validate_admin_session() = false THEN '✓ CORRECTLY DENIED' 
        ELSE '⚠ UNEXPECTED RESULT' 
    END as test_result;

\echo ''

-- Test 10: Check constraint validations
\echo 'TEST 10: Table Constraints'
SELECT 
    tc.constraint_name,
    tc.table_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public' 
  AND tc.table_name = 'admin_audit_log'
ORDER BY tc.constraint_type, tc.constraint_name;

\echo ''

-- Test 11: Foreign key relationships
\echo 'TEST 11: Foreign Key Relationships'
SELECT 
    tc.constraint_name,
    tc.table_name as child_table,
    kcu.column_name as child_column,
    ccu.table_name as parent_table,
    ccu.column_name as parent_column
FROM information_schema.table_constraints tc 
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
  AND tc.table_name = 'admin_audit_log';

\echo ''

-- Test 12: Verify data types and defaults
\echo 'TEST 12: Critical Column Configurations'
SELECT 
    table_name,
    column_name,
    data_type,
    column_default,
    is_nullable,
    CASE 
        WHEN column_name = 'id' AND data_type = 'uuid' AND column_default LIKE '%gen_random_uuid%' THEN '✓ CORRECT UUID PRIMARY KEY'
        WHEN column_name = 'timestamp' AND data_type = 'timestamp with time zone' AND column_default LIKE '%now%' THEN '✓ CORRECT TIMESTAMP DEFAULT'
        WHEN column_name = 'success' AND data_type = 'boolean' AND column_default = 'true' THEN '✓ CORRECT BOOLEAN DEFAULT'
        WHEN column_name = 'metadata' AND data_type = 'jsonb' AND column_default = '''{}''::jsonb' THEN '✓ CORRECT JSONB DEFAULT'
        ELSE 'ℹ ' || data_type
    END as validation_status
FROM information_schema.columns 
WHERE table_name = 'admin_audit_log' 
  AND table_schema = 'public'
  AND column_name IN ('id', 'timestamp', 'success', 'metadata')
ORDER BY column_name;

\echo ''

-- Summary Report
\echo '=== VALIDATION SUMMARY ==='
\echo ''

WITH validation_results AS (
    SELECT 'Audit Log Table' as component, 
           CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_audit_log' AND table_schema = 'public') THEN 1 ELSE 0 END as passed
    UNION ALL
    SELECT 'Admin Columns', 
           CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_admin' AND table_schema = 'public') THEN 1 ELSE 0 END
    UNION ALL
    SELECT 'RLS Enabled', 
           CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'admin_audit_log' AND rowsecurity = true AND schemaname = 'public') THEN 1 ELSE 0 END
    UNION ALL
    SELECT 'RLS Policies', 
           CASE WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'admin_audit_log' AND schemaname = 'public') THEN 1 ELSE 0 END
    UNION ALL
    SELECT 'Security Functions', 
           CASE WHEN (SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name IN ('verify_admin_access', 'validate_admin_session')) = 2 THEN 1 ELSE 0 END
    UNION ALL
    SELECT 'Performance Indexes', 
           CASE WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE indexname LIKE '%admin_audit_log%' AND schemaname = 'public') THEN 1 ELSE 0 END
    UNION ALL
    SELECT 'Insecure Functions Removed', 
           CASE WHEN NOT EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name IN ('is_admin', 'current_user_is_admin', 'get_admin_user_details', 'can_access_admin_functions')) THEN 1 ELSE 0 END
)
SELECT 
    component,
    CASE 
        WHEN passed = 1 THEN '✓ PASS' 
        ELSE '✗ FAIL' 
    END as status
FROM validation_results
ORDER BY component;

\echo ''

SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM (
            SELECT 'Audit Log Table' as component, CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_audit_log' AND table_schema = 'public') THEN 1 ELSE 0 END as passed
            UNION ALL SELECT 'Admin Columns', CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_admin' AND table_schema = 'public') THEN 1 ELSE 0 END
            UNION ALL SELECT 'RLS Enabled', CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'admin_audit_log' AND rowsecurity = true AND schemaname = 'public') THEN 1 ELSE 0 END
            UNION ALL SELECT 'RLS Policies', CASE WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'admin_audit_log' AND schemaname = 'public') THEN 1 ELSE 0 END
            UNION ALL SELECT 'Security Functions', CASE WHEN (SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name IN ('verify_admin_access', 'validate_admin_session')) = 2 THEN 1 ELSE 0 END
            UNION ALL SELECT 'Performance Indexes', CASE WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE indexname LIKE '%admin_audit_log%' AND schemaname = 'public') THEN 1 ELSE 0 END
            UNION ALL SELECT 'Insecure Functions Removed', CASE WHEN NOT EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name IN ('is_admin', 'current_user_is_admin', 'get_admin_user_details', 'can_access_admin_functions')) THEN 1 ELSE 0 END
        ) subq WHERE passed = 1) = 7 
        THEN '✅ ALL TESTS PASSED - MIGRATION SUCCESSFUL' 
        ELSE '❌ SOME TESTS FAILED - REVIEW REQUIRED' 
    END as overall_status;

\echo ''
\echo 'Migration validation complete!'
\echo 'Save this output for production deployment documentation.'
\echo ''