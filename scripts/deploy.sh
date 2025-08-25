#!/bin/bash

# QuoteKit Fly.io Deployment Script
# Run this script after authenticating with Fly.io

set -e

echo "🚀 Starting QuoteKit deployment to Fly.io..."

# Set Fly CLI path
export PATH="/root/.fly/bin:$PATH"

# Check if user is authenticated
echo "✅ Checking Fly.io authentication..."
if ! flyctl auth whoami > /dev/null 2>&1; then
    echo "❌ Not authenticated with Fly.io"
    echo "Please run: flyctl auth login"
    echo "Or visit: https://fly.io/app/auth/cli/[TOKEN_FROM_PREVIOUS_OUTPUT]"
    exit 1
fi

echo "✅ Authentication confirmed"

# Check if app exists
echo "📋 Checking if app 'quotekit-prelaunch-test' exists..."
if flyctl status --app quotekit-prelaunch-test > /dev/null 2>&1; then
    echo "✅ App 'quotekit-prelaunch-test' exists"
else
    echo "🔧 Creating app 'quotekit-prelaunch-test'..."
    flyctl apps create quotekit-prelaunch-test
fi

# Deploy the application
echo "🏗️  Deploying QuoteKit to Fly.io (this may take several minutes)..."
echo "    - Building Docker image with environment variables"
echo "    - Running npm build process"
echo "    - Optimizing for production"
echo ""

flyctl deploy --verbose

# Check deployment status
echo "🔍 Checking deployment status..."
flyctl status --app quotekit-prelaunch-test

# Test health endpoint
echo "🩺 Testing health endpoint..."
sleep 10  # Give app time to start
curl -f https://quotekit-prelaunch-test.fly.dev/api/health || echo "⚠️  Health check failed - app may still be starting up"

echo ""
echo "🎉 Deployment complete!"
echo "🌐 Your app is available at: https://quotekit-prelaunch-test.fly.dev"
echo "🩺 Health check: https://quotekit-prelaunch-test.fly.dev/api/health"
echo ""
echo "📋 Next steps:"
echo "   1. Test all functionality on the deployed app"
echo "   2. Validate Stripe test payments work"
echo "   3. Verify email sending through Resend"
echo "   4. Check PostHog analytics tracking"
echo "   5. Test quote creation and management"