#!/bin/bash

# Security Audit Script for Edge Functions Testing
# Checks for accidentally committed credentials and sensitive files
# Usage: ./scripts/security-audit.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Security Audit for Edge Functions Testing${NC}"
echo "=============================================="
echo "Scanning for accidentally committed credentials and sensitive files..."
echo "=============================================="

# Initialize counters
ISSUES_FOUND=0
WARNINGS_FOUND=0

# Function to report security issue
report_issue() {
    echo -e "${RED}🚨 SECURITY ISSUE: $1${NC}"
    ((ISSUES_FOUND++))
}

# Function to report warning
report_warning() {
    echo -e "${YELLOW}⚠️  WARNING: $1${NC}"
    ((WARNINGS_FOUND++))
}

# Function to report success
report_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

echo -e "\n${BLUE}1. Checking for committed credential files...${NC}"

# Check for .env files in git (but allow .example files)
if git ls-files | grep -E "\.env(\.|$)" | grep -v "\.example$" > /dev/null 2>&1; then
    report_issue "Environment files found in git:"
    git ls-files | grep -E "\.env(\.|$)" | grep -v "\.example$" | sed 's/^/   /'
else
    report_success "No .env files committed to git (example files are OK)"
fi

# Check for credential files
CREDENTIAL_PATTERNS=(
    "test-credentials"
    "jwt-token"
    "service-role-key"
    "supabase-key"
    "api-key"
    "bearer-token"
    "access-token"
)

for pattern in "${CREDENTIAL_PATTERNS[@]}"; do
    if git ls-files | grep -i "$pattern" > /dev/null 2>&1; then
        report_issue "Credential files found in git (pattern: $pattern):"
        git ls-files | grep -i "$pattern" | sed 's/^/   /'
    fi
done

echo -e "\n${BLUE}2. Scanning file contents for hardcoded credentials...${NC}"

# Patterns that might indicate hardcoded credentials
DANGEROUS_PATTERNS=(
    "eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*"  # JWT tokens
    "sk_test_[A-Za-z0-9]*"                                  # Stripe test keys
    "sk_live_[A-Za-z0-9]*"                                  # Stripe live keys
    "pk_test_[A-Za-z0-9]*"                                  # Stripe public test keys
    "pk_live_[A-Za-z0-9]*"                                  # Stripe public live keys
    "supabase_[A-Za-z0-9_]*"                               # Supabase keys
)

# Files to scan (exclude node_modules, .git, etc.)
SCAN_FILES=$(find . -type f \( -name "*.ts" -o -name "*.js" -o -name "*.tsx" -o -name "*.jsx" -o -name "*.json" -o -name "*.md" \) \
    -not -path "./node_modules/*" \
    -not -path "./.git/*" \
    -not -path "./.next/*" \
    -not -path "./build/*" \
    -not -path "./.vercel/*" \
    -not -path "./coverage/*" \
    -not -path "./supabase/functions/security-hardening/*")  # Exclude security test files

for pattern in "${DANGEROUS_PATTERNS[@]}"; do
    if echo "$SCAN_FILES" | xargs grep -l "$pattern" 2>/dev/null; then
        report_warning "Potential hardcoded credentials found (pattern: JWT/API key):"
        echo "$SCAN_FILES" | xargs grep -n "$pattern" 2>/dev/null | head -5 | sed 's/^/   /'
        if [ $(echo "$SCAN_FILES" | xargs grep -c "$pattern" 2>/dev/null | awk -F: '{sum+=$2} END {print sum}') -gt 5 ]; then
            echo "   ... and more matches found"
        fi
    fi
done

echo -e "\n${BLUE}3. Checking .gitignore coverage...${NC}"

# Check if .gitignore exists and has security patterns
if [[ ! -f ".gitignore" ]]; then
    report_issue ".gitignore file not found"
else
    # Check for essential security patterns in .gitignore
    REQUIRED_PATTERNS=(
        "\.env"
        "\.env\."
        "test-credentials"
        "jwt-token"
        "service-role-key"
    )
    
    for pattern in "${REQUIRED_PATTERNS[@]}"; do
        if ! grep -q "$pattern" .gitignore; then
            report_warning ".gitignore missing pattern: $pattern"
        fi
    done
    
    if grep -q "SECURITY:" .gitignore; then
        report_success ".gitignore has security section"
    else
        report_warning ".gitignore missing security documentation"
    fi
fi

echo -e "\n${BLUE}4. Checking for sensitive files in working directory...${NC}"

# Check for sensitive files that should be ignored
SENSITIVE_FILES=(
    ".env"
    ".env.local"
    ".env.test"
    ".env.production"
    "test-credentials.json"
    "jwt-token.txt"
    "service-role-key.txt"
)

for file in "${SENSITIVE_FILES[@]}"; do
    if [[ -f "$file" ]]; then
        if git check-ignore "$file" > /dev/null 2>&1; then
            report_success "Sensitive file '$file' is properly ignored"
        else
            report_issue "Sensitive file '$file' exists but is NOT ignored by git"
        fi
    fi
done

echo -e "\n${BLUE}5. Checking git history for accidentally committed secrets...${NC}"

# Check recent commits for potential secrets (last 10 commits)
if git log --oneline -10 --grep="password\|secret\|key\|token" > /dev/null 2>&1; then
    report_warning "Commit messages mention sensitive terms:"
    git log --oneline -10 --grep="password\|secret\|key\|token" | sed 's/^/   /'
fi

# Check for large files that might contain secrets
LARGE_FILES=$(git ls-files | xargs ls -la 2>/dev/null | awk '$5 > 1048576 {print $9, $5}' | head -5)
if [[ -n "$LARGE_FILES" ]]; then
    report_warning "Large files found (might contain secrets):"
    echo "$LARGE_FILES" | sed 's/^/   /'
fi

echo -e "\n${BLUE}6. Validating current security setup...${NC}"

# Check if credential manager exists
if [[ -f "tests/utils/credential-manager.ts" ]]; then
    report_success "Secure credential manager found"
else
    report_issue "Secure credential manager not found"
fi

# Check if security documentation exists
if [[ -f "docs/SECURITY.md" ]]; then
    report_success "Security documentation found"
else
    report_warning "Security documentation missing"
fi

# Check if .env.test.example exists
if [[ -f ".env.test.example" ]]; then
    report_success "Environment template found"
else
    report_warning "Environment template (.env.test.example) missing"
fi

echo -e "\n${BLUE}7. Testing credential manager security...${NC}"

# Test if credential manager properly masks credentials
if [[ -f "tests/utils/credential-manager.ts" ]]; then
    if deno run --allow-all -e "
        try {
            const { SecureCredentialManager } = await import('./tests/utils/credential-manager.ts');
            const manager = new SecureCredentialManager({ maskInLogs: true });
            const masked = manager.getMaskedCredential('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token');
            if (masked.includes('***')) {
                console.log('✅ Credential masking working');
            } else {
                console.log('❌ Credential masking failed');
                Deno.exit(1);
            }
        } catch (error) {
            console.log('⚠️  Could not test credential manager:', error.message);
        }
    " 2>/dev/null; then
        report_success "Credential masking is working"
    else
        report_warning "Could not verify credential masking"
    fi
fi

# Final security assessment
echo -e "\n${BLUE}📊 Security Audit Summary${NC}"
echo "=========================="
echo -e "🚨 Security Issues: ${RED}$ISSUES_FOUND${NC}"
echo -e "⚠️  Warnings: ${YELLOW}$WARNINGS_FOUND${NC}"

if [[ $ISSUES_FOUND -eq 0 && $WARNINGS_FOUND -eq 0 ]]; then
    echo -e "\n${GREEN}🎉 SECURITY AUDIT PASSED${NC}"
    echo -e "${GREEN}✅ No security issues found${NC}"
    echo -e "${GREEN}✅ All credentials properly protected${NC}"
    echo -e "${GREEN}✅ .gitignore is comprehensive${NC}"
    echo -e "${GREEN}✅ Security measures are in place${NC}"
elif [[ $ISSUES_FOUND -eq 0 ]]; then
    echo -e "\n${YELLOW}⚠️  SECURITY AUDIT PASSED WITH WARNINGS${NC}"
    echo -e "${GREEN}✅ No critical security issues found${NC}"
    echo -e "${YELLOW}⚠️  $WARNINGS_FOUND warning(s) should be addressed${NC}"
else
    echo -e "\n${RED}🚨 SECURITY AUDIT FAILED${NC}"
    echo -e "${RED}❌ $ISSUES_FOUND critical security issue(s) found${NC}"
    echo -e "${YELLOW}⚠️  $WARNINGS_FOUND warning(s) also need attention${NC}"
    echo ""
    echo -e "${RED}🔧 IMMEDIATE ACTIONS REQUIRED:${NC}"
    echo "1. Fix all security issues listed above"
    echo "2. Remove any committed credentials from git history"
    echo "3. Rotate any exposed credentials"
    echo "4. Update .gitignore to prevent future issues"
    echo "5. Run this audit again to verify fixes"
fi

echo -e "\n${BLUE}💡 Security Recommendations${NC}"
echo "=========================="
echo "1. Run this audit regularly: ./scripts/security-audit.sh"
echo "2. Use secure setup: ./scripts/setup-secure-testing.sh"
echo "3. Review security docs: docs/SECURITY.md"
echo "4. Never commit .env.test or credential files"
echo "5. Rotate test credentials regularly"
echo "6. Use credential manager for all authentication"

# Exit with appropriate code
if [[ $ISSUES_FOUND -gt 0 ]]; then
    exit 1
elif [[ $WARNINGS_FOUND -gt 0 ]]; then
    exit 2
else
    exit 0
fi
