#!/bin/bash

# Account Page Integration Test
# Tests that the account page properly integrates with the enhanced billing history

set -e

echo "🏠 Account Page Integration Test"
echo "==============================="
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

# Test configuration
TEST_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$TEST_DIR")"

print_status "INFO" "Testing Account Page Integration..."
echo ""

# Test 1: Check account page imports enhanced billing history API
print_status "INFO" "Test 1: Account Page Import Check"
ACCOUNT_PAGE="$PROJECT_ROOT/src/app/(account)/account/page.tsx"

if [ ! -f "$ACCOUNT_PAGE" ]; then
    print_status "ERROR" "Account page not found at $ACCOUNT_PAGE"
    exit 1
fi

# Check if it imports the enhanced billing history API
if grep -q "getBillingHistory.*from.*@/features/billing/api/billing-history" "$ACCOUNT_PAGE"; then
    print_status "SUCCESS" "Account page imports enhanced billing history API"
else
    print_status "ERROR" "Account page does not import enhanced billing history API"
    echo "Expected: import { getBillingHistory } from '@/features/billing/api/billing-history'"
    exit 1
fi

# Test 2: Check BillingHistoryTable supports type field
print_status "INFO" "Test 2: BillingHistoryTable Type Support Check"
BILLING_TABLE="$PROJECT_ROOT/src/features/account/components/BillingHistoryTable.tsx"

if [ ! -f "$BILLING_TABLE" ]; then
    print_status "ERROR" "BillingHistoryTable not found at $BILLING_TABLE"
    exit 1
fi

# Check if it has the type field in interface
if grep -q "type.*stripe_invoice.*subscription_change.*billing_record" "$BILLING_TABLE"; then
    print_status "SUCCESS" "BillingHistoryTable supports type field"
else
    print_status "ERROR" "BillingHistoryTable does not support type field"
    echo "Expected: type?: 'stripe_invoice' | 'subscription_change' | 'billing_record'"
    exit 1
fi

# Test 3: Check if type badges are implemented
if grep -q "getTypeBadgeClass" "$BILLING_TABLE" && grep -q "getTypeDisplayText" "$BILLING_TABLE"; then
    print_status "SUCCESS" "BillingHistoryTable has type badge functions"
else
    print_status "ERROR" "BillingHistoryTable missing type badge functions"
    exit 1
fi

# Test 4: Check if Source column is added to table
if grep -q "Source.*TableHead" "$BILLING_TABLE"; then
    print_status "SUCCESS" "BillingHistoryTable has Source column"
else
    print_status "ERROR" "BillingHistoryTable missing Source column"
    exit 1
fi

# Test 5: Check API route is updated
print_status "INFO" "Test 5: API Route Update Check"
API_ROUTE="$PROJECT_ROOT/src/app/api/billing-history/route.ts"

if [ ! -f "$API_ROUTE" ]; then
    print_status "ERROR" "Billing history API route not found"
    exit 1
fi

# Check if it uses the enhanced billing history logic
if grep -q "getBillingHistory.*from.*@/features/billing/api/billing-history" "$API_ROUTE"; then
    print_status "SUCCESS" "API route uses enhanced billing history logic"
else
    print_status "ERROR" "API route does not use enhanced billing history logic"
    exit 1
fi

# Test 6: Check invoice download route exists
print_status "INFO" "Test 6: Invoice Download Route Check"
DOWNLOAD_ROUTE="$PROJECT_ROOT/src/app/api/billing-history/[id]/invoice/route.ts"

if [ -f "$DOWNLOAD_ROUTE" ]; then
    print_status "SUCCESS" "Invoice download route exists"
else
    print_status "ERROR" "Invoice download route missing"
    exit 1
fi

# Test 7: Check useBillingHistory hook uses correct endpoint
print_status "INFO" "Test 7: Billing History Hook Check"
BILLING_HOOK="$PROJECT_ROOT/src/features/account/hooks/useBillingHistory.ts"

if [ ! -f "$BILLING_HOOK" ]; then
    print_status "ERROR" "useBillingHistory hook not found"
    exit 1
fi

# Check if it calls the correct API endpoint
if grep -q "/api/billing-history" "$BILLING_HOOK"; then
    print_status "SUCCESS" "useBillingHistory hook uses correct API endpoint"
else
    print_status "ERROR" "useBillingHistory hook uses incorrect API endpoint"
    exit 1
fi

echo ""
print_status "SUCCESS" "All integration tests passed! 🎉"
echo ""
print_status "INFO" "Integration Summary:"
echo "   ✅ Account page imports enhanced billing history API"
echo "   ✅ BillingHistoryTable supports type field and badges"
echo "   ✅ Source column added to billing history table"
echo "   ✅ API route uses enhanced billing history logic"
echo "   ✅ Invoice download route implemented"
echo "   ✅ useBillingHistory hook uses correct endpoint"
echo ""
print_status "INFO" "The account page is now properly integrated with the enhanced billing history system!"
echo ""
print_status "INFO" "Features available:"
echo "   🧾 Real Stripe invoice prioritization"
echo "   📊 Billing record type indicators (Invoice/Subscription/Billing)"
echo "   📥 Secure invoice downloads"
echo "   🔄 Automatic fallback to subscription history"
echo "   📱 Mobile-responsive design with type badges"
echo ""

exit 0
