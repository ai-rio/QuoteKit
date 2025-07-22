# Codebase Structure

## Root Level
- **Configuration files**: package.json, tsconfig.json, tailwind.config.ts, next.config.js
- **Environment**: .env.local.example (template for environment variables)
- **Database**: supabase/ directory with migrations and configuration

## Source Code (`src/`)

### App Router (`src/app/`)
- **Route Groups**:
  - `(auth)/` - Authentication pages (login, signup, callback)
  - `(account)/` - Account management pages
  - `(app)/` - Main application pages
- **API Routes**: `api/` directory with webhooks and quote PDF generation
- **Pages**: dashboard, settings, items, quotes management

### Features (`src/features/`)
Feature-based architecture with dedicated modules:

#### Core Features
- **`auth/`** - Authentication logic and components
- **`account/`** - User account management controllers
- **`dashboard/`** - Dashboard components and stats
- **`settings/`** - Company settings with profile, financial defaults, and terms
- **`items/`** - Service/material item management with enhanced library features
- **`quotes/`** - Quote creation, management, and PDF generation
- **`pricing/`** - Subscription/pricing components (Stripe integration)
- **`emails/`** - Email templates using React Email

#### Feature Structure Pattern
Each feature typically contains:
- `components/` - React components
- `actions.ts` - Server actions
- `types.ts` - TypeScript type definitions
- `utils/` - Utility functions
- `hooks/` - Custom React hooks

### Shared Code
- **`components/`** - Reusable UI components
  - `ui/` - shadcn/ui base components
  - `layout/` - Layout-specific components
  - `branding/` - Brand/logo components
- **`libs/`** - External service integrations (Supabase, Stripe, Resend, PDF)
- **`utils/`** - General utility functions
- **`hooks/`** - Shared React hooks
- **`types/`** - Global type definitions
- **`styles/`** - Global CSS files

## Key Architectural Patterns
- **Feature-based organization** - Business logic grouped by domain
- **Server Components** - Leveraging Next.js server components
- **Server Actions** - Form handling and data mutations
- **Component composition** - Small, focused, reusable components
- **Type safety** - Comprehensive TypeScript coverage

## Database Schema
Located in `supabase/migrations/` with tables for:
- User authentication (managed by Supabase Auth)
- Company settings
- Line items (services/materials catalog)
- Quotes and quote line items
- Subscription/pricing data (Stripe integration)