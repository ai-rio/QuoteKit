#!/bin/bash

echo "🧹 RESETTING DATABASE TO CLEAN LAWNQUOTE SCHEMA"
echo "================================================"

# Stop if any command fails
set -e

echo "📋 Step 1: Backing up current migrations..."
mkdir -p backup/migrations-$(date +%Y%m%d-%H%M%S)
cp -r supabase/migrations/* backup/migrations-$(date +%Y%m%d-%H%M%S)/ 2>/dev/null || true

echo "🗑️  Step 2: Clearing old migrations..."
rm -f supabase/migrations/*.sql

echo "📝 Step 3: Moving clean schema to migrations..."
mv supabase/migrations/00000000000000_clean_lawnquote_schema.sql supabase/migrations/20250801000000_clean_lawnquote_schema.sql

echo "🔄 Step 4: Resetting Supabase database..."
supabase db reset

echo "✅ DATABASE RESET COMPLETE!"
echo ""
echo "Your database now has a clean, consolidated schema with:"
echo "  ✅ Complete LawnQuote functionality"
echo "  ✅ Essential Stripe integration"
echo "  ✅ Analytics views"
echo "  ✅ Proper indexing and RLS"
echo "  ✅ All business features intact"
echo ""
echo "Next steps:"
echo "  1. Test the application: npm run dev"
echo "  2. Verify all features work"
echo "  3. Start refactoring the over-engineered code files"
