# Edge Functions Baseline Analysis

## Current API Endpoints Analysis

### Subscription Management Operations (5-7 API calls → 1 Edge Function)

**Current endpoints to consolidate:**
1. `/api/subscription-status` - Get subscription status with diagnostics
2. `/api/sync-my-subscription` - Manual subscription sync
3. `/api/manual-subscription-sync` - Admin subscription sync
4. `/api/debug-subscription` - Subscription debugging
5. `/api/preview-plan-change` - Preview subscription changes
6. `/api/subscription` - Subscription updates
7. `/api/features/usage` - Feature usage tracking

**Performance characteristics:**
- Multiple database queries per operation (2-5 queries each)
- Cross-table joins for subscription + price + product data
- Webhook event processing (up to 20 events queried)
- Feature access validation with metadata parsing
- Stripe API calls for external validation

**Estimated consolidation impact:**
- API calls reduced from 5-7 to 1
- Database queries reduced from 10-25 to 3-5
- Response time improvement: ~45-60%

### Quote Processing Pipeline (8-12 API calls → 1 Edge Function)

**Current endpoints to consolidate:**
1. `/api/quotes` - CRUD operations
2. `/api/quotes/[id]/pdf` - PDF generation
3. `/api/quotes/[id]/email` - Email sending
4. `/api/quotes/[id]/status` - Status updates
5. `/api/quotes/bulk-delete` - Bulk operations
6. `/api/quotes/bulk-export` - Bulk export
7. `/api/quotes/bulk-status` - Bulk status changes
8. `/api/features/usage` - Usage tracking
9. Client-side PDF generation requests
10. Email template processing
11. Feature limit validation
12. Quote numbering system

**Performance characteristics:**
- PDF generation: 2-3 seconds per quote
- Email processing: 500ms-1s per email
- Feature validation on every operation
- Sequential processing for bulk operations
- Multiple database queries for quote + client + items data

**Estimated consolidation impact:**
- API calls reduced from 8-12 to 1-2
- Bulk operations 70% faster through server-side processing
- PDF generation 40% faster through optimized templates
- Response time improvement: ~50-60%

### Admin Dashboard Operations (6-10 API calls → 2 Edge Functions)

**Current endpoints to consolidate:**
1. `/api/admin/analytics/subscriptions` - Subscription analytics
2. `/api/admin/users` - User management
3. `/api/admin/users/[id]/activity` - User activity
4. `/api/admin/users/[id]/status` - User status updates
5. `/api/admin/metrics` - System metrics
6. `/api/admin/custom-queries` - Custom analytics
7. `/api/admin/sync-subscriptions` - Bulk sync operations
8. `/api/admin/cleanup-customers` - Data cleanup
9. Stripe configuration queries
10. PostHog analytics integration

**Performance characteristics:**
- Complex analytics queries with multiple aggregations
- Large dataset processing (all users, subscriptions)
- External API calls to Stripe for validation
- Revenue calculations with date-based filtering
- Cross-table analytics joins

**Estimated consolidation impact:**
- API calls reduced from 6-10 to 2
- Analytics processing 60% faster through pre-aggregation
- Dashboard load time improvement: ~50%

### Webhook Processing (Multiple endpoints → 1 Edge Function)

**Current endpoints to consolidate:**
1. `/api/webhooks/stripe` - Stripe webhook handler
2. Individual webhook processors by event type
3. Customer creation/updates
4. Subscription lifecycle events
5. Payment method updates

**Performance characteristics:**
- Event validation and signature verification
- Multiple database operations per webhook
- Error handling and retry logic
- Event deduplication
- Customer data synchronization

**Estimated consolidation impact:**
- Processing time reduced by 60%
- Better error handling and retry mechanisms
- Unified event processing logic

## Current Architecture Pain Points

### Database Query Patterns
- Repetitive subscription status checks across endpoints
- Inefficient joins for user → subscription → price → product data
- Multiple round-trips for feature access validation
- Lack of result caching between operations

### Client-Side Processing Issues
- PDF generation happening in browser
- Multiple sequential API calls for single operations
- Feature limit validation on every action
- Heavy client-side state management

### Performance Bottlenecks
- Cold start times for serverless functions
- Sequential processing of bulk operations
- Redundant authentication checks
- Multiple Stripe API calls for validation

## Baseline Performance Metrics (To Be Measured)

### Response Time Targets
- **Subscription Operations**: 800ms → 400ms (50% improvement)
- **Quote Generation**: 2.5s → 1.2s (52% improvement) 
- **Admin Analytics**: 1.5s → 600ms (60% improvement)
- **Webhook Processing**: 500ms → 200ms (60% improvement)

### API Call Reduction Targets
- **Total API calls reduced by 70%**
- **Database queries reduced by 40%**
- **Client-server round trips reduced by 60%**

### Cost Reduction Projections
- **Current**: $100-165/month
- **Target**: $35-55/month
- **Savings**: 60-75% reduction

## Next Steps
1. Set up performance monitoring for current endpoints
2. Implement baseline measurement collection
3. Create Edge Functions development environment
4. Begin with subscription status consolidation as proof of concept

---
*Analysis Date: 2025-08-07*
*Status: Initial baseline established*