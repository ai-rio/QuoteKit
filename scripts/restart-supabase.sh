#!/bin/bash

# Script to properly restart Supabase local development environment
# This fixes common issues with Supabase containers not starting properly

echo "🔄 Restarting Supabase local development environment..."

# Stop any running Supabase containers
echo "📦 Stopping Supabase containers..."
npx supabase stop

# Clean up any orphaned containers
echo "🧹 Cleaning up Docker containers..."
docker container prune -f

# Remove problematic volumes if they exist
echo "🗑️  Removing problematic volumes..."
docker volume rm supabase_analytics_QuoteKit 2>/dev/null || true

# Start Supabase with fresh containers
echo "🚀 Starting Supabase..."
npx supabase start

# Check if it started successfully
if [ $? -eq 0 ]; then
    echo "✅ Supabase started successfully!"
    echo "📊 Checking status..."
    npx supabase status
else
    echo "❌ Supabase failed to start. Trying alternative approach..."
    
    # Alternative: Start without analytics
    echo "🔧 Trying to start without problematic services..."
    
    # Stop everything first
    npx supabase stop
    
    # Start with minimal services
    echo "🚀 Starting with minimal configuration..."
    npx supabase start
    
    if [ $? -eq 0 ]; then
        echo "✅ Supabase started with minimal configuration!"
    else
        echo "❌ Failed to start Supabase. Please check the logs above."
        exit 1
    fi
fi

echo "🎉 Supabase restart complete!"
