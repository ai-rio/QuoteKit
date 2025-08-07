#!/bin/bash

# Realistic Performance Testing for Edge Functions
# Tests critical functions under load with proper monitoring
# Usage: ./scripts/realistic-performance-test.sh [--local] [--concurrent N] [--duration N]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default configuration
LOCAL_MODE=false
CONCURRENT_REQUESTS=10
TEST_DURATION=30
PROJECT_ID=""
ANON_KEY=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --local)
      LOCAL_MODE=true
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
    -h|--help)
      echo "Usage: $0 [--local] [--concurrent N] [--duration N]"
      echo "  --local           Test local Supabase instance"
      echo "  --concurrent N    Number of concurrent requests (default: 10)"
      echo "  --duration N      Test duration in seconds (default: 30)"
      echo "  -h, --help        Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option $1"
      exit 1
      ;;
  esac
done

# Set up URLs and keys based on mode
if [[ "$LOCAL_MODE" == true ]]; then
  BASE_URL="http://localhost:54321/functions/v1"
  ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzM5NDk2MDAwLCJpYXQiOjE3Mzk0MDk2MDAsImlzcyI6Imh0dHA6Ly8xMjcuMC4wLjE6NTQzMjEvYXV0aC92MSIsInN1YiI6IjBhOGI4Y2U3LTNjYzMtNDc2ZS1iODIwLTIyOTZkZjIxMTljZiIsImVtYWlsIjoiY2FybG9zQGFpLnJpby5iciIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiXX0sInVzZXJfbWV0YWRhdGEiOnt9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6InBhc3N3b3JkIiwidGltZXN0YW1wIjoxNzM5NDA5NjAwfV0sInNlc3Npb25faWQiOiIwYThiOGNlNy0zY2MzLTQ3NmUtYjgyMC0yMjk2ZGYyMTE5Y2YifQ.test-jwt-token"
else
  PROJECT_ID="${SUPABASE_PROJECT_ID:-$(echo $NEXT_PUBLIC_SUPABASE_URL | cut -d'/' -f3 | cut -d'.' -f1)}"
  ANON_KEY="${SUPABASE_ANON_KEY:-$NEXT_PUBLIC_SUPABASE_ANON_KEY}"
  
  if [[ -z "$PROJECT_ID" || -z "$ANON_KEY" ]]; then
    echo -e "${RED}❌ Missing environment variables for production testing${NC}"
    echo "Set SUPABASE_PROJECT_ID and SUPABASE_ANON_KEY"
    exit 1
  fi
  
  BASE_URL="https://$PROJECT_ID.functions.supabase.co"
fi

# Critical functions to test under load
CRITICAL_FUNCTIONS=(
  "subscription-status"
  "quote-processor"
  "webhook-handler"
  "batch-processor"
)

# Test payloads for each function
declare -A PAYLOADS
PAYLOADS["subscription-status"]='{"action": "get-subscription"}'
PAYLOADS["quote-processor"]='{"operation": "create", "quote": {"client_name": "Load Test Client", "client_email": "loadtest@example.com", "line_items": [{"name": "Load Test Service", "quantity": 1, "unit_price": 100, "total": 100}], "tax_rate": 8.25}, "operations": {"generate_pdf": false, "send_email": false, "update_usage": false, "auto_save": false}}'
PAYLOADS["webhook-handler"]='{"type": "customer.subscription.created", "data": {"object": {"id": "sub_loadtest", "customer": "cus_loadtest", "status": "active"}}, "livemode": false, "created": '$(date +%s)'}'
PAYLOADS["batch-processor"]='{"operation": "bulk-status-update", "items": ["load-test-1", "load-test-2"], "status": "sent", "options": {"notify_clients": false, "update_analytics": false}}'

# Create temporary directory for results
TEMP_DIR=$(mktemp -d)
RESULTS_FILE="$TEMP_DIR/performance_results.txt"
SUMMARY_FILE="performance-test-$(date +%Y%m%d-%H%M%S).json"

echo -e "${BLUE}⚡ Realistic Performance Testing${NC}"
echo "==============================="
echo "Mode: $(if [[ "$LOCAL_MODE" == true ]]; then echo "Local Development"; else echo "Production"; fi)"
echo "Target: $BASE_URL"
echo "Concurrent Requests: $CONCURRENT_REQUESTS"
echo "Test Duration: ${TEST_DURATION}s"
echo "Functions: ${#CRITICAL_FUNCTIONS[@]}"
echo "Results: $SUMMARY_FILE"
echo "==============================="

# Initialize results
echo "{" > "$SUMMARY_FILE"
echo "  \"test_config\": {" >> "$SUMMARY_FILE"
echo "    \"mode\": \"$(if [[ "$LOCAL_MODE" == true ]]; then echo "local"; else echo "production"; fi)\"," >> "$SUMMARY_FILE"
echo "    \"concurrent_requests\": $CONCURRENT_REQUESTS," >> "$SUMMARY_FILE"
echo "    \"test_duration\": $TEST_DURATION," >> "$SUMMARY_FILE"
echo "    \"timestamp\": \"$(date -Iseconds)\"" >> "$SUMMARY_FILE"
echo "  }," >> "$SUMMARY_FILE"
echo "  \"results\": {" >> "$SUMMARY_FILE"

FIRST_FUNCTION=true

# Test each critical function
for func in "${CRITICAL_FUNCTIONS[@]}"; do
  echo -e "\n${BLUE}🔄 Load Testing: $func${NC}"
  echo "================================"
  
  payload="${PAYLOADS[$func]}"
  url="$BASE_URL/$func"
  
  # Create temporary files for this function's results
  FUNC_RESULTS="$TEMP_DIR/${func}_results.txt"
  FUNC_TIMES="$TEMP_DIR/${func}_times.txt"
  
  echo "Starting $CONCURRENT_REQUESTS concurrent requests for ${TEST_DURATION}s..."
  
  # Start background processes for concurrent requests
  pids=()
  start_time=$(date +%s)
  end_time=$((start_time + TEST_DURATION))
  
  for ((i=1; i<=CONCURRENT_REQUESTS; i++)); do
    (
      request_count=0
      success_count=0
      total_time=0
      
      while [[ $(date +%s) -lt $end_time ]]; do
        request_start=$(date +%s%3N)  # milliseconds
        
        if curl -s -X POST "$url" \
            -H "Authorization: Bearer $ANON_KEY" \
            -H "Content-Type: application/json" \
            -d "$payload" \
            --max-time 10 \
            --output /dev/null \
            --write-out "%{http_code}" > "$TEMP_DIR/response_$i.txt" 2>/dev/null; then
          
          request_end=$(date +%s%3N)
          response_time=$((request_end - request_start))
          http_code=$(cat "$TEMP_DIR/response_$i.txt")
          
          if [[ "$http_code" == "200" ]]; then
            ((success_count++))
            echo "$response_time" >> "$FUNC_TIMES"
          fi
          
          ((request_count++))
          total_time=$((total_time + response_time))
        fi
        
        # Small delay to prevent overwhelming
        sleep 0.1
      done
      
      echo "Worker $i: $request_count requests, $success_count successful" >> "$FUNC_RESULTS"
    ) &
    pids+=($!)
  done
  
  # Show progress
  while [[ $(date +%s) -lt $end_time ]]; do
    remaining=$((end_time - $(date +%s)))
    echo -ne "\r   Progress: $((TEST_DURATION - remaining))/${TEST_DURATION}s"
    sleep 1
  done
  echo ""
  
  # Wait for all background processes to complete
  for pid in "${pids[@]}"; do
    wait "$pid"
  done
  
  # Calculate statistics
  if [[ -f "$FUNC_TIMES" ]]; then
    total_requests=$(wc -l < "$FUNC_RESULTS")
    successful_requests=$(wc -l < "$FUNC_TIMES")
    
    if [[ $successful_requests -gt 0 ]]; then
      # Calculate response time statistics
      avg_time=$(awk '{sum+=$1} END {print sum/NR}' "$FUNC_TIMES")
      min_time=$(sort -n "$FUNC_TIMES" | head -1)
      max_time=$(sort -n "$FUNC_TIMES" | tail -1)
      
      # Calculate percentiles
      p95_time=$(sort -n "$FUNC_TIMES" | awk -v p=95 'BEGIN{c=0} {a[c++]=$1} END{print a[int(c*p/100)]}')
      p99_time=$(sort -n "$FUNC_TIMES" | awk -v p=99 'BEGIN{c=0} {a[c++]=$1} END{print a[int(c*p/100)]}')
      
      success_rate=$(echo "scale=2; $successful_requests * 100 / $total_requests" | bc)
      rps=$(echo "scale=2; $successful_requests / $TEST_DURATION" | bc)
      
      # Display results
      echo "   Total Requests: $total_requests"
      echo "   Successful: $successful_requests"
      echo -e "   Success Rate: ${GREEN}${success_rate}%${NC}"
      echo -e "   Requests/sec: ${GREEN}${rps}${NC}"
      echo "   Response Times:"
      echo "     Average: ${avg_time}ms"
      echo "     Min: ${min_time}ms"
      echo "     Max: ${max_time}ms"
      echo "     95th percentile: ${p95_time}ms"
      echo "     99th percentile: ${p99_time}ms"
      
      # Performance assessment
      if (( $(echo "$avg_time < 1000" | bc -l) )); then
        echo -e "   Performance: ${GREEN}Excellent (<1s avg)${NC}"
      elif (( $(echo "$avg_time < 2000" | bc -l) )); then
        echo -e "   Performance: ${YELLOW}Good (<2s avg)${NC}"
      else
        echo -e "   Performance: ${RED}Needs Improvement (>2s avg)${NC}"
      fi
      
      # Add to JSON results
      if [[ "$FIRST_FUNCTION" == false ]]; then
        echo "," >> "$SUMMARY_FILE"
      fi
      FIRST_FUNCTION=false
      
      echo "    \"$func\": {" >> "$SUMMARY_FILE"
      echo "      \"total_requests\": $total_requests," >> "$SUMMARY_FILE"
      echo "      \"successful_requests\": $successful_requests," >> "$SUMMARY_FILE"
      echo "      \"success_rate\": $success_rate," >> "$SUMMARY_FILE"
      echo "      \"requests_per_second\": $rps," >> "$SUMMARY_FILE"
      echo "      \"response_times\": {" >> "$SUMMARY_FILE"
      echo "        \"average_ms\": $avg_time," >> "$SUMMARY_FILE"
      echo "        \"min_ms\": $min_time," >> "$SUMMARY_FILE"
      echo "        \"max_ms\": $max_time," >> "$SUMMARY_FILE"
      echo "        \"p95_ms\": $p95_time," >> "$SUMMARY_FILE"
      echo "        \"p99_ms\": $p99_time" >> "$SUMMARY_FILE"
      echo "      }" >> "$SUMMARY_FILE"
      echo "    }" >> "$SUMMARY_FILE"
    else
      echo -e "   ${RED}❌ No successful requests${NC}"
    fi
  else
    echo -e "   ${RED}❌ No response data collected${NC}"
  fi
done

# Finalize JSON
echo "  }" >> "$SUMMARY_FILE"
echo "}" >> "$SUMMARY_FILE"

# Overall summary
echo -e "\n${BLUE}📊 Performance Test Summary${NC}"
echo "============================"

# Parse results for overall assessment
if command -v jq &> /dev/null; then
  echo "Overall Results:"
  jq -r '.results | to_entries[] | "  \(.key): \(.value.success_rate)% success, \(.value.requests_per_second) RPS, \(.value.response_times.average_ms)ms avg"' "$SUMMARY_FILE"
  
  # Check if any function failed performance targets
  failed_functions=$(jq -r '.results | to_entries[] | select(.value.response_times.average_ms > 2000 or .value.success_rate < 95) | .key' "$SUMMARY_FILE")
  
  if [[ -n "$failed_functions" ]]; then
    echo -e "\n${YELLOW}⚠️  Functions needing attention:${NC}"
    echo "$failed_functions" | while read -r func; do
      echo "  - $func"
    done
  fi
else
  echo "Install 'jq' for detailed JSON analysis"
fi

echo -e "\nDetailed results saved to: $SUMMARY_FILE"

# Cleanup
rm -rf "$TEMP_DIR"

echo -e "\n${GREEN}✅ Performance testing completed${NC}"
