#!/bin/bash

# Deploy All Edge Functions Script
# Deploys all 14 Edge Functions to local or production environment
# Usage: ./scripts/deploy-all-functions.sh [--local|--project-ref PROJECT_ID]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEPLOYMENT_TYPE="local"
PROJECT_REF=""
VERBOSE=false
DRY_RUN=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --local)
      DEPLOYMENT_TYPE="local"
      shift
      ;;
    --project-ref)
      DEPLOYMENT_TYPE="production"
      PROJECT_REF="$2"
      shift 2
      ;;
    --verbose)
      VERBOSE=true
      shift
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --help)
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --local                Deploy to local Supabase instance"
      echo "  --project-ref ID       Deploy to production with project ID"
      echo "  --verbose              Enable verbose output"
      echo "  --dry-run              Show what would be deployed without deploying"
      echo "  --help                 Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Validate project ref for production deployment
if [[ "$DEPLOYMENT_TYPE" == "production" && -z "$PROJECT_REF" ]]; then
  echo -e "${RED}❌ Error: --project-ref is required for production deployment${NC}"
  exit 1
fi

# Function definitions - all 14 Edge Functions
declare -a FUNCTIONS=(
  "subscription-status"
  "quote-processor"
  "quote-pdf-generator"
  "webhook-handler"
  "batch-processor"
  "webhook-monitor"
  "monitoring-alerting"
  "performance-optimizer"
  "connection-pool-manager"
  "migration-controller"
  "production-validator"
  "security-hardening"
  "global-deployment-optimizer"
)

# Function categories for better organization
declare -A FUNCTION_CATEGORIES=(
  ["subscription-status"]="Core Business"
  ["quote-processor"]="Core Business"
  ["quote-pdf-generator"]="Core Business"
  ["webhook-handler"]="Webhook System"
  ["webhook-monitor"]="Webhook System"
  ["batch-processor"]="Batch Operations"
  ["monitoring-alerting"]="Monitoring"
  ["performance-optimizer"]="Performance"
  ["connection-pool-manager"]="Performance"
  ["migration-controller"]="Deployment"
  ["production-validator"]="Deployment"
  ["security-hardening"]="Security"
  ["global-deployment-optimizer"]="Global Optimization"
)

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

# Check if Supabase CLI is installed
check_supabase_cli() {
  if ! command -v supabase &> /dev/null; then
    log_error "Supabase CLI is not installed. Please install it first:"
    echo "npm install -g supabase"
    exit 1
  fi
  
  local version=$(supabase --version)
  log_info "Using Supabase CLI: $version"
}

# Check if local Supabase is running (for local deployment)
check_local_supabase() {
  if [[ "$DEPLOYMENT_TYPE" == "local" ]]; then
    log_info "Checking local Supabase status..."
    
    if ! supabase status &> /dev/null; then
      log_warning "Local Supabase is not running. Starting it now..."
      supabase start
      
      if [[ $? -ne 0 ]]; then
        log_error "Failed to start local Supabase"
        exit 1
      fi
      
      log_success "Local Supabase started successfully"
    else
      log_success "Local Supabase is running"
    fi
  fi
}

# Validate function exists
validate_function() {
  local func_name=$1
  local func_path="supabase/functions/$func_name"
  
  if [[ ! -d "$func_path" ]]; then
    log_error "Function directory not found: $func_path"
    return 1
  fi
  
  if [[ ! -f "$func_path/index.ts" ]]; then
    log_error "Function entry point not found: $func_path/index.ts"
    return 1
  fi
  
  return 0
}

# Deploy a single function
deploy_function() {
  local func_name=$1
  local category=${FUNCTION_CATEGORIES[$func_name]}
  
  if [[ "$DRY_RUN" == "true" ]]; then
    log_info "Would deploy: $func_name ($category)"
    return 0
  fi
  
  log_info "Deploying $func_name ($category)..."
  
  # Validate function exists
  if ! validate_function "$func_name"; then
    return 1
  fi
  
  # Build deployment command
  local deploy_cmd="supabase functions deploy $func_name"
  
  if [[ "$DEPLOYMENT_TYPE" == "local" ]]; then
    deploy_cmd="$deploy_cmd --local"
  elif [[ "$DEPLOYMENT_TYPE" == "production" ]]; then
    deploy_cmd="$deploy_cmd --project-ref $PROJECT_REF"
  fi
  
  # Add verbose flag if requested
  if [[ "$VERBOSE" == "true" ]]; then
    deploy_cmd="$deploy_cmd --debug"
  fi
  
  # Execute deployment
  local start_time=$(date +%s)
  
  if eval "$deploy_cmd"; then
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    log_success "$func_name deployed successfully (${duration}s)"
    return 0
  else
    log_error "$func_name deployment failed"
    return 1
  fi
}

# Deploy all functions
deploy_all_functions() {
  local total_functions=${#FUNCTIONS[@]}
  local successful_deployments=0
  local failed_deployments=0
  local start_time=$(date +%s)
  
  log_info "Starting deployment of $total_functions Edge Functions..."
  log_info "Deployment type: $DEPLOYMENT_TYPE"
  
  if [[ "$DEPLOYMENT_TYPE" == "production" ]]; then
    log_info "Project ID: $PROJECT_REF"
  fi
  
  echo ""
  
  # Group functions by category for organized deployment
  declare -A category_functions
  for func in "${FUNCTIONS[@]}"; do
    local category=${FUNCTION_CATEGORIES[$func]}
    if [[ -z "${category_functions[$category]}" ]]; then
      category_functions[$category]="$func"
    else
      category_functions[$category]="${category_functions[$category]} $func"
    fi
  done
  
  # Deploy functions by category
  for category in "Core Business" "Webhook System" "Batch Operations" "Monitoring" "Performance" "Deployment" "Security" "Global Optimization"; do
    if [[ -n "${category_functions[$category]}" ]]; then
      echo -e "${BLUE}📦 Deploying $category Functions${NC}"
      echo "----------------------------------------"
      
      for func in ${category_functions[$category]}; do
        if deploy_function "$func"; then
          ((successful_deployments++))
        else
          ((failed_deployments++))
        fi
        
        # Small delay between deployments to avoid overwhelming the system
        sleep 1
      done
      
      echo ""
    fi
  done
  
  # Calculate total deployment time
  local end_time=$(date +%s)
  local total_duration=$((end_time - start_time))
  local minutes=$((total_duration / 60))
  local seconds=$((total_duration % 60))
  
  # Display summary
  echo "========================================"
  echo -e "${BLUE}📊 DEPLOYMENT SUMMARY${NC}"
  echo "========================================"
  echo "✅ Successful: $successful_deployments/$total_functions"
  echo "❌ Failed: $failed_deployments/$total_functions"
  echo "⏱️  Total time: ${minutes}m ${seconds}s"
  echo "🎯 Target: $DEPLOYMENT_TYPE"
  
  if [[ "$DEPLOYMENT_TYPE" == "production" ]]; then
    echo "🌐 Project: $PROJECT_REF"
  fi
  
  echo ""
  
  # Final status
  if [[ $failed_deployments -eq 0 ]]; then
    log_success "All Edge Functions deployed successfully! 🎉"
    
    if [[ "$DEPLOYMENT_TYPE" == "local" ]]; then
      echo ""
      log_info "Next steps:"
      echo "  1. Run tests: npm run edge-functions:test:local"
      echo "  2. Check functions: http://127.0.0.1:54323"
    else
      echo ""
      log_info "Next steps:"
      echo "  1. Run production tests: npm run edge-functions:test:production"
      echo "  2. Monitor functions in Supabase Dashboard"
    fi
    
    return 0
  else
    log_error "$failed_deployments function(s) failed to deploy"
    
    echo ""
    log_info "Troubleshooting:"
    echo "  1. Check function code for syntax errors"
    echo "  2. Verify all dependencies are installed"
    echo "  3. Check Supabase CLI authentication"
    echo "  4. Review function logs for specific errors"
    
    return 1
  fi
}

# Verify deployment
verify_deployment() {
  if [[ "$DRY_RUN" == "true" ]]; then
    log_info "Skipping verification in dry-run mode"
    return 0
  fi
  
  log_info "Verifying deployment..."
  
  local base_url
  if [[ "$DEPLOYMENT_TYPE" == "local" ]]; then
    base_url="http://127.0.0.1:54321/functions/v1"
  else
    base_url="https://$PROJECT_REF.functions.supabase.co"
  fi
  
  # Test a few critical functions
  local test_functions=("subscription-status" "quote-processor" "webhook-handler")
  local verification_passed=true
  
  for func in "${test_functions[@]}"; do
    log_info "Testing $func..."
    
    local response_code=$(curl -s -o /dev/null -w "%{http_code}" \
      -X POST "$base_url/$func" \
      -H "Content-Type: application/json" \
      -d '{"action": "health-check"}' \
      --max-time 10)
    
    if [[ "$response_code" == "200" || "$response_code" == "400" ]]; then
      log_success "$func is responding"
    else
      log_error "$func is not responding (HTTP $response_code)"
      verification_passed=false
    fi
  done
  
  if [[ "$verification_passed" == "true" ]]; then
    log_success "Deployment verification passed"
    return 0
  else
    log_error "Deployment verification failed"
    return 1
  fi
}

# Main execution
main() {
  echo -e "${BLUE}"
  echo "🚀 Edge Functions Deployment Script"
  echo "===================================="
  echo -e "${NC}"
  
  # Pre-flight checks
  check_supabase_cli
  check_local_supabase
  
  # Show dry-run notice
  if [[ "$DRY_RUN" == "true" ]]; then
    log_warning "DRY RUN MODE - No actual deployments will be performed"
    echo ""
  fi
  
  # Deploy all functions
  if deploy_all_functions; then
    # Verify deployment
    if verify_deployment; then
      log_success "Deployment completed successfully! 🎉"
      exit 0
    else
      log_error "Deployment verification failed"
      exit 1
    fi
  else
    log_error "Deployment failed"
    exit 1
  fi
}

# Run main function
main "$@"
