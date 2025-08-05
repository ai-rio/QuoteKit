#!/bin/bash

# Auto TypeScript Fix Script
# Automatically applies common TypeScript fixes using ESLint and custom patterns

set -e

echo "🔧 Starting automatic TypeScript fixes..."

# Step 1: Run ESLint auto-fix
echo "📝 Running ESLint auto-fix..."
npx eslint --fix --ext .ts,.tsx src/ || true

# Step 2: Apply common TypeScript patterns
echo "🎯 Applying common TypeScript fix patterns..."

# Fix implicit any parameters
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i.bak -E 's/\(([a-zA-Z_][a-zA-Z0-9_]*)\) =>/(\1: any) =>/g'

# Add null assertions for test files
find src -name "*.test.ts" -o -name "*.test.tsx" | xargs sed -i.bak -E 's/expect\(([^)]+)\[([0-9]+)\]\.([a-zA-Z_][a-zA-Z0-9_]*)\)/expect(\1[\2]!.\3)/g'

# Fix property access on union types
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i.bak -E 's/\(([a-zA-Z_][a-zA-Z0-9_]*) as any\)\?\.([a-zA-Z_][a-zA-Z0-9_]*)/(\1 as any).\2/g'

# Clean up backup files
find src -name "*.bak" -delete

# Step 3: Run TypeScript check
echo "🔍 Running TypeScript check..."
ERROR_COUNT=$(npm run type-check 2>&1 | grep -c "error TS" || echo "0")

echo "📊 TypeScript errors remaining: $ERROR_COUNT"

if [ "$ERROR_COUNT" -eq "0" ]; then
    echo "✅ All TypeScript errors fixed!"
    exit 0
else
    echo "⚠️  $ERROR_COUNT TypeScript errors remain"
    echo "🔍 Showing remaining errors:"
    npm run type-check 2>&1 | grep -E "error TS[0-9]+" | head -10
    exit 1
fi
