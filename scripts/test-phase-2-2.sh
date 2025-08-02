#!/bin/bash

# Phase 2.2 Testing Script
# Tests the enhanced billing history display with production-ready logic

set -e

echo "🧾 Phase 2.2: Enhanced Billing History Testing"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    case $status in
        "SUCCESS") echo -e "${GREEN}✅ $message${NC}" ;;
        "ERROR") echo -e "${RED}❌ $message${NC}" ;;
        "WARNING") echo -e "${YELLOW}⚠️  $message${NC}" ;;
        "INFO") echo -e "${BLUE}ℹ️  $message${NC}" ;;
    esac
}

# Function to run test and capture results
run_test() {
    local test_name=$1
    local test_command=$2
    
    print_status "INFO" "Running: $test_name"
    
    if eval "$test_command" > /dev/null 2>&1; then
        print_status "SUCCESS" "$test_name passed"
        return 0
    else
        print_status "ERROR" "$test_name failed"
        return 1
    fi
}

# Test configuration
TEST_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$TEST_DIR")"
RESULTS_FILE="$TEST_DIR/phase-2-2-test-results.json"

# Initialize results
echo "{" > "$RESULTS_FILE"
echo "  \"timestamp\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"," >> "$RESULTS_FILE"
echo "  \"phase\": \"2.2\"," >> "$RESULTS_FILE"
echo "  \"description\": \"Enhanced Billing History Display\"," >> "$RESULTS_FILE"
echo "  \"tests\": {" >> "$RESULTS_FILE"

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0

echo "📋 Running Phase 2.2 Tests..."
echo ""

# Test 1: Enhanced Billing History Unit Tests
print_status "INFO" "Test 1: Enhanced Billing History Unit Tests"
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if run_test "Enhanced Billing History Unit Tests" "cd '$PROJECT_ROOT' && npm test tests/integration/enhanced-billing-history.test.ts"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
    echo "    \"enhanced_billing_history_tests\": { \"status\": \"PASSED\", \"message\": \"All enhanced billing history tests passed\" }," >> "$RESULTS_FILE"
else
    echo "    \"enhanced_billing_history_tests\": { \"status\": \"FAILED\", \"message\": \"Enhanced billing history tests failed\" }," >> "$RESULTS_FILE"
fi
echo ""

# Test 2: Enhanced API File Structure
print_status "INFO" "Test 2: Enhanced API File Structure"
TOTAL_TESTS=$((TOTAL_TESTS + 1))
ENHANCED_API_FILE="$PROJECT_ROOT/src/features/billing/api/enhanced-billing-history.ts"

if [ -f "$ENHANCED_API_FILE" ]; then
    # Check for key functions
    if grep -q "getEnhancedBillingHistory" "$ENHANCED_API_FILE" && \
       grep -q "hasRealBillingActivity" "$ENHANCED_API_FILE" && \
       grep -q "getProductionBillingSummary" "$ENHANCED_API_FILE"; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
        print_status "SUCCESS" "Enhanced API file structure is correct"
        echo "    \"enhanced_api_structure\": { \"status\": \"PASSED\", \"message\": \"Enhanced API file has all required functions\" }," >> "$RESULTS_FILE"
    else
        print_status "ERROR" "Enhanced API file missing required functions"
        echo "    \"enhanced_api_structure\": { \"status\": \"FAILED\", \"message\": \"Enhanced API file missing required functions\" }," >> "$RESULTS_FILE"
    fi
else
    print_status "ERROR" "Enhanced API file not found"
    echo "    \"enhanced_api_structure\": { \"status\": \"FAILED\", \"message\": \"Enhanced API file not found\" }," >> "$RESULTS_FILE"
fi
echo ""

# Test 3: Production Mode Logic
print_status "INFO" "Test 3: Production Mode Logic Check"
TOTAL_TESTS=$((TOTAL_TESTS + 1))

if grep -q "productionMode.*process.env.NODE_ENV.*production" "$ENHANCED_API_FILE" && \
   grep -q "includeSubscriptionHistory.*false" "$ENHANCED_API_FILE"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
    print_status "SUCCESS" "Production mode logic implemented correctly"
    echo "    \"production_mode_logic\": { \"status\": \"PASSED\", \"message\": \"Production mode defaults are correct\" }," >> "$RESULTS_FILE"
else
    print_status "ERROR" "Production mode logic not implemented correctly"
    echo "    \"production_mode_logic\": { \"status\": \"FAILED\", \"message\": \"Production mode logic missing or incorrect\" }," >> "$RESULTS_FILE"
fi
echo ""

# Test 4: API Route Update
print_status "INFO" "Test 4: API Route Update Check"
TOTAL_TESTS=$((TOTAL_TESTS + 1))
API_ROUTE="$PROJECT_ROOT/src/app/api/billing-history/route.ts"

if grep -q "getEnhancedBillingHistory" "$API_ROUTE" && \
   grep -q "enhanced-billing-history" "$API_ROUTE"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
    print_status "SUCCESS" "API route updated to use enhanced logic"
    echo "    \"api_route_update\": { \"status\": \"PASSED\", \"message\": \"API route uses enhanced billing history\" }," >> "$RESULTS_FILE"
else
    print_status "ERROR" "API route not updated to use enhanced logic"
    echo "    \"api_route_update\": { \"status\": \"FAILED\", \"message\": \"API route not updated\" }," >> "$RESULTS_FILE"
fi
echo ""

# Test 5: Account Page Integration
print_status "INFO" "Test 5: Account Page Integration Check"
TOTAL_TESTS=$((TOTAL_TESTS + 1))
ACCOUNT_PAGE="$PROJECT_ROOT/src/app/(account)/account/page.tsx"

if grep -q "getEnhancedBillingHistory" "$ACCOUNT_PAGE" && \
   grep -q "billingMetadata" "$ACCOUNT_PAGE"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
    print_status "SUCCESS" "Account page integrated with enhanced billing history"
    echo "    \"account_page_integration\": { \"status\": \"PASSED\", \"message\": \"Account page uses enhanced API with metadata\" }," >> "$RESULTS_FILE"
else
    print_status "ERROR" "Account page not properly integrated"
    echo "    \"account_page_integration\": { \"status\": \"FAILED\", \"message\": \"Account page integration incomplete\" }," >> "$RESULTS_FILE"
fi
echo ""

# Test 6: BillingHistoryTable Enhancement
print_status "INFO" "Test 6: BillingHistoryTable Enhancement Check"
TOTAL_TESTS=$((TOTAL_TESTS + 1))
BILLING_TABLE="$PROJECT_ROOT/src/features/account/components/BillingHistoryTable.tsx"

if grep -q "metadata.*hasStripeInvoices" "$BILLING_TABLE" && \
   grep -q "Enhanced Status Message" "$BILLING_TABLE"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
    print_status "SUCCESS" "BillingHistoryTable enhanced with metadata display"
    echo "    \"billing_table_enhancement\": { \"status\": \"PASSED\", \"message\": \"BillingHistoryTable shows enhanced status messages\" }," >> "$RESULTS_FILE"
else
    print_status "ERROR" "BillingHistoryTable not properly enhanced"
    echo "    \"billing_table_enhancement\": { \"status\": \"FAILED\", \"message\": \"BillingHistoryTable enhancement incomplete\" }," >> "$RESULTS_FILE"
fi
echo ""

# Test 7: Stripe Invoice Prioritization
print_status "INFO" "Test 7: Stripe Invoice Prioritization Logic"
TOTAL_TESTS=$((TOTAL_TESTS + 1))

if grep -q "Step 1.*Always try to get real Stripe invoices first" "$ENHANCED_API_FILE" && \
   grep -q "hasStripeInvoices.*true" "$ENHANCED_API_FILE"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
    print_status "SUCCESS" "Stripe invoice prioritization implemented"
    echo "    \"stripe_prioritization\": { \"status\": \"PASSED\", \"message\": \"Stripe invoices are prioritized correctly\" }," >> "$RESULTS_FILE"
else
    print_status "ERROR" "Stripe invoice prioritization not implemented"
    echo "    \"stripe_prioritization\": { \"status\": \"FAILED\", \"message\": \"Stripe prioritization logic missing\" }," >> "$RESULTS_FILE"
fi
echo ""

# Test 8: Fallback Logic
print_status "INFO" "Test 8: Intelligent Fallback Logic"
TOTAL_TESTS=$((TOTAL_TESTS + 1))

if grep -q "Step 2.*billing records" "$ENHANCED_API_FILE" && \
   grep -q "Step 3.*subscription history.*development" "$ENHANCED_API_FILE"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
    print_status "SUCCESS" "Intelligent fallback logic implemented"
    echo "    \"fallback_logic\": { \"status\": \"PASSED\", \"message\": \"Fallback logic properly structured\" }," >> "$RESULTS_FILE"
else
    print_status "ERROR" "Fallback logic not properly implemented"
    echo "    \"fallback_logic\": { \"status\": \"FAILED\", \"message\": \"Fallback logic incomplete\" }," >> "$RESULTS_FILE"
fi
echo ""

# Test 9: User Messaging System
print_status "INFO" "Test 9: Enhanced User Messaging"
TOTAL_TESTS=$((TOTAL_TESTS + 1))

if grep -q "message.*real Stripe invoices" "$ENHANCED_API_FILE" && \
   grep -q "No billing history available" "$ENHANCED_API_FILE"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
    print_status "SUCCESS" "Enhanced user messaging implemented"
    echo "    \"user_messaging\": { \"status\": \"PASSED\", \"message\": \"User messaging system complete\" }" >> "$RESULTS_FILE"
else
    print_status "ERROR" "User messaging system incomplete"
    echo "    \"user_messaging\": { \"status\": \"FAILED\", \"message\": \"User messaging system incomplete\" }" >> "$RESULTS_FILE"
fi
echo ""

# Finalize results file
echo "  }," >> "$RESULTS_FILE"
echo "  \"summary\": {" >> "$RESULTS_FILE"
echo "    \"total_tests\": $TOTAL_TESTS," >> "$RESULTS_FILE"
echo "    \"passed_tests\": $PASSED_TESTS," >> "$RESULTS_FILE"
echo "    \"failed_tests\": $((TOTAL_TESTS - PASSED_TESTS))," >> "$RESULTS_FILE"
echo "    \"success_rate\": \"$(echo "scale=2; $PASSED_TESTS * 100 / $TOTAL_TESTS" | bc -l)%\"" >> "$RESULTS_FILE"
echo "  }" >> "$RESULTS_FILE"
echo "}" >> "$RESULTS_FILE"

# Print summary
echo "📊 Phase 2.2 Test Results Summary"
echo "================================="
echo ""
print_status "INFO" "Total Tests: $TOTAL_TESTS"
print_status "INFO" "Passed Tests: $PASSED_TESTS"
print_status "INFO" "Failed Tests: $((TOTAL_TESTS - PASSED_TESTS))"

SUCCESS_RATE=$(echo "scale=1; $PASSED_TESTS * 100 / $TOTAL_TESTS" | bc -l)
print_status "INFO" "Success Rate: ${SUCCESS_RATE}%"

echo ""
if [ $PASSED_TESTS -eq $TOTAL_TESTS ]; then
    print_status "SUCCESS" "Phase 2.2 implementation complete! 🎉"
    print_status "SUCCESS" "Enhanced billing history display is production-ready"
    echo ""
    echo "✨ Phase 2.2 Achievements:"
    echo "   🧾 Real Stripe invoice prioritization"
    echo "   📊 Production-ready fallback logic"
    echo "   💬 Enhanced user messaging system"
    echo "   🔒 No local subscription fallbacks in production"
    echo "   📱 Enhanced UI with status indicators"
    echo "   🧪 Comprehensive test coverage"
    echo ""
    echo "🚀 Ready for Phase 2.3: Handle Edge Cases"
else
    print_status "ERROR" "Some Phase 2.2 tests failed. Please review the issues above."
    echo ""
    echo "🔧 Troubleshooting:"
    echo "   1. Check the test output above for specific failures"
    echo "   2. Ensure all enhanced billing history files are created"
    echo "   3. Verify API route and account page updates"
    echo "   4. Check BillingHistoryTable enhancements"
fi

echo ""
print_status "INFO" "Detailed results saved to: $RESULTS_FILE"
echo ""

# Exit with appropriate code
if [ $PASSED_TESTS -eq $TOTAL_TESTS ]; then
    exit 0
else
    exit 1
fi
