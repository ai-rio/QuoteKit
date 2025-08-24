#!/bin/bash

# 🔒 SECURITY VALIDATION SCRIPT
# Validates that all security fixes are working correctly
# Must be run after implementing security remediation

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
VALIDATION_LOG="./security-validation-$TIMESTAMP.log"

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$VALIDATION_LOG"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" | tee -a "$VALIDATION_LOG" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}" | tee -a "$VALIDATION_LOG"
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}" | tee -a "$VALIDATION_LOG"
}

# Test results tracking
TESTS_PASSED=0
TESTS_FAILED=0
CRITICAL_ISSUES=0

# Test function template
run_test() {
    local test_name="$1"
    local test_command="$2"
    local is_critical="${3:-false}"
    
    log "Running test: $test_name"
    
    if eval "$test_command" >> "$VALIDATION_LOG" 2>&1; then
        success "✓ $test_name PASSED"
        ((TESTS_PASSED++))
        return 0
    else
        error "✗ $test_name FAILED"
        ((TESTS_FAILED++))
        if [[ "$is_critical" == "true" ]]; then
            ((CRITICAL_ISSUES++))
        fi
        return 1
    fi
}

# VALIDATION 1: Verify fly.toml has no hardcoded secrets
validate_fly_toml_security() {
    log "🔐 VALIDATION 1: Checking fly.toml for hardcoded secrets"
    
    local has_secrets=false
    
    # Check for patterns that indicate hardcoded secrets (excluding comments)
    if grep -v "^#" fly.toml | grep -q "SERVICE_ROLE_KEY.*=.*ey" 2>/dev/null; then
        error "Found hardcoded SERVICE_ROLE_KEY in fly.toml"
        has_secrets=true
    fi
    
    if grep -v "^#" fly.toml | grep -q "SECRET_KEY.*=.*sk_" 2>/dev/null; then
        error "Found hardcoded SECRET_KEY in fly.toml"
        has_secrets=true
    fi
    
    if grep -v "^#" fly.toml | grep -q "WEBHOOK_SECRET.*=.*whsec_" 2>/dev/null; then
        error "Found hardcoded WEBHOOK_SECRET in fly.toml"
        has_secrets=true
    fi
    
    if grep -v "^#" fly.toml | grep -q "CLIENT_SECRET.*=.*GOCSPX" 2>/dev/null; then
        error "Found hardcoded CLIENT_SECRET in fly.toml"
        has_secrets=true
    fi
    
    if grep -v "^#" fly.toml | grep -q "DB_PASSWORD.*=.*[^#]" 2>/dev/null; then
        error "Found hardcoded DB_PASSWORD in fly.toml"
        has_secrets=true
    fi
    
    if [[ "$has_secrets" == "false" ]]; then
        success "✓ No hardcoded secrets found in fly.toml"
        return 0
    else
        error "✗ Hardcoded secrets detected in fly.toml"
        return 1
    fi
}

# VALIDATION 2: Verify secure headers are present
validate_security_headers() {
    log "🛡️ VALIDATION 2: Checking security headers in fly.toml"
    
    local has_security_headers=true
    
    if ! grep -q "X-Frame-Options.*DENY" fly.toml 2>/dev/null; then
        error "Missing X-Frame-Options: DENY header"
        has_security_headers=false
    fi
    
    if ! grep -q "X-Content-Type-Options.*nosniff" fly.toml 2>/dev/null; then
        error "Missing X-Content-Type-Options: nosniff header"
        has_security_headers=false
    fi
    
    if ! grep -q "Strict-Transport-Security" fly.toml 2>/dev/null; then
        error "Missing Strict-Transport-Security header"
        has_security_headers=false
    fi
    
    if ! grep -q "Content-Security-Policy" fly.toml 2>/dev/null; then
        error "Missing Content-Security-Policy header"
        has_security_headers=false
    fi
    
    if [[ "$has_security_headers" == "true" ]]; then
        success "✓ Security headers properly configured"
        return 0
    else
        error "✗ Security headers missing or misconfigured"
        return 1
    fi
}

# VALIDATION 3: Verify admin layout has security enhancements
validate_admin_security() {
    log "👑 VALIDATION 3: Checking admin security enhancements"
    
    local admin_layout="src/app/(admin)/layout.tsx"
    
    if [[ ! -f "$admin_layout" ]]; then
        error "Admin layout file not found"
        return 1
    fi
    
    local has_security_features=true
    
    if ! grep -q "validateAdminAccess" "$admin_layout" 2>/dev/null; then
        error "Missing validateAdminAccess function in admin layout"
        has_security_features=false
    fi
    
    if ! grep -q "admin_audit_log" "$admin_layout" 2>/dev/null; then
        error "Missing audit logging in admin layout"
        has_security_features=false
    fi
    
    if ! grep -q "headers()" "$admin_layout" 2>/dev/null; then
        error "Missing IP tracking in admin layout"
        has_security_features=false
    fi
    
    if ! grep -q "PRIVILEGED ACCESS" "$admin_layout" 2>/dev/null; then
        error "Missing privileged access indicator"
        has_security_features=false
    fi
    
    if [[ "$has_security_features" == "true" ]]; then
        success "✓ Admin security enhancements properly implemented"
        return 0
    else
        error "✗ Admin security enhancements missing or incomplete"
        return 1
    fi
}

# VALIDATION 4: Verify webhook handler has security features
validate_webhook_security() {
    log "🔗 VALIDATION 4: Checking webhook handler security"
    
    local webhook_file="src/app/api/webhooks/stripe/route.ts"
    
    if [[ ! -f "$webhook_file" ]]; then
        error "Webhook handler file not found"
        return 1
    fi
    
    local has_security_features=true
    
    if ! grep -q "rateLimit" "$webhook_file" 2>/dev/null; then
        error "Missing rate limiting in webhook handler"
        has_security_features=false
    fi
    
    if ! grep -q "verifyWebhookSignature" "$webhook_file" 2>/dev/null; then
        error "Missing enhanced signature verification"
        has_security_features=false
    fi
    
    if ! grep -q "crypto.timingSafeEqual" "$webhook_file" 2>/dev/null; then
        error "Missing timing-safe signature comparison"
        has_security_features=false
    fi
    
    if ! grep -q "logSecurityEvent" "$webhook_file" 2>/dev/null; then
        error "Missing security event logging"
        has_security_features=false
    fi
    
    if ! grep -q "WEBHOOK_TIMEOUT_MS" "$webhook_file" 2>/dev/null; then
        error "Missing webhook timeout protection"
        has_security_features=false
    fi
    
    if [[ "$has_security_features" == "true" ]]; then
        success "✓ Webhook security features properly implemented"
        return 0
    else
        error "✗ Webhook security features missing or incomplete"
        return 1
    fi
}

# VALIDATION 5: Verify backup files exist
validate_backup_files() {
    log "💾 VALIDATION 5: Checking security backup files"
    
    local has_backups=true
    
    if [[ ! -f "fly.toml.insecure_backup" ]]; then
        error "Missing fly.toml backup"
        has_backups=false
    fi
    
    if [[ ! -f "src/app/api/webhooks/stripe/route-insecure-backup.ts" ]]; then
        error "Missing webhook handler backup"
        has_backups=false
    fi
    
    if [[ ! -f "scripts/security-rollback-procedures.sh" ]]; then
        error "Missing rollback procedures script"
        has_backups=false
    fi
    
    if [[ "$has_backups" == "true" ]]; then
        success "✓ Backup files properly created"
        return 0
    else
        error "✗ Missing critical backup files"
        return 1
    fi
}

# VALIDATION 6: Check for TypeScript/build errors
validate_build_integrity() {
    log "🔧 VALIDATION 6: Checking build integrity"
    
    if command -v npm &> /dev/null; then
        if npm run build --silent 2>/dev/null; then
            success "✓ Application builds successfully"
            return 0
        else
            error "✗ Build errors detected"
            return 1
        fi
    else
        warning "npm not available, skipping build check"
        return 0
    fi
}

# VALIDATION 7: Test file permissions and access
validate_file_permissions() {
    log "🔐 VALIDATION 7: Checking file permissions"
    
    local scripts_executable=true
    
    if [[ ! -x "scripts/secure-credential-migration.sh" ]]; then
        error "Migration script not executable"
        scripts_executable=false
    fi
    
    if [[ ! -x "scripts/security-rollback-procedures.sh" ]]; then
        error "Rollback script not executable"
        scripts_executable=false
    fi
    
    if [[ "$scripts_executable" == "true" ]]; then
        success "✓ Security scripts have correct permissions"
        return 0
    else
        error "✗ Security scripts permission issues"
        return 1
    fi
}

# VALIDATION 8: Environment variable checks
validate_environment_setup() {
    log "🌍 VALIDATION 8: Checking environment variable setup"
    
    local env_warnings=0
    
    # Check for common environment variables that should be set via fly secrets
    local required_secrets=(
        "STRIPE_WEBHOOK_SECRET"
        "SUPABASE_SERVICE_ROLE_KEY"
        "STRIPE_SECRET_KEY"
    )
    
    for secret in "${required_secrets[@]}"; do
        if [[ -n "${!secret:-}" ]]; then
            warning "Environment variable $secret is set locally - ensure it's managed via fly secrets in production"
            ((env_warnings++))
        fi
    done
    
    if [[ $env_warnings -eq 0 ]]; then
        success "✓ Environment setup looks good for production"
        return 0
    else
        warning "⚠️ $env_warnings environment warnings found"
        return 0
    fi
}

# Main validation function
main() {
    log "🔒 Starting QuoteKit Security Validation"
    log "Timestamp: $TIMESTAMP"
    log "Validation log: $VALIDATION_LOG"
    
    echo ""
    log "Running security validation tests..."
    echo ""
    
    # Run all validations
    run_test "Fly.toml Security" "validate_fly_toml_security" true
    run_test "Security Headers" "validate_security_headers" true  
    run_test "Admin Security" "validate_admin_security" true
    run_test "Webhook Security" "validate_webhook_security" true
    run_test "Backup Files" "validate_backup_files" false
    run_test "Build Integrity" "validate_build_integrity" false
    run_test "File Permissions" "validate_file_permissions" false
    run_test "Environment Setup" "validate_environment_setup" false
    
    echo ""
    log "🔒 Security Validation Complete"
    log "Tests Passed: $TESTS_PASSED"
    log "Tests Failed: $TESTS_FAILED"
    log "Critical Issues: $CRITICAL_ISSUES"
    
    if [[ $CRITICAL_ISSUES -gt 0 ]]; then
        error "❌ VALIDATION FAILED: $CRITICAL_ISSUES critical security issues found!"
        error "Review the log file: $VALIDATION_LOG"
        exit 1
    elif [[ $TESTS_FAILED -gt 0 ]]; then
        warning "⚠️ VALIDATION COMPLETED WITH WARNINGS: $TESTS_FAILED non-critical issues found"
        warning "Review the log file: $VALIDATION_LOG"
        exit 2
    else
        success "✅ VALIDATION PASSED: All security fixes verified successfully!"
        success "Log file saved: $VALIDATION_LOG"
        exit 0
    fi
}

# Run main function
main "$@"