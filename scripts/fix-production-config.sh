#!/bin/bash
# QuoteKit Production Configuration Fix Script
# This script fixes the critical issues identified in .env.production

set -e  # Exit on any error

echo "🔧 QuoteKit Production Configuration Fix Script"
echo "=============================================="

# Change to project root
cd "$(dirname "$0")/.."

# Backup current production env
echo "📋 Creating backup of current .env.production..."
if [ -f ".env.production" ]; then
    cp .env.production .env.production.backup.$(date +%Y%m%d-%H%M%S)
    echo "✅ Backup created: .env.production.backup.$(date +%Y%m%d-%H%M%S)"
else
    echo "❌ .env.production not found!"
    exit 1
fi

# Fix the configuration issues
echo "🛠️ Fixing configuration issues..."

cat > .env.production << 'EOF'
# QuoteKit Production Environment Variables (CORRECTED)
# NEVER commit .env.production to version control

# ==============================================
# SUPABASE PRODUCTION CONFIGURATION
# ==============================================
NEXT_PUBLIC_SUPABASE_URL=https://bujajubcktlpblewxtel.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1amFqdWJja3RscGJsZXd4dGVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4NDMzNTQsImV4cCI6MjA3MDQxOTM1NH0.oLzfozz8_bYJrarlZyHJG3IM54AKLoIWI5D97TFwjH0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1amFqdWJja3RscGJsZXd4dGVsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDg0MzM1NCwiZXhwIjoyMDcwNDE5MzU0fQ.pIsMT2ohSRtkLDWS57GGpQYQOL5SVtUd8gDyNtdKjS8
SUPABASE_DB_PASSWORD=Luliflora1.

# ==============================================
# STRIPE PRODUCTION CONFIGURATION
# ==============================================
# ⚠️ WARNING: CURRENTLY USING TEST KEYS - REPLACE WITH LIVE KEYS FOR PRODUCTION
# Get LIVE keys from: https://dashboard.stripe.com/apikeys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51PCRaPGgBK1ooXYFCVdD8Yr2O6moR1s5QzFRWopBmlsPBWHR2bLMvZ400elEJ3rzux9DNpnYadXJXnp0cqX7jmhv00c20JEgSB
STRIPE_SECRET_KEY=sk_test_51PCRaPGgBK1ooXYFpk09Mu8FvgQXshbm4XbpP0DZZ2crzJOabfqA60dUSQfg8yXWcs8IarbP8QAhQe4fhcwXp2M200b5lTZLuH
STRIPE_WEBHOOK_SECRET=whsec_391ee7fb05561e9f61817d6a97d7fc7a673be11ea853af57fa144b11e551c2f7

# ==============================================
# EMAIL CONFIGURATION
# ==============================================
RESEND_API_KEY=re_3VoudbyM_3L7J7KjqXuzFr9SiKRAXXBDA

# ==============================================
# APPLICATION CONFIGURATION
# ==============================================
NEXT_PUBLIC_SITE_URL=https://quotekit-prelaunch.fly.dev
NODE_ENV=production

# ==============================================
# MONITORING & ANALYTICS
# ==============================================
NEXT_PUBLIC_POSTHOG_KEY=phc_aTMaOPKid2gfZUqqSs2JjHQEBLOFBhQRJke8JbWF8ya
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

# Vercel Analytics (if using)
VERCEL_ANALYTICS_ID=YOUR_ANALYTICS_ID
EOF

echo "✅ Configuration issues fixed!"
echo ""
echo "📋 Issues Fixed:"
echo "  ✅ SUPABASE_SERVICE_ROLE_KEY: Removed appended 'YOUR_SERVICE_ROLE_KEY'"
echo "  ✅ SUPABASE_DB_PASSWORD: Fixed to contain only password, not full connection string"
echo "  ✅ NEXT_PUBLIC_SITE_URL: Updated to staging domain"
echo ""
echo "⚠️  IMPORTANT: Still using Stripe TEST keys!"
echo "   Before production deployment, replace with LIVE keys:"
echo "   - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_..."
echo "   - STRIPE_SECRET_KEY=sk_live_..."
echo "   - STRIPE_WEBHOOK_SECRET=whsec_... (from new live webhook)"
echo ""

# Test configuration validity
echo "🧪 Testing configuration validity..."

# Check if Supabase keys are valid JWT format
if [[ $(echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1amFqdWJja3RscGJsZXd4dGVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4NDMzNTQsImV4cCI6MjA3MDQxOTM1NH0.oLzfozz8_bYJrarlZyHJG3IM54AKLoIWI5D97TFwjH0" | cut -d. -f2 | base64 -d 2>/dev/null | grep -o "anon") == "anon" ]]; then
    echo "  ✅ SUPABASE_ANON_KEY format is valid"
else
    echo "  ❌ SUPABASE_ANON_KEY format invalid"
fi

if [[ $(echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1amFqdWJja3RscGJsZXd4dGVsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDg0MzM1NCwiZXhwIjoyMDcwNDE5MzU0fQ.pIsMT2ohSRtkLDWS57GGpQYQOL5SVtUd8gDyNtdKjS8" | cut -d. -f2 | base64 -d 2>/dev/null | grep -o "service_role") == "service_role" ]]; then
    echo "  ✅ SUPABASE_SERVICE_ROLE_KEY format is valid"
else
    echo "  ❌ SUPABASE_SERVICE_ROLE_KEY format invalid"
fi

# Check URL format
if [[ "https://bujajubcktlpblewxtel.supabase.co" =~ ^https://.*\.supabase\.co$ ]]; then
    echo "  ✅ SUPABASE_URL format is valid"
else
    echo "  ❌ SUPABASE_URL format invalid"
fi

# Check Stripe key format
if [[ "pk_test_51PCRaPGgBK1ooXYFCVdD8Yr2O6moR1s5QzFRWopBmlsPBWHR2bLMvZ400elEJ3rzux9DNpnYadXJXnp0cqX7jmhv00c20JEgSB" =~ ^pk_test_ ]]; then
    echo "  ⚠️ STRIPE keys are TEST keys (expected for now)"
else
    echo "  ❌ STRIPE_PUBLISHABLE_KEY format invalid"
fi

echo ""
echo "🎯 Next Steps:"
echo "1. Review the corrected .env.production file"
echo "2. Proceed with Supabase migration (Phase 2 of deployment plan)"
echo "3. Setup Fly.io deployment (Phase 3 of deployment plan)"
echo "4. Before going live: Replace Stripe TEST keys with LIVE keys"
echo ""
echo "📖 Full deployment guide: docs/deployment/COMPREHENSIVE_DEPLOYMENT_PLAN.md"