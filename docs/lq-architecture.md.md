# **Fullstack Architecture Document: LawnQuote Software**

Date: July 21, 2025  
Author: Winston, Architect

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