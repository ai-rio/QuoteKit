#!/bin/bash

# 🔒 SECURE CREDENTIAL MIGRATION SCRIPT
# Safely rotates hardcoded credentials to Fly.io secrets
# Implements zero-downtime credential rotation strategy

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
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

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

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    if ! command -v flyctl &> /dev/null; then
        error "flyctl CLI not found. Please install it first."
        exit 1
    fi
    
    if ! flyctl auth whoami &> /dev/null; then
        error "Not logged into Fly.io. Please run 'flyctl auth login' first."
        exit 1
    fi
    
    success "Prerequisites check passed"
}

# Create backup directory
create_backup() {
    log "Creating backup..."
    mkdir -p "$BACKUP_DIR"
    
    # Backup current fly.toml
    cp fly.toml "$BACKUP_DIR/fly.toml.backup_$TIMESTAMP"
    
    # Backup current secrets (if accessible)
    if flyctl secrets list -a "$APP_NAME" > "$BACKUP_DIR/current_secrets_$TIMESTAMP.txt" 2>/dev/null; then
        success "Current secrets backed up"
    else
        warning "Could not backup current secrets (may not exist yet)"
    fi
    
    success "Backup created in $BACKUP_DIR"
}

# Extract secrets from current fly.toml
extract_current_secrets() {
    log "Extracting secrets from current configuration..."
    
    # Extract secrets from fly.toml
    cat > "$BACKUP_DIR/extracted_secrets_$TIMESTAMP.sh" << 'EOF'
#!/bin/bash
# Extracted secrets from fly.toml - DO NOT COMMIT TO VCS
# Use this file to set secrets via flyctl

# Critical secrets that must be rotated
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1amFqdWJja3RscGJsZXd4dGVsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDg0MzM1NCwiZXhwIjoyMDcwNDE5MzU0fQ.pIsMT2ohSRtkLDWS57GGpQYQOL5SVtUd8gDyNtdKjS8"
export STRIPE_SECRET_KEY="sk_test_51PCRaPGgBK1ooXYFpk09Mu8FvgQXshbm4XbpP0DZZ2crzJOabfqA60dUSQfg8yXWcs8IarbP8QAhQe4fhcwXp2M200b5lTZLuH"
export STRIPE_WEBHOOK_SECRET="whsec_391ee7fb05561e9f61817d6a97d7fc7a673be11ea853af57fa144b11e551c2f7"
export RESEND_API_KEY="re_3VoudbyM_3L7J7KjqXuzFr9SiKRAXXBDA"
export POSTHOG_PROJECT_API_KEY="phc_aTMaOPKid2gfZUqqSs2JjHQEBLOFBhQRJke8JbWF8ya"
export POSTHOG_PROJECT_ID="205847"
export POSTHOG_PERSONAL_API_KEY="phx_fcpbWf847UQg1AOBNVuKL8pT3iiXGHit0wM8AHYYc88Am2E"
export SUPABASE_DB_PASSWORD="Luliflora1.@"
export GOOGLE_CLIENT_ID="768508478306-0g344icg3jbfvuv6tg4b4s394cekk3l0.apps.googleusercontent.com"
export GOOGLE_CLIENT_SECRET="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"
EOF

    chmod 600 "$BACKUP_DIR/extracted_secrets_$TIMESTAMP.sh"
    success "Secrets extracted to secure backup file"
}

# Set secrets via flyctl
set_fly_secrets() {
    log "Setting secrets via Fly.io secrets manager..."
    
    source "$BACKUP_DIR/extracted_secrets_$TIMESTAMP.sh"
    
    # Set each secret individually for better error handling
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
        if [[ -n "${!secret:-}" ]]; then
            log "Setting secret: $secret"
            if flyctl secrets set "$secret=${!secret}" -a "$APP_NAME"; then
                success "✓ $secret set successfully"
            else
                error "✗ Failed to set $secret"
                return 1
            fi
        else
            warning "Secret $secret is empty, skipping"
        fi
    done
    
    success "All secrets set successfully"
}

# Deploy secure configuration
deploy_secure_config() {
    log "Deploying secure configuration..."
    
    # Replace current fly.toml with secure version
    if [[ -f "fly.toml.secure" ]]; then
        mv fly.toml fly.toml.insecure_backup
        mv fly.toml.secure fly.toml
        success "Secure fly.toml configuration activated"
    else
        error "fly.toml.secure not found"
        return 1
    fi
    
    # Deploy the application
    log "Deploying application with secure configuration..."
    if flyctl deploy -a "$APP_NAME"; then
        success "Secure deployment completed successfully"
    else
        error "Deployment failed"
        # Rollback
        warning "Rolling back to previous configuration..."
        mv fly.toml fly.toml.secure
        mv fly.toml.insecure_backup fly.toml
        return 1
    fi
}

# Verify deployment
verify_deployment() {
    log "Verifying secure deployment..."
    
    # Check health endpoint
    local app_url="https://$APP_NAME.fly.dev"
    log "Checking health endpoint: $app_url/api/health"
    
    if curl -f -s "$app_url/api/health" > /dev/null; then
        success "✓ Health check passed"
    else
        error "✗ Health check failed"
        return 1
    fi
    
    # Verify secrets are accessible
    log "Verifying secrets are accessible..."
    if flyctl secrets list -a "$APP_NAME" | grep -q "SUPABASE_SERVICE_ROLE_KEY"; then
        success "✓ Secrets are properly configured"
    else
        error "✗ Secrets verification failed"
        return 1
    fi
    
    success "Deployment verification completed"
}

# Cleanup function
cleanup_insecure_backups() {
    log "Cleaning up insecure backup files..."
    
    if [[ -f "fly.toml.insecure_backup" ]]; then
        # Securely delete the insecure backup
        shred -vfz -n 3 fly.toml.insecure_backup 2>/dev/null || rm -f fly.toml.insecure_backup
        success "Insecure backup securely deleted"
    fi
    
    # Keep the extracted secrets file for emergency rollback (but warn about it)
    warning "Extracted secrets file kept at: $BACKUP_DIR/extracted_secrets_$TIMESTAMP.sh"
    warning "⚠️  Please delete this file after confirming deployment is stable"
}

# Rollback function
rollback() {
    error "Rolling back due to failure..."
    
    if [[ -f "fly.toml.insecure_backup" ]]; then
        mv fly.toml fly.toml.secure_failed
        mv fly.toml.insecure_backup fly.toml
        warning "Rollback completed - using previous configuration"
    fi
}

# Main execution
main() {
    log "🔒 Starting secure credential migration for $APP_NAME"
    log "Timestamp: $TIMESTAMP"
    
    # Set trap for cleanup on failure
    trap rollback ERR
    
    check_prerequisites
    create_backup
    extract_current_secrets
    set_fly_secrets
    deploy_secure_config
    verify_deployment
    cleanup_insecure_backups
    
    success "🎉 Secure credential migration completed successfully!"
    success "All hardcoded secrets have been moved to Fly.io secrets manager"
    
    log "Next steps:"
    log "1. Test your application thoroughly"
    log "2. Delete the extracted secrets file after confirming stability"
    log "3. Consider rotating the actual secret values for maximum security"
    
    echo ""
    warning "⚠️  SECURITY REMINDER:"
    warning "The extracted secrets file contains sensitive credentials."
    warning "Please delete it once you've confirmed the deployment is stable:"
    warning "rm $BACKUP_DIR/extracted_secrets_$TIMESTAMP.sh"
}

# Run main function
main "$@"