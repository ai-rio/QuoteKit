#!/bin/bash

# Enhanced TypeScript Error Analysis Script
# Based on proven methodology: 92→74 error reduction
# Provides actionable insights and automated fix suggestions

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
LOGS_DIR="logs"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo -e "${BLUE}🔍 Enhanced TypeScript Error Analysis${NC}"
echo -e "${CYAN}Based on proven 92→74 error reduction methodology${NC}"
echo "=================================================="

# Create logs directory
mkdir -p $LOGS_DIR

# Run TypeScript compiler and capture errors
echo -e "\n${YELLOW}📊 Running TypeScript analysis...${NC}"
npm run type-check 2>&1 | tee $LOGS_DIR/typescript-errors-${TIMESTAMP}.log || true

# Check if we have errors
if ! grep -q "error TS" $LOGS_DIR/typescript-errors-${TIMESTAMP}.log; then
  echo -e "${GREEN}🎉 No TypeScript errors found! Congratulations!${NC}"
  exit 0
fi

# Count total errors
TOTAL_ERRORS=$(grep -c "error TS" $LOGS_DIR/typescript-errors-${TIMESTAMP}.log)
echo -e "${BLUE}📈 Total TypeScript errors: ${TOTAL_ERRORS}${NC}"

# Error breakdown by type (our proven classification)
echo -e "\n${YELLOW}🏷️ Error Classification (Proven Priority Order):${NC}"

# High Impact Errors (Fix First)
TS2339_COUNT=$(grep -c "TS2339" $LOGS_DIR/typescript-errors-${TIMESTAMP}.log || echo "0")
TS2345_COUNT=$(grep -c "TS2345" $LOGS_DIR/typescript-errors-${TIMESTAMP}.log || echo "0")
TS2344_COUNT=$(grep -c "TS2344" $LOGS_DIR/typescript-errors-${TIMESTAMP}.log || echo "0")

# Medium Impact Errors
TS18047_COUNT=$(grep -c "TS18047" $LOGS_DIR/typescript-errors-${TIMESTAMP}.log || echo "0")
TS7006_COUNT=$(grep -c "TS7006" $LOGS_DIR/typescript-errors-${TIMESTAMP}.log || echo "0")
TS2322_COUNT=$(grep -c "TS2322" $LOGS_DIR/typescript-errors-${TIMESTAMP}.log || echo "0")
TS18046_COUNT=$(grep -c "TS18046" $LOGS_DIR/typescript-errors-${TIMESTAMP}.log || echo "0")

# Low Impact Errors
TS18048_COUNT=$(grep -c "TS18048" $LOGS_DIR/typescript-errors-${TIMESTAMP}.log || echo "0")
TS2769_COUNT=$(grep -c "TS2769" $LOGS_DIR/typescript-errors-${TIMESTAMP}.log || echo "0")
TS2739_COUNT=$(grep -c "TS2739" $LOGS_DIR/typescript-errors-${TIMESTAMP}.log || echo "0")

echo -e "${RED}🔴 HIGH IMPACT (Fix First):${NC}"
echo "  TS2339 (Property does not exist): $TS2339_COUNT"
echo "  TS2345 (Argument not assignable): $TS2345_COUNT"
echo "  TS2344 (Type constraint violation): $TS2344_COUNT"

echo -e "${YELLOW}🟡 MEDIUM IMPACT (Fix Second):${NC}"
echo "  TS18047 (Possibly null): $TS18047_COUNT"
echo "  TS7006 (Implicit any parameter): $TS7006_COUNT"
echo "  TS2322 (Type not assignable): $TS2322_COUNT"
echo "  TS18046 (Possibly undefined): $TS18046_COUNT"

echo -e "${GREEN}🟢 LOW IMPACT (Fix Last):${NC}"
echo "  TS18048 (Possibly undefined): $TS18048_COUNT"
echo "  TS2769 (No overload matches): $TS2769_COUNT"
echo "  TS2739 (Type missing properties): $TS2739_COUNT"

# Calculate impact scores
HIGH_IMPACT=$((TS2339_COUNT + TS2345_COUNT + TS2344_COUNT))
MEDIUM_IMPACT=$((TS18047_COUNT + TS7006_COUNT + TS2322_COUNT + TS18046_COUNT))
LOW_IMPACT=$((TS18048_COUNT + TS2769_COUNT + TS2739_COUNT))

echo -e "\n${BLUE}📊 Impact Distribution:${NC}"
echo "  🔴 High Impact: $HIGH_IMPACT errors ($(( HIGH_IMPACT * 100 / TOTAL_ERRORS ))%)"
echo "  🟡 Medium Impact: $MEDIUM_IMPACT errors ($(( MEDIUM_IMPACT * 100 / TOTAL_ERRORS ))%)"
echo "  🟢 Low Impact: $LOW_IMPACT errors ($(( LOW_IMPACT * 100 / TOTAL_ERRORS ))%)"

# File-based analysis
echo -e "\n${YELLOW}📁 Files Needing Attention:${NC}"
grep -E "\.tsx?:" $LOGS_DIR/typescript-errors-${TIMESTAMP}.log | \
  sed -E 's/^([^:]+):.*/\1/' | \
  sort | uniq -c | sort -nr | head -10 > $LOGS_DIR/files-with-errors.txt

cat $LOGS_DIR/files-with-errors.txt

# Identify specific problem patterns
echo -e "\n${PURPLE}🎯 Problem Pattern Analysis:${NC}"

# Supabase relationship issues
SUPABASE_RELATIONSHIP_ERRORS=$(grep -c -E "(prices.*products|subscriptions.*prices)" $LOGS_DIR/typescript-errors-${TIMESTAMP}.log || echo "0")
if [ "$SUPABASE_RELATIONSHIP_ERRORS" -gt 0 ]; then
  echo "🗄️ Supabase Relationship Types: $SUPABASE_RELATIONSHIP_ERRORS errors"
fi

# Union type property access
UNION_TYPE_ERRORS=$(grep -c -E "(Property.*does not exist on type.*\|)" $LOGS_DIR/typescript-errors-${TIMESTAMP}.log || echo "0")
if [ "$UNION_TYPE_ERRORS" -gt 0 ]; then
  echo "🔀 Union Type Property Access: $UNION_TYPE_ERRORS errors"
fi

# Null safety issues
NULL_SAFETY_ERRORS=$(grep -c -E "(possibly null|possibly undefined)" $LOGS_DIR/typescript-errors-${TIMESTAMP}.log || echo "0")
if [ "$NULL_SAFETY_ERRORS" -gt 0 ]; then
  echo "🛡️ Null Safety Issues: $NULL_SAFETY_ERRORS errors"
fi

# Generate actionable fix suggestions
echo -e "\n${CYAN}🛠️ ACTIONABLE FIX SUGGESTIONS:${NC}"
echo "================================"

if [ "$TS2339_COUNT" -gt 0 ]; then
  echo -e "${RED}1. Fix TS2339 Property Access Errors ($TS2339_COUNT):${NC}"
  echo "   • Add type guards: if ('property' in object) { ... }"
  echo "   • Use type assertions: (object as any).property"
  echo "   • Update interface definitions"
  echo "   • Example files to check:"
  grep -l "TS2339" $LOGS_DIR/typescript-errors-${TIMESTAMP}.log | head -3 | sed 's/^/     - /'
fi

if [ "$TS18047_COUNT" -gt 0 ]; then
  echo -e "\n${YELLOW}2. Fix TS18047 Null Safety Errors ($TS18047_COUNT):${NC}"
  echo "   • Add null assertions: object!.property"
  echo "   • Use optional chaining: object?.property"
  echo "   • Add null checks: if (object) { ... }"
  echo "   • Example files to check:"
  grep -l "TS18047" $LOGS_DIR/typescript-errors-${TIMESTAMP}.log | head -3 | sed 's/^/     - /'
fi

if [ "$TS7006_COUNT" -gt 0 ]; then
  echo -e "\n${GREEN}3. Fix TS7006 Implicit Any Parameters ($TS7006_COUNT):${NC}"
  echo "   • Add explicit types: .map((item: any) => ...)"
  echo "   • Use proper interfaces: .map((item: ItemType) => ...)"
  echo "   • Example files to check:"
  grep -l "TS7006" $LOGS_DIR/typescript-errors-${TIMESTAMP}.log | head -3 | sed 's/^/     - /'
fi

# Generate phase-based action plan
echo -e "\n${BLUE}📋 PHASE-BASED ACTION PLAN:${NC}"
echo "============================"

if [ "$HIGH_IMPACT" -gt 0 ]; then
  echo -e "${RED}🔴 PHASE 1: High Impact Errors ($HIGH_IMPACT errors)${NC}"
  echo "   Target: Property access and argument type issues"
  echo "   Expected reduction: 60-70% of remaining errors"
  echo "   Time estimate: 2-3 hours"
fi

if [ "$MEDIUM_IMPACT" -gt 0 ]; then
  echo -e "\n${YELLOW}🟡 PHASE 2: Medium Impact Errors ($MEDIUM_IMPACT errors)${NC}"
  echo "   Target: Null safety and implicit any issues"
  echo "   Expected reduction: 20-30% of remaining errors"
  echo "   Time estimate: 1-2 hours"
fi

if [ "$LOW_IMPACT" -gt 0 ]; then
  echo -e "\n${GREEN}🟢 PHASE 3: Low Impact Errors ($LOW_IMPACT errors)${NC}"
  echo "   Target: Function signatures and edge cases"
  echo "   Expected reduction: Final cleanup"
  echo "   Time estimate: 30-60 minutes"
fi

# Generate specific commands to run
echo -e "\n${CYAN}🚀 READY-TO-RUN COMMANDS:${NC}"
echo "========================="

if [ "$TS2339_COUNT" -gt 5 ]; then
  echo "# Focus on TS2339 errors:"
  echo "npm run type-check 2>&1 | grep 'TS2339' | head -5"
fi

if [ "$TS18047_COUNT" -gt 5 ]; then
  echo "# Focus on null safety:"
  echo "npm run type-check 2>&1 | grep 'TS18047' | head -5"
fi

if [ "$TS7006_COUNT" -gt 5 ]; then
  echo "# Focus on implicit any:"
  echo "npm run type-check 2>&1 | grep 'TS7006' | head -5"
fi

# Save comprehensive report
cat > $LOGS_DIR/error-analysis-${TIMESTAMP}.md << EOF
# TypeScript Error Analysis Report

**Generated**: $(date)
**Total Errors**: $TOTAL_ERRORS
**Analysis Method**: Proven 92→74 error reduction methodology

## Error Distribution

### High Impact (Fix First) - $HIGH_IMPACT errors
- TS2339 (Property does not exist): $TS2339_COUNT
- TS2345 (Argument not assignable): $TS2345_COUNT  
- TS2344 (Type constraint violation): $TS2344_COUNT

### Medium Impact (Fix Second) - $MEDIUM_IMPACT errors
- TS18047 (Possibly null): $TS18047_COUNT
- TS7006 (Implicit any parameter): $TS7006_COUNT
- TS2322 (Type not assignable): $TS2322_COUNT
- TS18046 (Possibly undefined): $TS18046_COUNT

### Low Impact (Fix Last) - $LOW_IMPACT errors
- TS18048 (Possibly undefined): $TS18048_COUNT
- TS2769 (No overload matches): $TS2769_COUNT
- TS2739 (Type missing properties): $TS2739_COUNT

## Problem Patterns
- Supabase Relationship Types: $SUPABASE_RELATIONSHIP_ERRORS
- Union Type Property Access: $UNION_TYPE_ERRORS
- Null Safety Issues: $NULL_SAFETY_ERRORS

## Recommended Action Plan

### Phase 1: High Impact ($HIGH_IMPACT errors)
Focus on property access and argument type issues. Expected 60-70% error reduction.

### Phase 2: Medium Impact ($MEDIUM_IMPACT errors)  
Address null safety and implicit any issues. Expected 20-30% error reduction.

### Phase 3: Low Impact ($LOW_IMPACT errors)
Final cleanup of function signatures and edge cases.

## Files Requiring Most Attention
$(head -5 $LOGS_DIR/files-with-errors.txt)

---
*Use this analysis to systematically reduce TypeScript errors using our proven methodology.*
EOF

echo -e "\n${GREEN}📁 Analysis complete! Reports saved to:${NC}"
echo "  - $LOGS_DIR/error-analysis-${TIMESTAMP}.md"
echo "  - $LOGS_DIR/typescript-errors-${TIMESTAMP}.log"
echo "  - $LOGS_DIR/files-with-errors.txt"

echo -e "\n${BLUE}🎯 Next Steps:${NC}"
echo "1. Start with Phase 1 (High Impact) errors"
echo "2. Use the specific fix suggestions above"
echo "3. Run this script again after each phase"
echo "4. Track progress with: ./scripts/track-progress.sh"

# Determine overall status
if [ "$TOTAL_ERRORS" -lt 10 ]; then
  echo -e "\n${GREEN}🎉 Status: NEARLY COMPLETE! Just $TOTAL_ERRORS errors left!${NC}"
elif [ "$TOTAL_ERRORS" -lt 50 ]; then
  echo -e "\n${YELLOW}🔧 Status: GOOD PROGRESS! $TOTAL_ERRORS errors remaining.${NC}"
else
  echo -e "\n${RED}🚧 Status: NEEDS WORK. $TOTAL_ERRORS errors to address.${NC}"
fi

exit 0
