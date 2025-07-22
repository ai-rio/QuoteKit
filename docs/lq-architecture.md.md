# **Fullstack Architecture Document: LawnQuote Software**

Date: July 21, 2025  
Author: Winston, Architect

**Update History:**
- January 22, 2025: Epic 1 Implementation Complete - All foundational architecture delivered
- January 22, 2025: Epic 2 Planning - UI/UX Enhancement Architecture Considerations

### **Introduction**

#### **Starter Template or Existing Project**

Based on the analysis of the README.md and the project's file structure, this project is based on the **"next-supabase-stripe-starter"** template. This provides a solid foundation with pre-configured integrations for Next.js, Supabase, and Stripe, which directly aligns with the PRD's technical assumptions.

This starter template imposes beneficial constraints and patterns that we will adopt:

* **Authentication:** User management is already set up using Supabase Auth.  
* **Database:** The initial database schema and migrations are handled via the supabase/migrations directory.  
* **Payments:** Stripe integration for subscriptions is pre-configured, including webhooks.  
* **File Structure:** The project follows a standard Next.js App Router structure with a clear separation of features.

We will proceed with the understanding that our architecture will extend this existing starter template.

### **High Level Architecture**

#### **Technical Summary**

LawnQuote Software will be a modern, serverless web application built on the **"next-supabase-stripe-starter"** template. The architecture is designed for rapid development, scalability, and low operational overhead, directly supporting the project's goal of a fast MVP launch. The system will feature a Next.js frontend for a dynamic user experience, with all backend logic, database operations, and user authentication handled by Supabase. This approach minimizes backend complexity and allows us to leverage powerful managed services.

#### **High Level Overview**

* **Architectural Style:** Serverless, leveraging Vercel for hosting and Next.js for both frontend rendering and API routes.  
* **Repository Structure:** A Single Application Repository, containing the entire Next.js project.  
* **Primary User Flow:** The user interacts with a React-based single-page application. All data-related actions are communicated to the Supabase backend via API calls from the Next.js server, ensuring our Supabase service keys remain secure.

#### **High Level Project Diagram**

graph TD  
    A\[User's Browser\] \--\>|Interacts with| B(Next.js Frontend on Vercel);  
    B \--\>|API Calls via Next.js Server| C(Supabase);  
    C \--\>|Stores/Retrieves Data| D\[Supabase Postgres DB\];  
    C \--\>|Handles Auth| E\[Supabase Auth\];  
    B \--\>|Securely Calls| F(Stripe API);  
    G\[Resend API\] \<--|Sends Welcome Emails| B;

    subgraph Supabase Platform  
        D;  
        E;  
    end

    style B fill:\#f9f,stroke:\#333,stroke-width:2px;  
    style C fill:\#ccf,stroke:\#333,stroke-width:2px;

#### **Architectural and Design Patterns**

* **Serverless Functions:** We will use Next.js API Routes for all backend logic that communicates with Supabase. This keeps our Supabase credentials secure on the server-side.  
* **Component-Based UI:** The frontend will be built using React and shadcn/ui, promoting reusability and a consistent design.  
* **Repository Pattern:** We will abstract all direct database calls into a dedicated data access layer to make our code easier to test and manage.

### **Tech Stack**

#### **Technology Stack Table**

|

| Category | Technology | Version | Purpose | Rationale |  
| Frontend Language | TypeScript | \~5.x | Primary language for type safety | Enforces type safety, improves code quality and maintainability. |  
| Frontend Framework | Next.js | 15 | Core application framework | Provides a robust, production-ready React framework with server-side capabilities. |  
| UI Component Lib | shadcn/ui | Latest | Pre-built, accessible UI components | Accelerates development with high-quality, customizable, and accessible components. |  
| Styling | Tailwind CSS | \~3.x | Utility-first CSS framework | Allows for rapid and consistent styling directly within the markup. |  
| Backend Services | Supabase | Latest | Database, Auth, Backend Functions | Provides a managed, scalable backend, reducing operational complexity. |  
| Database | PostgreSQL | Latest | Primary relational database | A powerful and reliable open-source relational database, managed by Supabase. |  
| Authentication | Supabase Auth | Latest | User sign-up, login, and management | Secure, built-in authentication that integrates seamlessly with the database. |  
| Transactional Email | React Email & Resend | Latest | Building and sending emails | Modern way to build emails with React; Resend provides a reliable sending service. |  
| Payments | Stripe | Latest | Subscription and payment processing | Industry-standard for secure payment processing, with excellent developer tools. |  
| Deployment | Vercel | Latest | Hosting and CI/CD platform | Offers seamless, optimized deployment for Next.js applications. |  
| Schema Management | Supabase Migrations | Latest | Database schema version control | Ensures database changes are version-controlled and repeatable. |  
| Data Seeding | Stripe Fixtures | Latest | Initial product/price data setup | Allows for easy and repeatable setup of product data in Stripe for testing. |

### **Data Models**

#### **CompanySettings**

**Purpose:** To store the user's company branding and default calculation settings. **TypeScript Interface:**

// src/features/settings/types.ts  
export interface CompanySettings {  
  id: string; // Corresponds to user\_id  
  company\_name: string | null;  
  company\_address: string | null;  
  company\_phone: string | null;  
  logo\_url: string | null;  
  default\_tax\_rate: number;  
  default\_markup\_rate: number;  
}

#### **LineItems**

**Purpose:** To store a user's personal database of reusable services and materials. **TypeScript Interface:**

// src/features/items/types.ts  
export interface LineItem {  
  id: string;  
  user\_id: string;  
  name: string;  
  unit: string;  
  cost: number;  
}

#### **Quotes**

**Purpose:** To store each quote created by a user, including all line items and final calculations. **TypeScript Interface:**

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
  user\_id: string;  
  client\_name: string;  
  client\_contact: string | null;  
  quote\_data: QuoteLineItem\[\];  
  subtotal: number;  
  tax\_rate: number;  
  markup\_rate: number;  
  total: number;  
  created\_at: string;  
}

### **Database Schema**

\-- supabase/migrations/YYYYMMDDHHMMSS\_create\_app\_tables.sql

CREATE TABLE public.company\_settings (  
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,  
  company\_name TEXT,  
  company\_address TEXT,  
  company\_phone TEXT,  
  logo\_url TEXT,  
  default\_tax\_rate NUMERIC(5, 2\) DEFAULT 0.00,  
  default\_markup\_rate NUMERIC(5, 2\) DEFAULT 0.00,  
  updated\_at TIMESTAMPTZ DEFAULT NOW()  
);  
ALTER TABLE public.company\_settings ENABLE ROW LEVEL SECURITY;  
CREATE POLICY "Users can view and manage their own company settings" ON public.company\_settings FOR ALL USING (auth.uid() \= id);

CREATE TABLE public.line\_items (  
  id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
  user\_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,  
  name TEXT NOT NULL,  
  unit TEXT,  
  cost NUMERIC(10, 2\) NOT NULL,  
  created\_at TIMESTAMPTZ DEFAULT NOW()  
);  
ALTER TABLE public.line\_items ENABLE ROW LEVEL SECURITY;  
CREATE POLICY "Users can view and manage their own line items" ON public.line\_items FOR ALL USING (auth.uid() \= user\_id);  
CREATE INDEX idx\_line\_items\_user\_id ON public.line\_items(user\_id);

CREATE TABLE public.quotes (  
  id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
  user\_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,  
  client\_name TEXT NOT NULL,  
  client\_contact TEXT,  
  quote\_data JSONB NOT NULL,  
  subtotal NUMERIC(10, 2\) NOT NULL,  
  tax\_rate NUMERIC(5, 2\) NOT NULL,  
  markup\_rate NUMERIC(5, 2\) NOT NULL,  
  total NUMERIC(10, 2\) NOT NULL,  
  created\_at TIMESTAMPTZ DEFAULT NOW()  
);  
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;  
CREATE POLICY "Users can view and manage their own quotes" ON public.quotes FOR ALL USING (auth.uid() \= user\_id);  
CREATE INDEX idx\_quotes\_user\_id ON public.quotes(user\_id);

### **Source Tree**

src/  
├── app/  
│   ├── (main)/  
│   │   ├── layout.tsx  
│   │   └── page.tsx             // Landing Page  
│   ├── (auth)/  
│   │   ├── login/  
│   │   └── signup/  
│   └── (app)/  
│       ├── layout.tsx           // Main app layout with nav  
│       ├── dashboard/           // Main dashboard after login  
│       │   └── page.tsx  
│       ├── settings/            // For Story 1.2  
│       │   └── page.tsx  
│       ├── items/               // For Story 1.3  
│       │   └── page.tsx  
│       └── quotes/  
│           └── page.tsx         // View for creating a new quote (Story 1.4)  
├── components/  
│   ├── ui/                      // shadcn/ui components  
│   └── shared/                  // Reusable components (e.g., Navbar, Logo)  
├── features/  
│   ├── auth/                    // Existing auth logic  
│   ├── settings/                // Logic for Story 1.2  
│   │   ├── components/          // SettingsFormComponent  
│   │   ├── actions.ts           // Server actions for settings  
│   │   └── types.ts             // TypeScript types for settings  
│   ├── items/                   // Logic for Story 1.3  
│   │   ├── components/          // ItemsDataTable, AddItemForm  
│   │   ├── actions.ts  
│   │   └── types.ts  
│   └── quotes/                  // Logic for Stories 1.4 & 1.5  
│       ├── components/          // QuoteCalculator, LineItemRow  
│       ├── actions.ts  
│       └── types.ts  
├── libs/  
│   ├── supabase/  
│   ├── stripe/  
│   └── pdf/                     // PDF generation logic (Story 1.5)  
└── utils/

### **Coding Standards**

#### **Critical Fullstack Rules**

* **Type Safety:** All data models and API communication must use the shared TypeScript interfaces defined in the features/\*/types.ts files.  
* **Server-Side Logic Only:** All Supabase client calls that require service keys MUST be made from Next.js Server Actions or API Routes.  
* **Environment Variables:** Access all environment variables through the provided utility functions. Never use process.env directly in components.  
* **UI Components:** All UI must be built using shadcn/ui components to maintain consistency.  
* **State Management:** For client-side state, use React's built-in hooks (useState, useContext).

#### **Naming Conventions**

| Element | Convention | Example |  
| Components | PascalCase | QuoteCalculator.tsx |  
| Server Actions | camelCase | saveSettings.ts |  
| API Routes | kebab-case | /api/quotes/generate-pdf |  
| Database Tables | snake\_case | company\_settings |  
| Type Interfaces | PascalCase | interface CompanySettings |

---

## **Epic 2: UI/UX Enhancement Architecture**

### **Architecture Status Update**

**Epic 1**: ✅ **COMPLETE** - All foundational architecture successfully implemented
- Database schema with RLS policies deployed
- Feature-based architecture established  
- TypeScript interfaces and types implemented
- Server Actions pattern proven effective
- PDF generation system operational

**Epic 2**: 🚧 **PLANNED** - Professional UI/UX Enhancement & Application Maturity

### **Epic 2 Architecture Considerations**

#### **UI/UX Enhancement Strategy**

**Design System Implementation:**
- **Custom Color Palette**: Forest green (#2A3D2F), stone gray (#D7D7D7), equipment yellow (#F2B705)
- **Typography System**: Inter (primary), Roboto Mono (code/numbers)  
- **Component Enhancement**: Extend existing shadcn/ui with custom styling
- **Layout System**: Professional sidebar navigation with responsive design

**Enhanced Component Architecture:**
```typescript
// Enhanced layout components
src/components/
├── layout/
│   ├── AppSidebar.tsx         // Professional navigation
│   ├── AppHeader.tsx          // Context-aware headers  
│   └── AppLayout.tsx          // Main layout wrapper
├── dashboard/
│   ├── QuickActions.tsx       // Dashboard action cards
│   ├── RecentQuotes.tsx       // Quote overview widget
│   └── WelcomeFlow.tsx        // New user onboarding
└── enhanced-ui/
    ├── DataTable.tsx          // Advanced table with sorting/filtering
    ├── InlineEditor.tsx       // Inline editing components
    └── StatusBadge.tsx        // Quote status indicators
```

**State Management Enhancement:**
- **Navigation State**: Active page and breadcrumb management
- **Draft Management**: Auto-save functionality for quotes
- **UI State**: Loading states, notifications, modal management
- **User Preferences**: Layout preferences, default views

#### **Database Schema Extensions**

**Quote Status Management:**
```sql
-- Epic 2 schema enhancements
ALTER TABLE public.quotes ADD COLUMN status TEXT DEFAULT 'draft';
ALTER TABLE public.quotes ADD COLUMN quote_number TEXT;
ALTER TABLE public.quotes ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();

-- Quote status enum
CREATE TYPE quote_status AS ENUM ('draft', 'sent', 'accepted', 'declined', 'expired');
ALTER TABLE public.quotes ALTER COLUMN status TYPE quote_status USING status::quote_status;

-- Quote numbering sequence
CREATE SEQUENCE quote_number_seq START 1000;
```

**Enhanced Company Settings:**
```sql
-- Logo storage and additional settings
ALTER TABLE public.company_settings ADD COLUMN logo_file_name TEXT;
ALTER TABLE public.company_settings ADD COLUMN preferred_currency TEXT DEFAULT 'USD';
ALTER TABLE public.company_settings ADD COLUMN quote_terms TEXT;
```

#### **Feature Architecture Expansion**

**Enhanced Source Tree:**
```
src/features/
├── dashboard/                 // Epic 2 Addition
│   ├── components/
│   │   ├── DashboardOverview.tsx
│   │   ├── QuickActionCards.tsx
│   │   └── RecentActivity.tsx
│   ├── actions.ts
│   └── types.ts
├── quotes/                    // Epic 2 Enhancements
│   ├── components/
│   │   ├── QuotesList.tsx     // NEW: Quote management
│   │   ├── QuoteFilters.tsx   // NEW: Search/filter
│   │   ├── QuoteStatus.tsx    // NEW: Status management
│   │   └── SaveDraftButton.tsx // NEW: Draft functionality
│   └── utils/
│       └── quote-numbering.ts // NEW: Auto-numbering
└── ui-enhancements/           // Epic 2 Addition
    ├── components/
    │   ├── EmptyState.tsx
    │   ├── LoadingSpinner.tsx
    │   └── ConfirmDialog.tsx
    └── hooks/
        ├── useAutoSave.ts
        └── useKeyboardShortcuts.ts
```

#### **Performance & Optimization**

**Epic 2 Performance Considerations:**
- **Component Lazy Loading**: Dashboard widgets and heavy components
- **Data Virtualization**: Large quote lists and item libraries
- **Optimistic Updates**: Enhanced UI responsiveness
- **Caching Strategy**: Quote drafts and user preferences
- **Image Optimization**: Logo uploads and display

**Mobile Responsiveness:**
- **Adaptive Navigation**: Collapsible sidebar for mobile
- **Touch Interactions**: Mobile-optimized touch targets
- **Progressive Enhancement**: Core functionality without JavaScript

#### **Security & Data Integrity**

**Epic 2 Security Enhancements:**
- **File Upload Security**: Logo upload validation and sanitization
- **XSS Prevention**: Enhanced input sanitization for rich content
- **CSRF Protection**: Form submission security
- **Rate Limiting**: API endpoint protection

**Data Integrity:**
- **Draft Auto-save**: Periodic background saves
- **Conflict Resolution**: Concurrent editing protection
- **Backup Strategy**: Critical data preservation
- **Audit Trail**: Quote modification history

### **Technical Debt & Improvements**

**Code Quality Enhancements:**
- **Component Testing**: Enhanced test coverage for UI components
- **E2E Testing**: Full workflow testing with Playwright
- **Performance Monitoring**: Real User Monitoring (RUM)
- **Error Tracking**: Enhanced error reporting and monitoring

**Architecture Maturity:**
- **Design System Documentation**: Component library documentation
- **API Documentation**: Enhanced endpoint documentation
- **Developer Experience**: Improved local development workflow
- **Deployment Pipeline**: Enhanced CI/CD with testing stages

---

## **Epic 2 Implementation Guidelines**

### **Phase-Based Approach**

**Phase 1: Foundation (Stories 2.1-2.2)**
- Layout system and navigation architecture
- Dashboard foundation and routing enhancements

**Phase 2: Core Enhancement (Stories 2.3-2.5)**  
- Enhanced form patterns and data management
- Advanced table components and filtering systems

**Phase 3: Business Features (Story 2.6)**
- Quote lifecycle management
- Advanced search and organization features

### **Compatibility Requirements**

- **Database Compatibility**: All Epic 2 changes maintain backward compatibility
- **API Stability**: Existing Epic 1 APIs remain unchanged
- **Component Consistency**: New components follow established patterns
- **Performance**: No degradation in existing functionality

### **Success Metrics**

- **UI/UX Quality**: Professional appearance matching industry standards
- **Performance**: Maintained or improved loading times
- **Accessibility**: WCAG AA compliance maintained
- **Mobile Experience**: Responsive design across all features
- **Developer Experience**: Enhanced development workflow and patterns