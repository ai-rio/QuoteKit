#!/bin/bash

# Supabase Deployment Management Script
# Handles authentication, migration, and deployment tasks for WSL environments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_REF="bujajubcktlpblewxtel"
ACCESS_TOKEN="sbp_d00d908f1c828b919d2f8fbc4b4d045a11bf5d35"
DB_PASSWORD="Luliflora1.@"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
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

# Set up environment
setup_env() {
    export SUPABASE_ACCESS_TOKEN="$ACCESS_TOKEN"
    export SUPABASE_DB_PASSWORD="$DB_PASSWORD"
    export SUPABASE_PROJECT_REF="$PROJECT_REF"
}

# Check if project is linked
check_link() {
    log_info "Checking project link status..."
    if supabase status > /dev/null 2>&1; then
        log_success "Project is linked"
        return 0
    else
        log_warning "Project is not linked"
        return 1
    fi
}

# Link project
link_project() {
    log_info "Linking to Supabase project..."
    SUPABASE_ACCESS_TOKEN="$ACCESS_TOKEN" supabase link --project-ref "$PROJECT_REF" --password "$DB_PASSWORD"
    if [ $? -eq 0 ]; then
        log_success "Project linked successfully"
    else
        log_error "Failed to link project"
        exit 1
    fi
}

# Check migration status
check_migrations() {
    log_info "Checking migration status..."
    
    # Use a here-string to provide the password
    if result=$(echo "$DB_PASSWORD" | supabase migration list 2>&1); then
        echo "$result"
        log_success "Migration status retrieved"
    else
        log_error "Failed to get migration status: $result"
        return 1
    fi
}

# Push migrations to hosted database
push_migrations() {
    log_info "Pushing migrations to hosted database..."
    
    # Show what will be pushed
    log_info "Local migrations that will be applied:"
    ls -la supabase/migrations/ | grep -E "\.sql$" || log_warning "No migration files found"
    
    # Confirm before pushing
    read -p "Do you want to continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Migration push cancelled"
        return 0
    fi
    
    # Push migrations
    if echo "$DB_PASSWORD" | supabase db push 2>&1; then
        log_success "Migrations pushed successfully"
    else
        log_error "Failed to push migrations"
        return 1
    fi
}

# Generate migration diff
generate_diff() {
    log_info "Generating migration diff..."
    
    if echo "$DB_PASSWORD" | supabase db diff --use-migra 2>&1; then
        log_success "Diff generated successfully"
    else
        log_error "Failed to generate diff"
        return 1
    fi
}

# Validate local setup
validate_setup() {
    log_info "Validating local Supabase setup..."
    
    # Check if supabase CLI is installed
    if ! command -v supabase &> /dev/null; then
        log_error "Supabase CLI is not installed"
        return 1
    fi
    
    # Check if project directory exists
    if [ ! -d "supabase" ]; then
        log_error "Supabase directory not found. Are you in the right directory?"
        return 1
    fi
    
    # Check for config file
    if [ ! -f "supabase/config.toml" ]; then
        log_error "Supabase config file not found"
        return 1
    fi
    
    log_success "Local setup is valid"
}

# Main execution
main() {
    setup_env
    validate_setup
    
    case "$1" in
        "link")
            link_project
            ;;
        "status")
            if check_link; then
                check_migrations
            else
                log_error "Project not linked. Run '$0 link' first"
            fi
            ;;
        "push")
            if check_link; then
                push_migrations
            else
                log_error "Project not linked. Run '$0 link' first"
            fi
            ;;
        "diff")
            if check_link; then
                generate_diff
            else
                log_error "Project not linked. Run '$0 link' first"
            fi
            ;;
        "deploy")
            if check_link || link_project; then
                check_migrations
                echo
                push_migrations
            fi
            ;;
        "reset")
            log_warning "This will reset the link and re-link the project"
            read -p "Are you sure? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                supabase stop 2>/dev/null || true
                rm -rf .supabase 2>/dev/null || true
                link_project
            fi
            ;;
        *)
            echo "Supabase Deployment Management"
            echo "Usage: $0 {link|status|push|diff|deploy|reset}"
            echo ""
            echo "Commands:"
            echo "  link    - Link to Supabase hosted project"
            echo "  status  - Check migration status"
            echo "  push    - Push local migrations to hosted database"
            echo "  diff    - Generate diff between local and remote"
            echo "  deploy  - Full deployment (link + status + push)"
            echo "  reset   - Reset and re-link project"
            echo ""
            echo "Project: $PROJECT_REF"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"