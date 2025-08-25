#!/bin/bash

# =====================================================
# SUPABASE DOCKER CONNECTIVITY CHECK
# =====================================================
# Checks if Supabase is running properly in Docker
# and can accept database connections

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🐳 Checking Supabase Docker Setup${NC}"
echo "========================================"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo -e "${BLUE}Checking Prerequisites:${NC}"

if command_exists supabase; then
    echo -e "✅ Supabase CLI: $(supabase --version | head -n1)"
else
    echo -e "❌ Supabase CLI not found"
    echo "   Install from: https://supabase.com/docs/guides/cli"
    exit 1
fi

if command_exists docker; then
    echo -e "✅ Docker: $(docker --version | cut -d',' -f1)"
else
    echo -e "❌ Docker not found"
    echo "   Docker is required for Supabase local development"
    exit 1
fi

echo ""

# Check Supabase status
echo -e "${BLUE}Checking Supabase Status:${NC}"

if supabase status > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Supabase is running${NC}"
    echo ""
    supabase status
    echo ""
else
    echo -e "${YELLOW}⚠️  Supabase is not running${NC}"
    echo -e "${BLUE}Attempting to start Supabase...${NC}"
    
    if supabase start; then
        echo -e "${GREEN}✅ Supabase started successfully${NC}"
        echo ""
        supabase status
        echo ""
    else
        echo -e "${RED}❌ Failed to start Supabase${NC}"
        echo "Please check Docker is running and try again"
        exit 1
    fi
fi

# Test database connectivity
echo -e "${BLUE}Testing Database Connectivity:${NC}"

# Simple connectivity test
if echo "SELECT 'Database connection successful' as status;" | supabase db shell > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Database connection successful${NC}"
else
    echo -e "${RED}❌ Database connection failed${NC}"
    echo "Please check Supabase is running properly"
    exit 1
fi

# Test if we can run queries
echo -e "${BLUE}Testing Query Execution:${NC}"

test_query="SELECT 
    count(*) as table_count,
    'Schema accessible' as status 
FROM information_schema.tables 
WHERE table_schema = 'public';"

if echo "$test_query" | supabase db shell > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Query execution successful${NC}"
else
    echo -e "${RED}❌ Query execution failed${NC}"
    echo "Database may not be properly initialized"
    exit 1
fi

# Get configuration details
echo -e "${BLUE}Supabase Configuration:${NC}"

if supabase status --output env > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Configuration accessible${NC}"
    
    # Extract key configuration values
    config_output=$(supabase status --output env)
    
    api_url=$(echo "$config_output" | grep "NEXT_PUBLIC_SUPABASE_URL=" | cut -d'=' -f2)
    anon_key=$(echo "$config_output" | grep "NEXT_PUBLIC_SUPABASE_ANON_KEY=" | cut -d'=' -f2)
    
    echo "API URL: $api_url"
    echo "Anonymous Key: ${anon_key:0:20}..."
    
else
    echo -e "${YELLOW}⚠️  Could not retrieve configuration${NC}"
fi

echo ""

# Check Docker containers
echo -e "${BLUE}Docker Containers Status:${NC}"

if docker ps --filter "name=supabase" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -q "supabase"; then
    echo -e "${GREEN}✅ Supabase Docker containers running:${NC}"
    docker ps --filter "name=supabase" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
else
    echo -e "${YELLOW}⚠️  No Supabase Docker containers found${NC}"
    echo "This may indicate a setup issue"
fi

echo ""

# Final summary
echo -e "${GREEN}🎉 Docker-based Supabase Setup Check Complete${NC}"
echo ""
echo -e "${BLUE}Summary:${NC}"
echo "• Supabase CLI: Available"
echo "• Docker: Available"
echo "• Supabase Instance: Running"
echo "• Database Connection: Working"
echo "• Query Execution: Working"
echo ""
echo -e "${GREEN}✅ Ready for migration testing!${NC}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "1. Run migration tests: ./scripts/run-migration-tests.sh"
echo "2. Check migration status: supabase migration list"
echo "3. Apply migrations: supabase db push"
echo ""