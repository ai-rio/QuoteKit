# Data Models

## Overview

The data models support the core user stories for LawnQuote Software. Each model corresponds to key functionality in the application.

## CompanySettings

**Purpose:** Store the user's company branding and default calculation settings (Story 1.2)

**TypeScript Interface:**
```typescript
// src/features/settings/types.ts
export interface CompanySettings {
  id: string; // Corresponds to user_id
  company_name: string | null;
  company_address: string | null;
  company_phone: string | null;
  logo_url: string | null;
  default_tax_rate: number;
  default_markup_rate: number;
}
```

## LineItems

**Purpose:** Store a user's personal database of reusable services and materials (Story 1.3)

**TypeScript Interface:**
```typescript
// src/features/items/types.ts
export interface LineItem {
  id: string;
  user_id: string;
  name: string;
  unit: string;
  cost: number;
}
```

## Quotes

**Purpose:** Store each quote created by a user, including all line items and final calculations (Stories 1.4 & 1.5)

**TypeScript Interface:**
```typescript
// src/features/quotes/types.ts
export interface QuoteLineItem {
  id: string;
  name: string;
  unit: string;
  cost: number;
  quantity: number;
}

export interface Quote {
  id: string;
  user_id: string;
  client_name: string;
  client_contact: string | null;
  quote_data: QuoteLineItem[];
  subtotal: number;
  tax_rate: number;
  markup_rate: number;
  total: number;
  created_at: string;
}
```

## Data Relationships

- **CompanySettings**: One-to-one relationship with User (Supabase Auth)
- **LineItems**: One-to-many relationship with User
- **Quotes**: One-to-many relationship with User
- **QuoteLineItem**: Embedded within Quote as JSONB data