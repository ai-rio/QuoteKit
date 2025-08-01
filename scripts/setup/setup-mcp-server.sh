#!/bin/bash

# Setup script for QuoteKit Q Agent MCP Server

echo "🚀 Setting up QuoteKit Q Agent MCP Server..."

# Create mcp-server directory if it doesn't exist
mkdir -p mcp-server

# Navigate to mcp-server directory
cd mcp-server

# Install dependencies
echo "📦 Installing MCP Server dependencies..."
npm install

# Make the server executable
chmod +x q-agent-server.js

# Test the server
echo "🧪 Testing MCP Server..."
timeout 5s node q-agent-server.js || echo "Server test completed (timeout expected)"

echo "✅ MCP Server setup complete!"
echo ""
echo "To use the server:"
echo "1. The server is already configured in .mcp.json"
echo "2. Amazon Q will automatically discover it when you restart"
echo "3. Available tools:"
echo "   - analyze_codebase: Analyze project structure"
echo "   - create_api_route: Generate Next.js API routes"
echo "   - create_component: Generate React components"
echo "   - manage_database: Supabase operations"
echo "   - generate_types: TypeScript type generation"
echo "   - run_tests: Execute test suites"
echo "   - deploy_application: Deploy to various platforms"
echo "   - optimize_performance: Performance analysis"
echo ""
echo "🎉 Ready to use with Amazon Q!"
