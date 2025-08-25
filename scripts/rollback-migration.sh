#!/bin/bash

# =====================================================
# MIGRATION ROLLBACK SCRIPT
# =====================================================
# Safely rolls back the admin security migration
# Can be used in both local and production environments

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Environment detection
ENVIRONMENT=${1:-"local"}
BACKUP_PATH=${2:-""}

if [[ "$ENVIRONMENT" == "local" ]]; then
    DB_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
elif [[ "$ENVIRONMENT" == "production" ]]; then
    DB_URL=$DATABASE_URL
    if [[ -z "$BACKUP_PATH" ]]; then
        echo "Usage for production: $0 production /path/to/backup.sql"
        exit 1
    fi
else
    echo "Usage: $0 [local|production] [backup_file]"
    exit 1
fi

# Logging functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Rollback confirmation
confirm_rollback() {
    log_warning "MIGRATION ROLLBACK CONFIRMATION"
    echo "=================================="
    echo "You are about to ROLLBACK the admin security migration."
    echo ""
    echo "Environment: $ENVIRONMENT"
    if [[ -n "$BACKUP_PATH" ]]; then
        echo "Backup file: $BACKUP_PATH"
    fi
    echo ""
    echo "This will:"
    echo "⚠️  Remove admin security enhancements"
    echo "⚠️  Drop audit logging table"
    echo "⚠️  Remove admin columns from users table"
    echo "⚠️  Remove security functions"
    echo ""
    
    if [[ "$ENVIRONMENT" == "production" ]]; then
        echo "🚨 PRODUCTION ROLLBACK WARNING 🚨"
        echo "This will affect your live application!"
        echo ""
    fi
    
    read -p "Are you absolutely sure you want to proceed? (type 'ROLLBACK' to confirm): " confirmation
    
    if [[ "$confirmation" != "ROLLBACK" ]]; then
        log_error "Rollback cancelled by user"
        exit 1
    fi
    
    log_success "Rollback confirmed"
}

# Create rollback backup
create_rollback_backup() {
    log "Creating backup before rollback..."
    
    ROLLBACK_BACKUP_DIR="./rollback_backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$ROLLBACK_BACKUP_DIR"
    
    if [[ "$ENVIRONMENT" == "local" ]]; then
        pg_dump "$DB_URL" > "$ROLLBACK_BACKUP_DIR/pre_rollback_backup.sql"
    else
        # Use --local flag for local testing, omit for linked production
        if command -v docker >/dev/null && supabase status >/dev/null 2>&1; then
            supabase db dump --local --schema public > "$ROLLBACK_BACKUP_DIR/pre_rollback_backup.sql"
        else
            supabase db dump --schema public > "$ROLLBACK_BACKUP_DIR/pre_rollback_backup.sql"
        fi
    fi
    
    log_success "Rollback backup created: $ROLLBACK_BACKUP_DIR"
}

# Method 1: Restore from backup file
restore_from_backup() {
    if [[ -z "$BACKUP_PATH" ]] || [[ ! -f "$BACKUP_PATH" ]]; then
        log_error "Backup file not found: $BACKUP_PATH"
        return 1
    fi
    
    log "Restoring database from backup: $BACKUP_PATH"
    
    # Reset database and restore from backup
    if [[ "$ENVIRONMENT" == "local" ]]; then
        # For local, we can reset and restore
        supabase db reset
        psql "$DB_URL" < "$BACKUP_PATH"
    else
        # For production, we need to be more careful
        log_warning "Production backup restoration requires manual intervention"
        log "Please manually restore using: psql \$DATABASE_URL < $BACKUP_PATH"
        return 1
    fi
    
    log_success "Database restored from backup"
}

# Method 2: Manual rollback using SQL
manual_rollback() {
    log "Performing manual rollback using SQL commands..."
    
    # Create rollback SQL
    ROLLBACK_SQL="/tmp/rollback_migration.sql"
    
cat > "$ROLLBACK_SQL" << 'EOF'
-- =====================================================
-- ROLLBACK ADMIN SECURITY MIGRATION
-- =====================================================
-- This script reverses the changes made by the admin security migration

BEGIN;

-- Log the rollback operation
DO $$
BEGIN
    RAISE NOTICE 'ROLLBACK: Starting admin security migration rollback';
END $$;

-- Drop new secure admin functions
DROP FUNCTION IF EXISTS public.verify_admin_access(UUID);
DROP FUNCTION IF EXISTS public.validate_admin_session();

-- Drop audit log table
DROP TABLE IF EXISTS public.admin_audit_log;

-- Drop indexes created by migration
DROP INDEX IF EXISTS idx_admin_audit_log_user_timestamp;
DROP INDEX IF EXISTS idx_users_admin_status;

-- Remove admin columns from users table (careful - check if they have data first)
DO $$
BEGIN
    -- Check if admin columns have any true values
    IF EXISTS (SELECT 1 FROM public.users WHERE is_admin = true) THEN
        RAISE NOTICE 'WARNING: Found admin users. Admin columns will be preserved with data.';
        RAISE NOTICE 'Manual review required for: is_admin, admin_verified_at, last_admin_login, admin_login_attempts, admin_locked_until';
    ELSE
        -- Safe to drop columns if no admin users
        ALTER TABLE public.users DROP COLUMN IF EXISTS is_admin;
        ALTER TABLE public.users DROP COLUMN IF EXISTS admin_verified_at;
        ALTER TABLE public.users DROP COLUMN IF EXISTS last_admin_login;
        ALTER TABLE public.users DROP COLUMN IF EXISTS admin_login_attempts;
        ALTER TABLE public.users DROP COLUMN IF EXISTS admin_locked_until;
        RAISE NOTICE 'Admin columns removed from users table';
    END IF;
END $$;

-- Recreate old admin functions (if you want to restore previous functionality)
-- NOTE: These are the INSECURE versions - only recreate if absolutely necessary
-- 
-- CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID DEFAULT auth.uid())
-- RETURNS BOOLEAN AS $$
-- BEGIN
--   RETURN EXISTS (
--     SELECT 1 FROM public.users 
--     WHERE id = user_id AND is_admin = true
--   );
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;
-- 
-- GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO anon, authenticated;

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'ROLLBACK COMPLETE: Admin security migration has been rolled back';
    RAISE NOTICE 'WARNING: Security enhancements have been removed';
    RAISE NOTICE 'RECOMMENDATION: Review and implement proper admin security';
END $$;

COMMIT;
EOF

    # Execute rollback SQL
    log "Executing rollback SQL..."
    if ! psql "$DB_URL" -f "$ROLLBACK_SQL"; then
        log_error "Rollback SQL execution failed"
        return 1
    fi
    
    log_success "Manual rollback completed"
}

# Verify rollback success
verify_rollback() {
    log "Verifying rollback success..."
    
    # Check 1: Audit log table should be gone
    log "- Checking if audit log table removed..."
    if psql "$DB_URL" -c "SELECT COUNT(*) FROM public.admin_audit_log;" > /dev/null 2>&1; then
        log_warning "Audit log table still exists"
    else
        log_success "Audit log table removed"
    fi
    
    # Check 2: New secure functions should be gone
    log "- Checking if secure functions removed..."
    SECURE_FUNCTIONS=$(psql "$DB_URL" -t -c "
        SELECT COUNT(*) 
        FROM pg_proc 
        WHERE proname IN ('verify_admin_access', 'validate_admin_session');
    ")
    
    if [[ "$SECURE_FUNCTIONS" == " 0" ]]; then
        log_success "Secure admin functions removed"
    else
        log_warning "Some secure functions still exist"
    fi
    
    # Check 3: Indexes should be gone
    log "- Checking if migration indexes removed..."
    MIGRATION_INDEXES=$(psql "$DB_URL" -t -c "
        SELECT COUNT(*) 
        FROM pg_indexes 
        WHERE indexname IN ('idx_admin_audit_log_user_timestamp', 'idx_users_admin_status');
    ")
    
    if [[ "$MIGRATION_INDEXES" == " 0" ]]; then
        log_success "Migration indexes removed"
    else
        log_warning "Some migration indexes still exist"
    fi
    
    # Check 4: Admin columns status
    log "- Checking admin columns status..."
    ADMIN_COLUMNS=$(psql "$DB_URL" -t -c "
        SELECT COUNT(*) 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name LIKE '%admin%';
    ")
    
    if [[ "$ADMIN_COLUMNS" == " 0" ]]; then
        log_success "Admin columns removed from users table"
    else
        log_warning "Admin columns preserved (may contain data)"
    fi
}

# Generate rollback report
generate_rollback_report() {
    log "Generating rollback report..."
    
    REPORT_FILE="/tmp/rollback_report_${ENVIRONMENT}.md"
    
cat > "$REPORT_FILE" << EOF
# Migration Rollback Report - $ENVIRONMENT

**Date:** $(date)
**Environment:** $ENVIRONMENT
**Backup Used:** ${BACKUP_PATH:-"Manual rollback"}

## Rollback Summary

The admin security migration has been rolled back.

### Changes Reverted

- [x] Admin security functions removed
- [x] Audit log table removed  
- [x] Performance indexes removed
- [x] Admin columns handled appropriately

### ⚠️ SECURITY WARNING ⚠️

**CRITICAL**: This rollback has removed important security enhancements:

1. **Admin Access Control**: Enhanced admin verification removed
2. **Audit Logging**: Admin action tracking disabled
3. **Rate Limiting**: Account lockout protection removed
4. **Anonymous Access**: Functions may now be accessible to anonymous users
5. **Session Validation**: Enhanced session security removed

### Immediate Actions Required

1. **Review Admin Access**: Ensure proper admin access controls are in place
2. **Implement Logging**: Set up alternative admin action logging
3. **Security Review**: Conduct immediate security assessment
4. **Monitor Access**: Watch for unauthorized admin access attempts

### Recommendations

1. **Temporary Measure**: This rollback should be considered temporary
2. **Root Cause Analysis**: Identify why rollback was necessary
3. **Improved Migration**: Plan and test improved security implementation
4. **Quick Fix**: Implement basic admin security measures immediately

### Database State

- Admin audit logging: **DISABLED**
- Enhanced admin functions: **REMOVED**
- Rate limiting: **DISABLED** 
- Performance indexes: **REMOVED**

### Recovery Options

To restore security enhancements:
1. Fix issues that caused the rollback
2. Re-run local testing: \`./scripts/test-migration-locally.sh\`
3. Re-deploy migration: \`./scripts/deploy-secure-migration.sh\`

---
**⚠️ IMPORTANT: Your application is now running with reduced security measures.**
**Please implement proper admin security as soon as possible.**

Rollback completed at: $(date)
EOF

    log_success "Rollback report generated: $REPORT_FILE"
    cat "$REPORT_FILE"
}

# Main execution
main() {
    log "Starting migration rollback for $ENVIRONMENT environment..."
    
    # Safety confirmation
    confirm_rollback
    
    # Create backup before rollback
    create_rollback_backup
    
    # Attempt rollback methods
    if [[ -n "$BACKUP_PATH" ]] && [[ -f "$BACKUP_PATH" ]]; then
        log "Using backup file restoration method..."
        if ! restore_from_backup; then
            log_warning "Backup restoration failed, trying manual rollback..."
            manual_rollback
        fi
    else
        log "Using manual rollback method..."
        manual_rollback
    fi
    
    # Verify rollback worked
    verify_rollback
    
    # Generate report
    generate_rollback_report
    
    log_warning "🚨 ROLLBACK COMPLETED"
    log_warning "Your application is now running with REDUCED SECURITY"
    log "Please review the rollback report: /tmp/rollback_report_${ENVIRONMENT}.md"
}

# Help text
if [[ "$1" == "--help" ]] || [[ "$1" == "-h" ]]; then
    echo "Migration Rollback Script"
    echo ""
    echo "Safely rolls back the admin security migration"
    echo ""
    echo "Usage:"
    echo "  $0 local                        # Rollback local environment"
    echo "  $0 production /path/backup.sql  # Rollback production with backup"
    echo "  $0 --help                       # Show this help"
    echo ""
    echo "Methods:"
    echo "  1. Backup Restoration - Restores from pre-migration backup"
    echo "  2. Manual Rollback - Uses SQL commands to reverse changes"
    echo ""
    echo "⚠️  WARNING: Rollback removes security enhancements!"
    echo ""
    echo "Examples:"
    echo "  # Rollback local development"
    echo "  $0 local"
    echo ""
    echo "  # Rollback production using backup"
    echo "  $0 production ./backups/20240101_120000/pre_migration_backup.sql"
    exit 0
fi

# Run main function
main "$@"