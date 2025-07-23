<p align="center">
  <h1 align="center">LawnQuote Software</h1>
</p>

<p align="center">
  <a href="https://opensource.org/licenses/MIT" rel="nofollow"><img src="https://img.shields.io/github/license/kolbysisk/next-supabase-stripe-starter" alt="License"></a>
</p>

## Introduction

**LawnQuote Software** is a comprehensive quote management system for landscaping and lawn care businesses. Create, manage, track, and deliver professional PDF quotes with advanced features like templates, bulk operations, and status tracking.

### 🌟 Core Features

- **🔐 User Authentication** - Secure passwordless login with email magic links
- **🏢 Company Settings** - Business information, logo upload, and default rate management
- **📋 Item Library** - Enhanced catalog with categories, favorites, and bulk operations
- **💼 Quote Management** - Complete quote lifecycle with status tracking and history
- **📝 Quote Templates** - Save and reuse frequently used quote configurations
- **📊 Dashboard Analytics** - Overview of quotes, revenue, and business performance
- **📄 Professional PDFs** - Branded, client-ready quotes with automatic calculations
- **📱 Mobile Responsive** - Optimized interface for all devices and screen sizes

### 🚀 Advanced Quote Features

- **Real-time Calculations** - Automatic subtotals, tax, markup, and totals
- **Status Management** - Track quotes through draft, sent, accepted, declined, expired, converted
- **Bulk Operations** - Select multiple quotes for status updates, export, or deletion
- **Advanced Filtering** - Filter by status, client, date range, and search terms
- **Template System** - Create reusable templates from existing quotes
- **Auto-save Drafts** - Never lose work with automatic draft saving
- **Date Range Selection** - Professional calendar interface for filtering
- **Quote History** - Complete audit trail of quote changes and status updates

### 🎨 Enhanced UI/UX

- **Design System Compliant** - Consistent color palette and typography
- **Loading States** - Skeleton screens and spinners for better user experience
- **Toast Notifications** - Real-time feedback for all user actions
- **Responsive Tables** - Desktop table view converts to mobile cards
- **Touch-friendly** - 44px minimum touch targets for mobile accessibility
- **Keyboard Navigation** - Full keyboard support with focus management

### 🛠 Technology Stack

- [Next.js 15](https://nextjs.org) - React framework with App Router
- [Supabase](https://supabase.com) - PostgreSQL database with Row Level Security
- [shadcn/ui](https://ui.shadcn.com) - Accessible UI component library
- [React PDF](https://react-pdf.org/) - Professional PDF document generation
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [TypeScript](https://typescriptlang.org) - Type-safe development
- [React Day Picker](https://react-day-picker.js.org/) - Date range selection

## Quick Start (Local Development)

### 1. Clone and Install Dependencies

```bash
git clone <your-repo>
cd QuoteKit
npm install
```

### 2. Start Local Supabase

```bash
supabase start
```

This will start the local Supabase development environment with:
- **API URL**: http://127.0.0.1:54321
- **Studio URL**: http://127.0.0.1:54323 (Database admin interface)
- **Inbucket URL**: http://127.0.0.1:54324 (Local email testing)

### 3. Run Database Migrations

```bash
supabase migration up
```

This creates all the necessary tables for the application:
- `company_settings` - Store business information and defaults
- `line_items` - User's database of services and materials  
- `quotes` - Generated quotes with calculations

### 4. Start the Application

```bash
npm run dev
```

The application will be available at http://localhost:3000

### 5. Test Email Authentication

1. **Go to**: http://localhost:3000/login
2. **Click**: "Continue with Email"
3. **Enter any email**: e.g., `test@example.com`
4. **Check local email server**: Go to http://127.0.0.1:54324
5. **Click the magic link** in the email to authenticate

### 6. Try the Complete Workflow

Once logged in, you can:

1. **Set up your company** → Go to Settings in the account menu
2. **Add services/materials** → Go to "My Items" to build your database
3. **Create quotes** → Go to "My Quotes" → "Create New Quote"
4. **Generate PDFs** → After saving a quote, use the PDF generator
5. **Create templates** → Go to Templates tab → "Create Template" from existing quotes
6. **Use templates** → "Use Template" to pre-fill new quotes with saved configurations
7. **Manage quotes** → Use bulk operations, filters, and status tracking for quote management

---

## Production Setup (Optional)

For production deployment, you'll need to set up external services:

### 1. Setup Supabase (Production)

1. Go to [supabase.com](https://supabase.com) and create a project
2. Get your project URL and API keys from Project Settings → API
3. Update your `.env.local` with production values

### 2. Setup Resend (For Production Emails)

1. Go to [resend.com](https://resend.com) and create an account
2. Get your API key from the [API Keys page](https://resend.com/api-keys)
3. Add `RESEND_API_KEY` to your environment variables

### 3. Deploy

Deploy to Vercel, Netlify, or your preferred hosting platform with the environment variables from your `.env.local` file.

---

## Application Features

### 🔐 Authentication System
- **Email Magic Links**: Secure passwordless authentication with Supabase
- **User Sessions**: Persistent login with automatic redirects and session management
- **Account Management**: User profile settings and secure logout
- **Row Level Security**: Database-level security ensuring data isolation

### 🏢 Company Settings
- **Business Information**: Store company name, address, phone, and contact details
- **Logo Management**: Upload and display company branding on quotes
- **Default Rates**: Configure default tax and markup percentages
- **Quote Customization**: Override company defaults on individual quotes
- **Settings Persistence**: Company settings saved and applied to new quotes

### 📋 Enhanced Item Library
- **Comprehensive Database**: Build your catalog of services and materials
- **Category Management**: Organize items by categories for easy navigation
- **Favorites System**: Mark frequently used items as favorites
- **Bulk Operations**: Select multiple items for editing or deletion
- **Advanced Search**: Find items quickly with search and filtering
- **Cost Tracking**: Unit prices, measurement units, and cost history
- **Usage Analytics**: Track which items are used most frequently

### 💼 Advanced Quote Management
- **Complete Quote Lifecycle**: Draft → Sent → Accepted/Declined/Expired/Converted
- **Status Tracking**: Visual status indicators and automated status management
- **Bulk Operations**: Update status, delete, or export multiple quotes simultaneously
- **Advanced Filtering**: Filter by status, client, date range, and search terms
- **Real-time Search**: Instant search across client names and quote numbers
- **Quote History**: Complete audit trail of all quote changes and status updates
- **Auto-save Drafts**: Automatic saving every 30 seconds to prevent data loss

### 📝 Quote Template System
- **Template Creation**: Save any quote as a reusable template
- **Template Library**: Manage collection of templates with names and descriptions
- **Quick Quote Creation**: Use templates to pre-fill new quotes instantly
- **Template Editing**: Update template names and manage template collections
- **Preview System**: See template details before using
- **Template Analytics**: Track template usage and effectiveness

### 📊 Dashboard & Analytics
- **Quote Overview**: Total quotes, revenue, and conversion metrics
- **Recent Activity**: Latest quotes and status changes
- **Performance Metrics**: Acceptance rates and average quote values
- **Quick Actions**: Direct access to common tasks from dashboard
- **Visual Indicators**: Status badges and progress indicators

### 📱 Mobile-Responsive Design
- **Touch-Optimized**: 44px minimum touch targets for mobile accessibility
- **Responsive Tables**: Desktop tables convert to mobile-friendly cards
- **Adaptive Navigation**: Collapsible sidebar and mobile-optimized menus
- **Calendar Interface**: Mobile-friendly date range selection
- **Form Optimization**: Touch-friendly inputs and buttons

### 📄 Professional PDF Generation
- **Branded Output**: Company logo and information on every quote
- **Client-Focused Design**: Tax displayed, internal markup calculations hidden
- **Professional Formatting**: Clean, print-ready layout with proper typography
- **Automatic Downloads**: Browser downloads with descriptive filenames
- **Calculation Accuracy**: Precise tax and total calculations
- **PDF Optimization**: Fast generation and reasonable file sizes

### 🎨 Enhanced User Experience
- **Design System**: Consistent color palette and typography throughout
- **Loading States**: Skeleton screens and spinners for better perceived performance
- **Toast Notifications**: Real-time feedback for all user actions
- **Error Handling**: Graceful error states with helpful messaging
- **Keyboard Navigation**: Full keyboard support with visible focus indicators
- **Accessibility**: WCAG AAA compliant color contrast and screen reader support

## Development Guide

### Database Schema Management

[Migrations](https://supabase.com/docs/reference/cli/supabase-migration-new) manage your database schema changes:

```bash
# Create a new migration
npm run migration:new add_new_table

# Apply migrations  
npm run migration:up
```

### File Structure

```
src/
├── app/                     # Next.js app router pages
│   ├── (auth)/             # Authentication pages
│   ├── (app)/              # Main application pages
│   └── api/                # API routes
├── components/             # Reusable UI components
│   └── ui/                 # shadcn/ui components
├── features/               # Feature-based modules
│   ├── auth/               # Authentication logic
│   ├── items/              # Service/material management
│   ├── quotes/             # Quote creation & management
│   └── settings/           # Company settings
└── libs/                   # External service integrations
    ├── pdf/                # PDF generation
    └── supabase/           # Database client
```

### Key Technologies

- **Next.js 15** - React framework with App Router
- **Supabase** - PostgreSQL database with Row Level Security
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Pre-built accessible components
- **React PDF** - PDF document generation

### Local Development URLs

- **Application**: http://localhost:3000
- **Database Admin**: http://127.0.0.1:54323
- **Email Testing**: http://127.0.0.1:54324
- **API Endpoint**: http://127.0.0.1:54321

---

## Architecture

LawnQuote is built following modern web development practices:

- **Feature-based Architecture**: Code organized by business features
- **Server Components**: Leverage Next.js server components for performance  
- **Row Level Security**: Database-level security with Supabase RLS
- **Type Safety**: Full TypeScript coverage with strict mode
- **Real-time Updates**: Optimistic UI updates for better UX
- **Progressive Enhancement**: Works without JavaScript for core features

Built from the [Next.js Supabase Starter](https://github.com/kolbysisk/next-supabase-stripe-starter) template.