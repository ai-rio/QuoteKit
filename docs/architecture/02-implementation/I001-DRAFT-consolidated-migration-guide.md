# QuoteKit Schema v3.0 Consolidated Migration Guide

## Overview

This guide provides comprehensive instructions for applying the consolidated schema v3.0 migration, which unifies 27+ previous migrations into a single, comprehensive subscription management system while maintaining 100% backward compatibility with the existing QuoteKit application.

## Migration Files

- **Primary Migration**: `20250731000000_consolidated_schema_v3.sql`
- **Rollback Procedures**: `20250731000001_rollback_procedures_v3.sql`

## Pre-Migration Checklist

### 1. Environment Safety Check

```sql
-- Check if environment is safe for migration
SELECT check_migration_safety();
```

Expected response should show `"safety_status": "SAFE"` for optimal migration conditions.

### 2. Create Backup

```sql
-- Create comprehensive backup before migration
SELECT create_migration_backup();
```

This returns a backup suffix (e.g., `backup_2025_07_30_20_30_00`) that you'll need for potential rollback.

### 3. Verify Current State

```sql
-- Check current subscription and user counts
SELECT 
    (SELECT count(*) FROM users) as user_count,
    (SELECT count(*) FROM subscriptions) as subscription_count,
    (SELECT count(*) FROM customers WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customers')) as customer_count;
```

## Migration Application

### Step 1: Apply Primary Migration

```bash
# Using Supabase CLI
supabase db reset --local  # For local development
# OR
supabase migration apply --local

# For production (after testing)
supabase db push
```

### Step 2: Apply Rollback Procedures

```bash
# Apply rollback procedures migration
supabase migration apply --include-file="20250731000001_rollback_procedures_v3.sql"
```

## Post-Migration Validation

### 1. Data Integrity Check

```sql
-- Validate migration integrity
SELECT validate_migration_integrity();
```

Expected result should show `"status": "PASS"`.

### 2. Fix Common Issues (if needed)

```sql
-- Fix any issues found during validation
SELECT fix_migration_issues();
```

### 3. Verify Application Functionality

Test key application features:

- [ ] User authentication and profile access
- [ ] Quote creation and management
- [ ] Company settings updates
- [ ] Line items management
- [ ] Subscription data display (if applicable)
- [ ] Payment methods display (if applicable)

## Schema Changes Summary

### Enhanced Tables

#### Users Table
- **New Fields**: `email`, `company_size`, `industry`, `phone`, `timezone`, `locale`, `email_verified`, `onboarding_completed`, `account_status`, `tax_ids`, `metadata`, `created_at`, `updated_at`, `last_seen_at`
- **Backward Compatibility**: All existing fields preserved

#### Subscriptions Table
- **New Fields**: `internal_id` (new primary key), `stripe_customer_id`, `collection_method`, `proration_behavior`, `cancellation_reason`, `usage_based_billing`, `mrr_amount`, `arr_amount`, plus many more
- **Backward Compatibility**: All existing fields preserved, legacy `id` field maintained

### New Tables Added

1. **stripe_customers** - Enhanced customer management
2. **payment_methods** - Secure payment method storage
3. **stripe_products** - Enhanced product catalog
4. **stripe_prices** - Enhanced pricing management
5. **subscription_events** - Subscription lifecycle tracking
6. **subscription_changes** - Plan change audit trail
7. **usage_metrics** - Usage tracking definitions
8. **user_usage_current** - Current period usage
9. **user_usage_history** - Historical usage data
10. **usage_events** - Real-time usage tracking
11. **webhook_events** - Enhanced webhook processing
12. **webhook_processing_logs** - Webhook debugging

### Backward Compatibility Views

- **products** - Maps to `stripe_products` for legacy compatibility
- **prices** - Maps to `stripe_prices` for legacy compatibility  
- **customers** - Maps to `stripe_customers` for legacy compatibility

### New Analytical Views

- **subscription_analytics** - Comprehensive subscription metrics
- **usage_analytics** - Usage tracking and billing metrics
- **subscription_diagnostics** - Troubleshooting and debugging

## New Features Available

### 1. Enhanced Subscription Management
- Multi-tier subscription support (free, starter, professional, enterprise)
- Usage-based billing and metering
- Subscription lifecycle tracking
- Advanced trial management

### 2. Payment Processing
- Secure payment method storage
- Multiple payment method support
- Payment failure handling and retry logic

### 3. Usage Tracking
- Real-time usage monitoring
- Overage detection and billing
- Historical usage analytics
- Custom usage metrics

### 4. Webhook Processing
- Enhanced webhook event handling
- Retry logic with exponential backoff
- Detailed processing logs
- Error tracking and debugging

### 5. Analytics and Reporting
- Revenue analytics (MRR, ARR, LTV)
- Subscription conversion metrics
- Usage analytics and trends
- Customer lifecycle analytics

## Rollback Procedures

### When to Rollback

Consider rollback if:
- Data integrity validation fails
- Application functionality is broken
- Performance degradation occurs
- Critical business operations are affected

### How to Rollback

```sql
-- Rollback using your backup suffix
SELECT rollback_v3_migration('backup_2025_07_30_20_30_00');
```

**Note**: Replace the backup suffix with the one returned from your `create_migration_backup()` call.

### Post-Rollback Validation

```sql
-- Verify rollback success
SELECT 
    (SELECT count(*) FROM users) as user_count,
    (SELECT count(*) FROM subscriptions) as subscription_count,
    (SELECT count(*) FROM customers) as customer_count;
```

## Monitoring and Troubleshooting

### Migration Logs

```sql
-- View migration logs
SELECT * FROM backup_v2.migration_log 
ORDER BY started_at DESC;
```

### Common Issues and Solutions

#### Issue: Missing internal_id values
```sql
-- Fix missing internal IDs
UPDATE subscriptions 
SET internal_id = gen_random_uuid() 
WHERE internal_id IS NULL;
```

#### Issue: Orphaned subscription records
```sql
-- Check for orphaned subscriptions
SELECT count(*) 
FROM subscriptions s 
LEFT JOIN users u ON s.user_id = u.id 
WHERE u.id IS NULL;
```

#### Issue: RLS Policy conflicts
```sql
-- Check RLS policies
SELECT schemaname, tablename, policyname, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;
```

## Performance Considerations

### New Indexes

The migration adds comprehensive indexes for optimal performance:

- User-related indexes for fast lookups
- Subscription indexes for analytics queries
- Payment method indexes for secure access
- Usage tracking indexes for real-time queries
- Webhook processing indexes for retry logic

### Query Optimization

The new schema includes several analytical views that pre-compute common queries:

- `subscription_analytics` for business metrics
- `usage_analytics` for billing calculations
- `subscription_diagnostics` for troubleshooting

## Security Enhancements

### Row Level Security (RLS)

All tables have comprehensive RLS policies:

- **User Isolation**: Users can only access their own data
- **Service Role Access**: Full access for webhook processing
- **Admin Access**: Special policies for admin operations
- **Public Read**: Limited read access for product catalog

### Data Protection

- Payment method data stored securely
- Webhook events isolated to service role
- Usage data protected by user-level policies
- Audit trails for all subscription changes

## Testing Recommendations

### Unit Tests

Test the following functionality:
- User CRUD operations
- Subscription management
- Payment method handling
- Usage tracking
- Webhook processing

### Integration Tests

- End-to-end subscription flows
- Payment processing workflows
- Usage-based billing calculations
- Analytics and reporting accuracy

### Performance Tests

- Query performance with large datasets
- Concurrent user operations
- Webhook processing under load
- Analytics view performance

## Support and Resources

### Diagnostic Queries

```sql
-- Overall system health
SELECT validate_migration_integrity();

-- Subscription overview
SELECT * FROM subscription_diagnostics LIMIT 10;

-- Usage tracking status
SELECT * FROM usage_analytics WHERE user_id = 'YOUR_USER_ID';

-- Recent webhook events
SELECT * FROM webhook_events 
WHERE created_at > now() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 10;
```

### Backup Information

```sql
-- View all available backups
SELECT * FROM backup_v2.migration_backups 
ORDER BY backup_timestamp DESC;
```

## Conclusion

The v3.0 consolidated migration provides a robust, scalable foundation for subscription management while maintaining complete backward compatibility. The enhanced schema supports advanced SaaS features including usage-based billing, comprehensive analytics, and enterprise-grade security.

For additional support or questions about the migration, refer to the diagnostic functions and monitoring tools provided in the rollback procedures migration.