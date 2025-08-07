#!/bin/bash

# Focused Security Audit for Edge Functions Testing
# Checks for real security issues, ignoring test files and documentation
# Usage: ./scripts/security-audit-focused.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Focused Security Audit${NC}"
echo "========================="
echo "Checking for real security issues in Edge Functions testing..."
echo "========================="

# Initialize counters
CRITICAL_ISSUES=0
WARNINGS=0

# Function to report critical issue
report_critical() {
    echo -e "${RED}🚨 CRITICAL: $1${NC}"
    ((CRITICAL_ISSUES++))
}

# Function to report warning
report_warning() {
    echo -e "${YELLOW}⚠️  WARNING: $1${NC}"
    ((WARNINGS++))
}

# Function to report success
report_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

echo -e "\n${BLUE}1. Checking for committed .env files...${NC}"

# Check for actual .env files (not examples)
COMMITTED_ENV_FILES=$(git ls-files | grep -E "^\.env$|^\.env\.test$|^\.env\.production$|^\.env\.local$" || true)
if [[ -n "$COMMITTED_ENV_FILES" ]]; then
    report_critical "Real environment files committed to git:"
    echo "$COMMITTED_ENV_FILES" | sed 's/^/   /'
else
    report_success "No real .env files committed to git"
fi

echo -e "\n${BLUE}2. Checking for hardcoded credentials in source code...${NC}"

# Check for hardcoded JWTs in actual source files (not tests/docs)
HARDCODED_JWTS=$(find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | \
    grep -v node_modules | \
    grep -v "\.test\." | \
    grep -v "\.spec\." | \
    grep -v "/tests/" | \
    grep -v "/docs/" | \
    grep -v "security-hardening" | \
    xargs grep -l "const.*=.*['\"]eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*['\"]" 2>/dev/null || true)

if [[ -n "$HARDCODED_JWTS" ]]; then
    report_critical "Hardcoded JWT tokens found in source code:"
    echo "$HARDCODED_JWTS" | sed 's/^/   /'
else
    report_success "No hardcoded JWT tokens in source code"
fi

# Check for hardcoded API keys (excluding mock/test keys)
HARDCODED_KEYS=$(find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | \
    grep -v node_modules | \
    grep -v "\.test\." | \
    grep -v "\.spec\." | \
    grep -v "/tests/" | \
    grep -v "/docs/" | \
    xargs grep -l "sk_test_[A-Za-z0-9]\{20,\}\|sk_live_[A-Za-z0-9]\{20,\}\|pk_test_[A-Za-z0-9]\{20,\}\|pk_live_[A-Za-z0-9]\{20,\}" 2>/dev/null | \
    xargs grep -L "mock\|test.*only\|placeholder" 2>/dev/null || true)

if [[ -n "$HARDCODED_KEYS" ]]; then
    report_critical "Real hardcoded API keys found in source code:"
    echo "$HARDCODED_KEYS" | sed 's/^/   /'
else
    report_success "No real hardcoded API keys in source code (mock keys are OK)"
fi

echo -e "\n${BLUE}3. Checking .gitignore security coverage...${NC}"

if [[ ! -f ".gitignore" ]]; then
    report_critical ".gitignore file missing"
else
    # Check for essential patterns
    MISSING_PATTERNS=()
    
    if ! grep -q "\.env$" .gitignore; then
        MISSING_PATTERNS+=(".env")
    fi
    
    if ! grep -q "\.env\.test" .gitignore; then
        MISSING_PATTERNS+=(".env.test")
    fi
    
    if ! grep -q "test-credentials" .gitignore; then
        MISSING_PATTERNS+=("test-credentials")
    fi
    
    if [[ ${#MISSING_PATTERNS[@]} -gt 0 ]]; then
        report_warning ".gitignore missing security patterns: ${MISSING_PATTERNS[*]}"
    else
        report_success ".gitignore has essential security patterns"
    fi
fi

echo -e "\n${BLUE}4. Checking for sensitive files in working directory...${NC}"

# Check for actual sensitive files
SENSITIVE_FILES_FOUND=()

if [[ -f ".env" && ! $(git check-ignore ".env" 2>/dev/null) ]]; then
    SENSITIVE_FILES_FOUND+=(".env")
fi

if [[ -f ".env.test" && ! $(git check-ignore ".env.test" 2>/dev/null) ]]; then
    SENSITIVE_FILES_FOUND+=(".env.test")
fi

if [[ -f "test-credentials.json" && ! $(git check-ignore "test-credentials.json" 2>/dev/null) ]]; then
    SENSITIVE_FILES_FOUND+=("test-credentials.json")
fi

if [[ ${#SENSITIVE_FILES_FOUND[@]} -gt 0 ]]; then
    report_critical "Sensitive files not ignored by git: ${SENSITIVE_FILES_FOUND[*]}"
else
    report_success "No unprotected sensitive files found"
fi

echo -e "\n${BLUE}5. Checking credential manager implementation...${NC}"

if [[ -f "tests/utils/credential-manager.ts" ]]; then
    # Check if credential manager properly masks credentials
    if grep -q "getMaskedCredential" tests/utils/credential-manager.ts; then
        report_success "Credential manager has masking functionality"
    else
        report_warning "Credential manager missing masking functionality"
    fi
    
    # Check if it validates credentials
    if grep -q "validateCredentials" tests/utils/credential-manager.ts; then
        report_success "Credential manager has validation"
    else
        report_warning "Credential manager missing validation"
    fi
else
    report_critical "Secure credential manager not found"
fi

echo -e "\n${BLUE}6. Checking test files for secure practices...${NC}"

# Check if test files use credential manager instead of hardcoded tokens
TEST_FILES_WITH_HARDCODED=$(find tests/ -name "*.ts" 2>/dev/null | \
    xargs grep -l "Bearer eyJ\|const.*JWT.*=" 2>/dev/null | \
    grep -v credential-manager || true)

if [[ -n "$TEST_FILES_WITH_HARDCODED" ]]; then
    report_warning "Test files may have hardcoded credentials:"
    echo "$TEST_FILES_WITH_HARDCODED" | sed 's/^/   /'
else
    report_success "Test files appear to use secure credential management"
fi

echo -e "\n${BLUE}📊 Security Audit Results${NC}"
echo "========================="
echo -e "🚨 Critical Issues: ${RED}$CRITICAL_ISSUES${NC}"
echo -e "⚠️  Warnings: ${YELLOW}$WARNINGS${NC}"

if [[ $CRITICAL_ISSUES -eq 0 && $WARNINGS -eq 0 ]]; then
    echo -e "\n${GREEN}🎉 SECURITY AUDIT PASSED${NC}"
    echo -e "${GREEN}✅ No security issues found${NC}"
    echo -e "${GREEN}✅ Credentials are properly protected${NC}"
    echo -e "${GREEN}✅ Ready for secure testing${NC}"
    exit 0
elif [[ $CRITICAL_ISSUES -eq 0 ]]; then
    echo -e "\n${YELLOW}⚠️  SECURITY AUDIT PASSED WITH WARNINGS${NC}"
    echo -e "${GREEN}✅ No critical issues found${NC}"
    echo -e "${YELLOW}⚠️  $WARNINGS warning(s) should be addressed${NC}"
    exit 2
else
    echo -e "\n${RED}🚨 SECURITY AUDIT FAILED${NC}"
    echo -e "${RED}❌ $CRITICAL_ISSUES critical issue(s) must be fixed${NC}"
    echo -e "${YELLOW}⚠️  $WARNINGS warning(s) also need attention${NC}"
    echo ""
    echo -e "${RED}🔧 IMMEDIATE ACTIONS REQUIRED:${NC}"
    echo "1. Remove any committed .env files from git"
    echo "2. Remove hardcoded credentials from source code"
    echo "3. Update .gitignore to protect sensitive files"
    echo "4. Use credential manager for all authentication"
    echo "5. Run audit again to verify fixes"
    exit 1
fi
