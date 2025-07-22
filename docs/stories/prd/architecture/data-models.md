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

---

## Epic 2 Data Model Enhancements

### Enhanced CompanySettings (Story 2.4)

**Purpose:** Extended company profile management with logo upload and additional business settings

**Enhanced TypeScript Interface:**
```typescript
// src/features/settings/types.ts
export interface CompanySettings {
  id: string; // Corresponds to user_id
  company_name: string | null;
  company_address: string | null;
  company_phone: string | null;
  company_email: string | null; // NEW: Business email
  logo_url: string | null;
  logo_file_name: string | null; // NEW: Original file name
  default_tax_rate: number;
  default_markup_rate: number;
  preferred_currency: string; // NEW: Currency preference (default: 'USD')
  quote_terms: string | null; // NEW: Default quote terms/conditions
  updated_at: string;
}
```

### Enhanced LineItems (Story 2.5)

**Purpose:** Extended item management with categories, tags, and organization features

**Enhanced TypeScript Interface:**
```typescript
// src/features/items/types.ts
export interface LineItem {
  id: string;
  user_id: string;
  name: string;
  unit: string;
  cost: number;
  category: string | null; // NEW: Item category
  tags: string[]; // NEW: Flexible tagging system
  is_favorite: boolean; // NEW: User favorites
  last_used_at: string | null; // NEW: Usage tracking
  created_at: string;
  updated_at: string;
}

export interface ItemCategory {
  id: string;
  user_id: string;
  name: string;
  color: string | null; // NEW: Category color coding
  created_at: string;
}
```

### Enhanced Quotes (Stories 2.3 & 2.6)

**Purpose:** Comprehensive quote management with status tracking, numbering, and lifecycle management

**Enhanced TypeScript Interface:**
```typescript
// src/features/quotes/types.ts
export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'declined' | 'expired' | 'converted';

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
  quote_number: string; // NEW: Auto-generated quote number
  client_name: string;
  client_contact: string | null;
  quote_data: QuoteLineItem[];
  subtotal: number;
  tax_rate: number;
  markup_rate: number;
  total: number;
  status: QuoteStatus; // NEW: Quote lifecycle status
  sent_at: string | null; // NEW: When quote was sent
  expires_at: string | null; // NEW: Quote expiration
  follow_up_date: string | null; // NEW: Reminder dates
  notes: string | null; // NEW: Internal notes
  is_template: boolean; // NEW: Template flag
  template_name: string | null; // NEW: Template name
  created_at: string;
  updated_at: string; // NEW: Modification tracking
}
```

### New Client Management (Story 2.6)

**Purpose:** Dedicated client relationship management for business growth

**TypeScript Interface:**
```typescript
// src/features/clients/types.ts
export interface Client {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientStats {
  client_id: string;
  total_quotes: number;
  accepted_quotes: number;
  total_value: number;
  last_quote_date: string | null;
  acceptance_rate: number;
}
```

### Dashboard Analytics (Story 2.2)

**Purpose:** Dashboard data aggregation and user insights

**TypeScript Interface:**
```typescript
// src/features/dashboard/types.ts
export interface DashboardStats {
  total_quotes: number;
  draft_quotes: number;
  sent_quotes: number;
  accepted_quotes: number;
  total_items: number;
  total_revenue: number;
  recent_quotes: Quote[];
  quote_trends: QuoteTrend[];
}

export interface QuoteTrend {
  period: string; // 'week' | 'month' | 'quarter'
  quote_count: number;
  total_value: number;
  acceptance_rate: number;
}

export interface UserProgress {
  settings_complete: boolean;
  items_added: boolean;
  first_quote_created: boolean;
  first_pdf_generated: boolean;
  completion_percentage: number;
}
```

## Epic 2 Data Relationships

**Enhanced Relationships:**
- **CompanySettings**: One-to-one with User (enhanced with logo storage)
- **LineItems**: One-to-many with User (enhanced with categories and tags)
- **ItemCategories**: One-to-many with User (new organization system)
- **Quotes**: One-to-many with User (enhanced with status and lifecycle)
- **Clients**: One-to-many with User (new client management)
- **QuoteLineItem**: Embedded within Quote as JSONB (unchanged)

**New Relationships:**
- **LineItems** → **ItemCategories**: Many-to-one (optional category assignment)
- **Quotes** → **Clients**: Many-to-one (optional client linking)
- **Quote Templates**: Quotes with `is_template = true` (reusable configurations)

## Data Access Patterns

**Epic 2 Query Patterns:**
- **Dashboard Aggregation**: Complex queries for statistics and trends
- **Advanced Search**: Full-text search across quotes and items
- **Status Filtering**: Efficient filtering by quote status and date ranges
- **Client Analytics**: Relationship queries for client insights
- **Template Management**: Filtering and loading reusable quote templates