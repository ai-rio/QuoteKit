#!/bin/bash

# Continuous Integration Script for Edge Functions
# Automated testing and validation for development workflow

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DIAGNOSTIC_SCRIPT="$SCRIPT_DIR/diagnose-edge-functions-enhanced.sh"

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}  Edge Functions CI Pipeline${NC}"
    echo -e "${BLUE}================================${NC}"
    echo ""
}

print_step() {
    echo -e "${YELLOW}🔄 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check if Supabase is running
check_supabase() {
    print_step "Checking Supabase status..."
    
    if ! curl -s "http://127.0.0.1:54321/rest/v1/" > /dev/null 2>&1; then
        print_error "Supabase is not running"
        echo "Starting Supabase..."
        cd "$PROJECT_ROOT"
        supabase start
        
        # Wait for startup
        echo "Waiting for Supabase to be ready..."
        sleep 10
        
        if curl -s "http://127.0.0.1:54321/rest/v1/" > /dev/null 2>&1; then
            print_success "Supabase started successfully"
        else
            print_error "Failed to start Supabase"
            exit 1
        fi
    else
        print_success "Supabase is running"
    fi
}

# Deploy all Edge Functions
deploy_functions() {
    print_step "Deploying Edge Functions..."
    
    cd "$PROJECT_ROOT"
    
    # Get list of functions
    local functions_dir="supabase/functions"
    if [[ ! -d "$functions_dir" ]]; then
        print_error "Functions directory not found: $functions_dir"
        exit 1
    fi
    
    local deployed=0
    local failed=0
    
    for func_dir in "$functions_dir"/*; do
        if [[ -d "$func_dir" && -f "$func_dir/index.ts" ]]; then
            local func_name=$(basename "$func_dir")
            
            # Skip shared directory
            if [[ "$func_name" == "_shared" ]]; then
                continue
            fi
            
            echo -n "  Deploying $func_name... "
            
            if supabase functions deploy "$func_name" --no-verify-jwt > /dev/null 2>&1; then
                echo -e "${GREEN}✓${NC}"
                deployed=$((deployed + 1))
            else
                echo -e "${RED}✗${NC}"
                failed=$((failed + 1))
            fi
        fi
    done
    
    if [[ $failed -eq 0 ]]; then
        print_success "All functions deployed successfully ($deployed functions)"
    else
        print_warning "$deployed functions deployed, $failed failed"
    fi
}

# Run diagnostic tests
run_diagnostics() {
    print_step "Running diagnostic tests..."
    
    if [[ -x "$DIAGNOSTIC_SCRIPT" ]]; then
        if "$DIAGNOSTIC_SCRIPT" --json; then
            print_success "All diagnostic tests passed"
            return 0
        else
            local exit_code=$?
            if [[ $exit_code -eq 2 ]]; then
                print_warning "Diagnostic tests passed with warnings"
                return 2
            else
                print_error "Diagnostic tests failed"
                return 1
            fi
        fi
    else
        print_error "Diagnostic script not found or not executable: $DIAGNOSTIC_SCRIPT"
        return 1
    fi
}

# Run quick smoke tests
run_smoke_tests() {
    print_step "Running smoke tests..."
    
    local critical_functions=("test-connection" "subscription-status")
    local passed=0
    local failed=0
    
    for func_name in "${critical_functions[@]}"; do
        echo -n "  Testing $func_name... "
        
        local response=$(curl -s -w "%{http_code}" \
            -X POST \
            -H "Content-Type: application/json" \
            -d '{"test": true}' \
            "http://127.0.0.1:54321/functions/v1/$func_name" 2>/dev/null)
        
        local http_code=$(echo "$response" | tail -c 4)
        
        if [[ "$http_code" == "200" ]]; then
            echo -e "${GREEN}✓${NC}"
            passed=$((passed + 1))
        else
            echo -e "${RED}✗ (HTTP $http_code)${NC}"
            failed=$((failed + 1))
        fi
    done
    
    if [[ $failed -eq 0 ]]; then
        print_success "All smoke tests passed"
        return 0
    else
        print_error "$failed smoke tests failed"
        return 1
    fi
}

# Generate summary report
generate_summary() {
    local test_result=$1
    
    print_step "Generating summary report..."
    
    # Find the latest JSON report
    local latest_report=$(ls -t edge-functions-report-*.json 2>/dev/null | head -n1)
    
    if [[ -n "$latest_report" && -f "$latest_report" ]]; then
        echo ""
        echo "📊 Test Summary:"
        echo "=================="
        
        # Extract key metrics from JSON report
        local total_tests=$(jq -r '.summary.total_tests' "$latest_report" 2>/dev/null || echo "N/A")
        local passed_tests=$(jq -r '.summary.passed_tests' "$latest_report" 2>/dev/null || echo "N/A")
        local failed_tests=$(jq -r '.summary.failed_tests' "$latest_report" 2>/dev/null || echo "N/A")
        local success_rate=$(jq -r '.summary.success_rate' "$latest_report" 2>/dev/null || echo "N/A")
        
        echo "Total Functions: $total_tests"
        echo "Passed: $passed_tests"
        echo "Failed: $failed_tests"
        echo "Success Rate: $success_rate%"
        echo ""
        
        if [[ "$test_result" == "0" ]]; then
            print_success "🎉 All tests passed! Edge Functions are ready for development."
        elif [[ "$test_result" == "2" ]]; then
            print_warning "⚠️  Tests passed with warnings. Review the issues above."
        else
            print_error "💥 Tests failed. Edge Functions need attention before development."
        fi
        
        echo ""
        echo "📄 Detailed report: $latest_report"
    else
        echo "No detailed report available"
    fi
}

# Cleanup function
cleanup() {
    echo ""
    print_step "Cleaning up..."
    
    # Remove old report files (keep last 5)
    ls -t edge-functions-report-*.json 2>/dev/null | tail -n +6 | xargs rm -f 2>/dev/null || true
    
    print_success "Cleanup completed"
}

# Main execution
main() {
    print_header
    
    local skip_deploy=false
    local quick_mode=false
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-deploy)
                skip_deploy=true
                shift
                ;;
            --quick)
                quick_mode=true
                shift
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo "Options:"
                echo "  --skip-deploy  Skip function deployment"
                echo "  --quick        Run only smoke tests"
                echo "  --help         Show this help message"
                exit 0
                ;;
            *)
                echo "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Set trap for cleanup
    trap cleanup EXIT
    
    # Pipeline steps
    check_supabase
    
    if [[ "$skip_deploy" == false ]]; then
        deploy_functions
    fi
    
    if [[ "$quick_mode" == true ]]; then
        run_smoke_tests
        local test_result=$?
    else
        run_diagnostics
        local test_result=$?
    fi
    
    generate_summary "$test_result"
    
    exit $test_result
}

# Run main with all arguments
main "$@"
