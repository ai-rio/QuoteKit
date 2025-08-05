#!/bin/bash

# Enhanced TypeScript Error Checking Script
# Based on proven 92→74 error reduction methodology
# Usage: ./scripts/type-check.sh [--fix] [--summary] [--track]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Flags
FIX_MODE=false
SUMMARY_MODE=false
TRACK_MODE=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --fix)
      FIX_MODE=true
      shift
      ;;
    --summary)
      SUMMARY_MODE=true
      shift
      ;;
    --track)
      TRACK_MODE=true
      shift
      ;;
    *)
      echo "Unknown option $1"
      echo "Usage: $0 [--fix] [--summary] [--track]"
      echo "  --fix     Apply automatic fixes"
      echo "  --summary Show detailed error breakdown"
      echo "  --track   Track progress over time"
      exit 1
      ;;
  esac
done

echo -e "${BLUE}🔍 Enhanced TypeScript Error Analysis${NC}"
echo -e "${CYAN}Based on proven 92→74 error reduction methodology${NC}"
echo "=================================================="

# Create logs directory if it doesn't exist
mkdir -p logs

# 1. ESLint check (if fix mode)
if [ "$FIX_MODE" = true ]; then
  echo -e "\n${YELLOW}📋 ESLint validation with auto-fix...${NC}"
  npm run lint:fix 2>&1 | tee logs/eslint-fix.log || true
fi

# 2. TypeScript compilation with enhanced analysis
echo -e "\n${YELLOW}🔧 TypeScript compilation check...${NC}"
npm run type-check 2>&1 | tee logs/typescript-errors.log || true

# 3. Enhanced error categorization
echo -e "\n${YELLOW}📊 Enhanced Error Analysis...${NC}"
if [ -f logs/typescript-errors.log ] && grep -q "error TS" logs/typescript-errors.log; then
  
  # Count total errors
  TOTAL_ERRORS=$(grep -c "error TS" logs/typescript-errors.log)
  
  # Count by our proven priority system
  TS2339_COUNT=$(grep -c "TS2339" logs/typescript-errors.log 2>/dev/null || echo "0")
  TS2345_COUNT=$(grep -c "TS2345" logs/typescript-errors.log 2>/dev/null || echo "0")
  TS18047_COUNT=$(grep -c "TS18047" logs/typescript-errors.log 2>/dev/null || echo "0")
  TS7006_COUNT=$(grep -c "TS7006" logs/typescript-errors.log 2>/dev/null || echo "0")
  TS2322_COUNT=$(grep -c "TS2322" logs/typescript-errors.log 2>/dev/null || echo "0")
  TS18046_COUNT=$(grep -c "TS18046" logs/typescript-errors.log 2>/dev/null || echo "0")
  
  # Calculate impact distribution
  HIGH_IMPACT=$((TS2339_COUNT + TS2345_COUNT))
  MEDIUM_IMPACT=$((TS18047_COUNT + TS7006_COUNT + TS2322_COUNT))
  LOW_IMPACT=$((TS18046_COUNT))
  
  echo -e "${BLUE}📈 Error Summary:${NC}"
  echo "Total TypeScript errors: $TOTAL_ERRORS"
  
  echo -e "\n${RED}🔴 HIGH IMPACT (Fix First): $HIGH_IMPACT errors${NC}"
  echo "  TS2339 (Property does not exist): $TS2339_COUNT"
  echo "  TS2345 (Argument not assignable): $TS2345_COUNT"
  
  echo -e "\n${YELLOW}🟡 MEDIUM IMPACT (Fix Second): $MEDIUM_IMPACT errors${NC}"
  echo "  TS18047 (Possibly null): $TS18047_COUNT"
  echo "  TS7006 (Implicit any parameter): $TS7006_COUNT"
  echo "  TS2322 (Type not assignable): $TS2322_COUNT"
  
  echo -e "\n${GREEN}🟢 LOW IMPACT (Fix Last): $LOW_IMPACT errors${NC}"
  echo "  TS18046 (Possibly undefined): $TS18046_COUNT"
  
  # Show detailed breakdown if requested
  if [ "$SUMMARY_MODE" = true ]; then
    echo -e "\n${PURPLE}📋 Detailed Error Breakdown:${NC}"
    grep -E "error TS[0-9]+" logs/typescript-errors.log | \
      sed -E 's/.*error (TS[0-9]+).*/\1/' | \
      sort | uniq -c | sort -nr > logs/error-summary.txt
    head -10 logs/error-summary.txt
    
    echo -e "\n${CYAN}📁 Files with Most Errors:${NC}"
    grep -E "\.tsx?:" logs/typescript-errors.log | \
      sed -E 's/^([^:]+):.*/\1/' | \
      sort | uniq -c | sort -nr | head -10
  fi
  
  # Generate actionable recommendations
  echo -e "\n${CYAN}💡 Actionable Recommendations:${NC}"
  echo "=============================="
  
  if [ "$TS2339_COUNT" -gt 5 ]; then
    echo -e "${RED}🎯 Priority 1: Fix TS2339 property access errors${NC}"
    echo "   Run: ./scripts/suggest-fixes.sh TS2339"
    echo "   Or:  ./scripts/quick-fix.sh property-access"
  fi
  
  if [ "$TS18047_COUNT" -gt 5 ]; then
    echo -e "${YELLOW}🎯 Priority 2: Fix TS18047 null safety issues${NC}"
    echo "   Run: ./scripts/suggest-fixes.sh TS18047"
    echo "   Or:  ./scripts/quick-fix.sh null-safety"
  fi
  
  if [ "$TS7006_COUNT" -gt 5 ]; then
    echo -e "${GREEN}🎯 Priority 3: Fix TS7006 implicit any parameters${NC}"
    echo "   Run: ./scripts/suggest-fixes.sh TS7006"
    echo "   Or:  ./scripts/quick-fix.sh safe"
  fi
  
  # Quick fix suggestions
  echo -e "\n${BLUE}🚀 Quick Fix Options:${NC}"
  echo "===================="
  echo "• Safe fixes:       ./scripts/quick-fix.sh safe"
  echo "• Null safety:      ./scripts/quick-fix.sh null-safety"
  echo "• Property access:  ./scripts/quick-fix.sh property-access"
  echo "• All fixes:        ./scripts/quick-fix.sh aggressive"
  
else
  echo -e "${GREEN}✅ No TypeScript errors found!${NC}"
  TOTAL_ERRORS=0
fi

# 4. Apply fixes if requested
if [ "$FIX_MODE" = true ] && [ "$TOTAL_ERRORS" -gt 0 ]; then
  echo -e "\n${PURPLE}🔧 Applying Automatic Fixes...${NC}"
  ./scripts/quick-fix.sh safe
fi

# 5. Track progress if requested
if [ "$TRACK_MODE" = true ]; then
  echo -e "\n${CYAN}📈 Tracking Progress...${NC}"
  ./scripts/track-progress.sh
fi

# 6. Build test (only if errors are manageable)
if [ "$TOTAL_ERRORS" -lt 30 ]; then
  echo -e "\n${YELLOW}🏗️ Build validation...${NC}"
  if npm run build 2>&1 | tee logs/build.log; then
    echo -e "${GREEN}✅ Build successful!${NC}"
  else
    echo -e "${RED}❌ Build failed - check logs/build.log${NC}"
  fi
else
  echo -e "\n${RED}⚠️ Skipping build test due to high error count ($TOTAL_ERRORS)${NC}"
  echo "Focus on reducing errors first, then test build."
fi

# 7. Generate progress report
echo -e "\n${BLUE}📊 Session Summary${NC}"
echo "=================="
echo "Timestamp: $(date)"
echo "Total TypeScript errors: $TOTAL_ERRORS"

# Determine status and next steps
if [ "$TOTAL_ERRORS" -eq 0 ]; then
  echo -e "Status: ${GREEN}✅ PERFECT - All errors resolved!${NC}"
  echo -e "\n${GREEN}🎉 Congratulations! Consider adding stricter TypeScript rules.${NC}"
elif [ "$TOTAL_ERRORS" -lt 10 ]; then
  echo -e "Status: ${YELLOW}🎯 NEARLY THERE - Only $TOTAL_ERRORS errors left!${NC}"
  echo -e "\n${YELLOW}💡 Focus on manual fixes for the remaining errors.${NC}"
elif [ "$TOTAL_ERRORS" -lt 30 ]; then
  echo -e "Status: ${YELLOW}🔧 GOOD PROGRESS - $TOTAL_ERRORS errors remaining${NC}"
  echo -e "\n${BLUE}💡 Continue with systematic fixing using priority order.${NC}"
elif [ "$TOTAL_ERRORS" -lt 60 ]; then
  echo -e "Status: ${RED}🚧 NEEDS WORK - $TOTAL_ERRORS errors to address${NC}"
  echo -e "\n${RED}💡 Focus on high-impact errors first (TS2339, TS2345).${NC}"
else
  echo -e "Status: ${RED}❌ MAJOR WORK NEEDED - $TOTAL_ERRORS errors${NC}"
  echo -e "\n${RED}💡 Start with automated fixes, then systematic manual fixing.${NC}"
fi

# Save progress to file
echo "$(date),${TOTAL_ERRORS}" >> logs/progress.csv

echo -e "\n${BLUE}📁 Generated Files:${NC}"
echo "=================="
echo "• logs/typescript-errors.log - Full error details"
echo "• logs/progress.csv - Progress tracking"
if [ "$SUMMARY_MODE" = true ]; then
  echo "• logs/error-summary.txt - Error breakdown"
fi
if [ "$FIX_MODE" = true ]; then
  echo "• logs/eslint-fix.log - ESLint fixes applied"
fi

echo -e "\n${CYAN}🔄 Recommended Workflow:${NC}"
echo "======================="
echo "1. ./scripts/type-check.sh --summary    # Analyze current state"
echo "2. ./scripts/quick-fix.sh safe          # Apply safe fixes"
echo "3. ./scripts/suggest-fixes.sh TS2339    # Get specific suggestions"
echo "4. ./scripts/track-progress.sh          # Monitor improvement"
echo "5. Repeat until errors < 10"

# Exit with appropriate code
if [ "$TOTAL_ERRORS" -eq 0 ]; then
  echo -e "\n${GREEN}✅ SUCCESS: No TypeScript errors!${NC}"
  exit 0
elif [ "$TOTAL_ERRORS" -lt 10 ]; then
  echo -e "\n${YELLOW}🎯 NEARLY COMPLETE: $TOTAL_ERRORS errors remaining${NC}"
  exit 0
else
  echo -e "\n${BLUE}🔧 IN PROGRESS: $TOTAL_ERRORS errors to fix${NC}"
  exit 1
fi
