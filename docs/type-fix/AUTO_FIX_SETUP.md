# Automatic TypeScript Fix Setup Guide

This guide shows how to set up automatic TypeScript error fixing using ESLint, TSC, and Git hooks.

## 🚀 Quick Setup

### 1. Install Dependencies
```bash
npm install --save-dev husky lint-staged @typescript-eslint/eslint-plugin @typescript-eslint/parser
```

### 2. Initialize Husky
```bash
npx husky install
npm pkg set scripts.prepare="husky install"
```

### 3. Create Pre-commit Hook
```bash
npx husky add .husky/pre-commit "npx lint-staged"
```

### 4. Add lint-staged Configuration
Add to `package.json`:
```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write",
      "bash -c 'npm run type-check'"
    ]
  }
}
```

## 🔧 Available Commands

### Manual Fixes
```bash
# Run all auto-fixes
npm run type-fix

# Advanced auto-fix with patterns
npm run type-fix:auto

# ESLint only
npm run lint:fix

# TypeScript check only
npm run type-check
```

### Automated Fixes
```bash
# Pre-commit hook (automatic)
git commit -m "your message"

# Manual trigger of pre-commit checks
npx lint-staged
```

## 🎯 What Gets Auto-Fixed

### ESLint Auto-Fixes
- ✅ Unused imports removal
- ✅ Missing semicolons
- ✅ Consistent quotes
- ✅ Spacing and formatting
- ✅ Prefer optional chaining
- ✅ Prefer nullish coalescing
- ✅ Remove unnecessary type assertions

### Custom Pattern Fixes
- ✅ Add `any` type to implicit parameters
- ✅ Add null assertions in tests
- ✅ Fix property access on union types
- ✅ Remove invalid properties

### TypeScript Compiler Fixes
- ✅ Import organization
- ✅ Missing import additions
- ✅ Type inference improvements

## 🛠️ Configuration Files

### ESLint Configuration (`.eslintrc.json`)
```json
{
  "extends": [
    "next/core-web-vitals",
    "@typescript-eslint/recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "project": "./tsconfig.json"
  },
  "rules": {
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "@typescript-eslint/prefer-nullish-coalescing": "error",
    "@typescript-eslint/prefer-optional-chain": "error",
    "@typescript-eslint/no-unnecessary-type-assertion": "error"
  }
}
```

### VS Code Settings (`.vscode/settings.json`)
```json
{
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "editor.formatOnSave": true,
  "typescript.preferences.includePackageJsonAutoImports": "auto"
}
```

## 🔄 Workflow Integration

### Pre-commit Hook Flow
1. **Stage files** → `git add .`
2. **Trigger hook** → `git commit -m "message"`
3. **Auto-fix runs** → ESLint + Prettier + TypeScript check
4. **Commit proceeds** → If no errors remain
5. **Commit blocked** → If TypeScript errors persist

### CI/CD Integration
- GitHub Actions workflow runs on every push
- Auto-fixes are committed back to the branch
- Pull requests get automatic fix suggestions

## 📊 Monitoring & Reporting

### Error Tracking
```bash
# Get current error count
npm run type-check 2>&1 | grep -c "error TS" || echo "0"

# Error breakdown by type
npm run type-check 2>&1 | grep -E "error TS[0-9]+" | sed 's/.*error \(TS[0-9]*\).*/\1/' | sort | uniq -c | sort -nr
```

### Success Metrics
- ✅ Zero TypeScript errors in main branch
- ✅ Automatic fix rate > 80%
- ✅ Reduced manual intervention
- ✅ Consistent code quality

## 🚨 Troubleshooting

### Common Issues

**Hook not running?**
```bash
# Check if husky is installed
ls -la .husky/

# Reinstall husky
rm -rf .husky && npx husky install
```

**ESLint not fixing?**
```bash
# Check ESLint config
npx eslint --print-config src/app/page.tsx

# Test specific file
npx eslint --fix src/path/to/file.ts
```

**TypeScript errors persist?**
```bash
# Clear TypeScript cache
rm -rf node_modules/.cache/typescript
npm run type-check
```

## 🎯 Best Practices

### 1. Gradual Adoption
- Start with ESLint auto-fixes
- Add TypeScript checks gradually
- Use `any` type strategically for complex cases

### 2. Team Workflow
- Run `npm run type-fix` before committing
- Use VS Code auto-fix on save
- Review auto-fixes in pull requests

### 3. Maintenance
- Update ESLint rules regularly
- Monitor auto-fix success rate
- Refine custom patterns based on common errors

---

*This setup ensures consistent TypeScript quality with minimal manual intervention.*
