#!/bin/bash

# 🔒 SECURITY ROLLBACK PROCEDURES
# Emergency rollback script for security remediation
# Use only if the secure deployment fails

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="quotekit-prelaunch-test"
BACKUP_DIR="./credential-backups"

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

# List available backups
list_backups() {
    log "Available backups in $BACKUP_DIR:"
    if [[ -d "$BACKUP_DIR" ]]; then
        ls -la "$BACKUP_DIR/"
    else
        error "Backup directory not found"
        exit 1
    fi
}

# Quick rollback to previous configuration
quick_rollback() {
    log "🚨 EMERGENCY ROLLBACK: Restoring previous fly.toml configuration"
    
    if [[ -f "fly.toml.insecure_backup" ]]; then
        # Backup the current (failed) secure config
        mv fly.toml fly.toml.secure_failed
        mv fly.toml.insecure_backup fly.toml
        success "Previous fly.toml configuration restored"
    else
        # Find the most recent backup
        local latest_backup=$(ls -t "$BACKUP_DIR"/fly.toml.backup_* 2>/dev/null | head -n1)
        if [[ -n "$latest_backup" ]]; then
            cp "$latest_backup" fly.toml
            success "Restored from backup: $latest_backup"
        else
            error "No backup files found"
            return 1
        fi
    fi
    
    # Deploy the rollback
    log "Deploying rollback configuration..."
    if flyctl deploy -a "$APP_NAME"; then
        success "Rollback deployment completed"
    else
        error "Rollback deployment failed"
        return 1
    fi
    
    # Verify rollback
    local app_url="https://$APP_NAME.fly.dev"
    if curl -f -s "$app_url/api/health" > /dev/null; then
        success "✓ Rollback health check passed"
    else
        warning "⚠️  Health check failed, but rollback deployed"
    fi
}

# Rollback specific backup
rollback_to_backup() {
    local backup_file="$1"
    
    if [[ ! -f "$backup_file" ]]; then
        error "Backup file not found: $backup_file"
        return 1
    fi
    
    log "Rolling back to: $backup_file"
    
    # Backup current state
    cp fly.toml "fly.toml.before_rollback_$(date +%Y%m%d_%H%M%S)"
    
    # Restore from backup
    cp "$backup_file" fly.toml
    success "Configuration restored from $backup_file"
    
    # Deploy
    log "Deploying rollback..."
    flyctl deploy -a "$APP_NAME"
}

# Check current deployment status
check_status() {
    log "Checking current deployment status..."
    
    # Check app status
    flyctl status -a "$APP_NAME"
    
    # Check secrets
    log "Current secrets:"
    flyctl secrets list -a "$APP_NAME"
    
    # Check health
    local app_url="https://$APP_NAME.fly.dev"
    log "Testing health endpoint: $app_url/api/health"
    
    if curl -f -s "$app_url/api/health"; then
        success "Health check passed"
    else
        error "Health check failed"
    fi
}

# Remove all secrets (nuclear option)
clear_all_secrets() {
    warning "🚨 NUCLEAR OPTION: This will remove ALL secrets"
    warning "This should only be used if secrets are causing issues"
    
    read -p "Are you sure? Type 'YES' to continue: " confirm
    if [[ "$confirm" != "YES" ]]; then
        log "Aborted by user"
        return 0
    fi
    
    log "Removing all secrets..."
    local secrets=(
        "SUPABASE_SERVICE_ROLE_KEY"
        "STRIPE_SECRET_KEY"
        "STRIPE_WEBHOOK_SECRET"
        "RESEND_API_KEY"
        "POSTHOG_PROJECT_API_KEY"
        "POSTHOG_PROJECT_ID"
        "POSTHOG_PERSONAL_API_KEY"
        "SUPABASE_DB_PASSWORD"
        "GOOGLE_CLIENT_ID"
        "GOOGLE_CLIENT_SECRET"
    )
    
    for secret in "${secrets[@]}"; do
        if flyctl secrets unset "$secret" -a "$APP_NAME" 2>/dev/null; then
            success "✓ Removed $secret"
        else
            warning "Could not remove $secret (may not exist)"
        fi
    done
    
    warning "All secrets removed - application may not function"
}

# Validate current configuration
validate_config() {
    log "Validating current fly.toml configuration..."
    
    # Check for hardcoded secrets
    local hardcoded_found=0
    local sensitive_patterns=(
        "SERVICE_ROLE_KEY.*=.*ey"
        "SECRET_KEY.*=.*sk_"
        "WEBHOOK_SECRET.*=.*whsec_"
        "API_KEY.*=.*re_"
        "CLIENT_SECRET.*=.*GOCSPX"
        "DB_PASSWORD.*=.*"
    )
    
    for pattern in "${patterns[@]}"; do
        if grep -q "$pattern" fly.toml; then
            error "❌ Found hardcoded secret matching: $pattern"
            hardcoded_found=1
        fi
    done
    
    if [[ $hardcoded_found -eq 0 ]]; then
        success "✅ No hardcoded secrets found in fly.toml"
    else
        error "❌ Hardcoded secrets detected in configuration"
        return 1
    fi
}

# Show usage
show_usage() {
    cat << EOF
🔒 Security Rollback Procedures

USAGE:
  $0 [command] [options]

COMMANDS:
  status              - Check current deployment status
  list-backups        - List available backup files
  quick-rollback      - Emergency rollback to previous config
  rollback <file>     - Rollback to specific backup file
  clear-secrets       - Remove all secrets (nuclear option)
  validate            - Validate current configuration
  help                - Show this help message

EXAMPLES:
  $0 status
  $0 quick-rollback
  $0 rollback ./credential-backups/fly.toml.backup_20240101_120000
  $0 clear-secrets

EMERGENCY CONTACT:
  If nothing works, check the backup directory:
  ls -la $BACKUP_DIR/

EOF
}

# Main function
main() {
    local command="${1:-help}"
    
    case "$command" in
        "status")
            check_status
            ;;
        "list-backups")
            list_backups
            ;;
        "quick-rollback")
            quick_rollback
            ;;
        "rollback")
            if [[ -n "${2:-}" ]]; then
                rollback_to_backup "$2"
            else
                error "Please specify backup file"
                exit 1
            fi
            ;;
        "clear-secrets")
            clear_all_secrets
            ;;
        "validate")
            validate_config
            ;;
        "help"|"--help"|"-h")
            show_usage
            ;;
        *)
            error "Unknown command: $command"
            show_usage
            exit 1
            ;;
    esac
}

# Run main function
main "$@"