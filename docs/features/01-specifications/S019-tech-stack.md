# Tech Stack

## Overview

LawnQuote Software is built on the **"next-supabase-stripe-starter"** template, providing a solid foundation with pre-configured integrations for Next.js, Supabase, and Stripe.

## Architecture Style
- **Serverless**, leveraging Vercel for hosting and Next.js for both frontend rendering and API routes
- **Single Application Repository**, containing the entire Next.js project
- **Component-Based UI** using React and shadcn/ui

## Technology Stack

| Category | Technology | Version | Purpose | Rationale |
|----------|------------|---------|---------|-----------|
| Frontend Language | TypeScript | ~5.x | Primary language for type safety | Enforces type safety, improves code quality and maintainability. |
| Frontend Framework | Next.js | 15 | Core application framework | Provides a robust, production-ready React framework with server-side capabilities. |
| UI Component Lib | shadcn/ui | Latest | Pre-built, accessible UI components | Accelerates development with high-quality, customizable, and accessible components. |
| Styling | Tailwind CSS | ~3.x | Utility-first CSS framework | Allows for rapid and consistent styling directly within the markup. |
| Backend Services | Supabase | Latest | Database, Auth, Backend Functions | Provides a managed, scalable backend, reducing operational complexity. |
| Database | PostgreSQL | Latest | Primary relational database | A powerful and reliable open-source relational database, managed by Supabase. |
| Authentication | Supabase Auth | Latest | User sign-up, login, and management | Secure, built-in authentication that integrates seamlessly with the database. |
| Transactional Email | React Email & Resend | Latest | Building and sending emails | Modern way to build emails with React; Resend provides a reliable sending service. |
| Payments | Stripe | Latest | Subscription and payment processing | Industry-standard for secure payment processing, with excellent developer tools. |
| Deployment | Vercel | Latest | Hosting and CI/CD platform | Offers seamless, optimized deployment for Next.js applications. |
| Schema Management | Supabase Migrations | Latest | Database schema version control | Ensures database changes are version-controlled and repeatable. |
| Data Seeding | Stripe Fixtures | Latest | Initial product/price data setup | Allows for easy and repeatable setup of product data in Stripe for testing. |

## High Level System Flow

```
User's Browser → Next.js Frontend (Vercel) → Supabase Backend → PostgreSQL Database
                              ↓
                        Stripe API (Payments)
                              ↓
                        Resend API (Emails)
```