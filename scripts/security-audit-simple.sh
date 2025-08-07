#!/bin/bash

# Simple Security Audit for Edge Functions Testing
# Focuses on the most critical security issues
# Usage: ./scripts/security-audit-simple.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Simple Security Audit${NC}"
echo "======================="
echo "Checking critical security issues..."
echo "======================="

ISSUES=0

echo -e "\n${BLUE}1. Checking .gitignore protection...${NC}"

if [[ -f ".gitignore" ]]; then
    if grep -q "\.env" .gitignore && grep -q "test-credentials" .gitignore; then
        echo -e "${GREEN}✅ .gitignore protects sensitive files${NC}"
    else
        echo -e "${RED}❌ .gitignore missing security patterns${NC}"
        ((ISSUES++))
    fi
else
    echo -e "${RED}❌ .gitignore file missing${NC}"
    ((ISSUES++))
fi

echo -e "\n${BLUE}2. Checking for committed .env files...${NC}"

if git ls-files | grep -E "^\.env$|^\.env\.test$|^\.env\.production$" > /dev/null 2>&1; then
    echo -e "${RED}❌ Environment files committed to git${NC}"
    git ls-files | grep -E "^\.env$|^\.env\.test$|^\.env\.production$" | sed 's/^/   /'
    ((ISSUES++))
else
    echo -e "${GREEN}✅ No environment files committed${NC}"
fi

echo -e "\n${BLUE}3. Checking credential manager...${NC}"

if [[ -f "tests/utils/credential-manager.ts" ]]; then
    echo -e "${GREEN}✅ Secure credential manager exists${NC}"
else
    echo -e "${RED}❌ Secure credential manager missing${NC}"
    ((ISSUES++))
fi

echo -e "\n${BLUE}4. Checking for .env.test.example...${NC}"

if [[ -f ".env.test.example" ]]; then
    echo -e "${GREEN}✅ Environment template exists${NC}"
else
    echo -e "${YELLOW}⚠️  Environment template missing${NC}"
fi

echo -e "\n${BLUE}5. Checking security documentation...${NC}"

if [[ -f "docs/SECURITY.md" ]]; then
    echo -e "${GREEN}✅ Security documentation exists${NC}"
else
    echo -e "${YELLOW}⚠️  Security documentation missing${NC}"
fi

echo -e "\n${BLUE}📊 Security Status${NC}"
echo "=================="

if [[ $ISSUES -eq 0 ]]; then
    echo -e "${GREEN}🎉 SECURITY AUDIT PASSED${NC}"
    echo -e "${GREEN}✅ All critical security measures in place${NC}"
    echo -e "${GREEN}✅ Ready for secure testing${NC}"
    echo ""
    echo -e "${BLUE}💡 Next Steps:${NC}"
    echo "1. Run: ./scripts/setup-secure-testing.sh"
    echo "2. Create .env.test with your credentials"
    echo "3. Test: npm run edge-functions:test:local"
    exit 0
else
    echo -e "${RED}🚨 SECURITY AUDIT FAILED${NC}"
    echo -e "${RED}❌ $ISSUES critical issue(s) found${NC}"
    echo ""
    echo -e "${RED}🔧 REQUIRED ACTIONS:${NC}"
    echo "1. Fix all issues listed above"
    echo "2. Run audit again to verify"
    echo "3. Never commit .env files to git"
    echo "4. Use credential manager for authentication"
    exit 1
fi
