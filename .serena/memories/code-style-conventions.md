# Code Style and Conventions

## TypeScript Configuration
- **Strict mode enabled** - Full type safety enforcement
- **Target: ES2017** - Modern JavaScript features
- **Path aliases**: `@/*` maps to `./src/*`
- **Incremental compilation** enabled for faster builds

## Code Style (Prettier)
- **Single quotes** for strings and JSX
- **Semicolons** required
- **Tab width**: 2 spaces
- **Print width**: 120 characters
- **Bracket spacing**: enabled
- **Arrow parentheses**: always include
- **Tailwind plugin** for class sorting

## Import Organization (ESLint)
Enforced import order:
1. React and Next.js imports first
2. External packages (alphabetical)
3. Internal imports with `~` and `@`
4. Relative parent directory imports
5. Relative same directory imports
6. CSS imports
7. Type-only imports last

## Component Patterns
- **Function components** with TypeScript
- **forwardRef** for components that need ref forwarding
- **Interface definitions** for props with descriptive names
- **Consistent export patterns** - named exports for utilities, default exports for pages/components

## File Organization
- **Feature-based architecture** - code organized by business domains
- **Separation of concerns** - components, actions, types, utils in separate files
- **Consistent naming**:
  - PascalCase for components and types
  - camelCase for functions and variables
  - kebab-case for file names (where appropriate)

## Component Architecture
- **shadcn/ui pattern** - base components with variants using cva
- **Composition over inheritance** - small, focused components
- **Props interfaces** clearly defined with TypeScript
- **Consistent component structure**:
  - Imports
  - Type definitions
  - Component logic
  - Export

## Styling Conventions
- **Tailwind utility classes** for styling
- **CSS custom properties** for theming (HSL color values)
- **Component variants** using class-variance-authority
- **Responsive design** with mobile-first approach
- **Brand-specific colors** defined in Tailwind config