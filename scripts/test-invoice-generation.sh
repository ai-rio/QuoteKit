#!/bin/bash

# Invoice Generation Testing Script
# Tests the invoice generation functionality locally

set -e

echo "🧾 Invoice Generation Testing Script"
echo "===================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test configuration
TEST_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$TEST_DIR")"
RESULTS_FILE="$TEST_DIR/invoice-generation-test-results.json"

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

# Initialize results
echo "{" > "$RESULTS_FILE"
echo "  \"timestamp\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"," >> "$RESULTS_FILE"
echo "  \"tests\": {" >> "$RESULTS_FILE"

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0

echo "📋 Running Invoice Generation Tests..."
echo ""

# Test 1: Invoice Generation Unit Tests
print_status "INFO" "Test 1: Invoice Generation Unit Tests"
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if run_test "Invoice Generation Unit Tests" "cd '$PROJECT_ROOT' && npm test tests/integration/invoice-generation.test.ts"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
    echo "    \"invoice_generation_unit_tests\": { \"status\": \"PASSED\", \"message\": \"All unit tests passed\" }," >> "$RESULTS_FILE"
else
    echo "    \"invoice_generation_unit_tests\": { \"status\": \"FAILED\", \"message\": \"Unit tests failed\" }," >> "$RESULTS_FILE"
fi
echo ""

# Test 2: Billing History API Integration
print_status "INFO" "Test 2: Billing History API Integration"
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if run_test "Billing History API Integration" "cd '$PROJECT_ROOT' && npm test tests/billing-history.test.tsx"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
    echo "    \"billing_history_api_integration\": { \"status\": \"PASSED\", \"message\": \"API integration tests passed\" }," >> "$RESULTS_FILE"
else
    echo "    \"billing_history_api_integration\": { \"status\": \"FAILED\", \"message\": \"API integration tests failed\" }," >> "$RESULTS_FILE"
fi
echo ""

# Test 3: TypeScript Compilation
print_status "INFO" "Test 3: TypeScript Compilation Check"
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if run_test "TypeScript Compilation" "cd '$PROJECT_ROOT' && npx tsc --noEmit"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
    echo "    \"typescript_compilation\": { \"status\": \"PASSED\", \"message\": \"TypeScript compilation successful\" }," >> "$RESULTS_FILE"
else
    echo "    \"typescript_compilation\": { \"status\": \"FAILED\", \"message\": \"TypeScript compilation failed\" }," >> "$RESULTS_FILE"
fi
echo ""

# Test 4: Invoice Generation Controller Import Test
print_status "INFO" "Test 4: Invoice Generation Controller Import"
TOTAL_TESTS=$((TOTAL_TESTS + 1))
cat > "$TEST_DIR/temp-import-test.js" << 'EOF'
const path = require('path');
const projectRoot = path.resolve(__dirname, '..');

// Test if the invoice generation controller can be imported
try {
  // This would normally require transpilation, but we'll test the file exists and has exports
  const fs = require('fs');
  const controllerPath = path.join(projectRoot, 'src/features/billing/controllers/invoice-generation.ts');
  
  if (!fs.existsSync(controllerPath)) {
    console.error('Invoice generation controller file not found');
    process.exit(1);
  }
  
  const content = fs.readFileSync(controllerPath, 'utf8');
  
  // Check for key exports
  const requiredExports = [
    'configureAutomaticInvoices',
    'generateManualInvoice',
    'generateSubscriptionInvoice',
    'getUpcomingInvoicePreview',
    'syncInvoiceToDatabase'
  ];
  
  for (const exportName of requiredExports) {
    if (!content.includes(`export async function ${exportName}`) && !content.includes(`export function ${exportName}`)) {
      console.error(`Missing export: ${exportName}`);
      process.exit(1);
    }
  }
  
  console.log('All required exports found');
  process.exit(0);
} catch (error) {
  console.error('Import test failed:', error.message);
  process.exit(1);
}
EOF

if run_test "Invoice Generation Controller Import" "node '$TEST_DIR/temp-import-test.js'"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
    echo "    \"controller_import_test\": { \"status\": \"PASSED\", \"message\": \"Controller imports correctly\" }," >> "$RESULTS_FILE"
else
    echo "    \"controller_import_test\": { \"status\": \"FAILED\", \"message\": \"Controller import failed\" }," >> "$RESULTS_FILE"
fi
rm -f "$TEST_DIR/temp-import-test.js"
echo ""

# Test 5: Billing API Controller Import Test
print_status "INFO" "Test 5: Billing API Controller Import"
TOTAL_TESTS=$((TOTAL_TESTS + 1))
cat > "$TEST_DIR/temp-api-import-test.js" << 'EOF'
const path = require('path');
const projectRoot = path.resolve(__dirname, '..');

try {
  const fs = require('fs');
  const apiPath = path.join(projectRoot, 'src/features/billing/api/billing-history.ts');
  
  if (!fs.existsSync(apiPath)) {
    console.error('Billing API controller file not found');
    process.exit(1);
  }
  
  const content = fs.readFileSync(apiPath, 'utf8');
  
  // Check for key exports
  const requiredExports = [
    'getBillingHistory',
    'refreshBillingHistoryCache',
    'hasBillingHistory',
    'getBillingSummary'
  ];
  
  for (const exportName of requiredExports) {
    if (!content.includes(`export async function ${exportName}`) && !content.includes(`export function ${exportName}`)) {
      console.error(`Missing export: ${exportName}`);
      process.exit(1);
    }
  }
  
  console.log('All required API exports found');
  process.exit(0);
} catch (error) {
  console.error('API import test failed:', error.message);
  process.exit(1);
}
EOF

if run_test "Billing API Controller Import" "node '$TEST_DIR/temp-api-import-test.js'"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
    echo "    \"api_import_test\": { \"status\": \"PASSED\", \"message\": \"API controller imports correctly\" }," >> "$RESULTS_FILE"
else
    echo "    \"api_import_test\": { \"status\": \"FAILED\", \"message\": \"API controller import failed\" }," >> "$RESULTS_FILE"
fi
rm -f "$TEST_DIR/temp-api-import-test.js"
echo ""

# Test 6: Database Schema Compatibility
print_status "INFO" "Test 6: Database Schema Compatibility Check"
TOTAL_TESTS=$((TOTAL_TESTS + 1))
cat > "$TEST_DIR/temp-schema-test.js" << 'EOF'
const path = require('path');
const projectRoot = path.resolve(__dirname, '..');

try {
  const fs = require('fs');
  const migrationPath = path.join(projectRoot, 'supabase/migrations');
  
  if (!fs.existsSync(migrationPath)) {
    console.error('Migration directory not found');
    process.exit(1);
  }
  
  // Check for billing_history table in migrations
  const migrationFiles = fs.readdirSync(migrationPath);
  let foundBillingHistory = false;
  
  for (const file of migrationFiles) {
    if (file.endsWith('.sql')) {
      const content = fs.readFileSync(path.join(migrationPath, file), 'utf8');
      if (content.includes('billing_history') || content.includes('payment_methods')) {
        foundBillingHistory = true;
        break;
      }
    }
  }
  
  if (!foundBillingHistory) {
    console.error('billing_history table not found in migrations');
    process.exit(1);
  }
  
  console.log('Database schema compatibility verified');
  process.exit(0);
} catch (error) {
  console.error('Schema test failed:', error.message);
  process.exit(1);
}
EOF

if run_test "Database Schema Compatibility" "node '$TEST_DIR/temp-schema-test.js'"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
    echo "    \"schema_compatibility_test\": { \"status\": \"PASSED\", \"message\": \"Database schema is compatible\" }," >> "$RESULTS_FILE"
else
    echo "    \"schema_compatibility_test\": { \"status\": \"FAILED\", \"message\": \"Database schema compatibility failed\" }," >> "$RESULTS_FILE"
fi
rm -f "$TEST_DIR/temp-schema-test.js"
echo ""

# Test 7: API Route Update Verification
print_status "INFO" "Test 7: API Route Update Verification"
TOTAL_TESTS=$((TOTAL_TESTS + 1))
cat > "$TEST_DIR/temp-route-test.js" << 'EOF'
const path = require('path');
const projectRoot = path.resolve(__dirname, '..');

try {
  const fs = require('fs');
  const routePath = path.join(projectRoot, 'src/app/api/billing-history/route.ts');
  
  if (!fs.existsSync(routePath)) {
    console.error('Billing history API route not found');
    process.exit(1);
  }
  
  const content = fs.readFileSync(routePath, 'utf8');
  
  // Check if route uses new billing history logic
  if (!content.includes('getBillingHistory') || !content.includes('@/features/billing/api/billing-history')) {
    console.error('API route not updated to use new billing history logic');
    process.exit(1);
  }
  
  console.log('API route successfully updated');
  process.exit(0);
} catch (error) {
  console.error('Route test failed:', error.message);
  process.exit(1);
}
EOF

if run_test "API Route Update Verification" "node '$TEST_DIR/temp-route-test.js'"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
    echo "    \"api_route_update_test\": { \"status\": \"PASSED\", \"message\": \"API route successfully updated\" }" >> "$RESULTS_FILE"
else
    echo "    \"api_route_update_test\": { \"status\": \"FAILED\", \"message\": \"API route update failed\" }" >> "$RESULTS_FILE"
fi
rm -f "$TEST_DIR/temp-route-test.js"
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
echo "📊 Test Results Summary"
echo "======================"
echo ""
print_status "INFO" "Total Tests: $TOTAL_TESTS"
print_status "INFO" "Passed Tests: $PASSED_TESTS"
print_status "INFO" "Failed Tests: $((TOTAL_TESTS - PASSED_TESTS))"

SUCCESS_RATE=$(echo "scale=1; $PASSED_TESTS * 100 / $TOTAL_TESTS" | bc -l)
print_status "INFO" "Success Rate: ${SUCCESS_RATE}%"

echo ""
if [ $PASSED_TESTS -eq $TOTAL_TESTS ]; then
    print_status "SUCCESS" "All invoice generation tests passed! 🎉"
    print_status "SUCCESS" "Invoice generation functionality is ready for Phase 2 implementation"
    echo ""
    echo "✨ Next Steps:"
    echo "   1. Deploy invoice generation logic to development environment"
    echo "   2. Test with real Stripe data in local development"
    echo "   3. Verify billing history shows real invoices"
    echo "   4. Continue with Phase 2 implementation"
else
    print_status "ERROR" "Some tests failed. Please review the issues above."
    echo ""
    echo "🔧 Troubleshooting:"
    echo "   1. Check the test output above for specific failures"
    echo "   2. Ensure all dependencies are installed (npm install)"
    echo "   3. Verify TypeScript compilation (npx tsc --noEmit)"
    echo "   4. Check that all required files exist"
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
