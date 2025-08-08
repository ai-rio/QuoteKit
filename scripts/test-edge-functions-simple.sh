#!/bin/bash

echo "🧪 Simple Edge Functions Test"
echo "============================="

# Configuration
SUPABASE_URL="http://localhost:54321"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"

echo "Testing Supabase connectivity..."

# Test 1: Basic connectivity
echo "1. Testing basic Supabase connectivity..."
curl -s -o /dev/null -w "Status: %{http_code}, Time: %{time_total}s\n" \
  -H "apikey: $ANON_KEY" \
  "$SUPABASE_URL/rest/v1/"

# Test 2: Edge Functions endpoint
echo "2. Testing Edge Functions endpoint..."
curl -s -o /dev/null -w "Status: %{http_code}, Time: %{time_total}s\n" \
  -H "Authorization: Bearer $ANON_KEY" \
  "$SUPABASE_URL/functions/v1/"

# Test 3: Specific function test
echo "3. Testing subscription-status function..."
response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action": "health-check"}' \
  "$SUPABASE_URL/functions/v1/subscription-status")

http_status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)
response_body=$(echo "$response" | sed '/HTTP_STATUS:/d')

echo "Status: $http_status"
echo "Response: $response_body"

# Test 4: List available functions
echo "4. Checking available functions..."
if command -v supabase &> /dev/null; then
  echo "Available Edge Functions:"
  supabase functions list 2>/dev/null || echo "Could not list functions"
else
  echo "Supabase CLI not available"
fi

# Test 5: Docker containers
echo "5. Checking Docker containers..."
if command -v docker &> /dev/null; then
  echo "Supabase containers:"
  docker ps --format "table {{.Names}}\t{{.Status}}" | grep supabase || echo "No Supabase containers found"
else
  echo "Docker not available"
fi

echo ""
echo "💡 Troubleshooting Tips:"
echo "- If status is 000: Supabase is not running (run: supabase start)"
echo "- If status is 404: Function not found or not deployed"
echo "- If status is 500: Function error (check logs)"
echo "- If status is 200: Function is working!"
echo ""
echo "🔧 Quick fixes:"
echo "- supabase stop && supabase start"
echo "- Check http://localhost:54323 (Supabase Studio)"
echo "- Verify functions exist in supabase/functions/ directory"
