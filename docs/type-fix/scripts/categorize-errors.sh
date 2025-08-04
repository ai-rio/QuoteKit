#!/bin/bash

# TypeScript Error Categorization Script
# Analyzes and categorizes TypeScript errors for strategic fixing

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}📊 Categorizing TypeScript errors...${NC}"

# Create logs directory
mkdir -p logs

# Run TypeScript compiler and capture errors
echo "🔍 Running TypeScript compiler..."
npx tsc --noEmit 2>&1 | tee logs/raw-errors.log || true

if [ ! -s logs/raw-errors.log ]; then
  echo -e "${GREEN}✅ No TypeScript errors found!${NC}"
  exit 0
fi

# Extract and categorize errors
echo "📋 Analyzing error patterns..."

# Error code frequency
echo -e "\n${YELLOW}🔢 Error Code Frequency:${NC}"
grep -E "error TS[0-9]+" logs/raw-errors.log | \
  sed -E 's/.*error (TS[0-9]+).*/\1/' | \
  sort | uniq -c | sort -nr > logs/error-codes.txt

head -15 logs/error-codes.txt

# File-based error distribution
echo -e "\n${YELLOW}📁 Files with Most Errors:${NC}"
grep -E "\.tsx?:" logs/raw-errors.log | \
  sed -E 's/^([^:]+):.*/\1/' | \
  sort | uniq -c | sort -nr | head -15 > logs/files-with-errors.txt

cat logs/files-with-errors.txt

# Categorize by error type
echo -e "\n${YELLOW}🏷️ Error Categories:${NC}"

# Critical errors (compilation blockers)
CRITICAL_ERRORS=$(grep -c -E "(TS2306|TS2554|TS2451|TS2304)" logs/raw-errors.log || echo "0")
echo "🔴 Critical (Compilation Blockers): $CRITICAL_ERRORS"

# Type safety errors
TYPE_SAFETY_ERRORS=$(grep -c -E "(TS7034|TS7005|TS7006|TS18046|TS18047|TS18048)" logs/raw-errors.log || echo "0")
echo "🟡 Type Safety Issues: $TYPE_SAFETY_ERRORS"

# Property access errors
PROPERTY_ERRORS=$(grep -c -E "(TS2339|TS2322|TS2345)" logs/raw-errors.log || echo "0")
echo "🟠 Property Access Issues: $PROPERTY_ERRORS"

# Function signature errors
FUNCTION_ERRORS=$(grep -c -E "(TS2769|TS2540)" logs/raw-errors.log || echo "0")
echo "🟢 Function Signature Issues: $FUNCTION_ERRORS"

# Calculate total
TOTAL_ERRORS=$(grep -c "error TS" logs/raw-errors.log || echo "0")

# Generate priority matrix
echo -e "\n${BLUE}📈 Priority Matrix:${NC}"
echo "===================="
echo "🔴 Phase 1 (Critical): $CRITICAL_ERRORS errors"
echo "🟡 Phase 2 (High): $TYPE_SAFETY_ERRORS errors"  
echo "🟠 Phase 3 (Medium): $PROPERTY_ERRORS errors"
echo "🟢 Phase 4 (Low): $FUNCTION_ERRORS errors"
echo "📊 Total: $TOTAL_ERRORS errors"

# Identify specific problem areas
echo -e "\n${YELLOW}🎯 Specific Problem Areas:${NC}"

# Supabase type issues
SUPABASE_ERRORS=$(grep -c "libs/supabase/types" logs/raw-errors.log || echo "0")
if [ "$SUPABASE_ERRORS" -gt 0 ]; then
  echo "🗄️ Supabase Types Missing: $SUPABASE_ERRORS files affected"
fi

# Stripe integration issues
STRIPE_ERRORS=$(grep -c -E "(stripe|Stripe)" logs/raw-errors.log || echo "0")
if [ "$STRIPE_ERRORS" -gt 0 ]; then
  echo "💳 Stripe Integration: $STRIPE_ERRORS errors"
fi

# React/JSX issues
REACT_ERRORS=$(grep -c -E "(JSX|React|tsx)" logs/raw-errors.log || echo "0")
if [ "$REACT_ERRORS" -gt 0 ]; then
  echo "⚛️ React/JSX Issues: $REACT_ERRORS errors"
fi

# Generate actionable recommendations
echo -e "\n${BLUE}💡 Recommended Actions:${NC}"
echo "========================"

if [ "$SUPABASE_ERRORS" -gt 0 ]; then
  echo "1. 🗄️ Generate Supabase types: npm run generate-types"
fi

if [ "$STRIPE_ERRORS" -gt 10 ]; then
  echo "2. 💳 Focus on Stripe type definitions and error handling"
fi

if [ "$CRITICAL_ERRORS" -gt 20 ]; then
  echo "3. 🔴 Address critical compilation blockers first"
fi

if [ "$TYPE_SAFETY_ERRORS" -gt 15 ]; then
  echo "4. 🟡 Implement proper type guards and explicit typing"
fi

# Save categorized report
cat > logs/error-analysis.md << EOF
# TypeScript Error Analysis Report

Generated: $(date)

## Summary
- **Total Errors**: $TOTAL_ERRORS
- **Critical Errors**: $CRITICAL_ERRORS
- **Type Safety Issues**: $TYPE_SAFETY_ERRORS
- **Property Access Issues**: $PROPERTY_ERRORS
- **Function Signature Issues**: $FUNCTION_ERRORS

## Problem Areas
- **Supabase Types**: $SUPABASE_ERRORS files affected
- **Stripe Integration**: $STRIPE_ERRORS errors
- **React/JSX**: $REACT_ERRORS errors

## Priority Order
1. 🔴 Critical compilation blockers ($CRITICAL_ERRORS)
2. 🟡 Type safety improvements ($TYPE_SAFETY_ERRORS)
3. 🟠 Property access fixes ($PROPERTY_ERRORS)
4. 🟢 Function signature cleanup ($FUNCTION_ERRORS)

## Next Steps
$(if [ "$SUPABASE_ERRORS" -gt 0 ]; then echo "- [ ] Generate Supabase types"; fi)
$(if [ "$STRIPE_ERRORS" -gt 10 ]; then echo "- [ ] Fix Stripe integration types"; fi)
$(if [ "$CRITICAL_ERRORS" -gt 0 ]; then echo "- [ ] Address critical compilation errors"; fi)
$(if [ "$TYPE_SAFETY_ERRORS" -gt 0 ]; then echo "- [ ] Implement type guards and explicit typing"; fi)
EOF

echo -e "\n${GREEN}📁 Analysis complete! Reports saved to:${NC}"
echo "  - logs/error-codes.txt"
echo "  - logs/files-with-errors.txt"
echo "  - logs/error-analysis.md"
echo "  - logs/raw-errors.log"

echo -e "\n${BLUE}🚀 Ready to start fixing! Use the priority matrix above.${NC}"
