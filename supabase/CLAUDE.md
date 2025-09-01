# Supabase Database Context for QuoteKit

## Core Tables & Landscaping Business Schema

### Primary Business Entities
- `users` - Authentication and profile data with RLS policies
- `companies` - Landscaping business information and settings
- `clients` - Property owners and business customers  
- `properties` - Physical locations requiring landscaping services
- `property_assessments` - Detailed property condition evaluations
- `quotes` - Main business entities with landscaping service pricing
- `quote_line_items` - Individual services (mowing, mulching, hardscaping)
- `payments` - Stripe payment tracking with subscription management
- `analytics_events` - PostHog event tracking for landscaping workflows

### Landscaping-Specific Tables
- `assessment_conditions` - Lawn, soil, irrigation, obstacle conditions
- `pricing_multipliers` - Condition-based pricing adjustments (1.1x-1.6x)
- `service_templates` - Reusable landscaping service configurations
- `property_media` - Photos and videos from assessments

## Row Level Security (RLS) Patterns

### User Data Security
```sql
-- Standard user data access
auth.uid() = user_id

-- Company-scoped access for landscaping businesses
auth.uid() IN (SELECT user_id FROM company_users WHERE company_id = companies.id)

-- Property access for assessments and quotes
auth.uid() IN (SELECT user_id FROM company_users cu 
               JOIN companies c ON c.id = cu.company_id 
               WHERE c.id = properties.company_id)
```

### Public Content Patterns
- Assessment templates: `is_template = true AND visibility = 'public'`
- Pricing guidelines: `public_pricing = true`
- Service catalogs: role-based access via `company_roles` table

## Edge Function Deployment

### QuoteKit-Specific Functions
```bash
# Payment processing for landscaping subscriptions
supabase functions deploy stripe-webhook-landscaping

# Assessment PDF generation with landscaping branding  
supabase functions deploy generate-assessment-pdf

# Quote email delivery with professional templates
supabase functions deploy send-quote-email

# Analytics processing for landscaping business metrics
supabase functions deploy process-landscaping-analytics

# Pricing calculations with condition multipliers
supabase functions deploy calculate-condition-pricing
```

### Function Environment Variables
- `STRIPE_SECRET_KEY` - B2B payment processing
- `RESEND_API_KEY` - Professional email delivery
- `POSTHOG_API_KEY` - Landscaping business analytics
- `PDF_GENERATION_KEY` - Assessment report generation

## Migration Best Practices for Landscaping SaaS

### Development Workflow
```bash
# Always test landscaping schema changes locally first
supabase db reset
bun run test -- --grep="assessment.*quote.*integration"

# Apply migrations with landscaping business validation
supabase db push --dry-run
supabase db push

# Generate TypeScript types for QuoteKit features
bun run generate-types
```

### Schema Evolution Patterns
- Document breaking changes affecting quote calculations
- Use transactions for multi-table landscaping operations
- Version pricing engine schema for backward compatibility
- Test assessment-to-quote conversion after schema changes

## Common Supabase Operations for QuoteKit

### Database Debugging
```bash
# Check landscaping business data
supabase auth users list
supabase logs --type=database

# Monitor quote generation performance  
supabase logs --function=calculate-condition-pricing
supabase logs --function=generate-assessment-pdf
```

### Edge Function Monitoring
```bash
# Monitor landscaping payment processing
supabase functions logs stripe-webhook-landscaping

# Check assessment PDF generation
supabase functions logs generate-assessment-pdf

# Monitor quote email delivery
supabase functions logs send-quote-email
```

### Performance Optimization
- Index on `property_assessments.property_id` for quick lookups
- Composite index on `quotes(company_id, status, created_at)` for dashboard queries
- Partial index on `payments(status)` WHERE status IN ('pending', 'processing')
- Full-text search index on `clients(name, email)` for client lookup

## Landscaping Business Context

QuoteKit's Supabase schema is optimized for:
- **Property Assessment Workflow**: Detailed condition evaluation → pricing calculation
- **Quote Generation**: Professional PDF with company branding
- **B2B Payment Processing**: Stripe integration for business subscriptions  
- **Multi-property Management**: Residential and commercial property tracking
- **Condition-based Pricing**: Advanced multipliers based on property conditions