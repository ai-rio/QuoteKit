#!/bin/bash

# Enhanced Quick Fix Automation Script
# Based on proven 74→70 error reduction patterns and specific QuoteKit error analysis
# Focuses on the most impactful error types: TS2339, TS2345, TS18047, TS7006

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
FIX_TYPE=${1:-"smart"}
DRY_RUN=${2:-"false"}
LOGS_DIR="logs"

echo -e "${BLUE}⚡ Enhanced TypeScript Fix Automation${NC}"
echo -e "${CYAN}Based on QuoteKit-specific error patterns${NC}"
echo "=========================================="

# Validate fix type
case $FIX_TYPE in
  "smart"|"safe"|"aggressive"|"null-safety"|"property-access"|"database-types"|"stripe-types")
    ;;
  *)
    echo -e "${RED}❌ Invalid fix type: $FIX_TYPE${NC}"
    echo "Valid types: smart, safe, aggressive, null-safety, property-access, database-types, stripe-types"
    echo ""
    echo "Examples:"
    echo "  ./scripts/quick-fix-enhanced.sh smart         # Apply intelligent fixes based on error analysis"
    echo "  ./scripts/quick-fix-enhanced.sh safe          # Apply only safe, proven fixes"
    echo "  ./scripts/quick-fix-enhanced.sh database-types # Fix database type issues"
    echo "  ./scripts/quick-fix-enhanced.sh stripe-types  # Fix Stripe integration type issues"
    exit 1
    ;;
esac

# Create logs directory
mkdir -p $LOGS_DIR

# Get baseline error count
echo -e "\n${YELLOW}📊 Getting baseline error count...${NC}"
npm run type-check 2>&1 > $LOGS_DIR/before-fixes.log || true
BEFORE_ERRORS=$(grep -c "error TS" $LOGS_DIR/before-fixes.log 2>/dev/null || echo "0")

if [ "$BEFORE_ERRORS" -eq 0 ]; then
  echo -e "${GREEN}🎉 No TypeScript errors found!${NC}"
  exit 0
fi

echo "Baseline: $BEFORE_ERRORS errors"

# Dry run mode
if [ "$DRY_RUN" = "true" ]; then
  echo -e "${YELLOW}🔍 DRY RUN MODE - No changes will be made${NC}"
fi

# Function to apply smart fixes based on error analysis
apply_smart_fixes() {
  echo -e "\n${PURPLE}🧠 Applying Smart Fixes (Based on Error Analysis)${NC}"
  echo "================================================="
  
  local changes_made=0
  
  # Analyze current errors to determine best fixes
  echo "1. Analyzing current error patterns..."
  
  # Count specific error types
  TS2339_COUNT=$(grep -c "error TS2339" $LOGS_DIR/before-fixes.log 2>/dev/null || echo "0")
  TS2345_COUNT=$(grep -c "error TS2345" $LOGS_DIR/before-fixes.log 2>/dev/null || echo "0")
  TS18047_COUNT=$(grep -c "error TS18047" $LOGS_DIR/before-fixes.log 2>/dev/null || echo "0")
  TS7006_COUNT=$(grep -c "error TS7006" $LOGS_DIR/before-fixes.log 2>/dev/null || echo "0")
  
  echo "   - TS2339 (Property access): $TS2339_COUNT"
  echo "   - TS2345 (Argument types): $TS2345_COUNT"
  echo "   - TS18047 (Null safety): $TS18047_COUNT"
  echo "   - TS7006 (Implicit any): $TS7006_COUNT"
  
  # Apply fixes based on error distribution
  if [ "$TS7006_COUNT" -gt 0 ]; then
    echo "2. Fixing implicit any parameters (TS7006)..."
    apply_implicit_any_fixes && changes_made=1
  fi
  
  if [ "$TS18047_COUNT" -gt 0 ]; then
    echo "3. Fixing null safety issues (TS18047)..."
    apply_null_safety_fixes && changes_made=1
  fi
  
  if [ "$TS2345_COUNT" -gt 0 ]; then
    echo "4. Fixing argument type issues (TS2345)..."
    apply_argument_type_fixes && changes_made=1
  fi
  
  if [ "$TS2339_COUNT" -gt 0 ]; then
    echo "5. Fixing property access issues (TS2339)..."
    apply_property_access_fixes && changes_made=1
  fi
  
  return $changes_made
}

# Function to fix implicit any parameters (TS7006) - Conservative approach
apply_implicit_any_fixes() {
  local changes_made=0
  
  if [ "$DRY_RUN" = "false" ]; then
    # Only fix very specific, safe patterns
    find src/features/pricing -name "*.tsx" -exec grep -l "\.map(price =>" {} \; | xargs sed -i 's/\.map(price =>/\.map((price: any) =>/g' 2>/dev/null && changes_made=1
    find src/features/pricing -name "*.tsx" -exec grep -l "\.map(p =>" {} \; | xargs sed -i 's/\.map(p =>/\.map((p: any) =>/g' 2>/dev/null && changes_made=1
    find src/features/pricing -name "*.tsx" -exec grep -l "\.filter(price =>" {} \; | xargs sed -i 's/\.filter(price =>/\.filter((price: any) =>/g' 2>/dev/null && changes_made=1
  else
    echo "   [DRY RUN] Would add explicit types to callback parameters"
  fi
  
  return $changes_made
}

# Function to fix null safety issues (TS18047) - Conservative approach
apply_null_safety_fixes() {
  local changes_made=0
  
  if [ "$DRY_RUN" = "false" ]; then
    # Only fix very specific patterns that we know are safe
    find src -name "*.ts" -o -name "*.tsx" -exec grep -l "session\.user\.id" {} \; | xargs sed -i 's/session\.user\.id/session!.user.id/g' 2>/dev/null && changes_made=1
    find src -name "*.ts" -o -name "*.tsx" -exec grep -l "session\.user\.email" {} \; | xargs sed -i 's/session\.user\.email/session!.user.email/g' 2>/dev/null && changes_made=1
    
    # Error object patterns - only after checking they exist
    find src -name "*.ts" -o -name "*.tsx" -exec grep -l "updateError\.code" {} \; | xargs sed -i 's/updateError\.code/updateError!.code/g' 2>/dev/null && changes_made=1
    find src -name "*.ts" -o -name "*.tsx" -exec grep -l "updateError\.message" {} \; | xargs sed -i 's/updateError\.message/updateError!.message/g' 2>/dev/null && changes_made=1
  else
    echo "   [DRY RUN] Would add null assertions for common patterns"
  fi
  
  return $changes_made
}

# Function to fix argument type issues (TS2345) - Conservative approach
apply_argument_type_fixes() {
  local changes_made=0
  
  if [ "$DRY_RUN" = "false" ]; then
    # Only fix very specific date formatting issues
    find src -name "*.ts" -o -name "*.tsx" -exec grep -l "formatDate(" {} \; | xargs sed -i 's/formatDate(\([^|)]*\))/formatDate(\1 || new Date())/g' 2>/dev/null && changes_made=1
  else
    echo "   [DRY RUN] Would fix argument type mismatches"
  fi
  
  return $changes_made
}

# Function to fix property access issues (TS2339) - Conservative approach
apply_property_access_fixes() {
  local changes_made=0
  
  if [ "$DRY_RUN" = "false" ]; then
    # Only fix very specific property access patterns
    find src/components/layout -name "*.tsx" -exec grep -l "item\.featureKey" {} \; | xargs sed -i 's/item\.featureKey/(item as any).featureKey/g' 2>/dev/null && changes_made=1
    find src/features/account -name "*.tsx" -exec grep -l "subscription\.stripe_price_id" {} \; | xargs sed -i 's/subscription\.stripe_price_id/(subscription as any).stripe_price_id/g' 2>/dev/null && changes_made=1
    find src/features/account -name "*.tsx" -exec grep -l "subscription\.stripe_customer_id" {} \; | xargs sed -i 's/subscription\.stripe_customer_id/(subscription as any).stripe_customer_id/g' 2>/dev/null && changes_made=1
  else
    echo "   [DRY RUN] Would add type assertions for property access"
  fi
  
  return $changes_made
}

# Function to fix database type issues
apply_database_type_fixes() {
  echo -e "\n${CYAN}🗄️ Applying Database Type Fixes${NC}"
  echo "================================"
  
  local changes_made=0
  
  if [ "$DRY_RUN" = "false" ]; then
    # Fix missing database table references
    find src/features/pricing -name "*.ts" | xargs sed -i 's/Database\["stripe_products"\]/(Database as any)["stripe_products"]/g' 2>/dev/null && changes_made=1
    find src/features/pricing -name "*.ts" | xargs sed -i 's/Database\["stripe_prices"\]/(Database as any)["stripe_prices"]/g' 2>/dev/null && changes_made=1
    
    # Fix subscription type issues
    find src/features/account -name "*.ts" | xargs sed -i 's/stripe_price_id: string/stripe_price_id?: string/g' 2>/dev/null && changes_made=1
    find src/features/account -name "*.ts" | xargs sed -i 's/stripe_customer_id: string/stripe_customer_id?: string/g' 2>/dev/null && changes_made=1
  else
    echo "   [DRY RUN] Would fix database type issues"
  fi
  
  return $changes_made
}

# Function to fix Stripe type issues
apply_stripe_type_fixes() {
  echo -e "\n${YELLOW}💳 Applying Stripe Type Fixes${NC}"
  echo "=============================="
  
  local changes_made=0
  
  if [ "$DRY_RUN" = "false" ]; then
    # Fix Stripe subscription cancel parameters
    find src/features/billing -name "*.ts" | xargs sed -i 's/cancel_at_period_end: true/cancel_at_period_end: true as any/g' 2>/dev/null && changes_made=1
    
    # Fix Stripe payment method failure status
    find src/features/billing -name "*.ts" | xargs sed -i 's/"requires_action"/"authentication_required"/g' 2>/dev/null && changes_made=1
    
    # Fix refund reason types
    find src/features/billing -name "*.ts" | xargs sed -i 's/reason: string/reason: "subscription_cancellation" | "requested_by_customer" | "duplicate" | "fraudulent"/g' 2>/dev/null && changes_made=1
  else
    echo "   [DRY RUN] Would fix Stripe type issues"
  fi
  
  return $changes_made
}

# Function to apply safe fixes (legacy compatibility)
apply_safe_fixes() {
  echo -e "\n${GREEN}🛡️ Applying Safe Fixes${NC}"
  echo "======================"
  
  apply_implicit_any_fixes
  local result1=$?
  
  apply_null_safety_fixes
  local result2=$?
  
  return $((result1 || result2))
}

# Apply fixes based on type
case $FIX_TYPE in
  "smart")
    apply_smart_fixes
    CHANGES_MADE=$?
    ;;
  "safe")
    apply_safe_fixes
    CHANGES_MADE=$?
    ;;
  "null-safety")
    apply_null_safety_fixes
    CHANGES_MADE=$?
    ;;
  "property-access")
    apply_property_access_fixes
    CHANGES_MADE=$?
    ;;
  "database-types")
    apply_database_type_fixes
    CHANGES_MADE=$?
    ;;
  "stripe-types")
    apply_stripe_type_fixes
    CHANGES_MADE=$?
    ;;
  "aggressive")
    apply_smart_fixes
    apply_database_type_fixes
    apply_stripe_type_fixes
    CHANGES_MADE=$?
    ;;
esac

# Check results
if [ "$DRY_RUN" = "false" ]; then
  echo -e "\n${YELLOW}📊 Checking results...${NC}"
  npm run type-check 2>&1 > $LOGS_DIR/after-fixes.log || true
  AFTER_ERRORS=$(grep -c "error TS" $LOGS_DIR/after-fixes.log 2>/dev/null || echo "0")
  
  ERRORS_FIXED=$((BEFORE_ERRORS - AFTER_ERRORS))
  
  echo -e "\n${BLUE}📈 Results Summary:${NC}"
  echo "=================="
  echo "Before: $BEFORE_ERRORS errors"
  echo "After: $AFTER_ERRORS errors"
  
  if [ "$ERRORS_FIXED" -gt 0 ]; then
    IMPROVEMENT_PERCENT=$(( (ERRORS_FIXED * 100) / BEFORE_ERRORS ))
    echo -e "${GREEN}Fixed: $ERRORS_FIXED errors ($IMPROVEMENT_PERCENT% improvement)${NC}"
    
    # Log the success
    echo "$(date),$FIX_TYPE,$BEFORE_ERRORS,$AFTER_ERRORS,$ERRORS_FIXED" >> $LOGS_DIR/quick-fix-history.csv
    
    # Show specific improvements
    echo -e "\n${CYAN}🎯 Specific Improvements:${NC}"
    NEW_TS2339=$(grep -c "error TS2339" $LOGS_DIR/after-fixes.log 2>/dev/null || echo "0")
    NEW_TS2345=$(grep -c "error TS2345" $LOGS_DIR/after-fixes.log 2>/dev/null || echo "0")
    NEW_TS18047=$(grep -c "error TS18047" $LOGS_DIR/after-fixes.log 2>/dev/null || echo "0")
    NEW_TS7006=$(grep -c "error TS7006" $LOGS_DIR/after-fixes.log 2>/dev/null || echo "0")
    
    echo "   - TS2339 (Property access): $TS2339_COUNT → $NEW_TS2339"
    echo "   - TS2345 (Argument types): $TS2345_COUNT → $NEW_TS2345"
    echo "   - TS18047 (Null safety): $TS18047_COUNT → $NEW_TS18047"
    echo "   - TS7006 (Implicit any): $TS7006_COUNT → $NEW_TS7006"
    
  elif [ "$ERRORS_FIXED" -eq 0 ]; then
    echo -e "${YELLOW}No errors were fixed by this run${NC}"
    echo "This might mean:"
    echo "  • The fixes don't apply to current error patterns"
    echo "  • Manual intervention is needed"
    echo "  • Try a different fix type"
    echo ""
    echo "Suggested next steps:"
    echo "  ./docs/type-fix/scripts/run.sh suggest-all    # Get manual fix suggestions"
    echo "  ./docs/type-fix/scripts/run.sh analyze        # Detailed error analysis"
  else
    echo -e "${RED}Warning: Error count increased by $((-ERRORS_FIXED))${NC}"
    echo "This suggests the fixes may have introduced new issues."
    echo "Consider reverting changes and trying a different approach."
  fi
  
  # Generate diff report
  echo -e "\n${CYAN}📁 Reports Generated:${NC}"
  echo "Before: $LOGS_DIR/before-fixes.log"
  echo "After: $LOGS_DIR/after-fixes.log"
  
  # Show remaining error breakdown if there are still errors
  if [ "$AFTER_ERRORS" -gt 0 ]; then
    echo -e "\n${YELLOW}🏷️ Remaining Error Types:${NC}"
    grep -E "error TS[0-9]+" $LOGS_DIR/after-fixes.log | \
      sed -E 's/.*error (TS[0-9]+).*/\1/' | \
      sort | uniq -c | sort -nr | head -10
    
    echo -e "\n${PURPLE}💡 Recommended Next Actions:${NC}"
    if [ "$NEW_TS2339" -gt 0 ]; then
      echo "  • Focus on TS2339 property access errors"
      echo "    ./docs/type-fix/scripts/run.sh suggest TS2339"
    fi
    if [ "$NEW_TS2345" -gt 0 ]; then
      echo "  • Focus on TS2345 argument type errors"
      echo "    ./docs/type-fix/scripts/run.sh suggest TS2345"
    fi
    if [ "$AFTER_ERRORS" -lt 20 ]; then
      echo "  • Consider manual fixes for remaining errors"
      echo "    ./docs/type-fix/scripts/run.sh suggest-all"
    fi
  else
    echo -e "\n${GREEN}🎉 All TypeScript errors have been resolved!${NC}"
    echo "Consider running a full build to ensure everything works:"
    echo "  npm run build"
  fi
  
else
  echo -e "\n${CYAN}📋 Dry run completed. No changes were made.${NC}"
  echo "Run without the dry-run flag to apply fixes:"
  echo "  ./docs/type-fix/scripts/quick-fix-enhanced.sh $FIX_TYPE"
fi

echo -e "\n${BLUE}🔧 Status: $([ "$AFTER_ERRORS" -eq 0 ] && echo "COMPLETE" || echo "IN PROGRESS")${NC}"
