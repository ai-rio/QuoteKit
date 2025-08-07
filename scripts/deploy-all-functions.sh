#!/bin/bash

# Deploy All Edge Functions to Production
# Comprehensive deployment script for all 14 Edge Functions
# Usage: ./scripts/deploy-all-functions.sh [--local] [--project-ref PROJECT_ID]

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
LOCAL_MODE=false
PROJECT_REF=""
DEPLOYMENT_LOG="deployment-$(date +%Y%m%d-%H%M%S).log"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --local)
      LOCAL_MODE=true
      shift
      ;;
    --project-ref)
      PROJECT_REF="$2"
      shift 2
      ;;
    -h|--help)
      echo "Usage: $0 [--local] [--project-ref PROJECT_ID]"
      echo "  --local           Deploy to local Supabase instance"
      echo "  --project-ref     Supabase project reference ID for production"
      echo "  -h, --help        Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option $1"
      exit 1
      ;;
  esac
done

# Validate configuration
if [[ "$LOCAL_MODE" == false && -z "$PROJECT_REF" ]]; then
  if [[ -z "$SUPABASE_PROJECT_ID" ]]; then
    echo -e "${RED}❌ Error: PROJECT_REF required for production deployment${NC}"
    echo "Use --project-ref PROJECT_ID or set SUPABASE_PROJECT_ID environment variable"
    exit 1
  fi
  PROJECT_REF="$SUPABASE_PROJECT_ID"
fi

# All Edge Functions to deploy (in dependency order)
FUNCTIONS=(
  # Core shared utilities (deploy first)
  # Note: _shared is not a function, it's included automatically
  
  # Core business functions
  "subscription-status"
  "quote-processor" 
  "quote-pdf-generator"
  
  # Webhook system
  "webhook-handler"
  "webhook-monitor"
  
  # Batch operations
  "batch-processor"
  
  # Monitoring & optimization
  "monitoring-alerting"
  "performance-optimizer"
  "connection-pool-manager"
  
  # Deployment functions
  "migration-controller"
  "production-validator"
  "security-hardening"
  "global-deployment-optimizer"
)

# Function categories for better organization
declare -A FUNCTION_CATEGORIES
FUNCTION_CATEGORIES["subscription-status"]="Core Business"
FUNCTION_CATEGORIES["quote-processor"]="Core Business"
FUNCTION_CATEGORIES["quote-pdf-generator"]="Core Business"
FUNCTION_CATEGORIES["webhook-handler"]="Webhook System"
FUNCTION_CATEGORIES["webhook-monitor"]="Webhook System"
FUNCTION_CATEGORIES["batch-processor"]="Batch Operations"
FUNCTION_CATEGORIES["monitoring-alerting"]="Monitoring"
FUNCTION_CATEGORIES["performance-optimizer"]="Optimization"
FUNCTION_CATEGORIES["connection-pool-manager"]="Optimization"
FUNCTION_CATEGORIES["migration-controller"]="Deployment"
FUNCTION_CATEGORIES["production-validator"]="Deployment"
FUNCTION_CATEGORIES["security-hardening"]="Security"
FUNCTION_CATEGORIES["global-deployment-optimizer"]="Optimization"

# Critical functions that must deploy successfully
CRITICAL_FUNCTIONS=(
  "subscription-status"
  "quote-processor"
  "webhook-handler"
)

echo -e "${BLUE}🚀 Starting Edge Functions Deployment${NC}"
echo "======================================"
echo "Mode: $(if [[ "$LOCAL_MODE" == true ]]; then echo "Local Development"; else echo "Production"; fi)"
echo "Target: $(if [[ "$LOCAL_MODE" == true ]]; then echo "localhost:54321"; else echo "$PROJECT_REF"; fi)"
echo "Functions: ${#FUNCTIONS[@]}"
echo "Log file: $DEPLOYMENT_LOG"
echo "======================================"

# Initialize log file
echo "Edge Functions Deployment Log - $(date)" > "$DEPLOYMENT_LOG"
echo "Mode: $(if [[ "$LOCAL_MODE" == true ]]; then echo "Local"; else echo "Production"; fi)" >> "$DEPLOYMENT_LOG"
echo "Target: $(if [[ "$LOCAL_MODE" == true ]]; then echo "localhost"; else echo "$PROJECT_REF"; fi)" >> "$DEPLOYMENT_LOG"
echo "======================================" >> "$DEPLOYMENT_LOG"

# Check if Supabase CLI is available
if ! command -v supabase &> /dev/null; then
  echo -e "${RED}❌ Supabase CLI not found. Please install it first.${NC}"
  exit 1
fi

# Check if local Supabase is running (for local mode)
if [[ "$LOCAL_MODE" == true ]]; then
  echo -e "${YELLOW}🔍 Checking local Supabase status...${NC}"
  if ! supabase status &> /dev/null; then
    echo -e "${YELLOW}⚠️  Local Supabase not running. Starting it now...${NC}"
    supabase start
    if [[ $? -ne 0 ]]; then
      echo -e "${RED}❌ Failed to start local Supabase${NC}"
      exit 1
    fi
  fi
  echo -e "${GREEN}✅ Local Supabase is running${NC}"
fi

# Deployment statistics
DEPLOYED_COUNT=0
FAILED_COUNT=0
CRITICAL_FAILED=0
DEPLOYMENT_START_TIME=$(date +%s)

# Deploy each function
echo -e "\n${BLUE}📦 Deploying Edge Functions...${NC}"
echo "==============================="

for func in "${FUNCTIONS[@]}"; do
  category="${FUNCTION_CATEGORIES[$func]}"
  is_critical=false
  
  # Check if function is critical
  for critical_func in "${CRITICAL_FUNCTIONS[@]}"; do
    if [[ "$func" == "$critical_func" ]]; then
      is_critical=true
      break
    fi
  done
  
  echo -e "\n${BLUE}🔄 Deploying: $func${NC}"
  echo "   Category: $category"
  echo "   Critical: $(if [[ "$is_critical" == true ]]; then echo "Yes"; else echo "No"; fi)"
  
  # Log deployment attempt
  echo "$(date): Deploying $func ($category)" >> "$DEPLOYMENT_LOG"
  
  # Build deployment command
  if [[ "$LOCAL_MODE" == true ]]; then
    deploy_cmd="supabase functions deploy $func --local"
  else
    deploy_cmd="supabase functions deploy $func --project-ref $PROJECT_REF"
  fi
  
  # Execute deployment with timeout
  if timeout 120s $deploy_cmd >> "$DEPLOYMENT_LOG" 2>&1; then
    echo -e "   ${GREEN}✅ Successfully deployed${NC}"
    echo "$(date): SUCCESS - $func deployed" >> "$DEPLOYMENT_LOG"
    ((DEPLOYED_COUNT++))
  else
    echo -e "   ${RED}❌ Deployment failed${NC}"
    echo "$(date): FAILED - $func deployment failed" >> "$DEPLOYMENT_LOG"
    ((FAILED_COUNT++))
    
    if [[ "$is_critical" == true ]]; then
      ((CRITICAL_FAILED++))
      echo -e "   ${RED}🚨 CRITICAL FUNCTION FAILED${NC}"
    fi
    
    # Show last few lines of error for immediate feedback
    echo -e "   ${YELLOW}Last error lines:${NC}"
    tail -n 3 "$DEPLOYMENT_LOG" | sed 's/^/   /'
  fi
  
  # Small delay between deployments to avoid overwhelming the system
  sleep 2
done

# Calculate deployment time
DEPLOYMENT_END_TIME=$(date +%s)
DEPLOYMENT_DURATION=$((DEPLOYMENT_END_TIME - DEPLOYMENT_START_TIME))

# Final deployment summary
echo -e "\n${BLUE}📊 Deployment Summary${NC}"
echo "====================="
echo "Total Functions: ${#FUNCTIONS[@]}"
echo -e "Successfully Deployed: ${GREEN}$DEPLOYED_COUNT${NC}"
echo -e "Failed Deployments: ${RED}$FAILED_COUNT${NC}"
echo -e "Critical Failures: ${RED}$CRITICAL_FAILED${NC}"
echo "Deployment Time: ${DEPLOYMENT_DURATION}s"
echo "Success Rate: $(( (DEPLOYED_COUNT * 100) / ${#FUNCTIONS[@]} ))%"

# Log final summary
echo "======================================" >> "$DEPLOYMENT_LOG"
echo "DEPLOYMENT SUMMARY - $(date)" >> "$DEPLOYMENT_LOG"
echo "Total Functions: ${#FUNCTIONS[@]}" >> "$DEPLOYMENT_LOG"
echo "Successfully Deployed: $DEPLOYED_COUNT" >> "$DEPLOYMENT_LOG"
echo "Failed Deployments: $FAILED_COUNT" >> "$DEPLOYMENT_LOG"
echo "Critical Failures: $CRITICAL_FAILED" >> "$DEPLOYMENT_LOG"
echo "Deployment Time: ${DEPLOYMENT_DURATION}s" >> "$DEPLOYMENT_LOG"
echo "Success Rate: $(( (DEPLOYED_COUNT * 100) / ${#FUNCTIONS[@]} ))%" >> "$DEPLOYMENT_LOG"

# Quick health check for deployed functions
if [[ "$DEPLOYED_COUNT" -gt 0 ]]; then
  echo -e "\n${YELLOW}🏥 Running quick health check...${NC}"
  
  # Test a few critical functions
  for func in "${CRITICAL_FUNCTIONS[@]}"; do
    if [[ "$LOCAL_MODE" == true ]]; then
      health_url="http://localhost:54321/functions/v1/$func"
    else
      health_url="https://$PROJECT_REF.functions.supabase.co/$func"
    fi
    
    echo -n "   Testing $func... "
    
    if curl -s -X POST "$health_url" \
        -H "Content-Type: application/json" \
        -d '{"action": "health-check"}' \
        --max-time 10 > /dev/null 2>&1; then
      echo -e "${GREEN}✅ OK${NC}"
    else
      echo -e "${RED}❌ Failed${NC}"
    fi
  done
fi

# Determine exit status
if [[ "$CRITICAL_FAILED" -gt 0 ]]; then
  echo -e "\n${RED}🚨 DEPLOYMENT BLOCKED: Critical functions failed${NC}"
  echo "Review the deployment log: $DEPLOYMENT_LOG"
  exit 1
elif [[ "$FAILED_COUNT" -gt 3 ]]; then
  echo -e "\n${YELLOW}⚠️  DEPLOYMENT WARNING: Multiple functions failed${NC}"
  echo "Review the deployment log: $DEPLOYMENT_LOG"
  exit 1
elif [[ "$DEPLOYED_COUNT" -eq "${#FUNCTIONS[@]}" ]]; then
  echo -e "\n${GREEN}🎉 ALL FUNCTIONS DEPLOYED SUCCESSFULLY!${NC}"
  echo "Ready for integration testing."
  exit 0
else
  echo -e "\n${GREEN}✅ Deployment completed with minor issues${NC}"
  echo "Review the deployment log: $DEPLOYMENT_LOG"
  exit 0
fi
