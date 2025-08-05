#!/bin/bash

# Automated TypeScript Fix Suggestion Script
# Provides specific, actionable fix suggestions based on error patterns
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
ERROR_TYPE=${1:-"all"}
MAX_SUGGESTIONS=${2:-5}
LOGS_DIR="logs"

echo -e "${BLUE}🔧 TypeScript Fix Suggestions Generator${NC}"
echo -e "${CYAN}Based on proven error reduction patterns${NC}"
echo "============================================="

# Validate error type
case $ERROR_TYPE in
  "TS2339"|"TS2345"|"TS18047"|"TS7006"|"TS2322"|"all")
    ;;
  *)
    echo -e "${RED}❌ Invalid error type: $ERROR_TYPE${NC}"
    echo "Valid types: TS2339, TS2345, TS18047, TS7006, TS2322, all"
    exit 1
    ;;
esac

# Create logs directory
mkdir -p $LOGS_DIR

# Get latest errors
echo -e "\n${YELLOW}📊 Analyzing current TypeScript errors...${NC}"
npm run type-check 2>&1 > $LOGS_DIR/current-errors.log || true

if ! grep -q "error TS" $LOGS_DIR/current-errors.log; then
  echo -e "${GREEN}🎉 No TypeScript errors found!${NC}"
  exit 0
fi

# Function to generate TS2339 fixes
generate_ts2339_fixes() {
  echo -e "\n${RED}🔴 TS2339: Property does not exist on type${NC}"
  echo "=============================================="
  
  local errors=$(grep "TS2339" $LOGS_DIR/current-errors.log | head -$MAX_SUGGESTIONS)
  local count=1
  
  while IFS= read -r error; do
    if [ -n "$error" ]; then
      # Extract file, line, and property info
      local file=$(echo "$error" | cut -d'(' -f1)
      local line_info=$(echo "$error" | sed -n "s/.*(\([0-9]*,[0-9]*\)).*/\1/p")
      local property=$(echo "$error" | sed -n "s/.*Property '\([^']*\)'.*/\1/p")
      local type_info=$(echo "$error" | sed -n "s/.*on type '\([^']*\)'.*/\1/p")
      
      echo -e "\n${YELLOW}Fix #$count:${NC} $file:$line_info"
      echo -e "${BLUE}Property:${NC} '$property' missing on type '$type_info'"
      
      # Provide specific fix suggestions
      echo -e "${GREEN}💡 Suggested Fixes:${NC}"
      
      # Pattern 1: Union type property access
      if [[ "$type_info" == *"|"* ]]; then
        echo "   1. Type Guard: if ('$property' in object) { object.$property }"
        echo "   2. Type Assertion: (object as any).$property"
        echo "   3. Optional Access: object?.hasOwnProperty('$property') && object.$property"
      fi
      
      # Pattern 2: Interface missing property
      if [[ "$type_info" != *"|"* ]]; then
        echo "   1. Add to Interface: Add '$property' to the $type_info interface"
        echo "   2. Type Assertion: (object as any).$property"
        echo "   3. Optional Property: Make '$property' optional in interface"
      fi
      
      # Pattern 3: Relationship types (Supabase)
      if [[ "$property" == "products" || "$property" == "prices" || "$property" == "subscriptions" ]]; then
        echo "   4. Relationship Type: Add relationship type to Supabase schema"
        echo "      Example: ${property}?: { id: string, name: string | null }"
      fi
      
      echo -e "${CYAN}📝 Quick Fix Command:${NC}"
      echo "   # Open file and navigate to error:"
      echo "   code $file:${line_info%,*}"
      
      count=$((count + 1))
    fi
  done <<< "$errors"
}

# Function to generate TS18047 fixes
generate_ts18047_fixes() {
  echo -e "\n${YELLOW}🟡 TS18047: Object is possibly null${NC}"
  echo "========================================"
  
  local errors=$(grep "TS18047" $LOGS_DIR/current-errors.log | head -$MAX_SUGGESTIONS)
  local count=1
  
  while IFS= read -r error; do
    if [ -n "$error" ]; then
      local file=$(echo "$error" | cut -d'(' -f1)
      local line_info=$(echo "$error" | sed -n "s/.*(\([0-9]*,[0-9]*\)).*/\1/p")
      local variable=$(echo "$error" | sed -n "s/.*'\([^']*\)' is possibly null.*/\1/p")
      
      echo -e "\n${YELLOW}Fix #$count:${NC} $file:$line_info"
      echo -e "${BLUE}Variable:${NC} '$variable' is possibly null"
      
      echo -e "${GREEN}💡 Suggested Fixes:${NC}"
      echo "   1. Null Assertion: $variable!.property (if you're sure it's not null)"
      echo "   2. Optional Chaining: $variable?.property"
      echo "   3. Null Check: if ($variable) { $variable.property }"
      echo "   4. Default Value: $variable || defaultValue"
      
      # Specific patterns for common cases
      if [[ "$variable" == "session" ]]; then
        echo "   5. Session Pattern: After null check, use session!.user.id"
      fi
      
      if [[ "$variable" == *"Error"* ]]; then
        echo "   5. Error Pattern: if (error) { error.message }"
      fi
      
      echo -e "${CYAN}📝 Quick Fix Command:${NC}"
      echo "   code $file:${line_info%,*}"
      
      count=$((count + 1))
    fi
  done <<< "$errors"
}

# Function to generate TS7006 fixes
generate_ts7006_fixes() {
  echo -e "\n${GREEN}🟢 TS7006: Parameter implicitly has 'any' type${NC}"
  echo "=============================================="
  
  local errors=$(grep "TS7006" $LOGS_DIR/current-errors.log | head -$MAX_SUGGESTIONS)
  local count=1
  
  while IFS= read -r error; do
    if [ -n "$error" ]; then
      local file=$(echo "$error" | cut -d'(' -f1)
      local line_info=$(echo "$error" | sed -n "s/.*(\([0-9]*,[0-9]*\)).*/\1/p")
      local parameter=$(echo "$error" | sed -n "s/.*Parameter '\([^']*\)'.*/\1/p")
      
      echo -e "\n${YELLOW}Fix #$count:${NC} $file:$line_info"
      echo -e "${BLUE}Parameter:${NC} '$parameter' needs explicit type"
      
      echo -e "${GREEN}💡 Suggested Fixes:${NC}"
      echo "   1. Quick Fix: ($parameter: any) => ..."
      echo "   2. Proper Type: ($parameter: SpecificType) => ..."
      echo "   3. Array Methods: .map(($parameter: any) => ...)"
      echo "   4. Event Handlers: ($parameter: React.MouseEvent) => ..."
      
      # Context-specific suggestions
      if [[ "$file" == *"components"* ]]; then
        echo "   5. Component Props: ($parameter: ComponentProps) => ..."
      fi
      
      if [[ "$parameter" == "price" || "$parameter" == "product" ]]; then
        echo "   5. Pricing Types: ($parameter: PriceType | ProductType) => ..."
      fi
      
      echo -e "${CYAN}📝 Quick Fix Command:${NC}"
      echo "   code $file:${line_info%,*}"
      
      count=$((count + 1))
    fi
  done <<< "$errors"
}

# Function to generate TS2345 fixes
generate_ts2345_fixes() {
  echo -e "\n${RED}🔴 TS2345: Argument not assignable to parameter${NC}"
  echo "=============================================="
  
  local errors=$(grep "TS2345" $LOGS_DIR/current-errors.log | head -$MAX_SUGGESTIONS)
  local count=1
  
  while IFS= read -r error; do
    if [ -n "$error" ]; then
      local file=$(echo "$error" | cut -d'(' -f1)
      local line_info=$(echo "$error" | sed -n "s/.*(\([0-9]*,[0-9]*\)).*/\1/p")
      
      echo -e "\n${YELLOW}Fix #$count:${NC} $file:$line_info"
      echo -e "${BLUE}Issue:${NC} Argument type mismatch"
      
      echo -e "${GREEN}💡 Suggested Fixes:${NC}"
      echo "   1. Type Assertion: argument as ExpectedType"
      echo "   2. Type Conversion: Convert argument to expected type"
      echo "   3. Update Interface: Modify interface to accept current type"
      echo "   4. Add Type Guard: Check type before passing argument"
      
      echo -e "${CYAN}📝 Quick Fix Command:${NC}"
      echo "   code $file:${line_info%,*}"
      
      count=$((count + 1))
    fi
  done <<< "$errors"
}

# Generate batch fix script
generate_batch_fixes() {
  echo -e "\n${PURPLE}🚀 Batch Fix Script Generator${NC}"
  echo "================================"
  
  local ts2339_count=$(grep -c "TS2339" $LOGS_DIR/current-errors.log || echo "0")
  local ts18047_count=$(grep -c "TS18047" $LOGS_DIR/current-errors.log || echo "0")
  local ts7006_count=$(grep -c "TS7006" $LOGS_DIR/current-errors.log || echo "0")
  
  cat > $LOGS_DIR/batch-fixes.sh << 'EOF'
#!/bin/bash
# Generated batch fix script
# Run with: chmod +x logs/batch-fixes.sh && ./logs/batch-fixes.sh

echo "🔧 Applying common TypeScript fixes..."

# Common TS2339 fixes (property access)
echo "Fixing property access issues..."
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/\.success !== false/(as any)?.success !== false/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/session\.user\.id/session!.user.id/g'

# Common TS7006 fixes (implicit any)
echo "Adding explicit any types to common patterns..."
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/\.map(price =>/\.map((price: any) =>/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/\.filter(item =>/\.filter((item: any) =>/g'

# Common TS18047 fixes (null safety)
echo "Adding null assertions for common patterns..."
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/updateError\.code/updateError!.code/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/updateError\.message/updateError!.message/g'

echo "✅ Batch fixes applied! Run type-check to see results."
EOF
  
  chmod +x $LOGS_DIR/batch-fixes.sh
  
  echo -e "${GREEN}📁 Generated batch fix script:${NC} $LOGS_DIR/batch-fixes.sh"
  echo -e "${YELLOW}⚠️ Review before running:${NC} cat $LOGS_DIR/batch-fixes.sh"
  echo -e "${CYAN}🚀 Execute with:${NC} ./$LOGS_DIR/batch-fixes.sh"
}

# Main execution
case $ERROR_TYPE in
  "TS2339")
    generate_ts2339_fixes
    ;;
  "TS18047")
    generate_ts18047_fixes
    ;;
  "TS7006")
    generate_ts7006_fixes
    ;;
  "TS2345")
    generate_ts2345_fixes
    ;;
  "all")
    generate_ts2339_fixes
    generate_ts18047_fixes
    generate_ts7006_fixes
    generate_ts2345_fixes
    generate_batch_fixes
    ;;
esac

echo -e "\n${BLUE}📊 Summary:${NC}"
echo "============"
local total_errors=$(grep -c "error TS" $LOGS_DIR/current-errors.log)
echo "Total errors analyzed: $total_errors"
echo "Suggestions generated for: $ERROR_TYPE"
echo "Max suggestions per type: $MAX_SUGGESTIONS"

echo -e "\n${GREEN}🎯 Next Steps:${NC}"
echo "1. Review the specific fix suggestions above"
echo "2. Apply fixes one by one, testing after each"
echo "3. Run type-check after each fix to see progress"
echo "4. Use batch fixes for common patterns (with caution)"

echo -e "\n${CYAN}💡 Pro Tips:${NC}"
echo "• Start with the highest impact errors (TS2339, TS2345)"
echo "• Test after every 3-5 fixes to catch regressions"
echo "• Use 'any' strategically for complex union types"
echo "• Add proper types incrementally as you understand the code better"

exit 0
