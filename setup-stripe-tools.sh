#!/bin/bash

# Setup script for Stripe cleanup tools
echo "🔧 Setting up Stripe cleanup tools..."

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not found. Please install Node.js first."
    exit 1
fi

# Check if we have package.json
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found. Please run this script from the project root."
    exit 1
fi

# Install required dependencies if not already present
echo "📦 Installing required dependencies..."

# Check if stripe package is installed
if ! npm list stripe &> /dev/null; then
    echo "   Installing stripe package..."
    npm install stripe
fi

# Check if dotenv package is installed
if ! npm list dotenv &> /dev/null; then
    echo "   Installing dotenv package..."
    npm install dotenv
fi

# Make scripts executable
chmod +x check-stripe-status.js
chmod +x stripe-cleanup-script.js

echo "✅ Setup completed successfully!"
echo ""
echo "Available commands:"
echo "   npm run stripe:check     - Analyze current Stripe account status"
echo "   npm run stripe:cleanup   - Clean up and reorganize Stripe products/prices"
echo ""
echo "Manual commands:"
echo "   node check-stripe-status.js    - Same as npm run stripe:check"  
echo "   node stripe-cleanup-script.js  - Same as npm run stripe:cleanup"
echo ""
echo "⚠️  IMPORTANT: Before running cleanup, make sure to:"
echo "   1. Backup your current Stripe data"
echo "   2. Test in development environment first"
echo "   3. Review the cleanup guide: STRIPE_CLEANUP_GUIDE.md"
echo ""
echo "🔍 To get started, run: npm run stripe:check"