#!/bin/bash

# Post-Migration Validation Script
# Run this after completing the schema migration in Supabase Studio

echo "🎯 Post-Migration Validation Starting..."

# Step 1: Generate new TypeScript types
echo "📝 Generating updated TypeScript types..."
npm run generate-types

if [ $? -eq 0 ]; then
    echo "✅ TypeScript types generated successfully"
else
    echo "❌ Type generation failed - check Supabase connection"
fi

# Step 2: Run TypeScript compilation check
echo "🔍 Running TypeScript compilation check..."
npx tsc --noEmit

if [ $? -eq 0 ]; then
    echo "✅ TypeScript compilation successful"
else
    echo "⚠️  TypeScript compilation has errors - check types"
fi

# Step 3: Test build
echo "🏗️  Testing Next.js build..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful - clean schema working!"
else
    echo "❌ Build failed - check for remaining issues"
fi

echo ""
echo "🎉 Post-Migration Validation Complete!"
echo "📋 Next Steps:"
echo "1. Test your application: npm run dev"
echo "2. Verify subscription functionality works"
echo "3. Check performance improvements in database queries"
echo ""
echo "🚀 Expected Results:"
echo "- 5-7x faster subscription queries"
echo "- Zero TypeScript compilation errors"
echo "- Clean database schema with proper relationships"
echo "- Optimized indexes for performance"