#!/bin/bash

# Simple Security Audit Script for Edge Functions
# Performs basic security checks on the codebase and deployment
# Usage: ./scripts/security-audit-simple.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNING_CHECKS=0

# Logging functions
log_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
  echo -e "${GREEN}✅ $1${NC}"
  ((PASSED_CHECKS++))
}

log_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
  ((WARNING_CHECKS++))
}

log_error() {
  echo -e "${RED}❌ $1${NC}"
  ((FAILED_CHECKS++))
}

check_item() {
  ((TOTAL_CHECKS++))
}

# Check for sensitive data in code
check_sensitive_data() {
  log_info "Checking for sensitive data in code..."
  
  check_item
  if grep -r "password.*=" supabase/functions/ --include="*.ts" --include="*.js" | grep -v "// " | grep -v "password_hash" | grep -v "password_field" > /dev/null 2>&1; then
    log_error "Potential hardcoded passwords found in Edge Functions"
  else
    log_success "No hardcoded passwords found"
  fi
  
  check_item
  if grep -r "api_key.*=" supabase/functions/ --include="*.ts" --include="*.js" | grep -v "// " | grep -v "Deno.env.get" > /dev/null 2>&1; then
    log_error "Potential hardcoded API keys found in Edge Functions"
  else
    log_success "No hardcoded API keys found"
  fi
  
  check_item
  if grep -r "secret.*=" supabase/functions/ --include="*.ts" --include="*.js" | grep -v "// " | grep -v "Deno.env.get" > /dev/null 2>&1; then
    log_error "Potential hardcoded secrets found in Edge Functions"
  else
    log_success "No hardcoded secrets found"
  fi
}

# Check environment variable usage
check_env_variables() {
  log_info "Checking environment variable security..."
  
  check_item
  if grep -r "Deno.env.get" supabase/functions/ --include="*.ts" | grep -v "|| ''" | grep -v "??" > /dev/null 2>&1; then
    log_warning "Some environment variables lack fallback values"
  else
    log_success "Environment variables have proper fallback handling"
  fi
  
  check_item
  if [[ -f ".env" ]]; then
    log_error ".env file found in repository - should be in .gitignore"
  else
    log_success "No .env file in repository"
  fi
  
  check_item
  if [[ -f ".env.local" ]]; then
    log_error ".env.local file found in repository - should be in .gitignore"
  else
    log_success "No .env.local file in repository"
  fi
}

# Check authentication and authorization
check_auth_security() {
  log_info "Checking authentication and authorization..."
  
  check_item
  if grep -r "auth.uid()" supabase/functions/ --include="*.ts" > /dev/null 2>&1; then
    log_success "Authentication checks found in Edge Functions"
  else
    log_warning "No authentication checks found - verify if intentional"
  fi
  
  check_item
  if grep -r "is_admin" supabase/functions/ --include="*.ts" > /dev/null 2>&1; then
    log_success "Admin authorization checks found"
  else
    log_warning "No admin authorization checks found"
  fi
  
  check_item
  if grep -r "requireAuth\|requireAdmin" supabase/functions/ --include="*.ts" > /dev/null 2>&1; then
    log_success "Authentication middleware usage found"
  else
    log_warning "No authentication middleware usage found"
  fi
}

# Check input validation
check_input_validation() {
  log_info "Checking input validation..."
  
  check_item
  if grep -r "JSON.parse" supabase/functions/ --include="*.ts" | grep -v "try\|catch" > /dev/null 2>&1; then
    log_error "Unsafe JSON parsing found - should use try/catch"
  else
    log_success "JSON parsing appears to be safe"
  fi
  
  check_item
  if grep -r "validateRequired\|sanitizeString" supabase/functions/ --include="*.ts" > /dev/null 2>&1; then
    log_success "Input validation functions found"
  else
    log_warning "No input validation functions found"
  fi
  
  check_item
  if grep -r "sql.*\+" supabase/functions/ --include="*.ts" > /dev/null 2>&1; then
    log_error "Potential SQL injection vulnerability found"
  else
    log_success "No obvious SQL injection vulnerabilities"
  fi
}

# Check CORS configuration
check_cors_config() {
  log_info "Checking CORS configuration..."
  
  check_item
  if grep -r "Access-Control-Allow-Origin.*\*" supabase/functions/ --include="*.ts" > /dev/null 2>&1; then
    log_warning "Wildcard CORS origin found - consider restricting in production"
  else
    log_success "CORS configuration appears restrictive"
  fi
  
  check_item
  if grep -r "corsHeaders\|handleCors" supabase/functions/ --include="*.ts" > /dev/null 2>&1; then
    log_success "CORS handling functions found"
  else
    log_warning "No CORS handling functions found"
  fi
}

# Check error handling
check_error_handling() {
  log_info "Checking error handling..."
  
  check_item
  if grep -r "try.*{" supabase/functions/ --include="*.ts" | wc -l | awk '{if($1 > 5) print "found"}' > /dev/null 2>&1; then
    log_success "Try-catch blocks found for error handling"
  else
    log_warning "Limited error handling found"
  fi
  
  check_item
  if grep -r "console.log.*error\|console.error" supabase/functions/ --include="*.ts" > /dev/null 2>&1; then
    log_success "Error logging found"
  else
    log_warning "No error logging found"
  fi
  
  check_item
  if grep -r "stack.*trace\|error.stack" supabase/functions/ --include="*.ts" > /dev/null 2>&1; then
    log_warning "Stack traces may be exposed - ensure they're not returned to clients"
  else
    log_success "No stack trace exposure found"
  fi
}

# Check database security
check_database_security() {
  log_info "Checking database security..."
  
  check_item
  if grep -r "ROW LEVEL SECURITY" supabase/migrations/ --include="*.sql" > /dev/null 2>&1; then
    log_success "Row Level Security (RLS) policies found"
  else
    log_error "No Row Level Security policies found"
  fi
  
  check_item
  if grep -r "SECURITY DEFINER" supabase/migrations/ --include="*.sql" > /dev/null 2>&1; then
    log_success "Security definer functions found"
  else
    log_warning "No security definer functions found"
  fi
  
  check_item
  if grep -r "auth.uid()" supabase/migrations/ --include="*.sql" > /dev/null 2>&1; then
    log_success "Authentication checks in database policies"
  else
    log_warning "No authentication checks in database policies"
  fi
}

# Check file permissions and structure
check_file_security() {
  log_info "Checking file security..."
  
  check_item
  if [[ -f ".gitignore" ]] && grep -q "\.env" .gitignore; then
    log_success ".env files are properly ignored by git"
  else
    log_error ".env files are not properly ignored by git"
  fi
  
  check_item
  if find supabase/functions/ -name "*.ts" -perm /o+w | grep -q .; then
    log_error "World-writable files found in functions directory"
  else
    log_success "File permissions appear secure"
  fi
  
  check_item
  if [[ -f "supabase/functions/_shared/types.ts" ]]; then
    log_success "Shared types file found - good for consistency"
  else
    log_warning "No shared types file found"
  fi
}

# Check dependencies
check_dependencies() {
  log_info "Checking dependencies..."
  
  check_item
  if [[ -f "supabase/functions/deno.json" ]]; then
    log_success "Deno configuration file found"
  else
    log_warning "No Deno configuration file found"
  fi
  
  check_item
  if grep -r "https://esm.sh" supabase/functions/ --include="*.ts" > /dev/null 2>&1; then
    log_success "Using esm.sh for dependencies"
  else
    log_warning "No esm.sh dependencies found"
  fi
  
  check_item
  if grep -r "import.*http://" supabase/functions/ --include="*.ts" > /dev/null 2>&1; then
    log_error "Insecure HTTP imports found - use HTTPS"
  else
    log_success "No insecure HTTP imports found"
  fi
}

# Generate security report
generate_security_report() {
  local report_file="security-audit-$(date +%Y%m%d_%H%M%S).txt"
  
  cat > "$report_file" << EOF
Edge Functions Security Audit Report
====================================
Date: $(date)
Total Checks: $TOTAL_CHECKS
Passed: $PASSED_CHECKS
Failed: $FAILED_CHECKS
Warnings: $WARNING_CHECKS

Security Score: $(( (PASSED_CHECKS * 100) / TOTAL_CHECKS ))%

Recommendations:
- Address all failed checks before production deployment
- Review warnings and implement fixes where appropriate
- Regularly run security audits as part of CI/CD pipeline
- Consider using automated security scanning tools
- Implement security headers in production
- Regular dependency updates and vulnerability scanning

EOF

  log_success "Security report generated: $report_file"
}

# Main execution
main() {
  echo -e "${BLUE}"
  echo "🔒 Edge Functions Security Audit"
  echo "================================="
  echo -e "${NC}"
  
  # Run all security checks
  check_sensitive_data
  echo ""
  
  check_env_variables
  echo ""
  
  check_auth_security
  echo ""
  
  check_input_validation
  echo ""
  
  check_cors_config
  echo ""
  
  check_error_handling
  echo ""
  
  check_database_security
  echo ""
  
  check_file_security
  echo ""
  
  check_dependencies
  echo ""
  
  # Generate summary
  echo "========================================"
  echo -e "${BLUE}📊 SECURITY AUDIT SUMMARY${NC}"
  echo "========================================"
  echo "✅ Passed: $PASSED_CHECKS/$TOTAL_CHECKS"
  echo "❌ Failed: $FAILED_CHECKS/$TOTAL_CHECKS"
  echo "⚠️  Warnings: $WARNING_CHECKS/$TOTAL_CHECKS"
  
  local security_score=$(( (PASSED_CHECKS * 100) / TOTAL_CHECKS ))
  echo "🔒 Security Score: $security_score%"
  
  echo ""
  
  # Generate report
  generate_security_report
  
  # Final assessment
  if [[ $FAILED_CHECKS -eq 0 ]]; then
    if [[ $WARNING_CHECKS -eq 0 ]]; then
      log_success "Excellent security posture! Ready for production."
      exit 0
    else
      log_warning "Good security posture with some warnings. Review before production."
      exit 0
    fi
  else
    log_error "Security issues found. Address failed checks before production deployment."
    exit 1
  fi
}

# Run main function
main "$@"
