# Task Completion Checklist

When completing coding tasks, always run these commands to ensure code quality:

## Required Quality Checks
1. **Linting**: `npm run lint`
   - Fixes import ordering and catches code issues
   - Must pass before considering task complete

2. **Build Verification**: `npm run build`
   - Ensures TypeScript compilation succeeds
   - Catches type errors and build issues
   - Must succeed for production readiness

## Additional Checks (If Available)
- **Type Checking**: No separate typecheck command - included in build process
- **Tests**: No test script found - may need to be configured
- **Formatting**: Prettier should be configured in editor, or run manually

## Development Workflow
1. Make code changes
2. Run `npm run lint` to fix import order and catch issues
3. Run `npm run build` to verify TypeScript compilation
4. Test changes locally with `npm run dev`
5. Verify functionality in browser

## Database Changes
If database schema changes are made:
1. Create migration: `npm run migration:new <description>`
2. Apply migration: `npm run migration:up`
3. Verify schema in Supabase Studio (http://127.0.0.1:54323)

## Best Practices
- Always test in local development environment
- Check console for errors and warnings
- Verify responsive design on different screen sizes
- Test authentication flows if auth-related changes are made
- Ensure PDF generation works if quote-related changes are made