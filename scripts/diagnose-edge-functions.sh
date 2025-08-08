#!/bin/bash

# Edge Functions Diagnostic Script
# Comprehensive health check for Edge Functions setup and connectivity

set -e

echo "🔍 Edge Functions Diagnostic Tool"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Track overall status
ISSUES_FOUND=0

print_status() {
    local status=$1
    local message=$2
    
    if [ "$status" = "OK" ]; then
        echo -e "${GREEN}✅ $message${NC}"
    elif [ "$status" = "WARNING" ]; then
        echo -e "${YELLOW}⚠️  $message${NC}"
        ((ISSUES_FOUND++))
    elif [ "$status" = "ERROR" ]; then
        echo -e "${RED}❌ $message${NC}"
        ((ISSUES_FOUND++))
    else
        echo -e "${BLUE}ℹ️  $message${NC}"
    fi
}

# 1. Check if Supabase CLI is installed
echo "1. Checking Supabase CLI..."
if command -v supabase &> /dev/null; then
    SUPABASE_VERSION=$(supabase --version)
    print_status "OK" "Supabase CLI installed: $SUPABASE_VERSION"
else
    print_status "ERROR" "Supabase CLI not found. Install with: npm install -g supabase"
fi
echo ""

# 2. Check if Supabase is running
echo "2. Checking Supabase local instance..."
if curl -s http://127.0.0.1:54321 > /dev/null 2>&1; then
    print_status "OK" "Supabase is running on http://127.0.0.1:54321"
    
    # Check API health
    API_RESPONSE=$(curl -s http://127.0.0.1:54321/rest/v1/ -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0")
    if echo "$API_RESPONSE" | grep -q "swagger"; then
        print_status "OK" "Supabase REST API is responding"
    else
        print_status "WARNING" "Supabase REST API may not be fully ready"
    fi
else
    print_status "ERROR" "Supabase is not running. Start with: supabase start"
fi
echo ""

# 3. Check Edge Functions
echo "3. Checking Edge Functions..."
FUNCTIONS_DIR="supabase/functions"
if [ -d "$FUNCTIONS_DIR" ]; then
    print_status "OK" "Functions directory exists: $FUNCTIONS_DIR"
    
    # List available functions
    FUNCTION_COUNT=$(find "$FUNCTIONS_DIR" -maxdepth 1 -type d ! -path "$FUNCTIONS_DIR" ! -name "_shared" | wc -l)
    if [ "$FUNCTION_COUNT" -gt 0 ]; then
        print_status "OK" "Found $FUNCTION_COUNT Edge Functions:"
        find "$FUNCTIONS_DIR" -maxdepth 1 -type d ! -path "$FUNCTIONS_DIR" ! -name "_shared" | while read -r func_dir; do
            func_name=$(basename "$func_dir")
            echo "   - $func_name"
        done
    else
        print_status "WARNING" "No Edge Functions found in $FUNCTIONS_DIR"
    fi
else
    print_status "ERROR" "Functions directory not found: $FUNCTIONS_DIR"
fi
echo ""

# 4. Test Edge Functions connectivity
echo "4. Testing Edge Functions connectivity..."
if curl -s http://127.0.0.1:54321 > /dev/null 2>&1; then
    # Test the test-connection function if it exists
    if [ -d "$FUNCTIONS_DIR/test-connection" ]; then
        print_status "INFO" "Testing test-connection function..."
        
        FUNCTION_RESPONSE=$(curl -s -w "%{http_code}" -X POST \
            "http://127.0.0.1:54321/functions/v1/test-connection" \
            -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0" \
            -H "Content-Type: application/json" \
            -d '{"test": true}' 2>/dev/null)
        
        HTTP_CODE="${FUNCTION_RESPONSE: -3}"
        RESPONSE_BODY="${FUNCTION_RESPONSE%???}"
        
        if [ "$HTTP_CODE" = "200" ]; then
            print_status "OK" "test-connection function is working (HTTP $HTTP_CODE)"
            if echo "$RESPONSE_BODY" | grep -q "success.*true"; then
                print_status "OK" "Function returned successful response"
            fi
        elif [ "$HTTP_CODE" = "404" ]; then
            print_status "WARNING" "test-connection function not deployed (HTTP $HTTP_CODE)"
        else
            print_status "ERROR" "test-connection function failed (HTTP $HTTP_CODE)"
        fi
    else
        print_status "INFO" "test-connection function not found, skipping connectivity test"
    fi
else
    print_status "ERROR" "Cannot test Edge Functions - Supabase not running"
fi
echo ""

# 5. Check database migrations
echo "5. Checking database setup..."
if command -v supabase &> /dev/null && curl -s http://127.0.0.1:54321 > /dev/null 2>&1; then
    # Check if admin user exists
    ADMIN_CHECK=$(curl -s -X POST "http://127.0.0.1:54321/rest/v1/rpc/is_admin" \
        -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0" \
        -H "Content-Type: application/json" \
        -H "Prefer: return=representation" \
        -d '{}' 2>/dev/null || echo "error")
    
    if echo "$ADMIN_CHECK" | grep -q "error\|not found"; then
        print_status "WARNING" "Admin functions may not be available - run: supabase migration up"
    else
        print_status "OK" "Database functions are available"
    fi
    
    # Check if performance tables exist
    PERF_CHECK=$(curl -s "http://127.0.0.1:54321/rest/v1/edge_function_performance?select=id&limit=1" \
        -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0" 2>/dev/null || echo "error")
    
    if echo "$PERF_CHECK" | grep -q "error\|not found"; then
        print_status "WARNING" "Performance monitoring tables not found - run: supabase migration up"
    else
        print_status "OK" "Performance monitoring tables exist"
    fi
else
    print_status "ERROR" "Cannot check database - Supabase CLI or instance not available"
fi
echo ""

# 6. Check environment variables
echo "6. Checking environment configuration..."
if [ -f ".env.local" ]; then
    print_status "OK" ".env.local file exists"
    
    if grep -q "NEXT_PUBLIC_SUPABASE_URL" .env.local; then
        print_status "OK" "NEXT_PUBLIC_SUPABASE_URL is set"
    else
        print_status "WARNING" "NEXT_PUBLIC_SUPABASE_URL not found in .env.local"
    fi
    
    if grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY" .env.local; then
        print_status "OK" "NEXT_PUBLIC_SUPABASE_ANON_KEY is set"
    else
        print_status "WARNING" "NEXT_PUBLIC_SUPABASE_ANON_KEY not found in .env.local"
    fi
else
    print_status "WARNING" ".env.local file not found - copy from .env.local.example"
fi
echo ""

# 7. Check Next.js development server
echo "7. Checking Next.js development server..."
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    print_status "OK" "Next.js development server is running on http://localhost:3000"
else
    print_status "INFO" "Next.js development server not running - start with: npm run dev"
fi
echo ""

# Summary
echo "=================================="
echo "🏁 Diagnostic Summary"
echo "=================================="

if [ $ISSUES_FOUND -eq 0 ]; then
    print_status "OK" "No issues found! Your Edge Functions setup looks good."
    echo ""
    echo -e "${GREEN}✅ You can now test Edge Functions at:${NC}"
    echo "   http://localhost:3000/test-edge-functions"
else
    print_status "WARNING" "Found $ISSUES_FOUND potential issues that may need attention."
    echo ""
    echo -e "${YELLOW}🔧 Quick fix commands:${NC}"
    echo "   supabase start"
    echo "   supabase migration up"
    echo "   supabase functions deploy"
    echo "   npm run dev"
fi

echo ""
echo -e "${BLUE}📚 Useful links:${NC}"
echo "   • Supabase Studio: http://127.0.0.1:54323"
echo "   • API Docs: http://127.0.0.1:54321"
echo "   • Test Page: http://localhost:3000/test-edge-functions"
echo "   • Email Testing: http://127.0.0.1:54324"
echo ""
