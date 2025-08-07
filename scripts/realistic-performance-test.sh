#!/bin/bash

# Realistic Performance Testing Script for Edge Functions
# Tests performance under realistic load conditions
# Usage: ./scripts/realistic-performance-test.sh [--local|--production]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT="local"
BASE_URL="http://127.0.0.1:54321/functions/v1"
CONCURRENT_REQUESTS=10
TEST_DURATION=30
WARMUP_REQUESTS=5
RESULTS_DIR="test-results"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --local)
      ENVIRONMENT="local"
      BASE_URL="http://127.0.0.1:54321/functions/v1"
      shift
      ;;
    --production)
      ENVIRONMENT="production"
      if [[ -z "$SUPABASE_PROJECT_ID" ]]; then
        echo -e "${RED}❌ Error: SUPABASE_PROJECT_ID environment variable is required for production testing${NC}"
        exit 1
      fi
      BASE_URL="https://$SUPABASE_PROJECT_ID.functions.supabase.co"
      shift
      ;;
    --concurrent)
      CONCURRENT_REQUESTS="$2"
      shift 2
      ;;
    --duration)
      TEST_DURATION="$2"
      shift 2
      ;;
    --help)
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --local                Test against local Supabase instance"
      echo "  --production           Test against production (requires SUPABASE_PROJECT_ID)"
      echo "  --concurrent N         Number of concurrent requests (default: 10)"
      echo "  --duration N           Test duration in seconds (default: 30)"
      echo "  --help                 Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Create results directory
mkdir -p "$RESULTS_DIR"

# Get authentication token
get_auth_token() {
  if [[ "$ENVIRONMENT" == "local" ]]; then
    echo "$SUPABASE_ANON_KEY"
  else
    echo "$SUPABASE_ANON_KEY"
  fi
}

AUTH_TOKEN=$(get_auth_token)

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

# Function to test a single endpoint
test_function_performance() {
  local func_name=$1
  local payload=$2
  local test_type=$3
  local results_file="$RESULTS_DIR/${func_name}_${test_type}_results.txt"
  
  log_info "Testing $func_name ($test_type)..."
  
  # Warmup requests
  log_info "Warming up $func_name with $WARMUP_REQUESTS requests..."
  for ((i=1; i<=WARMUP_REQUESTS; i++)); do
    curl -s -o /dev/null \
      -X POST "$BASE_URL/$func_name" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $AUTH_TOKEN" \
      -d "$payload" \
      --max-time 30 &
  done
  wait
  
  # Clear results file
  > "$results_file"
  
  # Performance test
  log_info "Running performance test: $CONCURRENT_REQUESTS concurrent requests for ${TEST_DURATION}s..."
  
  local start_time=$(date +%s)
  local end_time=$((start_time + TEST_DURATION))
  local request_count=0
  local success_count=0
  local error_count=0
  
  # Array to store response times
  declare -a response_times=()
  
  while [[ $(date +%s) -lt $end_time ]]; do
    # Launch concurrent requests
    for ((i=1; i<=CONCURRENT_REQUESTS; i++)); do
      (
        local req_start=$(date +%s%3N)
        local http_code=$(curl -s -o /dev/null -w "%{http_code}" \
          -X POST "$BASE_URL/$func_name" \
          -H "Content-Type: application/json" \
          -H "Authorization: Bearer $AUTH_TOKEN" \
          -d "$payload" \
          --max-time 30)
        local req_end=$(date +%s%3N)
        local response_time=$((req_end - req_start))
        
        echo "$response_time,$http_code" >> "$results_file"
        
        if [[ "$http_code" == "200" || "$http_code" == "201" ]]; then
          echo "SUCCESS:$response_time" >> "${results_file}.status"
        else
          echo "ERROR:$http_code:$response_time" >> "${results_file}.status"
        fi
      ) &
      
      ((request_count++))
    done
    
    # Wait for current batch to complete
    wait
    
    # Small delay to prevent overwhelming
    sleep 0.1
  done
  
  # Calculate statistics
  if [[ -f "$results_file" ]]; then
    local total_requests=$(wc -l < "$results_file")
    local successful_requests=$(grep -c "^[0-9]*,200$\|^[0-9]*,201$" "$results_file" || echo 0)
    local failed_requests=$((total_requests - successful_requests))
    
    # Calculate response time statistics
    local response_times=($(awk -F',' '{print $1}' "$results_file" | sort -n))
    local min_time=${response_times[0]}
    local max_time=${response_times[-1]}
    
    # Calculate percentiles
    local count=${#response_times[@]}
    local p50_index=$((count * 50 / 100))
    local p95_index=$((count * 95 / 100))
    local p99_index=$((count * 99 / 100))
    
    local p50_time=${response_times[$p50_index]}
    local p95_time=${response_times[$p95_index]}
    local p99_time=${response_times[$p99_index]}
    
    # Calculate average
    local sum=0
    for time in "${response_times[@]}"; do
      sum=$((sum + time))
    done
    local avg_time=$((sum / count))
    
    # Calculate requests per second
    local actual_duration=$(($(date +%s) - start_time))
    local rps=$((total_requests / actual_duration))
    
    # Calculate success rate
    local success_rate=$(echo "scale=2; $successful_requests * 100 / $total_requests" | bc -l)
    
    # Display results
    echo ""
    echo "📊 Performance Results for $func_name ($test_type):"
    echo "─────────────────────────────────────────────────"
    echo "Total Requests:     $total_requests"
    echo "Successful:         $successful_requests"
    echo "Failed:             $failed_requests"
    echo "Success Rate:       ${success_rate}%"
    echo "Requests/sec:       $rps"
    echo "Response Times (ms):"
    echo "  Min:              $min_time"
    echo "  Average:          $avg_time"
    echo "  P50 (Median):     $p50_time"
    echo "  P95:              $p95_time"
    echo "  P99:              $p99_time"
    echo "  Max:              $max_time"
    echo ""
    
    # Performance assessment
    if [[ $avg_time -lt 1000 && $success_rate > 95 ]]; then
      log_success "$func_name performance: EXCELLENT"
    elif [[ $avg_time -lt 2000 && $success_rate > 90 ]]; then
      log_success "$func_name performance: GOOD"
    elif [[ $avg_time -lt 5000 && $success_rate > 80 ]]; then
      log_warning "$func_name performance: ACCEPTABLE"
    else
      log_error "$func_name performance: POOR"
    fi
    
    # Save summary to file
    cat > "$RESULTS_DIR/${func_name}_${test_type}_summary.json" << EOF
{
  "function": "$func_name",
  "test_type": "$test_type",
  "environment": "$ENVIRONMENT",
  "timestamp": "$(date -Iseconds)",
  "total_requests": $total_requests,
  "successful_requests": $successful_requests,
  "failed_requests": $failed_requests,
  "success_rate": $success_rate,
  "requests_per_second": $rps,
  "response_times": {
    "min_ms": $min_time,
    "avg_ms": $avg_time,
    "p50_ms": $p50_time,
    "p95_ms": $p95_time,
    "p99_ms": $p99_time,
    "max_ms": $max_time
  },
  "test_config": {
    "concurrent_requests": $CONCURRENT_REQUESTS,
    "test_duration_seconds": $TEST_DURATION,
    "warmup_requests": $WARMUP_REQUESTS
  }
}
EOF
  else
    log_error "No results file found for $func_name"
  fi
}

# Test critical functions with realistic payloads
test_critical_functions() {
  log_info "Testing critical Edge Functions under load..."
  
  # Subscription Status - Core business function
  test_function_performance "subscription-status" \
    '{"action": "get-subscription"}' \
    "core_business"
  
  # Quote Processor - Heavy computation
  test_function_performance "quote-processor" \
    '{
      "operation": "create",
      "quote": {
        "client_name": "Performance Test Client",
        "client_email": "perf@test.com",
        "line_items": [
          {"name": "Service 1", "quantity": 2, "unit_price": 50.00, "total": 100.00},
          {"name": "Service 2", "quantity": 1, "unit_price": 75.00, "total": 75.00}
        ],
        "subtotal": 175.00,
        "tax_rate": 8.25,
        "tax_amount": 14.44,
        "total": 189.44
      }
    }' \
    "heavy_computation"
  
  # Webhook Handler - High frequency
  test_function_performance "webhook-handler" \
    '{
      "type": "customer.subscription.updated",
      "data": {"object": {"id": "sub_perf_test", "status": "active"}},
      "livemode": false
    }' \
    "high_frequency"
  
  # Batch Processor - Bulk operations
  test_function_performance "batch-processor" \
    '{
      "operation": "bulk-status-update",
      "items": ["item1", "item2", "item3", "item4", "item5"],
      "status": "processed",
      "options": {"validate": false}
    }' \
    "bulk_operations"
}

# Test monitoring functions
test_monitoring_functions() {
  log_info "Testing monitoring and optimization functions..."
  
  # Performance Optimizer
  test_function_performance "performance-optimizer" \
    '{"action": "analyze", "scope": "quick"}' \
    "monitoring"
  
  # Connection Pool Manager
  test_function_performance "connection-pool-manager" \
    '{"action": "status"}' \
    "monitoring"
  
  # Monitoring Alerting
  test_function_performance "monitoring-alerting" \
    '{"action": "health-check"}' \
    "monitoring"
}

# Generate comprehensive report
generate_performance_report() {
  local report_file="$RESULTS_DIR/performance_report_$(date +%Y%m%d_%H%M%S).html"
  
  log_info "Generating comprehensive performance report..."
  
  cat > "$report_file" << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Edge Functions Performance Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f0f0f0; padding: 20px; border-radius: 5px; }
        .function-result { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .excellent { border-left: 5px solid #4CAF50; }
        .good { border-left: 5px solid #8BC34A; }
        .acceptable { border-left: 5px solid #FF9800; }
        .poor { border-left: 5px solid #F44336; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; }
        .metric { background: #f9f9f9; padding: 10px; border-radius: 3px; }
        .metric-value { font-size: 1.5em; font-weight: bold; color: #333; }
        .metric-label { font-size: 0.9em; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Edge Functions Performance Report</h1>
        <p><strong>Environment:</strong> ENVIRONMENT_PLACEHOLDER</p>
        <p><strong>Test Date:</strong> DATE_PLACEHOLDER</p>
        <p><strong>Test Configuration:</strong> CONCURRENT_REQUESTS concurrent requests, TEST_DURATION seconds duration</p>
    </div>
EOF

  # Add results for each function
  for summary_file in "$RESULTS_DIR"/*_summary.json; do
    if [[ -f "$summary_file" ]]; then
      local func_name=$(jq -r '.function' "$summary_file")
      local test_type=$(jq -r '.test_type' "$summary_file")
      local success_rate=$(jq -r '.success_rate' "$summary_file")
      local avg_time=$(jq -r '.response_times.avg_ms' "$summary_file")
      local rps=$(jq -r '.requests_per_second' "$summary_file")
      
      # Determine performance class
      local perf_class="poor"
      if (( $(echo "$avg_time < 1000 && $success_rate > 95" | bc -l) )); then
        perf_class="excellent"
      elif (( $(echo "$avg_time < 2000 && $success_rate > 90" | bc -l) )); then
        perf_class="good"
      elif (( $(echo "$avg_time < 5000 && $success_rate > 80" | bc -l) )); then
        perf_class="acceptable"
      fi
      
      cat >> "$report_file" << EOF
    <div class="function-result $perf_class">
        <h3>$func_name ($test_type)</h3>
        <div class="metrics">
            <div class="metric">
                <div class="metric-value">$success_rate%</div>
                <div class="metric-label">Success Rate</div>
            </div>
            <div class="metric">
                <div class="metric-value">${avg_time}ms</div>
                <div class="metric-label">Avg Response Time</div>
            </div>
            <div class="metric">
                <div class="metric-value">$rps</div>
                <div class="metric-label">Requests/sec</div>
            </div>
        </div>
    </div>
EOF
    fi
  done
  
  cat >> "$report_file" << 'EOF'
</body>
</html>
EOF

  # Replace placeholders
  sed -i "s/ENVIRONMENT_PLACEHOLDER/$ENVIRONMENT/g" "$report_file"
  sed -i "s/DATE_PLACEHOLDER/$(date)/g" "$report_file"
  sed -i "s/CONCURRENT_REQUESTS/$CONCURRENT_REQUESTS/g" "$report_file"
  sed -i "s/TEST_DURATION/$TEST_DURATION/g" "$report_file"
  
  log_success "Performance report generated: $report_file"
}

# Main execution
main() {
  echo -e "${BLUE}"
  echo "⚡ Edge Functions Performance Testing"
  echo "====================================="
  echo -e "${NC}"
  
  log_info "Environment: $ENVIRONMENT"
  log_info "Base URL: $BASE_URL"
  log_info "Concurrent Requests: $CONCURRENT_REQUESTS"
  log_info "Test Duration: ${TEST_DURATION}s"
  log_info "Results Directory: $RESULTS_DIR"
  echo ""
  
  # Check dependencies
  if ! command -v curl &> /dev/null; then
    log_error "curl is required but not installed"
    exit 1
  fi
  
  if ! command -v bc &> /dev/null; then
    log_error "bc is required but not installed"
    exit 1
  fi
  
  if ! command -v jq &> /dev/null; then
    log_error "jq is required but not installed"
    exit 1
  fi
  
  # Run performance tests
  test_critical_functions
  test_monitoring_functions
  
  # Generate report
  generate_performance_report
  
  # Final summary
  echo ""
  echo "🎯 Performance Testing Complete!"
  echo "Results saved to: $RESULTS_DIR"
  echo ""
  
  # Check if any functions performed poorly
  local poor_performance=false
  for summary_file in "$RESULTS_DIR"/*_summary.json; do
    if [[ -f "$summary_file" ]]; then
      local avg_time=$(jq -r '.response_times.avg_ms' "$summary_file")
      local success_rate=$(jq -r '.success_rate' "$summary_file")
      
      if (( $(echo "$avg_time > 5000 || $success_rate < 80" | bc -l) )); then
        poor_performance=true
        break
      fi
    fi
  done
  
  if [[ "$poor_performance" == "true" ]]; then
    log_error "Some functions showed poor performance. Review results before production deployment."
    exit 1
  else
    log_success "All functions performed within acceptable limits!"
    exit 0
  fi
}

# Run main function
main "$@"
