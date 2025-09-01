#!/bin/bash
# QuoteKit Landscaping Business Quality Assurance Hook
# Runs after Claude edits files to ensure landscaping domain compliance

echo "🌱 Running QuoteKit landscaping quality checks..."

if [[ "$CLAUDE_EDIT_FILES" =~ \.ts$ ]] || [[ "$CLAUDE_EDIT_FILES" =~ \.tsx$ ]]; then
    echo "📋 TypeScript validation for landscaping features..."
    bun run type-check
    if [ $? -ne 0 ]; then
        echo "⚠️ TypeScript errors detected in landscaping codebase"
    fi
fi

# Check for landscaping-specific patterns
if [[ "$CLAUDE_EDIT_FILES" =~ assessment|quote|pricing ]]; then
    echo "💰 Validating landscaping business logic..."
    
    # Test pricing engine for landscaping calculations
    bun test src/features/quotes/pricing-engine/ --silent 2>/dev/null
    if [ $? -ne 0 ]; then
        echo "⚠️ Landscaping pricing engine validation failed"
    fi
    
    # Test assessment workflows
    bun test src/features/assessments/ --silent 2>/dev/null
    if [ $? -ne 0 ]; then
        echo "⚠️ Property assessment validation failed"
    fi
fi

# Check shadcn/ui compliance for landscaping UI
if [[ "$CLAUDE_EDIT_FILES" =~ components.*\.tsx$ ]]; then
    echo "🎨 Checking landscaping UI component standards..."
    if ! grep -q "shadcn" "$CLAUDE_EDIT_FILES" 2>/dev/null; then
        echo "💡 Remember: Use shadcn/ui v4 MCP tools for all UI components"
    fi
fi

echo "✅ QuoteKit landscaping quality check complete"