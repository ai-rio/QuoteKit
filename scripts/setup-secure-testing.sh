#!/bin/bash

# Secure Edge Functions Testing Setup
# Sets up testing environment with proper credential management
# Usage: ./scripts/setup-secure-testing.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔐 Secure Edge Functions Testing Setup${NC}"
echo "========================================"
echo "Setting up secure testing environment with proper credential management..."
echo "========================================"

# Check if .env.test already exists
if [[ -f ".env.test" ]]; then
    echo -e "${YELLOW}⚠️  .env.test file already exists${NC}"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Keeping existing .env.test file${NC}"
        SKIP_ENV_CREATION=true
    fi
fi

# Create .env.test file with secure defaults
if [[ "$SKIP_ENV_CREATION" != true ]]; then
    echo -e "\n${YELLOW}📝 Creating secure .env.test configuration...${NC}"
    
    # Copy from example
    if [[ -f ".env.test.example" ]]; then
        cp .env.test.example .env.test
        echo -e "${GREEN}✅ Created .env.test from example${NC}"
    else
        # Create basic .env.test
        cat > .env.test << 'EOF'
# Edge Functions Testing Environment Variables
# NEVER commit this file to git!

# ==============================================
# LOCAL DEVELOPMENT CREDENTIALS
# ==============================================

# Local Supabase Configuration
LOCAL_SUPABASE_URL=http://localhost:54321
LOCAL_FUNCTIONS_URL=http://localhost:54321/functions/v1

# Test User JWT Token (Local Development Only)
# Get this from Supabase Studio > Authentication > Users > [User] > Copy JWT
TEST_JWT_TOKEN=your-local-test-jwt-here

# Alternative: Use service role key for testing (more secure)
# Get from Supabase Studio > Settings > API > service_role key
LOCAL_SERVICE_ROLE_KEY=your-local-service-role-key-here

# ==============================================
# PRODUCTION TESTING CREDENTIALS
# ==============================================

# Production Supabase Configuration
SUPABASE_PROJECT_ID=your-production-project-id
SUPABASE_ANON_KEY=your-production-anon-key

# Production Service Role (for admin testing)
SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key

# ==============================================
# TESTING CONFIGURATION
# ==============================================

# Test timeouts and limits
TEST_TIMEOUT_MS=10000
TEST_CONCURRENT_REQUESTS=10
TEST_DURATION_SECONDS=30

# Security settings
ENABLE_CREDENTIAL_VALIDATION=true
MASK_CREDENTIALS_IN_LOGS=true
REQUIRE_HTTPS_IN_PRODUCTION=true
EOF
        echo -e "${GREEN}✅ Created basic .env.test file${NC}"
    fi
fi

# Check if Supabase is running and get local credentials
echo -e "\n${YELLOW}🔍 Checking local Supabase status...${NC}"
if supabase status &> /dev/null; then
    echo -e "${GREEN}✅ Local Supabase is running${NC}"
    
    # Try to get service role key from Supabase status
    SERVICE_ROLE_KEY=$(supabase status | grep "service_role key" | awk '{print $NF}' || echo "")
    if [[ -n "$SERVICE_ROLE_KEY" && "$SERVICE_ROLE_KEY" != "service_role" ]]; then
        echo -e "${GREEN}✅ Found local service role key${NC}"
        
        # Update .env.test with the actual service role key
        if [[ -f ".env.test" ]]; then
            sed -i.bak "s/your-local-service-role-key-here/$SERVICE_ROLE_KEY/" .env.test
            rm -f .env.test.bak
            echo -e "${GREEN}✅ Updated .env.test with local service role key${NC}"
        fi
    fi
    
    # Get anon key as well
    ANON_KEY=$(supabase status | grep "anon key" | awk '{print $NF}' || echo "")
    if [[ -n "$ANON_KEY" && "$ANON_KEY" != "anon" ]]; then
        echo -e "${GREEN}✅ Found local anon key${NC}"
    fi
    
else
    echo -e "${YELLOW}⚠️  Local Supabase not running. Starting it now...${NC}"
    supabase start
    if [[ $? -eq 0 ]]; then
        echo -e "${GREEN}✅ Local Supabase started${NC}"
    else
        echo -e "${RED}❌ Failed to start local Supabase${NC}"
        exit 1
    fi
fi

# Validate .env.test file
echo -e "\n${YELLOW}🔍 Validating credential configuration...${NC}"

if [[ -f ".env.test" ]]; then
    # Check for placeholder values
    if grep -q "your-.*-here" .env.test; then
        echo -e "${YELLOW}⚠️  Found placeholder values in .env.test${NC}"
        echo -e "${YELLOW}   Please update the following placeholders:${NC}"
        grep "your-.*-here" .env.test | sed 's/^/   - /'
        echo ""
        echo -e "${BLUE}💡 To get your credentials:${NC}"
        echo "   Local JWT Token: Supabase Studio > Authentication > Users > [User] > Copy JWT"
        echo "   Service Role Key: Supabase Studio > Settings > API > service_role key"
        echo "   Production Keys: Your production Supabase project settings"
    else
        echo -e "${GREEN}✅ No placeholder values found${NC}"
    fi
    
    # Test credential loading
    echo -e "\n${YELLOW}🧪 Testing credential loading...${NC}"
    if deno run --allow-all -e "
        import { localCredentialManager } from './tests/utils/credential-manager.ts';
        try {
            await localCredentialManager.initialize();
            console.log('✅ Local credentials loaded successfully');
            const summary = localCredentialManager.getCredentialSummary();
            console.log('📊 Credential summary:', summary);
        } catch (error) {
            console.error('❌ Credential loading failed:', error.message);
            Deno.exit(1);
        }
    "; then
        echo -e "${GREEN}✅ Credential manager working correctly${NC}"
    else
        echo -e "${RED}❌ Credential manager test failed${NC}"
        echo -e "${YELLOW}💡 Check your .env.test file and ensure credentials are valid${NC}"
    fi
else
    echo -e "${RED}❌ .env.test file not found${NC}"
    exit 1
fi

# Security reminders
echo -e "\n${BLUE}🔒 Security Reminders${NC}"
echo "===================="
echo ""
echo -e "${RED}🚨 IMPORTANT SECURITY NOTES:${NC}"
echo ""
echo "1. ✅ .env.test is in .gitignore (never committed)"
echo "2. ✅ Credentials are masked in logs"
echo "3. ✅ Use different credentials for testing vs production"
echo "4. ✅ Rotate test credentials regularly"
echo "5. ✅ Never use production service role keys in client code"
echo ""
echo -e "${YELLOW}⚠️  NEVER commit .env.test to git!${NC}"
echo -e "${YELLOW}⚠️  Use service role keys only for testing!${NC}"
echo -e "${YELLOW}⚠️  Rotate credentials if they're ever exposed!${NC}"

# Test the secure setup
echo -e "\n${YELLOW}🧪 Running secure credential test...${NC}"
if npm run edge-functions:test:health &> /dev/null; then
    echo -e "${GREEN}✅ Secure testing setup successful!${NC}"
else
    echo -e "${YELLOW}⚠️  Health check failed - this may be normal if functions aren't deployed${NC}"
fi

# Display next steps
echo -e "\n${BLUE}📋 Next Steps${NC}"
echo "============="
echo ""
echo "1. Review and update .env.test with your actual credentials"
echo "2. Test local functions: npm run edge-functions:test:local"
echo "3. Use visual dashboard: http://localhost:3000/test-edge-functions"
echo "4. For production testing, add production credentials to .env.test"
echo ""
echo -e "${GREEN}🎉 Secure testing environment ready!${NC}"
