# Email Implementation Guide - Quote Sending System

## Overview

This document outlines the implementation plan for adding email functionality to QuoteKit, enabling users to send professional quotes directly to clients via email with PDF attachments.

## Current Infrastructure Analysis

### ✅ Existing Email Components

**Resend Integration**
- Location: `/src/libs/resend/resend-client.ts`
- Status: Fully configured with API key handling
- Purpose: Production email delivery

**Email Templates Infrastructure**
- Location: `/src/features/emails/`
- Status: React Email components configured
- Features: Tailwind CSS styling, development environment (`npm run email:dev`)

**Inbucket Local Testing**
- URL: http://127.0.0.1:54324 (via `supabase start`)
- Status: Already integrated in local development stack
- Purpose: Local email testing without external dependencies

**Company Settings Integration**
- Table: `company_settings`
- Available: Company name, email, address, phone, logo
- Purpose: Email sender information and branding

**Quote System**
- Status tracking: draft, sent, accepted, declined, expired, converted
- PDF generation: Existing with company branding
- Client contact: Currently stored as string (needs email validation)

## Implementation Architecture

### Email Service Configuration

**Environment-Based Provider Switching**
```typescript
// Development Environment
{
  provider: 'smtp',
  smtp: {
    host: '127.0.0.1',
    port: 2500, // Inbucket SMTP port
    secure: false,
    requireTLS: false
  }
}

// Production Environment  
{
  provider: 'resend',
  apiKey: process.env.RESEND_API_KEY
}
```

### Database Schema Considerations

**Current Quote Model**
```sql
quotes (
  id,
  user_id,
  client_name,
  client_contact, -- ⚠️ Mixed contact info as string
  status, -- Perfect for email tracking
  sent_at, -- Already exists for email timestamps
  expires_at,
  quote_data,
  subtotal,
  tax_rate,
  markup_rate,
  total
)
```

**Enhancement Needed**
- Email validation for `client_contact` field
- Consider leveraging existing `clients` table with dedicated email fields

## Implementation Plan

### Phase 1: Core Email Infrastructure

#### 1.1 Email Configuration Service
**File**: `/src/libs/email/email-config.ts`
- Environment detection (development vs production)
- Provider switching logic
- SMTP vs API configuration

#### 1.2 Email Service Wrapper
**File**: `/src/libs/email/email-service.ts`
- Unified interface for both Resend and SMTP
- Error handling and logging
- Email delivery status tracking

#### 1.3 Quote Email Template
**File**: `/src/features/emails/quote-email.tsx`
- Professional quote presentation
- Company branding integration
- PDF attachment support
- Responsive design for all email clients

### Phase 2: API Integration

#### 2.1 Email API Endpoints
```
POST /api/quotes/[id]/email        # Send quote via email
POST /api/quotes/[id]/email/resend # Resend quote email
POST /api/quotes/bulk/email        # Bulk email operations
```

#### 2.2 Server Actions
**File**: `/src/features/quotes/email-actions.ts`
- Email sending logic
- Status updates (draft → sent)
- Timestamp management (`sent_at`)
- Error handling and retry logic

### Phase 3: UI Integration

#### 3.1 Quote Management Interface
- Email button in quote actions
- Email status indicators
- Last sent timestamp display

#### 3.2 Email Composition Modal
- Recipient email validation
- Subject line customization
- Message body editing
- PDF attachment preview

#### 3.3 Email History Tracking
- Email send history
- Delivery status tracking
- Error logs and retry options

### Phase 4: Advanced Features

#### 4.1 Follow-up System
- Automated follow-up scheduling
- Reminder emails based on quote expiry
- Template-based follow-up messages

#### 4.2 Email Analytics
- Open/click tracking (optional)
- Email performance metrics
- Client engagement insights

#### 4.3 Bulk Operations
- Multi-quote email sending
- Batch status updates
- Progress tracking for bulk operations

## Technical Implementation Details

### Email Template Structure

```typescript
interface QuoteEmailProps {
  quote: {
    id: string;
    quote_number: string;
    client_name: string;
    total: number;
    expires_at: string;
  };
  company: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    logo?: string;
  };
  pdfBuffer: Buffer;
}
```

### API Response Format

```typescript
interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  timestamp: string;
}
```

### Error Handling Strategy

1. **SMTP Errors**: Retry logic with exponential backoff
2. **API Rate Limits**: Queue management and throttling
3. **Attachment Errors**: PDF generation validation
4. **Email Validation**: Client-side and server-side validation

## Testing Strategy

### Local Development Testing
- Use Inbucket at http://127.0.0.1:54324
- Test all email templates and layouts
- Verify PDF attachments
- Validate company branding

### Integration Testing
- Email delivery confirmation
- Status update verification
- Error handling scenarios
- Bulk operation performance

## Security Considerations

### Email Address Validation
- Client-side validation with proper regex
- Server-side sanitization
- Protection against email injection

### Attachment Security
- PDF generation validation
- File size limits
- Content type verification

### Rate Limiting
- Per-user email limits
- Bulk operation throttling
- API key protection

## Deployment Configuration

### Environment Variables
```bash
# Development
NODE_ENV=development
SMTP_HOST=127.0.0.1
SMTP_PORT=2500

# Production  
NODE_ENV=production
RESEND_API_KEY=your_resend_api_key
```

### Database Migrations
- Email tracking tables (if needed)
- Index optimization for email queries
- Cleanup procedures for old email logs

## Success Metrics

### Functional Requirements
- ✅ Email successfully sent to client
- ✅ Quote status updated to 'sent'
- ✅ PDF attachment included
- ✅ Company branding applied
- ✅ Error handling and user feedback

### Performance Requirements
- Email delivery within 30 seconds
- PDF generation under 5 seconds
- Bulk operations handling 50+ quotes
- UI responsiveness maintained

## Future Enhancements

### Email Automation
- Quote expiry reminders
- Follow-up sequences
- Client engagement tracking

### Advanced Templates
- Seasonal variations
- Industry-specific templates
- Multi-language support

### Integration Opportunities
- Calendar scheduling integration
- CRM system connectivity
- Payment link inclusion

## File Structure

```
src/
├── libs/
│   └── email/
│       ├── email-config.ts      # Environment-based configuration
│       ├── email-service.ts     # Unified email service
│       └── smtp-client.ts       # SMTP client for development
├── features/
│   ├── emails/
│   │   ├── quote-email.tsx      # Quote email template
│   │   └── email-layouts.tsx    # Shared email layouts
│   └── quotes/
│       ├── email-actions.ts     # Server actions for email
│       └── email-utils.ts       # Email utilities
└── app/
    └── api/
        └── quotes/
            └── [id]/
                └── email/
                    └── route.ts # Email API endpoint
```

## Development Workflow

1. **Setup Local Environment**
   ```bash
   supabase start  # Starts Inbucket at :54324
   npm run dev     # Starts application
   ```

2. **Test Email Flow**
   - Create/edit quote
   - Click "Send Email" button
   - Check Inbucket at http://127.0.0.1:54324
   - Verify email content and PDF attachment

3. **Production Deployment**
   - Configure Resend API key
   - Test with real email addresses
   - Monitor delivery metrics

This implementation leverages existing infrastructure while adding comprehensive email functionality with proper local testing capabilities.