-- Blueprint Migration Validation Queries - Task M1.2
-- Comprehensive data integrity and validation queries for QuoteKit Blueprint implementation
-- Following proven database validation patterns

-- =====================================================
-- PRE-MIGRATION VALIDATION QUERIES
-- =====================================================

-- 1. Client Data Integrity Check
-- Identifies clients with missing or invalid required data
SELECT 
  'pre_migration_client_integrity' as check_type,
  COUNT(*) as total_clients,
  COUNT(*) FILTER (WHERE name IS NULL OR TRIM(name) = '') as invalid_names,
  COUNT(*) FILTER (WHERE user_id IS NULL) as missing_user_ids,
  COUNT(*) FILTER (WHERE email IS NOT NULL AND email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$') as invalid_emails,
  ARRAY_AGG(id) FILTER (WHERE name IS NULL OR TRIM(name) = '' OR user_id IS NULL) as problematic_client_ids
FROM public.clients;

-- 2. Quote-Client Relationship Integrity
-- Identifies orphaned quotes and relationship issues
WITH quote_client_analysis AS (
  SELECT 
    q.id,
    q.client_id,
    q.client_name,
    q.user_id,
    c.id as actual_client_id,
    c.name as actual_client_name,
    CASE 
      WHEN q.client_id IS NOT NULL AND c.id IS NULL THEN 'orphaned'
      WHEN q.client_id IS NOT NULL AND c.name != q.client_name THEN 'name_mismatch'
      WHEN q.client_id IS NULL THEN 'no_client_link'
      ELSE 'valid'
    END as relationship_status
  FROM public.quotes q
  LEFT JOIN public.clients c ON q.client_id = c.id
)
SELECT 
  'pre_migration_quote_relationships' as check_type,
  COUNT(*) as total_quotes,
  COUNT(*) FILTER (WHERE relationship_status = 'orphaned') as orphaned_quotes,
  COUNT(*) FILTER (WHERE relationship_status = 'name_mismatch') as name_mismatches,
  COUNT(*) FILTER (WHERE relationship_status = 'no_client_link') as no_client_link,
  COUNT(*) FILTER (WHERE relationship_status = 'valid') as valid_relationships,
  ARRAY_AGG(id) FILTER (WHERE relationship_status != 'valid') as problematic_quote_ids
FROM quote_client_analysis;

-- 3. User Account Validation
-- Ensures all clients and quotes belong to valid users
SELECT 
  'pre_migration_user_validation' as check_type,
  (SELECT COUNT(*) FROM public.clients) as total_clients,
  (SELECT COUNT(*) FROM public.quotes) as total_quotes,
  (SELECT COUNT(DISTINCT c.user_id) FROM public.clients c 
   LEFT JOIN auth.users u ON c.user_id = u.id WHERE u.id IS NULL) as clients_invalid_users,
  (SELECT COUNT(DISTINCT q.user_id) FROM public.quotes q 
   LEFT JOIN auth.users u ON q.user_id = u.id WHERE u.id IS NULL) as quotes_invalid_users;

-- 4. Duplicate Client Detection
-- Identifies potential duplicate clients for cleanup
WITH client_duplicates AS (
  SELECT 
    user_id,
    LOWER(TRIM(name)) as normalized_name,
    LOWER(TRIM(COALESCE(email, ''))) as normalized_email,
    COUNT(*) as duplicate_count,
    ARRAY_AGG(id ORDER BY created_at) as client_ids,
    ARRAY_AGG(created_at ORDER BY created_at) as created_dates
  FROM public.clients
  GROUP BY user_id, LOWER(TRIM(name)), LOWER(TRIM(COALESCE(email, '')))
  HAVING COUNT(*) > 1
)
SELECT 
  'pre_migration_duplicate_clients' as check_type,
  COUNT(*) as duplicate_groups,
  SUM(duplicate_count) as total_duplicate_clients,
  JSON_AGG(JSON_BUILD_OBJECT(
    'user_id', user_id,
    'name', normalized_name,
    'email', normalized_email,
    'count', duplicate_count,
    'client_ids', client_ids
  )) as duplicate_details
FROM client_duplicates;

-- =====================================================
-- MIGRATION READINESS ASSESSMENT
-- =====================================================

-- 5. Migration Readiness Summary
-- Provides overall assessment of data readiness for Blueprint migration
WITH readiness_checks AS (
  SELECT 
    'clients_ready' as check_name,
    CASE 
      WHEN COUNT(*) FILTER (WHERE name IS NULL OR TRIM(name) = '' OR user_id IS NULL) = 0 
      THEN true ELSE false 
    END as is_ready,
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE name IS NULL OR TRIM(name) = '' OR user_id IS NULL) as problematic_records
  FROM public.clients
  
  UNION ALL
  
  SELECT 
    'quotes_ready' as check_name,
    CASE 
      WHEN COUNT(*) FILTER (WHERE user_id IS NULL OR client_name IS NULL) = 0 
      THEN true ELSE false 
    END as is_ready,
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE user_id IS NULL OR client_name IS NULL) as problematic_records
  FROM public.quotes
  
  UNION ALL
  
  SELECT 
    'no_orphaned_quotes' as check_name,
    CASE 
      WHEN COUNT(*) = 0 THEN true ELSE false 
    END as is_ready,
    COUNT(*) as total_records,
    COUNT(*) as problematic_records
  FROM public.quotes q
  WHERE q.client_id IS NOT NULL 
    AND NOT EXISTS (SELECT 1 FROM public.clients c WHERE c.id = q.client_id)
)
SELECT 
  'migration_readiness_summary' as check_type,
  BOOL_AND(is_ready) as overall_ready,
  COUNT(*) as total_checks,
  COUNT(*) FILTER (WHERE is_ready = true) as passed_checks,
  COUNT(*) FILTER (WHERE is_ready = false) as failed_checks,
  JSON_AGG(JSON_BUILD_OBJECT(
    'check', check_name,
    'ready', is_ready,
    'total', total_records,
    'problematic', problematic_records
  )) as check_details
FROM readiness_checks;

-- =====================================================
-- POST-MIGRATION VALIDATION QUERIES
-- =====================================================

-- 6. Property Creation Validation
-- Validates that all clients have properties after migration
SELECT 
  'post_migration_property_creation' as check_type,
  COUNT(DISTINCT c.id) as total_clients,
  COUNT(DISTINCT p.client_id) as clients_with_properties,
  COUNT(DISTINCT c.id) - COUNT(DISTINCT p.client_id) as clients_without_properties,
  ARRAY_AGG(DISTINCT c.id) FILTER (WHERE p.client_id IS NULL) as clients_missing_properties,
  COUNT(p.id) as total_properties_created,
  COUNT(p.id) FILTER (WHERE p.is_primary = true) as primary_properties,
  COUNT(p.id) FILTER (WHERE p.property_type = 'residential') as residential_properties,
  COUNT(p.id) FILTER (WHERE p.property_type = 'commercial') as commercial_properties
FROM public.clients c
LEFT JOIN public.properties p ON c.id = p.client_id;

-- 7. Quote-Property Linking Validation  
-- Validates that quotes are properly linked to properties
SELECT 
  'post_migration_quote_property_linking' as check_type,
  COUNT(*) as total_quotes,
  COUNT(*) FILTER (WHERE property_id IS NOT NULL) as quotes_with_properties,
  COUNT(*) FILTER (WHERE property_id IS NULL AND client_id IS NOT NULL) as quotes_missing_properties,
  COUNT(*) FILTER (WHERE property_id IS NULL AND client_id IS NULL) as quotes_no_client_or_property,
  ROUND(
    (COUNT(*) FILTER (WHERE property_id IS NOT NULL)::numeric / NULLIF(COUNT(*)::numeric, 0)) * 100, 
    2
  ) as property_link_success_rate
FROM public.quotes;

-- 8. Property Data Integrity Post-Migration
-- Validates quality of created property data
SELECT 
  'post_migration_property_integrity' as check_type,
  COUNT(*) as total_properties,
  COUNT(*) FILTER (WHERE service_address IS NULL OR TRIM(service_address) = '') as missing_addresses,
  COUNT(*) FILTER (WHERE property_type IS NULL) as missing_property_type,
  COUNT(*) FILTER (WHERE client_id IS NULL) as missing_client_links,
  COUNT(*) FILTER (WHERE is_primary = true) as primary_properties,
  COUNT(DISTINCT client_id) as unique_clients_with_properties,
  ROUND(AVG(CASE WHEN is_primary THEN 1 ELSE 0 END), 2) as avg_primary_per_client
FROM public.properties;

-- 9. Relationship Integrity Validation
-- Comprehensive validation of all relationships after migration
WITH relationship_validation AS (
  SELECT 
    c.id as client_id,
    c.name as client_name,
    c.user_id,
    COUNT(p.id) as property_count,
    COUNT(q.id) as quote_count,
    COUNT(q.id) FILTER (WHERE q.property_id IS NOT NULL) as quotes_with_properties,
    BOOL_AND(p.id IS NOT NULL) as has_properties,
    MAX(p.is_primary::int) as has_primary_property
  FROM public.clients c
  LEFT JOIN public.properties p ON c.id = p.client_id
  LEFT JOIN public.quotes q ON c.id = q.client_id
  GROUP BY c.id, c.name, c.user_id
)
SELECT 
  'post_migration_relationship_integrity' as check_type,
  COUNT(*) as total_clients,
  COUNT(*) FILTER (WHERE has_properties = true) as clients_with_properties,
  COUNT(*) FILTER (WHERE has_primary_property = 1) as clients_with_primary,
  COUNT(*) FILTER (WHERE quote_count > 0) as clients_with_quotes,
  COUNT(*) FILTER (WHERE quote_count > 0 AND quotes_with_properties = quote_count) as clients_all_quotes_linked,
  ROUND(AVG(property_count), 2) as avg_properties_per_client,
  ROUND(AVG(quote_count), 2) as avg_quotes_per_client,
  ROUND(
    (COUNT(*) FILTER (WHERE has_properties = true)::numeric / NULLIF(COUNT(*)::numeric, 0)) * 100, 
    2
  ) as property_coverage_percent
FROM relationship_validation;

-- =====================================================
-- ROLLBACK VALIDATION QUERIES  
-- =====================================================

-- 10. Pre-Rollback State Check
-- Documents current state before rollback for verification
SELECT 
  'pre_rollback_state' as check_type,
  (SELECT COUNT(*) FROM public.properties) as current_properties,
  (SELECT COUNT(*) FROM public.quotes WHERE property_id IS NOT NULL) as quotes_with_properties,
  (SELECT COUNT(DISTINCT client_id) FROM public.properties) as clients_with_properties,
  NOW() as rollback_timestamp;

-- 11. Post-Rollback Validation
-- Validates rollback was successful
SELECT 
  'post_rollback_validation' as check_type,
  (SELECT COUNT(*) FROM public.properties) as remaining_properties,
  (SELECT COUNT(*) FROM public.quotes WHERE property_id IS NOT NULL) as quotes_still_linked,
  CASE 
    WHEN (SELECT COUNT(*) FROM public.properties) = 0 
     AND (SELECT COUNT(*) FROM public.quotes WHERE property_id IS NOT NULL) = 0
    THEN 'ROLLBACK_SUCCESSFUL'
    ELSE 'ROLLBACK_INCOMPLETE'
  END as rollback_status;

-- =====================================================
-- PERFORMANCE VALIDATION QUERIES
-- =====================================================

-- 12. Query Performance Validation
-- Ensures database performance remains optimal after migration
EXPLAIN (ANALYZE, BUFFERS) 
SELECT c.name, p.service_address, COUNT(q.id) as quote_count
FROM public.clients c
JOIN public.properties p ON c.id = p.client_id
LEFT JOIN public.quotes q ON p.id = q.property_id
WHERE c.user_id = (SELECT id FROM auth.users LIMIT 1)
GROUP BY c.id, c.name, p.id, p.service_address
ORDER BY quote_count DESC
LIMIT 10;

-- 13. Index Effectiveness Check
-- Validates that indexes are being used effectively
SELECT 
  'index_effectiveness' as check_type,
  schemaname,
  tablename,
  indexname,
  idx_scan as times_used,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes 
WHERE schemaname = 'public' 
  AND tablename IN ('clients', 'properties', 'quotes')
ORDER BY idx_scan DESC;

-- =====================================================
-- DATA CONSISTENCY VERIFICATION
-- =====================================================

-- 14. Cross-Table Consistency Check
-- Verifies data consistency across related tables
WITH consistency_check AS (
  SELECT 
    'client_property_consistency' as check_name,
    COUNT(DISTINCT c.id) as total_clients,
    COUNT(DISTINCT p.client_id) as clients_in_properties,
    COUNT(DISTINCT c.id) = COUNT(DISTINCT p.client_id) as is_consistent
  FROM public.clients c
  LEFT JOIN public.properties p ON c.id = p.client_id
  
  UNION ALL
  
  SELECT 
    'property_quote_consistency' as check_name,
    COUNT(DISTINCT p.id) as total_properties,
    COUNT(DISTINCT q.property_id) as properties_in_quotes,
    true as is_consistent -- Properties don't need quotes, so this is always valid
  FROM public.properties p
  LEFT JOIN public.quotes q ON p.id = q.property_id
)
SELECT 
  'data_consistency_summary' as check_type,
  BOOL_AND(is_consistent) as overall_consistent,
  JSON_AGG(JSON_BUILD_OBJECT(
    'check', check_name,
    'consistent', is_consistent,
    'details', JSON_BUILD_OBJECT(
      'total', total_clients,
      'related', clients_in_properties
    )
  )) as consistency_details
FROM consistency_check;

-- =====================================================
-- TYPESCRIPT TYPE VALIDATION SUPPORT
-- =====================================================

-- 15. Type Generation Validation Query
-- Provides data structure info for TypeScript type validation
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length,
  numeric_precision,
  numeric_scale
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('clients', 'properties', 'quotes')
ORDER BY table_name, ordinal_position;

-- 16. Foreign Key Relationship Mapping
-- Maps relationships for TypeScript interface generation
SELECT 
  tc.constraint_name,
  tc.table_name as source_table,
  kcu.column_name as source_column,
  ccu.table_name as target_table,
  ccu.column_name as target_column,
  tc.constraint_type
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('clients', 'properties', 'quotes')
ORDER BY tc.table_name, tc.constraint_name;