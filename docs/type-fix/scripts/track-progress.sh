#!/bin/bash

# TypeScript Error Progress Tracking Script
# Tracks error reduction progress over time
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

# Configuration
LOGS_DIR="logs"
PROGRESS_FILE="$LOGS_DIR/progress-history.csv"
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
DATE_ONLY=$(date +"%Y-%m-%d")

echo -e "${BLUE}📈 TypeScript Error Progress Tracker${NC}"
echo -e "${CYAN}Monitoring systematic error reduction${NC}"
echo "======================================"

# Create logs directory and progress file if they don't exist
mkdir -p $LOGS_DIR

if [ ! -f "$PROGRESS_FILE" ]; then
  echo "timestamp,total_errors,ts2339,ts2345,ts18047,ts7006,ts2322,ts18046,phase,notes" > $PROGRESS_FILE
  echo -e "${YELLOW}📁 Created new progress tracking file${NC}"
fi

# Get current error counts
echo -e "\n${YELLOW}📊 Analyzing current state...${NC}"
npm run type-check 2>&1 > $LOGS_DIR/current-check.log || true

if ! grep -q "error TS" $LOGS_DIR/current-check.log; then
  TOTAL_ERRORS=0
  echo -e "${GREEN}🎉 No TypeScript errors found!${NC}"
else
  TOTAL_ERRORS=$(grep -c "error TS" $LOGS_DIR/current-check.log)
fi

# Count specific error types
TS2339_COUNT=$(grep -c "TS2339" $LOGS_DIR/current-check.log 2>/dev/null || echo "0")
TS2345_COUNT=$(grep -c "TS2345" $LOGS_DIR/current-check.log 2>/dev/null || echo "0")
TS18047_COUNT=$(grep -c "TS18047" $LOGS_DIR/current-check.log 2>/dev/null || echo "0")
TS7006_COUNT=$(grep -c "TS7006" $LOGS_DIR/current-check.log 2>/dev/null || echo "0")
TS2322_COUNT=$(grep -c "TS2322" $LOGS_DIR/current-check.log 2>/dev/null || echo "0")
TS18046_COUNT=$(grep -c "TS18046" $LOGS_DIR/current-check.log 2>/dev/null || echo "0")

# Determine current phase
PHASE="Unknown"
if [ "$TOTAL_ERRORS" -eq 0 ]; then
  PHASE="Complete"
elif [ "$TOTAL_ERRORS" -lt 10 ]; then
  PHASE="Final Cleanup"
elif [ "$TOTAL_ERRORS" -lt 30 ]; then
  PHASE="Phase 3 - Low Impact"
elif [ "$TOTAL_ERRORS" -lt 60 ]; then
  PHASE="Phase 2 - Medium Impact"
else
  PHASE="Phase 1 - High Impact"
fi

# Display current status
echo -e "\n${BLUE}📊 Current Status:${NC}"
echo "=================="
echo "Total Errors: $TOTAL_ERRORS"
echo "Phase: $PHASE"
echo "Timestamp: $TIMESTAMP"

echo -e "\n${YELLOW}🏷️ Error Breakdown:${NC}"
echo "TS2339 (Property access): $TS2339_COUNT"
echo "TS2345 (Argument types): $TS2345_COUNT"
echo "TS18047 (Null safety): $TS18047_COUNT"
echo "TS7006 (Implicit any): $TS7006_COUNT"
echo "TS2322 (Type assignment): $TS2322_COUNT"
echo "TS18046 (Undefined): $TS18046_COUNT"

# Get previous record for comparison
if [ -f "$PROGRESS_FILE" ] && [ $(wc -l < "$PROGRESS_FILE") -gt 1 ]; then
  LAST_RECORD=$(tail -n 1 "$PROGRESS_FILE")
  LAST_TOTAL=$(echo "$LAST_RECORD" | cut -d',' -f2)
  LAST_DATE=$(echo "$LAST_RECORD" | cut -d',' -f1 | cut -d' ' -f1)
  
  # Calculate progress
  if [ "$LAST_TOTAL" -gt 0 ]; then
    ERRORS_REDUCED=$((LAST_TOTAL - TOTAL_ERRORS))
    if [ "$ERRORS_REDUCED" -gt 0 ]; then
      REDUCTION_PERCENT=$(( (ERRORS_REDUCED * 100) / LAST_TOTAL ))
      echo -e "\n${GREEN}📈 Progress Since Last Check:${NC}"
      echo "Previous: $LAST_TOTAL errors ($LAST_DATE)"
      echo "Current: $TOTAL_ERRORS errors"
      echo "Reduced: $ERRORS_REDUCED errors ($REDUCTION_PERCENT% improvement)"
    elif [ "$ERRORS_REDUCED" -lt 0 ]; then
      ERRORS_INCREASED=$((-ERRORS_REDUCED))
      echo -e "\n${RED}📉 Regression Detected:${NC}"
      echo "Previous: $LAST_TOTAL errors ($LAST_DATE)"
      echo "Current: $TOTAL_ERRORS errors"
      echo "Increased: $ERRORS_INCREASED errors"
    else
      echo -e "\n${YELLOW}📊 No Change Since Last Check${NC}"
      echo "Errors remain at: $TOTAL_ERRORS"
    fi
  fi
fi

# Add notes based on current state
NOTES=""
if [ "$TOTAL_ERRORS" -eq 0 ]; then
  NOTES="All TypeScript errors resolved! 🎉"
elif [ "$TOTAL_ERRORS" -lt 10 ]; then
  NOTES="Nearly complete - final cleanup phase"
elif [ "$TS2339_COUNT" -gt 10 ]; then
  NOTES="Focus on property access errors (TS2339)"
elif [ "$TS18047_COUNT" -gt 10 ]; then
  NOTES="Focus on null safety issues (TS18047)"
else
  NOTES="Systematic reduction in progress"
fi

# Record current state
echo "$TIMESTAMP,$TOTAL_ERRORS,$TS2339_COUNT,$TS2345_COUNT,$TS18047_COUNT,$TS7006_COUNT,$TS2322_COUNT,$TS18046_COUNT,$PHASE,$NOTES" >> $PROGRESS_FILE

# Generate progress visualization
echo -e "\n${PURPLE}📊 Progress History (Last 10 Records):${NC}"
echo "======================================"
echo "Date       Time     Total  TS2339 TS2345 TS18047 Phase"
echo "----------------------------------------------------"
tail -n 10 "$PROGRESS_FILE" | grep -v "timestamp" | while IFS=',' read -r timestamp total ts2339 ts2345 ts18047 ts7006 ts2322 ts18046 phase notes; do
  date_part=$(echo "$timestamp" | cut -d' ' -f1)
  time_part=$(echo "$timestamp" | cut -d' ' -f2 | cut -d':' -f1-2)
  printf "%-10s %-8s %-6s %-6s %-6s %-7s %s\n" "$date_part" "$time_part" "$total" "$ts2339" "$ts2345" "$ts18047" "$phase"
done

# Calculate overall progress from baseline
if [ -f "$PROGRESS_FILE" ] && [ $(wc -l < "$PROGRESS_FILE") -gt 1 ]; then
  FIRST_RECORD=$(sed -n '2p' "$PROGRESS_FILE")  # Skip header
  if [ -n "$FIRST_RECORD" ]; then
    BASELINE_TOTAL=$(echo "$FIRST_RECORD" | cut -d',' -f2)
    BASELINE_DATE=$(echo "$FIRST_RECORD" | cut -d',' -f1 | cut -d' ' -f1)
    
    if [ "$BASELINE_TOTAL" -gt 0 ]; then
      TOTAL_REDUCED=$((BASELINE_TOTAL - TOTAL_ERRORS))
      TOTAL_PERCENT=$(( (TOTAL_REDUCED * 100) / BASELINE_TOTAL ))
      
      echo -e "\n${CYAN}🎯 Overall Progress:${NC}"
      echo "==================="
      echo "Baseline: $BASELINE_TOTAL errors ($BASELINE_DATE)"
      echo "Current: $TOTAL_ERRORS errors"
      echo "Total Reduced: $TOTAL_REDUCED errors"
      echo "Overall Progress: $TOTAL_PERCENT%"
      
      # Progress bar
      PROGRESS_BARS=$((TOTAL_PERCENT / 5))
      REMAINING_BARS=$((20 - PROGRESS_BARS))
      printf "Progress: ["
      for i in $(seq 1 $PROGRESS_BARS); do printf "█"; done
      for i in $(seq 1 $REMAINING_BARS); do printf "░"; done
      printf "] %d%%\n" $TOTAL_PERCENT
    fi
  fi
fi

# Generate recommendations
echo -e "\n${GREEN}💡 Recommendations:${NC}"
echo "==================="

if [ "$TOTAL_ERRORS" -eq 0 ]; then
  echo "🎉 Congratulations! All TypeScript errors resolved!"
  echo "Consider adding stricter TypeScript rules for future development."
elif [ "$TOTAL_ERRORS" -lt 10 ]; then
  echo "🎯 You're almost there! Focus on the remaining $TOTAL_ERRORS errors."
  echo "Run: ./scripts/suggest-fixes.sh all"
elif [ "$TS2339_COUNT" -gt 5 ]; then
  echo "🔴 Priority: Fix TS2339 property access errors ($TS2339_COUNT remaining)"
  echo "Run: ./scripts/suggest-fixes.sh TS2339"
elif [ "$TS18047_COUNT" -gt 5 ]; then
  echo "🟡 Priority: Fix TS18047 null safety issues ($TS18047_COUNT remaining)"
  echo "Run: ./scripts/suggest-fixes.sh TS18047"
else
  echo "🔧 Continue systematic fixing using the proven methodology"
  echo "Run: ./scripts/analyze-errors.sh"
fi

# Export data for external analysis
echo -e "\n${BLUE}📁 Data Export:${NC}"
echo "==============="
echo "Progress data: $PROGRESS_FILE"
echo "Latest errors: $LOGS_DIR/current-check.log"

# Generate CSV for spreadsheet analysis
cat > $LOGS_DIR/progress-summary.csv << EOF
metric,value
total_errors,$TOTAL_ERRORS
ts2339_errors,$TS2339_COUNT
ts2345_errors,$TS2345_COUNT
ts18047_errors,$TS18047_COUNT
ts7006_errors,$TS7006_COUNT
ts2322_errors,$TS2322_COUNT
ts18046_errors,$TS18046_COUNT
current_phase,$PHASE
timestamp,$TIMESTAMP
EOF

echo "Summary export: $LOGS_DIR/progress-summary.csv"

# Quick commands for next steps
echo -e "\n${CYAN}🚀 Quick Commands:${NC}"
echo "=================="
echo "# Analyze current errors:"
echo "./scripts/analyze-errors.sh"
echo ""
echo "# Get fix suggestions:"
echo "./scripts/suggest-fixes.sh all"
echo ""
echo "# Track progress again:"
echo "./scripts/track-progress.sh"
echo ""
echo "# View progress history:"
echo "cat $PROGRESS_FILE"

# Set exit code based on progress
if [ "$TOTAL_ERRORS" -eq 0 ]; then
  echo -e "\n${GREEN}✅ Status: COMPLETE${NC}"
  exit 0
elif [ "$TOTAL_ERRORS" -lt 10 ]; then
  echo -e "\n${YELLOW}🎯 Status: NEARLY COMPLETE${NC}"
  exit 0
else
  echo -e "\n${BLUE}🔧 Status: IN PROGRESS${NC}"
  exit 0
fi
