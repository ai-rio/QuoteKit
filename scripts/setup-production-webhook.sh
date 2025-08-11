#!/bin/bash

# Setup Production Webhook Endpoint
# This script creates a webhook endpoint for production deployment

echo "🔧 Setting up Stripe webhook endpoint for production..."

# Check if Stripe CLI is installed
if ! command -v stripe &> /dev/null; then
    echo "❌ Stripe CLI not found. Please install it first:"
    echo "   https://stripe.com/docs/stripe-cli"
    exit 1
fi

# Get production domain from user
read -p "Enter your production domain (e.g., https://your-app.com): " PRODUCTION_DOMAIN

if [ -z "$PRODUCTION_DOMAIN" ]; then
    echo "❌ Production domain is required"
    exit 1
fi

# Ensure domain starts with https://
if [[ ! $PRODUCTION_DOMAIN == https://* ]]; then
    PRODUCTION_DOMAIN="https://$PRODUCTION_DOMAIN"
fi

WEBHOOK_URL="$PRODUCTION_DOMAIN/api/webhooks"

echo "📡 Creating webhook endpoint: $WEBHOOK_URL"

# Create webhook endpoint with all necessary events
WEBHOOK_RESPONSE=$(stripe webhook_endpoints create \
  --url "$WEBHOOK_URL" \
  --enabled-events customer.subscription.created \
  --enabled-events customer.subscription.updated \
  --enabled-events customer.subscription.deleted \
  --enabled-events customer.subscription.trial_will_end \
  --enabled-events checkout.session.completed \
  --enabled-events checkout.session.expired \
  --enabled-events invoice.payment_succeeded \
  --enabled-events invoice.payment_failed \
  --enabled-events invoice.finalized \
  --enabled-events payment_method.attached \
  --enabled-events payment_method.detached \
  --enabled-events setup_intent.succeeded \
  --enabled-events product.created \
  --enabled-events product.updated \
  --enabled-events price.created \
  --enabled-events price.updated \
  --format json)

if [ $? -eq 0 ]; then
    echo "✅ Webhook endpoint created successfully!"
    
    # Extract webhook ID and secret
    WEBHOOK_ID=$(echo "$WEBHOOK_RESPONSE" | jq -r '.id')
    WEBHOOK_SECRET=$(echo "$WEBHOOK_RESPONSE" | jq -r '.secret')
    
    echo ""
    echo "📋 Webhook Details:"
    echo "   ID: $WEBHOOK_ID"
    echo "   URL: $WEBHOOK_URL"
    echo "   Secret: $WEBHOOK_SECRET"
    echo ""
    echo "🔐 Add this to your production environment variables:"
    echo "   STRIPE_WEBHOOK_SECRET=$WEBHOOK_SECRET"
    echo ""
    echo "💡 For Fly.io deployment:"
    echo "   fly secrets set STRIPE_WEBHOOK_SECRET=\"$WEBHOOK_SECRET\""
    echo ""
    echo "💡 For Vercel deployment:"
    echo "   vercel env add STRIPE_WEBHOOK_SECRET"
    echo "   (then paste: $WEBHOOK_SECRET)"
    
    # Save to file for reference
    cat > webhook-config.txt << EOF
Webhook Configuration
Created: $(date)
Domain: $PRODUCTION_DOMAIN
Webhook ID: $WEBHOOK_ID
Webhook URL: $WEBHOOK_URL
Webhook Secret: $WEBHOOK_SECRET

Environment Variable:
STRIPE_WEBHOOK_SECRET=$WEBHOOK_SECRET

Fly.io Command:
fly secrets set STRIPE_WEBHOOK_SECRET="$WEBHOOK_SECRET"

Vercel Setup:
vercel env add STRIPE_WEBHOOK_SECRET
Value: $WEBHOOK_SECRET
EOF
    
    echo ""
    echo "📄 Configuration saved to: webhook-config.txt"
    echo "⚠️  Keep this file secure and don't commit it to version control!"
    
else
    echo "❌ Failed to create webhook endpoint"
    echo "Please check your Stripe CLI authentication and try again"
    exit 1
fi
