#!/bin/bash
# PostHog CLI Configuration Script for QuoteKit

# Add npm global bin to PATH if not already present
if [[ ":$PATH:" != *":/root/.npm-global/bin:"* ]]; then
    export PATH="/root/.npm-global/bin:$PATH"
fi

# Set PostHog CLI credentials
export POSTHOG_CLI_TOKEN="phx_fcpbWf847UQg1AOBNVuKL8pT3iiXGHit0wM8AHYYc88Am2E"
export POSTHOG_CLI_ENV_ID="205847"

echo "PostHog CLI configured successfully!"
echo "Available commands:"
echo "  posthog-cli query run 'SELECT * FROM events LIMIT 5'"
echo "  posthog-cli query editor"
echo "  posthog-cli sourcemap --help"

# Test connection
echo ""
echo "Testing connection..."
posthog-cli query run "SELECT count() FROM events" 2>/dev/null && echo "✅ Connection successful!" || echo "⚠️  Connection test failed - check credentials"