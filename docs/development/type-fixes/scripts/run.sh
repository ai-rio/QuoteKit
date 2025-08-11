#!/bin/bash

# Master TypeScript Fix Script Runner
# Provides easy access to all type-fixing tools
# Based on proven 92→74 error reduction methodology

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${BLUE}🚀 TypeScript Fix Toolkit${NC}"
echo -e "${CYAN}Master script runner for systematic error reduction${NC}"
echo "================================================="

# Show usage if no arguments
if [ $# -eq 0 ]; then
  echo -e "\n${YELLOW}📋 Available Commands:${NC}"
  echo "====================="
  echo ""
  echo -e "${GREEN}🔍 Analysis & Monitoring:${NC}"
  echo "  analyze     - Comprehensive error analysis with actionable insights"
  echo "  check       - Enhanced type checking with priority breakdown"
  echo "  track       - Progress tracking and historical analysis"
  echo ""
  echo -e "${BLUE}🛠️ Automated Fixes:${NC}"
  echo "  quick-safe  - Apply safe, proven fixes (recommended first step)"
  echo "  quick-null  - Focus on null safety issues"
  echo "  quick-prop  - Fix property access errors"
  echo "  quick-all   - Apply all available automated fixes"
  echo ""
  echo -e "${PURPLE}💡 Manual Fix Assistance:${NC}"
  echo "  suggest     - Get specific fix suggestions for error types"
  echo "  suggest-all - Comprehensive fix suggestions for all errors"
  echo ""
  echo -e "${CYAN}🔄 Workflows:${NC}"
  echo "  workflow    - Run complete analysis → fix → track workflow"
  echo "  status      - Quick status check and next steps"
  echo ""
  echo -e "${YELLOW}📊 Examples:${NC}"
  echo "============"
  echo "  $0 analyze           # Analyze current errors"
  echo "  $0 quick-smart       # Apply intelligent automated fixes"
  echo "  $0 quick-safe        # Apply safe automated fixes"
  echo "  $0 quick-null        # Apply null safety fixes"
  echo "  $0 quick-prop        # Apply property access fixes"
  echo "  $0 quick-db          # Apply database type fixes"
  echo "  $0 quick-stripe      # Apply Stripe type fixes"
  echo "  $0 quick-all         # Apply all automated fixes"
  echo "  $0 suggest TS2339    # Get suggestions for property errors"
  echo "  $0 workflow          # Run complete workflow"
  echo "  $0 track             # Track progress over time"
  echo ""
  echo -e "${GREEN}💡 Recommended Workflow:${NC}"
  echo "======================="
  echo "1. $0 analyze          # Understand current state"
  echo "2. $0 quick-smart      # Apply intelligent fixes"
  echo "3. $0 track            # Monitor progress"
  echo "4. $0 suggest-all      # Get manual fix suggestions"
  echo ""
  exit 0
fi

# Parse command
COMMAND=$1
shift

case $COMMAND in
  "analyze"|"analysis")
    echo -e "${YELLOW}🔍 Running comprehensive error analysis...${NC}"
    "$SCRIPT_DIR/analyze-errors.sh" "$@"
    ;;
    
  "check"|"type-check")
    echo -e "${BLUE}🔧 Running enhanced type check...${NC}"
    "$SCRIPT_DIR/type-check.sh" "$@"
    ;;
    
  "track"|"progress")
    echo -e "${CYAN}📈 Tracking progress...${NC}"
    "$SCRIPT_DIR/track-progress.sh" "$@"
    ;;
    
  "quick-safe"|"safe")
    echo -e "${GREEN}🛡️ Applying safe automated fixes...${NC}"
    "$SCRIPT_DIR/quick-fix-enhanced.sh" safe "$@"
    ;;
    
  "quick-smart"|"smart")
    echo -e "${PURPLE}🧠 Applying smart automated fixes...${NC}"
    "$SCRIPT_DIR/quick-fix-enhanced.sh" smart "$@"
    ;;
    
  "quick-null"|"null")
    echo -e "${YELLOW}🛡️ Applying null safety fixes...${NC}"
    "$SCRIPT_DIR/quick-fix-enhanced.sh" null-safety "$@"
    ;;
    
  "quick-prop"|"prop")
    echo -e "${RED}🔧 Applying property access fixes...${NC}"
    "$SCRIPT_DIR/quick-fix-enhanced.sh" property-access "$@"
    ;;
    
  "quick-db"|"database")
    echo -e "${CYAN}🗄️ Applying database type fixes...${NC}"
    "$SCRIPT_DIR/quick-fix-enhanced.sh" database-types "$@"
    ;;
    
  "quick-stripe"|"stripe")
    echo -e "${YELLOW}💳 Applying Stripe type fixes...${NC}"
    "$SCRIPT_DIR/quick-fix-enhanced.sh" stripe-types "$@"
    ;;
    
  "quick-all"|"aggressive")
    echo -e "${PURPLE}⚡ Applying all automated fixes...${NC}"
    "$SCRIPT_DIR/quick-fix-enhanced.sh" aggressive "$@"
    ;;
    
  "quick-all"|"aggressive")
    echo -e "${PURPLE}⚡ Applying all automated fixes...${NC}"
    "$SCRIPT_DIR/quick-fix.sh" aggressive "$@"
    ;;
    
  "suggest")
    if [ $# -eq 0 ]; then
      echo -e "${PURPLE}💡 Getting comprehensive fix suggestions...${NC}"
      "$SCRIPT_DIR/suggest-fixes.sh" all
    else
      ERROR_TYPE=$1
      echo -e "${PURPLE}💡 Getting fix suggestions for $ERROR_TYPE...${NC}"
      "$SCRIPT_DIR/suggest-fixes.sh" "$ERROR_TYPE"
    fi
    ;;
    
  "suggest-all")
    echo -e "${PURPLE}💡 Getting comprehensive fix suggestions...${NC}"
    "$SCRIPT_DIR/suggest-fixes.sh" all
    ;;
    
  "workflow")
    echo -e "${CYAN}🔄 Running complete workflow...${NC}"
    echo "================================="
    
    echo -e "\n${YELLOW}Step 1: Analysis${NC}"
    "$SCRIPT_DIR/analyze-errors.sh"
    
    echo -e "\n${GREEN}Step 2: Safe Fixes${NC}"
    "$SCRIPT_DIR/quick-fix.sh" safe
    
    echo -e "\n${CYAN}Step 3: Progress Tracking${NC}"
    "$SCRIPT_DIR/track-progress.sh"
    
    echo -e "\n${BLUE}🎉 Workflow Complete!${NC}"
    echo "Check the results above and run manual fixes if needed."
    ;;
    
  "status")
    echo -e "${BLUE}📊 Quick Status Check${NC}"
    echo "===================="
    
    # Get current error count
    npm run type-check 2>&1 > /tmp/quick-status.log || true
    if grep -q "error TS" /tmp/quick-status.log; then
      TOTAL_ERRORS=$(grep -c "error TS" /tmp/quick-status.log)
      echo "Current errors: $TOTAL_ERRORS"
      
      # Quick breakdown
      TS2339_COUNT=$(grep -c "TS2339" /tmp/quick-status.log 2>/dev/null || echo "0")
      TS18047_COUNT=$(grep -c "TS18047" /tmp/quick-status.log 2>/dev/null || echo "0")
      TS7006_COUNT=$(grep -c "TS7006" /tmp/quick-status.log 2>/dev/null || echo "0")
      
      echo "  - Property access (TS2339): $TS2339_COUNT"
      echo "  - Null safety (TS18047): $TS18047_COUNT"
      echo "  - Implicit any (TS7006): $TS7006_COUNT"
      
      echo -e "\n${GREEN}💡 Recommended Next Steps:${NC}"
      if [ "$TS2339_COUNT" -gt 5 ]; then
        echo "  $0 suggest TS2339    # Fix property access errors"
      elif [ "$TS18047_COUNT" -gt 5 ]; then
        echo "  $0 quick-null        # Fix null safety issues"
      elif [ "$TS7006_COUNT" -gt 5 ]; then
        echo "  $0 quick-safe        # Fix implicit any parameters"
      else
        echo "  $0 suggest-all       # Get comprehensive suggestions"
      fi
    else
      echo -e "${GREEN}🎉 No TypeScript errors found!${NC}"
    fi
    
    rm -f /tmp/quick-status.log
    ;;
    
  "help"|"--help"|"-h")
    # Re-run with no arguments to show help
    "$0"
    ;;
    
  *)
    echo -e "${RED}❌ Unknown command: $COMMAND${NC}"
    echo ""
    echo "Run '$0' without arguments to see available commands."
    echo "Or run '$0 help' for detailed usage information."
    exit 1
    ;;
esac

# Show quick next steps after most commands
if [[ "$COMMAND" != "help" && "$COMMAND" != "status" && "$COMMAND" != "workflow" ]]; then
  echo -e "\n${CYAN}🔄 Quick Next Steps:${NC}"
  echo "=================="
  echo "• Check status:     $0 status"
  echo "• Track progress:   $0 track"
  echo "• Run workflow:     $0 workflow"
  echo "• Get help:         $0 help"
fi
