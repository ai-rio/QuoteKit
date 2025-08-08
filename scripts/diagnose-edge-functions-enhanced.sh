#!/bin/bash

# Enhanced Edge Functions Diagnostic Script
# Builds upon the existing diagnostic capabilities with comprehensive testing

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SUPABASE_URL="http://127.0.0.1:54321"
FUNCTIONS_URL="${SUPABASE_URL}/functions/v1"
MAX_RESPONSE_TIME=2000  # 2 seconds
CRITICAL_FUNCTIONS=("test-connection" "subscription-status" "webhook-handler")

# Function list with descriptions
declare -A FUNCTIONS=(
    ["test-connection"]="Basic connectivity and database test"
    ["subscription-status"]="User subscription validation"
    ["quote-processor"]="Quote processing and calculations"
    ["quote-pdf-generator"]="PDF generation for quotes"
    ["webhook-handler"]="Stripe webhook processing"
    ["batch-processor"]="Bulk operations handler"
    ["webhook-monitor"]="Webhook monitoring and logging"
    ["migration-controller"]="Zero-downtime migration control"
    ["production-validator"]="Production deployment validation"
    ["security-hardening"]="Security scanning and hardening"
    ["performance-optimizer"]="Performance optimization engine"
    ["monitoring-alerting"]="System monitoring and alerts"
    ["global-deployment-optimizer"]="Global deployment optimization"
    ["connection-pool-manager"]="Database connection pooling"
    ["edge-functions-health-check"]="Comprehensive health checking"
)

# Counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
WARNINGS=0

# Results storage
declare -A TEST_RESULTS
declare -A RESPONSE_TIMES
declare -A ERROR_MESSAGES

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}  Edge Functions Diagnostics${NC}"
    echo -e "${BLUE}================================${NC}"
    echo ""
}

print_section() {
    echo -e "${YELLOW}--- $1 ---${NC}"
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

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if Supabase is running
check_supabase_status() {
    print_section "Checking Supabase Status"
    
    if curl -s "${SUPABASE_URL}/rest/v1/" > /dev/null 2>&1; then
        print_success "Supabase is running at ${SUPABASE_URL}"
        
        # Check if Edge Functions are enabled
        if curl -s "${FUNCTIONS_URL}/" > /dev/null 2>&1; then
            print_success "Edge Functions endpoint is accessible"
        else
            print_error "Edge Functions endpoint is not accessible"
            return 1
        fi
    else
        print_error "Supabase is not running or not accessible at ${SUPABASE_URL}"
        print_info "Run 'supabase start' to start the local development environment"
        return 1
    fi
    echo ""
}

# Test individual function
test_function() {
    local func_name=$1
    local description=${FUNCTIONS[$func_name]}
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -n "Testing ${func_name}... "
    
    # Measure response time
    local start_time=$(date +%s%3N)
    
    # Make the request (try POST first, then GET if 405)
    local response=$(curl -s -w "\n%{http_code}" \
        -X POST \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${SUPABASE_ANON_KEY:-}" \
        -d '{"test": true, "health_check": true}' \
        "${FUNCTIONS_URL}/${func_name}" 2>/dev/null)
    
    local end_time=$(date +%s%3N)
    local response_time=$((end_time - start_time))
    
    # Parse response
    local http_code=$(echo "$response" | tail -n1)
    local response_body=$(echo "$response" | head -n -1)
    
    # If we get 405, try GET request
    if [[ "$http_code" == "405" ]]; then
        start_time=$(date +%s%3N)
        response=$(curl -s -w "\n%{http_code}" \
            -X GET \
            -H "Authorization: Bearer ${SUPABASE_ANON_KEY:-}" \
            "${FUNCTIONS_URL}/${func_name}" 2>/dev/null)
        end_time=$(date +%s%3N)
        response_time=$((end_time - start_time))
        http_code=$(echo "$response" | tail -n1)
        response_body=$(echo "$response" | head -n -1)
    fi
    
    RESPONSE_TIMES[$func_name]=$response_time
    
    # Evaluate result
    if [[ "$http_code" == "200" ]]; then
        if [[ $response_time -lt $MAX_RESPONSE_TIME ]]; then
            print_success "${response_time}ms"
            TEST_RESULTS[$func_name]="PASS"
            PASSED_TESTS=$((PASSED_TESTS + 1))
        else
            print_warning "${response_time}ms (slow)"
            TEST_RESULTS[$func_name]="SLOW"
            WARNINGS=$((WARNINGS + 1))
        fi
    elif [[ "$http_code" == "401" ]]; then
        # 401 is expected for functions requiring authentication
        if [[ $response_time -lt $MAX_RESPONSE_TIME ]]; then
            print_success "${response_time}ms (auth required - expected)"
            TEST_RESULTS[$func_name]="PASS"
            PASSED_TESTS=$((PASSED_TESTS + 1))
        else
            print_warning "${response_time}ms (auth required, slow)"
            TEST_RESULTS[$func_name]="SLOW"
            WARNINGS=$((WARNINGS + 1))
        fi
    elif [[ "$http_code" == "400" ]]; then
        # 400 might be expected for functions requiring specific input
        local error_msg=$(echo "$response_body" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)
        if [[ "$error_msg" =~ (signature|missing|required) ]]; then
            if [[ $response_time -lt $MAX_RESPONSE_TIME ]]; then
                print_success "${response_time}ms (validation required - expected)"
                TEST_RESULTS[$func_name]="PASS"
                PASSED_TESTS=$((PASSED_TESTS + 1))
            else
                print_warning "${response_time}ms (validation required, slow)"
                TEST_RESULTS[$func_name]="SLOW"
                WARNINGS=$((WARNINGS + 1))
            fi
        else
            print_warning "HTTP 400 (unexpected)"
            TEST_RESULTS[$func_name]="DEGRADED"
            ERROR_MESSAGES[$func_name]="HTTP 400: $error_msg"
            WARNINGS=$((WARNINGS + 1))
        fi
    elif [[ "$http_code" == "404" ]]; then
        print_error "Function not found"
        TEST_RESULTS[$func_name]="NOT_FOUND"
        ERROR_MESSAGES[$func_name]="Function not deployed"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    else
        print_error "HTTP ${http_code}"
        TEST_RESULTS[$func_name]="ERROR"
        ERROR_MESSAGES[$func_name]="HTTP ${http_code}: ${response_body}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

# Test all functions
test_all_functions() {
    print_section "Testing Edge Functions"
    
    for func_name in "${!FUNCTIONS[@]}"; do
        test_function "$func_name"
    done
    echo ""
}

# Test critical functions only
test_critical_functions() {
    print_section "Testing Critical Functions"
    
    for func_name in "${CRITICAL_FUNCTIONS[@]}"; do
        if [[ -n "${FUNCTIONS[$func_name]}" ]]; then
            test_function "$func_name"
        fi
    done
    echo ""
}

# Performance analysis
analyze_performance() {
    print_section "Performance Analysis"
    
    local total_time=0
    local function_count=0
    local slow_functions=()
    
    for func_name in "${!RESPONSE_TIMES[@]}"; do
        local time=${RESPONSE_TIMES[$func_name]}
        total_time=$((total_time + time))
        function_count=$((function_count + 1))
        
        if [[ $time -gt $MAX_RESPONSE_TIME ]]; then
            slow_functions+=("${func_name} (${time}ms)")
        fi
    done
    
    if [[ $function_count -gt 0 ]]; then
        local avg_time=$((total_time / function_count))
        print_info "Average response time: ${avg_time}ms"
        
        if [[ ${#slow_functions[@]} -gt 0 ]]; then
            print_warning "Slow functions detected:"
            for slow_func in "${slow_functions[@]}"; do
                echo "  - $slow_func"
            done
        else
            print_success "All functions meet performance requirements"
        fi
    fi
    echo ""
}

# Generate detailed report
generate_report() {
    print_section "Test Results Summary"
    
    echo "Total Functions Tested: $TOTAL_TESTS"
    echo "Passed: $PASSED_TESTS"
    echo "Failed: $FAILED_TESTS"
    echo "Warnings: $WARNINGS"
    echo ""
    
    # Calculate success rate
    if [[ $TOTAL_TESTS -gt 0 ]]; then
        local success_rate=$(( (PASSED_TESTS * 100) / TOTAL_TESTS ))
        echo "Success Rate: ${success_rate}%"
        
        if [[ $success_rate -ge 90 ]]; then
            print_success "Excellent health status"
        elif [[ $success_rate -ge 75 ]]; then
            print_warning "Good health status with some issues"
        else
            print_error "Poor health status - immediate attention required"
        fi
    fi
    echo ""
    
    # Detailed results
    if [[ $FAILED_TESTS -gt 0 || $WARNINGS -gt 0 ]]; then
        print_section "Issues Found"
        
        for func_name in "${!TEST_RESULTS[@]}"; do
            local result=${TEST_RESULTS[$func_name]}
            local error_msg=${ERROR_MESSAGES[$func_name]:-}
            
            case $result in
                "NOT_FOUND")
                    print_error "${func_name}: Function not deployed"
                    ;;
                "ERROR")
                    print_error "${func_name}: ${error_msg}"
                    ;;
                "DEGRADED")
                    print_warning "${func_name}: ${error_msg}"
                    ;;
                "SLOW")
                    print_warning "${func_name}: Slow response (${RESPONSE_TIMES[$func_name]}ms)"
                    ;;
            esac
        done
        echo ""
    fi
}

# Generate recommendations
generate_recommendations() {
    print_section "Recommendations"
    
    local has_recommendations=false
    
    # Check for missing functions
    local missing_functions=()
    for func_name in "${!FUNCTIONS[@]}"; do
        if [[ "${TEST_RESULTS[$func_name]}" == "NOT_FOUND" ]]; then
            missing_functions+=("$func_name")
        fi
    done
    
    if [[ ${#missing_functions[@]} -gt 0 ]]; then
        has_recommendations=true
        print_info "Deploy missing functions:"
        for func in "${missing_functions[@]}"; do
            echo "  supabase functions deploy $func"
        done
        echo ""
    fi
    
    # Check for performance issues
    local slow_functions=()
    for func_name in "${!RESPONSE_TIMES[@]}"; do
        if [[ ${RESPONSE_TIMES[$func_name]} -gt $MAX_RESPONSE_TIME ]]; then
            slow_functions+=("$func_name")
        fi
    done
    
    if [[ ${#slow_functions[@]} -gt 0 ]]; then
        has_recommendations=true
        print_info "Optimize slow functions:"
        for func in "${slow_functions[@]}"; do
            echo "  - Review $func for performance bottlenecks"
        done
        echo ""
    fi
    
    # Check critical functions
    local critical_issues=()
    for func_name in "${CRITICAL_FUNCTIONS[@]}"; do
        local result=${TEST_RESULTS[$func_name]:-}
        if [[ "$result" == "ERROR" || "$result" == "NOT_FOUND" ]]; then
            critical_issues+=("$func_name")
        fi
    done
    
    if [[ ${#critical_issues[@]} -gt 0 ]]; then
        has_recommendations=true
        print_error "Critical functions with issues:"
        for func in "${critical_issues[@]}"; do
            echo "  - $func requires immediate attention"
        done
        echo ""
    fi
    
    if [[ "$has_recommendations" == false ]]; then
        print_success "No recommendations - all functions are healthy!"
    fi
}

# Export results to JSON
export_json_report() {
    local output_file="edge-functions-report-$(date +%Y%m%d-%H%M%S).json"
    
    cat > "$output_file" << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "summary": {
    "total_tests": $TOTAL_TESTS,
    "passed_tests": $PASSED_TESTS,
    "failed_tests": $FAILED_TESTS,
    "warnings": $WARNINGS,
    "success_rate": $(( TOTAL_TESTS > 0 ? (PASSED_TESTS * 100) / TOTAL_TESTS : 0 ))
  },
  "functions": {
EOF

    local first=true
    for func_name in "${!TEST_RESULTS[@]}"; do
        if [[ "$first" == false ]]; then
            echo "," >> "$output_file"
        fi
        first=false
        
        cat >> "$output_file" << EOF
    "$func_name": {
      "status": "${TEST_RESULTS[$func_name]}",
      "response_time_ms": ${RESPONSE_TIMES[$func_name]:-0},
      "description": "${FUNCTIONS[$func_name]:-}",
      "error_message": "${ERROR_MESSAGES[$func_name]:-}"
    }
EOF
    done

    cat >> "$output_file" << EOF
  }
}
EOF

    print_info "Report exported to: $output_file"
}

# Main execution
main() {
    print_header
    
    # Parse command line arguments
    local test_mode="all"
    local export_json=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --quick)
                test_mode="critical"
                shift
                ;;
            --json)
                export_json=true
                shift
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo "Options:"
                echo "  --quick    Test only critical functions"
                echo "  --json     Export results to JSON file"
                echo "  --help     Show this help message"
                exit 0
                ;;
            *)
                echo "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Check prerequisites
    if ! check_supabase_status; then
        exit 1
    fi
    
    # Run tests
    if [[ "$test_mode" == "critical" ]]; then
        test_critical_functions
    else
        test_all_functions
    fi
    
    # Analysis and reporting
    analyze_performance
    generate_report
    generate_recommendations
    
    # Export JSON if requested
    if [[ "$export_json" == true ]]; then
        export_json_report
    fi
    
    # Exit with appropriate code
    if [[ $FAILED_TESTS -gt 0 ]]; then
        exit 1
    elif [[ $WARNINGS -gt 0 ]]; then
        exit 2
    else
        exit 0
    fi
}

# Run main function with all arguments
main "$@"
