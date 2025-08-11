#!/bin/bash
# QuoteKit Supabase API Keys Setup Script
# This script helps you configure Supabase API keys after the security incident

set -e  # Exit on any error

echo "🔑 QuoteKit Supabase API Keys Setup"
echo "===================================="
echo ""
echo "⚠️  SECURITY INCIDENT RESPONSE"
echo "This script helps you configure NEW Supabase API keys after the GitGuardian incident."
echo "All previous keys have been compromised and must be rotated."
echo ""

# Change to project root
cd "$(dirname "$0")/.."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 Step 1: Get Your New API Keys${NC}"
echo "1. Go to: https://supabase.com/dashboard/project/bujajubcktlpblewxtel/settings/api"
echo "2. Reset your Service Role Key (click 'Reset' button)"
echo "3. Copy the new keys"
echo ""

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}📝 Creating .env.local file...${NC}"
    cp .env.local.example .env.local
fi

echo -e "${BLUE}🔧 Step 2: Configure Environment Variables${NC}"
echo ""

# Function to prompt for input
prompt_for_key() {
    local var_name=$1
    local description=$2
    local is_secret=$3
    
    echo -e "${YELLOW}Enter $description:${NC}"
    if [ "$is_secret" = "true" ]; then
        read -s value
        echo ""
    else
        read value
    fi
    
    # Update .env.local
    if grep -q "^$var_name=" .env.local; then
        # Replace existing line
        sed -i "s|^$var_name=.*|$var_name=$value|" .env.local
    else
        # Add new line
        echo "$var_name=$value" >> .env.local
    fi
    
    echo -e "${GREEN}✅ $var_name updated${NC}"
    echo ""
}

# Prompt for Supabase keys
echo -e "${BLUE}🔑 Supabase Configuration${NC}"
echo "Project URL (should be): https://bujajubcktlpblewxtel.supabase.co"
prompt_for_key "NEXT_PUBLIC_SUPABASE_URL" "Supabase Project URL" false

echo "Anon Key (starts with eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...):"
prompt_for_key "NEXT_PUBLIC_SUPABASE_ANON_KEY" "Supabase Anon Key" true

echo "Service Role Key (starts with eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...):"
prompt_for_key "SUPABASE_SERVICE_ROLE_KEY" "Supabase Service Role Key" true

echo "Database Password:"
prompt_for_key "SUPABASE_DB_PASSWORD" "Supabase Database Password" true

echo -e "${GREEN}✅ Supabase configuration complete!${NC}"
echo ""

# Test connection
echo -e "${BLUE}🧪 Step 3: Testing Connection${NC}"
echo "Testing Supabase connection..."

# Create a simple test script
cat > test-supabase.js << 'EOF'
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    try {
        const { data, error } = await supabase.from('profiles').select('count');
        if (error) {
            console.log('⚠️  Connection test result:', error.message);
        } else {
            console.log('✅ Supabase connection successful!');
        }
    } catch (err) {
        console.log('⚠️  Connection test error:', err.message);
    }
}

testConnection();
EOF

# Run test if Node.js is available
if command -v node &> /dev/null; then
    if [ -f "node_modules/@supabase/supabase-js/package.json" ]; then
        node test-supabase.js
        rm test-supabase.js
    else
        echo "⚠️  Supabase client not installed. Run 'npm install' first."
    fi
else
    echo "⚠️  Node.js not found. Skipping connection test."
fi

echo ""
echo -e "${BLUE}🚀 Step 4: Deploy to Production${NC}"
echo "Update your production environment variables:"
echo ""
echo "For Fly.io:"
echo "fly secrets set NEXT_PUBLIC_SUPABASE_URL=\"\$(grep NEXT_PUBLIC_SUPABASE_URL .env.local | cut -d '=' -f2)\""
echo "fly secrets set NEXT_PUBLIC_SUPABASE_ANON_KEY=\"\$(grep NEXT_PUBLIC_SUPABASE_ANON_KEY .env.local | cut -d '=' -f2)\""
echo "fly secrets set SUPABASE_SERVICE_ROLE_KEY=\"\$(grep SUPABASE_SERVICE_ROLE_KEY .env.local | cut -d '=' -f2)\""
echo "fly secrets set SUPABASE_DB_PASSWORD=\"\$(grep SUPABASE_DB_PASSWORD .env.local | cut -d '=' -f2)\""
echo ""

echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo ""
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo "1. Test your application locally: npm run dev"
echo "2. Update production environment variables"
echo "3. Deploy your application: fly deploy"
echo "4. Monitor for any authentication errors"
echo ""
echo -e "${RED}⚠️  Security Reminders:${NC}"
echo "- Never commit .env.local or .env.production to version control"
echo "- Rotate keys every 90 days"
echo "- Monitor API usage for anomalies"
echo "- Service Role Key should NEVER be exposed to client-side code"
echo ""
echo "For more details, see: docs/SUPABASE_API_KEYS_GUIDE.md"
