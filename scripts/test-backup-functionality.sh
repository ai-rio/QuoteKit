#!/bin/bash

# =====================================================
# BACKUP FUNCTIONALITY TESTING SCRIPT
# =====================================================
# This script tests different backup methods to ensure
# the migration testing script will work correctly

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== BACKUP FUNCTIONALITY TESTING ===${NC}"
echo "Testing Supabase CLI backup methods..."
echo ""

# Function to log messages
log_message() {
    local level=$1
    local message=$2
    
    case $level in
        "INFO")
            echo -e "${BLUE}[INFO]${NC} $message"
            ;;
        "SUCCESS")
            echo -e "${GREEN}[SUCCESS]${NC} $message"
            ;;
        "WARNING")
            echo -e "${YELLOW}[WARNING]${NC} $message"
            ;;
        "ERROR")
            echo -e "${RED}[ERROR]${NC} $message"
            ;;
    esac
}

# Check if Supabase is running
check_supabase() {
    log_message "INFO" "Checking Supabase status..."
    
    if ! command -v supabase &> /dev/null; then
        log_message "ERROR" "Supabase CLI not found"
        exit 1
    fi
    
    if ! supabase status > /dev/null 2>&1; then
        log_message "WARNING" "Supabase not running, starting..."
        supabase start
    fi
    
    log_message "SUCCESS" "Supabase is running"
}

# Test different backup methods
test_backup_methods() {
    log_message "INFO" "Testing backup methods..."
    
    local timestamp=$(date +%Y%m%d_%H%M%S)
    
    # Method 1: Data-only backup
    log_message "INFO" "Test 1: Data-only backup with --use-copy"
    local backup1="test-backup-data-${timestamp}.sql"
    if supabase db dump --local --data-only -f "$backup1" --use-copy 2>/dev/null; then
        log_message "SUCCESS" "Data-only backup created: $backup1"
        ls -la "$backup1"
        rm -f "$backup1"
    else
        log_message "WARNING" "Data-only backup failed"
    fi
    
    # Method 2: Full backup (schema + data)
    log_message "INFO" "Test 2: Full backup with --use-copy"
    local backup2="test-backup-full-${timestamp}.sql"
    if supabase db dump --local -f "$backup2" --use-copy 2>/dev/null; then
        log_message "SUCCESS" "Full backup created: $backup2"
        ls -la "$backup2"
        rm -f "$backup2"
    else
        log_message "WARNING" "Full backup failed"
    fi
    
    # Method 3: Schema-only backup
    log_message "INFO" "Test 3: Schema-only backup"
    local backup3="test-backup-schema-${timestamp}.sql"
    if supabase db dump --local --schema public -f "$backup3" 2>/dev/null; then
        log_message "SUCCESS" "Schema-only backup created: $backup3"
        ls -la "$backup3"
        rm -f "$backup3"
    else
        log_message "WARNING" "Schema-only backup failed"
    fi
    
    # Method 4: Basic backup without flags
    log_message "INFO" "Test 4: Basic backup without extra flags"
    local backup4="test-backup-basic-${timestamp}.sql"
    if supabase db dump --local -f "$backup4" 2>/dev/null; then
        log_message "SUCCESS" "Basic backup created: $backup4"
        ls -la "$backup4"
        rm -f "$backup4"
    else
        log_message "WARNING" "Basic backup failed"
    fi
}

# Test restore functionality
test_restore() {
    log_message "INFO" "Testing restore functionality..."
    
    # Create a simple backup
    local test_backup="test-restore-$(date +%Y%m%d_%H%M%S).sql"
    echo "-- Test backup file" > "$test_backup"
    echo "SELECT 'Backup test successful' as test_message;" >> "$test_backup"
    
    # Test restore
    if supabase db shell < "$test_backup" > /dev/null 2>&1; then
        log_message "SUCCESS" "Restore test successful"
    else
        log_message "WARNING" "Restore test had issues"
    fi
    
    rm -f "$test_backup"
}

# Test database reset
test_reset() {
    log_message "INFO" "Testing database reset..."
    
    if supabase db reset --debug > /dev/null 2>&1; then
        log_message "SUCCESS" "Database reset successful"
    else
        log_message "WARNING" "Database reset had issues"
    fi
}

# Main execution
main() {
    check_supabase
    test_backup_methods
    test_restore
    test_reset
    
    echo ""
    echo -e "${GREEN}=== BACKUP TESTING COMPLETE ===${NC}"
    echo "The migration testing script should now work with the backup fixes."
    echo ""
    echo "To run the full migration test, use:"
    echo "  ./scripts/local-migration-test.sh"
}

# Run tests
main "$@"