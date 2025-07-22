# Design Patterns and Guidelines

## Architecture Principles
- **Feature-based Architecture** - Code organized by business features, not technical layers
- **Server Components First** - Leverage Next.js server components for performance
- **Progressive Enhancement** - Core features work without JavaScript
- **Real-time Updates** - Optimistic UI updates for better user experience

## Component Design Patterns

### shadcn/ui Pattern
- Base components use `class-variance-authority` for variants
- Consistent prop interfaces with `className` override support
- `forwardRef` for components that need DOM ref access
- Example structure:
  ```typescript
  const componentVariants = cva("base-classes", {
    variants: { /* variant definitions */ },
    defaultVariants: { /* defaults */ }
  });
  
  const Component = forwardRef<HTMLElement, ComponentProps>(
    ({ className, variant, ...props }, ref) => (
      <Element className={cn(componentVariants({ variant, className }))} {...props} ref={ref} />
    )
  );
  ```

### Feature Module Pattern
Each feature follows consistent structure:
- **Components** - UI components specific to the feature
- **Actions** - Server actions for data operations
- **Types** - TypeScript interfaces and types
- **Utils/Hooks** - Feature-specific utilities and React hooks

### Form Handling
- Server Actions for form submissions
- Optimistic updates for immediate feedback
- Validation using Zod schemas
- Toast notifications for user feedback

## Data Patterns

### Database Security
- **Row Level Security (RLS)** - Database-level access control
- **User-scoped data** - All data tied to authenticated users
- **Type-safe queries** - Generated TypeScript types from Supabase schema

### State Management
- **React hooks** for local component state
- **Server state** managed through Server Actions and Components
- **Optimistic updates** for better UX during async operations
- **Form state** handled with controlled components

## Styling Guidelines

### Tailwind CSS Patterns
- **Utility-first approach** - Compose styles with utility classes
- **Custom CSS properties** for theming (HSL color system)
- **Component variants** using cva for maintainable component APIs
- **Responsive design** with mobile-first approach

### Brand Integration
- **Consistent brand colors** defined in Tailwind config
- **Custom font definitions** with fallbacks
- **Professional business aesthetics** suitable for landscaping industry

## Error Handling
- **Graceful degradation** for network issues
- **User-friendly error messages** via toast system
- **Form validation** with clear feedback
- **Server-side validation** with Zod schemas

## Security Considerations
- **Environment variable protection** - Sensitive data in env vars
- **No client-side secrets** - API keys server-side only
- **Authenticated routes** - Protected pages require login
- **Input validation** - All user inputs validated

## Performance Patterns
- **Server Components** for data fetching
- **Incremental builds** with TypeScript
- **Image optimization** through Next.js
- **Bundle optimization** with modern build tools