# Source Tree Structure

## Overview

The source tree follows Next.js App Router conventions with feature-based organization to support all user stories.

## Directory Structure

```
src/
├── app/
│   ├── (main)/
│   │   ├── layout.tsx
│   │   └── page.tsx             // Landing Page
│   ├── (auth)/                  // Story 1.1: Authentication
│   │   ├── login/
│   │   └── signup/
│   └── (app)/
│       ├── layout.tsx           // Main app layout with nav
│       ├── dashboard/           // Main dashboard after login
│       │   └── page.tsx
│       ├── settings/            // Story 1.2: Company Settings
│       │   └── page.tsx
│       ├── items/               // Story 1.3: Line Items Management
│       │   └── page.tsx
│       └── quotes/              // Stories 1.4 & 1.5: Quote Creation & PDF
│           └── page.tsx
├── components/
│   ├── ui/                      // shadcn/ui components
│   └── shared/                  // Reusable components (e.g., Navbar, Logo)
├── features/
│   ├── auth/                    // Existing auth logic (Story 1.1)
│   ├── settings/                // Story 1.2: Company & Quote Settings
│   │   ├── components/          // SettingsFormComponent
│   │   ├── actions.ts           // Server actions for settings
│   │   └── types.ts             // TypeScript types for settings
│   ├── items/                   // Story 1.3: Service & Material Items
│   │   ├── components/          // ItemsDataTable, AddItemForm
│   │   ├── actions.ts
│   │   └── types.ts
│   └── quotes/                  // Stories 1.4 & 1.5: Quote Creation & PDF
│       ├── components/          // QuoteCalculator, LineItemRow
│       ├── actions.ts
│       └── types.ts
├── libs/
│   ├── supabase/               // Supabase client configuration
│   ├── stripe/                 // Stripe integration
│   └── pdf/                    // PDF generation logic (Story 1.5)
└── utils/                      // Shared utility functions
```

## Key Organizing Principles

- **Route Groups**: `(main)`, `(auth)`, `(app)` for clean URL structure
- **Feature-Based**: Each major functionality has its own feature directory
- **Co-location**: Components, actions, and types are grouped by feature
- **Separation**: UI components separated from business logic
- **Shared Resources**: Common utilities and components in dedicated folders

## Story Mapping

- **Story 1.1**: `app/(auth)/`, `features/auth/`
- **Story 1.2**: `app/(app)/settings/`, `features/settings/`  
- **Story 1.3**: `app/(app)/items/`, `features/items/`
- **Story 1.4**: `app/(app)/quotes/`, `features/quotes/`
- **Story 1.5**: `features/quotes/`, `libs/pdf/`