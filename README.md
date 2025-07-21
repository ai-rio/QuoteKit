<p align="center">
  <h1 align="center">LawnQuote Software</h1>
</p>

<p align="center">
  <a href="https://opensource.org/licenses/MIT" rel="nofollow"><img src="https://img.shields.io/github/license/kolbysisk/next-supabase-stripe-starter" alt="License"></a>
</p>

## Introduction

**LawnQuote Software** is a professional quote generation system for landscaping and lawn care businesses. Create, calculate, and deliver beautiful PDF quotes to your clients with automatic tax calculations and company branding.

### Features Included

- **User Authentication** - Secure login with email magic links
- **Company Settings** - Store your business info, logo, default tax and markup rates
- **Service & Material Items** - Build your personal database of reusable services and materials
- **Quote Calculator** - Real-time quote creation with automatic calculations
- **PDF Generation** - Professional, branded quotes ready to send to clients
- [Next.js 15](https://nextjs.org) - Modern React framework
- [Supabase](https://supabase.com) - Postgres database & user authentication
- [shadcn/ui](https://ui.shadcn.com) - Beautiful, accessible UI components
- [React PDF](https://react-pdf.org/) - Professional PDF generation
- [Tailwindcss](https://tailwindcss.com/) - Utility-first CSS framework

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
- **Email Magic Links**: Secure passwordless authentication
- **User Sessions**: Persistent login with automatic redirects
- **Account Management**: User profile and session management

### 🏢 Company Settings
- **Business Information**: Store company name, address, phone
- **Logo Upload**: Company branding (placeholder for future enhancement)
- **Default Rates**: Set default tax and markup percentages
- **Quote Customization**: Override defaults per quote

### 📋 Service & Material Management
- **Item Database**: Build your personal catalog of services and materials
- **CRUD Operations**: Add, edit, delete items with validation
- **Cost Tracking**: Unit prices and measurement units
- **Quick Selection**: Easy item selection for quotes

### 💼 Quote Generation
- **Client Information**: Store client names and contact details
- **Real-time Calculations**: Automatic subtotals, tax, markup, and totals
- **Dynamic Line Items**: Add multiple items with quantities
- **Rate Overrides**: Quote-specific tax and markup adjustments
- **Quote History**: View and manage all created quotes

### 📄 Professional PDFs
- **Branded Output**: Company information and professional formatting
- **Client-Focused**: Tax shown, internal markup hidden from clients
- **Automatic Download**: Browser download with formatted filenames
- **Print-Ready**: Clean, professional layout suitable for printing

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