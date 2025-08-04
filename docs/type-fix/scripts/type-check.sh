#!/bin/bash

# Comprehensive TypeScript Error Checking Script
# Usage: ./scripts/type-check.sh [--fix] [--summary]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Flags
FIX_MODE=false
SUMMARY_MODE=false

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
    *)
      echo "Unknown option $1"
      exit 1
      ;;
  esac
done

echo -e "${BLUE}🔍 Running comprehensive type check...${NC}"
echo "=================================================="

# Create logs directory if it doesn't exist
mkdir -p logs

# 1. ESLint check
echo -e "\n${YELLOW}📋 ESLint validation...${NC}"
if [ "$FIX_MODE" = true ]; then
  echo "🔧 Running ESLint with auto-fix..."
  npm run lint:fix 2>&1 | tee logs/eslint-fix.log
else
  npm run lint 2>&1 | tee logs/eslint.log || true
fi

# 2. TypeScript compilation
echo -e "\n${YELLOW}🔧 TypeScript compilation check...${NC}"
npx tsc --noEmit --pretty 2>&1 | tee logs/typescript-errors.log || true

# 3. Error categorization
echo -e "\n${YELLOW}📊 Categorizing errors...${NC}"
if [ -f logs/typescript-errors.log ]; then
  # Extract error codes and count them
  grep -E "error TS[0-9]+" logs/typescript-errors.log | \
    sed -E 's/.*error (TS[0-9]+).*/\1/' | \
    sort | uniq -c | sort -nr > logs/error-summary.txt
  
  # Count total errors
  TOTAL_ERRORS=$(grep -c "error TS" logs/typescript-errors.log || echo "0")
  
  echo -e "${BLUE}📈 Error Summary:${NC}"
  echo "Total TypeScript errors: $TOTAL_ERRORS"
  
  if [ "$SUMMARY_MODE" = true ] && [ -f logs/error-summary.txt ]; then
    echo -e "\n${BLUE}Top error types:${NC}"
    head -10 logs/error-summary.txt
  fi
else
  echo -e "${GREEN}✅ No TypeScript errors found!${NC}"
  TOTAL_ERRORS=0
fi

# 4. Build test (optional, only if no critical errors)
if [ "$TOTAL_ERRORS" -lt 50 ]; then
  echo -e "\n${YELLOW}🏗️ Build validation...${NC}"
  npm run build 2>&1 | tee logs/build.log || true
else
  echo -e "\n${RED}⚠️ Skipping build test due to high error count ($TOTAL_ERRORS)${NC}"
fi

# 5. Generate progress report
echo -e "\n${BLUE}📊 Progress Report${NC}"
echo "==================="
echo "Timestamp: $(date)"
echo "Total TypeScript errors: $TOTAL_ERRORS"

# Determine status
if [ "$TOTAL_ERRORS" -eq 0 ]; then
  echo -e "Status: ${GREEN}✅ PASSING${NC}"
elif [ "$TOTAL_ERRORS" -lt 10 ]; then
  echo -e "Status: ${YELLOW}⚠️ NEARLY THERE${NC}"
elif [ "$TOTAL_ERRORS" -lt 50 ]; then
  echo -e "Status: ${YELLOW}🔧 IN PROGRESS${NC}"
else
  echo -e "Status: ${RED}❌ NEEDS WORK${NC}"
fi

# Save progress to file
echo "$(date),${TOTAL_ERRORS}" >> logs/progress.csv

echo -e "\n${BLUE}📁 Logs saved to:${NC}"
echo "  - logs/typescript-errors.log"
echo "  - logs/error-summary.txt"
echo "  - logs/progress.csv"

if [ "$FIX_MODE" = true ]; then
  echo "  - logs/eslint-fix.log"
fi

echo -e "\n${GREEN}✅ Type check complete!${NC}"

# Exit with error code if there are TypeScript errors
if [ "$TOTAL_ERRORS" -gt 0 ]; then
  exit 1
fi
