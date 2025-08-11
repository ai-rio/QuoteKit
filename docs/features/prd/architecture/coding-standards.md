# Coding Standards

## Critical Fullstack Rules

### Type Safety
- All data models and API communication must use the shared TypeScript interfaces defined in the `features/*/types.ts` files
- Never use `any` type - always define proper interfaces

### Server-Side Security  
- All Supabase client calls that require service keys MUST be made from Next.js Server Actions or API Routes
- Never expose service keys to the client-side
- Use Row Level Security (RLS) policies for data access control

### Environment Variables
- Access all environment variables through the provided utility functions
- Never use `process.env` directly in components
- Keep sensitive variables server-side only

### UI Components
- All UI must be built using shadcn/ui components to maintain consistency
- Create reusable components in the `components/shared/` directory
- Follow the component composition pattern

### State Management
- For client-side state, use React's built-in hooks (`useState`, `useContext`)
- Keep state close to where it's used
- Use Server Actions for server state mutations

## Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Components | PascalCase | `QuoteCalculator.tsx` |
| Server Actions | camelCase | `saveSettings.ts` |
| API Routes | kebab-case | `/api/quotes/generate-pdf` |
| Database Tables | snake_case | `company_settings` |
| Type Interfaces | PascalCase | `interface CompanySettings` |
| Variables | camelCase | `const taxRate = 0.08` |
| Constants | UPPER_SNAKE_CASE | `const MAX_ITEMS = 100` |

## File Organization

- **Co-location**: Keep related files together in feature directories
- **Separation of Concerns**: Separate UI, business logic, and data access
- **Consistent Structure**: Follow the established patterns across features
- **Import Organization**: Group imports (React, external libs, internal)

## Code Quality

- Write descriptive variable and function names
- Add JSDoc comments for complex functions
- Use TypeScript strict mode
- Handle loading and error states in UI components
- Validate all user inputs on both client and server