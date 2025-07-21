# LawnQuote Software Stories & Architecture Index

## Overview

This directory contains the comprehensive breakdown of LawnQuote Software requirements, organized into actionable user stories and supporting architecture documentation. This structure enables AI agents and developers to efficiently navigate and correlate implementation requirements.

## Directory Structure

```
docs/stories/
├── index.md                    # This navigation file
└── prd/                        # Product Requirements breakdown
    ├── architecture/           # Technical architecture supporting stories
    │   ├── coding-standards.md # Development guidelines and conventions
    │   ├── data-models.md      # TypeScript interfaces for all entities
    │   ├── database-schema.md  # Complete SQL schema with RLS policies
    │   ├── source-tree.md      # Directory structure mapped to stories
    │   └── tech-stack.md       # Technology choices and system overview
    ├── story-1-1-user-signup-and-login.md
    ├── story-1-2-company-and-quote-settings.md
    ├── story-1-3-manage-service-and-material-items.md
    ├── story-1-4-create-and-calculate-quote.md
    └── story-1-5-generate-and-download-quote-pdf.md
```

## Epic 1: Foundational Setup & Core Quoting Workflow

### Story Implementation Guide

| Story | File | Architecture Dependencies | Key Models | Implementation Focus |
|-------|------|--------------------------|------------|---------------------|
| **1.1** | [User Sign-Up and Login](./prd/story-1-1-user-signup-and-login.md) | [Tech Stack](./prd/architecture/tech-stack.md) • [Source Tree](./prd/architecture/source-tree.md) | Supabase Auth | `app/(auth)/`, `features/auth/` |
| **1.2** | [Company and Quote Settings](./prd/story-1-2-company-and-quote-settings.md) | [Data Models](./prd/architecture/data-models.md) • [Database Schema](./prd/architecture/database-schema.md) | `CompanySettings` | `app/(app)/settings/`, `features/settings/` |
| **1.3** | [Manage Service and Material Items](./prd/story-1-3-manage-service-and-material-items.md) | [Data Models](./prd/architecture/data-models.md) • [Database Schema](./prd/architecture/database-schema.md) | `LineItem` | `app/(app)/items/`, `features/items/` |
| **1.4** | [Create and Calculate a Quote](./prd/story-1-4-create-and-calculate-quote.md) | [Data Models](./prd/architecture/data-models.md) • [Database Schema](./prd/architecture/database-schema.md) | `Quote`, `QuoteLineItem` | `app/(app)/quotes/`, `features/quotes/` |
| **1.5** | [Generate and Download Quote PDF](./prd/story-1-5-generate-and-download-quote-pdf.md) | [Data Models](./prd/architecture/data-models.md) • [Source Tree](./prd/architecture/source-tree.md) | `Quote`, `CompanySettings` | `features/quotes/`, `libs/pdf/` |

## Architecture Quick Reference

### Essential Files for Implementation

1. **[Tech Stack](./prd/architecture/tech-stack.md)** - Start here for technology overview
2. **[Data Models](./prd/architecture/data-models.md)** - TypeScript interfaces for all entities
3. **[Database Schema](./prd/architecture/database-schema.md)** - Complete SQL schema with security policies
4. **[Source Tree](./prd/architecture/source-tree.md)** - File organization and feature mapping
5. **[Coding Standards](./prd/architecture/coding-standards.md)** - Development guidelines and conventions

### Data Model Relationships

```
User (Supabase Auth)
├── CompanySettings (1:1) → Story 1.2
├── LineItems (1:many) → Story 1.3  
└── Quotes (1:many) → Stories 1.4, 1.5
    └── QuoteLineItem[] (embedded JSONB)
```

### Implementation Sequence

**Phase 1: Foundation**
- Story 1.1 (Authentication) → Enables user access
- Story 1.2 (Settings) → Required for quote calculations

**Phase 2: Core Functionality** 
- Story 1.3 (Items) → Required for quote creation
- Story 1.4 (Quote Calculator) → Core business logic

**Phase 3: Output**
- Story 1.5 (PDF Generation) → Deliverable to clients

## AI Agent Navigation Tips

### For Story Implementation:
1. Read the specific story file for acceptance criteria
2. Reference corresponding data models for entities
3. Check database schema for table structure
4. Review source tree for file placement
5. Follow coding standards for implementation

### For Architecture Decisions:
- **Tech choices**: [tech-stack.md](./prd/architecture/tech-stack.md)
- **Data structure**: [data-models.md](./prd/architecture/data-models.md) 
- **Database design**: [database-schema.md](./prd/architecture/database-schema.md)
- **Code organization**: [source-tree.md](./prd/architecture/source-tree.md)
- **Development rules**: [coding-standards.md](./prd/architecture/coding-standards.md)

### Cross-Story Dependencies:
- Stories 1.4 & 1.5 depend on 1.2 (company settings for calculations)
- Stories 1.4 & 1.5 depend on 1.3 (line items for quote content)
- Story 1.5 depends on 1.4 (quote data for PDF generation)
- All stories depend on 1.1 (user authentication)

## File Correlation Matrix

| Story | Models Used | Database Tables | UI Components | Business Logic |
|-------|-------------|-----------------|---------------|----------------|
| 1.1 | User (Supabase) | `auth.users` | Login/Signup Forms | Authentication |
| 1.2 | `CompanySettings` | `company_settings` | Settings Form | Default Values |
| 1.3 | `LineItem` | `line_items` | Items Table, Add Form | CRUD Operations |
| 1.4 | `Quote`, `QuoteLineItem` | `quotes` | Calculator, Line Rows | Real-time Calculations |
| 1.5 | `Quote`, `CompanySettings` | `quotes`, `company_settings` | PDF Button | PDF Generation |

This index provides complete navigation for implementing LawnQuote Software with clear correlations between requirements and technical implementation.