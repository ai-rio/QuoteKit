#!/bin/bash

# Setup Secure Testing Environment
# Prepares the environment for secure Edge Functions testing
# Usage: ./scripts/setup-secure-testing.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
  echo -e "${RED}❌ $1${NC}"
}

# Check if running in development environment
check_environment() {
  log_info "Checking environment..."
  
  if [[ -f ".env.local" ]]; then
    log_warning ".env.local found - ensure it contains only development credentials"
  fi
  
  if [[ -f ".env" ]]; then
    log_error ".env file found in repository - this should be removed"
    return 1
  fi
  
  log_success "Environment check passed"
}

# Setup secure environment variables
setup_env_variables() {
  log_info "Setting up secure environment variables..."
  
  # Create .env.local.example if it doesn't exist
  if [[ ! -f ".env.local.example" ]]; then
    cat > .env.local.example << 'EOF'
# Local Development Environment Variables
# Copy this file to .env.local and update with your actual values

# Supabase Configuration (Local Development)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU

# Production Environment Variables (Update for production testing)
# NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
# SUPABASE_PROJECT_ID=your-project-id

# Stripe Configuration (Development)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Email Configuration (Optional)
RESEND_API_KEY=re_your_resend_api_key

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000
EOF
    log_success "Created .env.local.example template"
  fi
  
  # Check if .env.local exists
  if [[ ! -f ".env.local" ]]; then
    log_warning ".env.local not found. Creating from template..."
    cp .env.local.example .env.local
    log_warning "Please update .env.local with your actual credentials"
  else
    log_success ".env.local already exists"
  fi
}

# Setup secure .gitignore
setup_gitignore() {
  log_info "Setting up secure .gitignore..."
  
  # Ensure sensitive files are ignored
  local gitignore_additions=(
    "# Environment variables"
    ".env"
    ".env.local"
    ".env.*.local"
    ""
    "# Test results and logs"
    "test-results/"
    "*.log"
    "security-audit-*.txt"
    ""
    "# Temporary files"
    "*.tmp"
    "*.temp"
    ".DS_Store"
    "Thumbs.db"
  )
  
  local needs_update=false
  
  for item in "${gitignore_additions[@]}"; do
    if [[ -n "$item" ]] && ! grep -Fxq "$item" .gitignore 2>/dev/null; then
      needs_update=true
      break
    fi
  done
  
  if [[ "$needs_update" == "true" ]]; then
    echo "" >> .gitignore
    echo "# Added by setup-secure-testing.sh" >> .gitignore
    for item in "${gitignore_additions[@]}"; do
      echo "$item" >> .gitignore
    done
    log_success "Updated .gitignore with security patterns"
  else
    log_success ".gitignore already contains security patterns"
  fi
}

# Setup test directories
setup_test_directories() {
  log_info "Setting up test directories..."
  
  local directories=(
    "test-results"
    "logs"
    "temp"
  )
  
  for dir in "${directories[@]}"; do
    if [[ ! -d "$dir" ]]; then
      mkdir -p "$dir"
      echo "# Test artifacts directory" > "$dir/.gitkeep"
      log_success "Created $dir directory"
    fi
  done
  
  # Add to .gitignore but keep .gitkeep files
  if ! grep -q "test-results/*" .gitignore 2>/dev/null; then
    cat >> .gitignore << 'EOF'

# Test artifacts (keep .gitkeep files)
test-results/*
!test-results/.gitkeep
logs/*
!logs/.gitkeep
temp/*
!temp/.gitkeep
EOF
    log_success "Added test directories to .gitignore"
  fi
}

# Validate Supabase setup
validate_supabase_setup() {
  log_info "Validating Supabase setup..."
  
  # Check if Supabase CLI is installed
  if ! command -v supabase &> /dev/null; then
    log_error "Supabase CLI is not installed. Install with: npm install -g supabase"
    return 1
  fi
  
  local version=$(supabase --version)
  log_success "Supabase CLI installed: $version"
  
  # Check if local Supabase can be started
  if supabase status &> /dev/null; then
    log_success "Local Supabase is running"
  else
    log_info "Starting local Supabase..."
    if supabase start; then
      log_success "Local Supabase started successfully"
    else
      log_error "Failed to start local Supabase"
      return 1
    fi
  fi
  
  # Check if migrations are up to date
  log_info "Checking database migrations..."
  if supabase migration list --local | grep -q "Applied"; then
    log_success "Database migrations are applied"
  else
    log_warning "Database migrations may need to be applied"
    log_info "Run: supabase migration up"
  fi
}

# Setup development certificates (for HTTPS testing)
setup_dev_certificates() {
  log_info "Setting up development certificates..."
  
  if command -v mkcert &> /dev/null; then
    if [[ ! -f "localhost.pem" ]]; then
      mkcert localhost 127.0.0.1 ::1
      log_success "Development certificates created"
    else
      log_success "Development certificates already exist"
    fi
  else
    log_warning "mkcert not installed - HTTPS testing will not be available"
    log_info "Install mkcert for HTTPS testing: https://github.com/FiloSottile/mkcert"
  fi
}

# Create test configuration file
create_test_config() {
  log_info "Creating test configuration..."
  
  cat > test-config.json << 'EOF'
{
  "testing": {
    "local": {
      "baseUrl": "http://127.0.0.1:54321/functions/v1",
      "timeout": 30000,
      "retries": 3
    },
    "production": {
      "baseUrl": "https://PROJECT_ID.functions.supabase.co",
      "timeout": 15000,
      "retries": 2
    }
  },
  "performance": {
    "concurrentRequests": 10,
    "testDuration": 30,
    "warmupRequests": 5,
    "thresholds": {
      "responseTime": 5000,
      "successRate": 90,
      "errorRate": 5
    }
  },
  "security": {
    "enableCorsCheck": true,
    "enableAuthCheck": true,
    "enableInputValidation": true,
    "enableRateLimitCheck": true
  },
  "functions": {
    "critical": [
      "subscription-status",
      "quote-processor",
      "webhook-handler",
      "batch-processor"
    ],
    "monitoring": [
      "monitoring-alerting",
      "performance-optimizer",
      "connection-pool-manager"
    ],
    "deployment": [
      "migration-controller",
      "production-validator",
      "security-hardening",
      "global-deployment-optimizer"
    ]
  }
}
EOF
  
  log_success "Test configuration created: test-config.json"
}

# Setup NPM scripts for testing
setup_npm_scripts() {
  log_info "Verifying NPM scripts for testing..."
  
  local required_scripts=(
    "edge-functions:test:local"
    "edge-functions:test:production"
    "edge-functions:test:performance"
    "edge-functions:deploy:local"
    "security:audit"
  )
  
  local missing_scripts=()
  
  for script in "${required_scripts[@]}"; do
    if ! npm run "$script" --silent 2>/dev/null | grep -q "Missing script"; then
      continue
    else
      missing_scripts+=("$script")
    fi
  done
  
  if [[ ${#missing_scripts[@]} -eq 0 ]]; then
    log_success "All required NPM scripts are available"
  else
    log_warning "Some NPM scripts may be missing: ${missing_scripts[*]}"
    log_info "Check package.json for the complete script definitions"
  fi
}

# Create testing checklist
create_testing_checklist() {
  log_info "Creating testing checklist..."
  
  cat > TESTING_CHECKLIST.md << 'EOF'
# Edge Functions Testing Checklist

## Pre-Testing Setup
- [ ] Environment variables configured in `.env.local`
- [ ] Local Supabase running (`supabase start`)
- [ ] Database migrations applied (`supabase migration up`)
- [ ] All Edge Functions deployed locally
- [ ] Admin user created and accessible

## Local Testing
- [ ] Run local tests: `npm run edge-functions:test:local`
- [ ] All critical functions responding (subscription-status, quote-processor, webhook-handler, batch-processor)
- [ ] No authentication errors
- [ ] Response times under 5 seconds
- [ ] Error rates under 5%

## Security Testing
- [ ] Run security audit: `npm run security:audit`
- [ ] No hardcoded credentials found
- [ ] Proper authentication checks in place
- [ ] Input validation implemented
- [ ] CORS configuration secure

## Performance Testing
- [ ] Run performance tests: `npm run edge-functions:test:performance`
- [ ] All functions handle concurrent requests
- [ ] Average response times acceptable
- [ ] No memory leaks or crashes
- [ ] Connection pooling working correctly

## Production Deployment Testing
- [ ] Deploy to production: `npm run edge-functions:deploy:production`
- [ ] Run production tests: `npm run edge-functions:test:production`
- [ ] All functions accessible in production
- [ ] Production environment variables configured
- [ ] Monitoring and alerting functional

## Final Validation
- [ ] All tests passing
- [ ] No critical security issues
- [ ] Performance within acceptable limits
- [ ] Documentation updated
- [ ] Team notified of deployment

## Rollback Plan
- [ ] Previous version tagged
- [ ] Rollback procedure documented
- [ ] Database migration rollback tested
- [ ] Monitoring alerts configured for issues

---

**Note**: Complete all checklist items before production deployment.
EOF
  
  log_success "Testing checklist created: TESTING_CHECKLIST.md"
}

# Main execution
main() {
  echo -e "${BLUE}"
  echo "🔒 Secure Testing Environment Setup"
  echo "==================================="
  echo -e "${NC}"
  
  # Run all setup steps
  if ! check_environment; then
    log_error "Environment check failed. Please fix issues before continuing."
    exit 1
  fi
  
  setup_env_variables
  setup_gitignore
  setup_test_directories
  
  if ! validate_supabase_setup; then
    log_error "Supabase setup validation failed"
    exit 1
  fi
  
  setup_dev_certificates
  create_test_config
  setup_npm_scripts
  create_testing_checklist
  
  # Final summary
  echo ""
  echo "========================================"
  echo -e "${BLUE}📊 SETUP COMPLETE${NC}"
  echo "========================================"
  log_success "Secure testing environment is ready!"
  echo ""
  echo "Next steps:"
  echo "1. Update .env.local with your actual credentials"
  echo "2. Run: npm run edge-functions:test:local"
  echo "3. Follow the TESTING_CHECKLIST.md for complete validation"
  echo "4. Run security audit: npm run security:audit"
  echo ""
  echo "Files created:"
  echo "- .env.local.example (template)"
  echo "- test-config.json (test configuration)"
  echo "- TESTING_CHECKLIST.md (testing checklist)"
  echo ""
  
  log_success "Setup completed successfully! 🎉"
}

# Run main function
main "$@"
