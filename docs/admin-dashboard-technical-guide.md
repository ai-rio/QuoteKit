# Admin Dashboard Technical Implementation Guide

**Version:** 1.0  
**Last Updated:** 2025-01-23  
**Status:** Active Development

## Architecture Overview

### Tech Stack
- **Frontend:** Next.js 15 App Router, React 18, TypeScript
- **UI Library:** shadcn-ui v4, Tailwind CSS  
- **Backend:** Next.js API Routes, Server Actions
- **Database:** Supabase PostgreSQL with RLS
- **Analytics:** PostHog (client + server integration)
- **Email:** Resend API
- **Authentication:** Supabase Auth

### Project Structure
```
src/
├── app/(admin)/                    # Admin route group
│   ├── layout.tsx                  # Admin authentication wrapper
│   ├── admin-dashboard/            # Main dashboard
│   ├── admin-settings/             # PostHog/Resend config
│   ├── users/                      # User management
│   │   ├── overview/              # User list and metrics
│   │   └── bulk-actions/          # Bulk operations
│   ├── email-system/              # Email management
│   │   ├── campaigns/             # Campaign management
│   │   ├── performance/           # Email metrics
│   │   └── templates/             # Email templates
│   └── analytics/                 # PostHog analytics
│       ├── custom-queries/        # HogQL interface
│       ├── funnels/              # Funnel analysis
│       └── cohorts/              # Cohort analysis
├── app/api/admin/                 # Admin API endpoints
│   ├── posthog-config/           # PostHog configuration
│   ├── resend-config/            # Resend configuration
│   ├── users/                    # User management APIs
│   └── metrics/                  # Analytics APIs
├── components/layout/            
│   └── admin-sidebar.tsx         # Hierarchical navigation
├── libs/posthog/                 # PostHog integrations
│   ├── posthog-admin.ts          # Server-side client
│   └── posthog-client.ts         # Client-side client
└── libs/supabase/               # Database clients
    ├── supabase-server-client.ts
    ├── supabase-admin.ts
    └── admin-utils.ts           # Admin role utilities
```

## Database Schema

### Admin Settings Table
```sql
CREATE TABLE public.admin_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Configuration examples stored in value column:
-- key: 'posthog_config'
-- value: { "project_api_key": "phc_...", "host": "https://us.posthog.com", ... }

-- key: 'resend_config'  
-- value: { "api_key": "re_...", "from_email": "noreply@domain.com", ... }
```

### Admin Role System
```sql
-- Admin role stored in auth.users.raw_user_meta_data
-- Example: { "role": "admin" }

CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT COALESCE((raw_user_meta_data->>'role')::text = 'admin', false)
    FROM auth.users 
    WHERE id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Implementation Status

### ✅ Completed Components

#### 1. Admin Layout & Navigation
```typescript
// src/app/(admin)/layout.tsx
// - Authentication middleware
// - Admin role checking (currently disabled)
// - Layout wrapper with sidebar

// src/components/layout/admin-sidebar.tsx  
// - Hierarchical expandable navigation
// - Active state management
// - Design system compliant
```

#### 2. Configuration Management
```typescript
// src/app/(admin)/admin-settings/page.tsx
// - PostHog API key configuration
// - Resend email configuration  
// - Connection testing
// - Secure credential storage

// API Endpoints:
// - GET/POST /api/admin/posthog-config
// - POST /api/admin/posthog-config/test
// - GET/POST /api/admin/resend-config  
// - POST /api/admin/resend-config/test
```

#### 3. Database Infrastructure
```sql
-- Migrations applied:
-- 20250723184549_add_admin_roles.sql
-- 20250723200000_add_admin_settings.sql
```

### ❌ Outstanding Implementation

#### 1. User Management (Critical)
```typescript
// src/app/(admin)/users/overview/page.tsx
// Current: Mock data only
// Needed: Real Supabase user integration

interface UserData {
  id: string
  email: string
  company_name?: string
  quote_count: number
  total_revenue: number
  last_active: string
  created_at: string
  status: 'active' | 'inactive'
  role: 'admin' | 'user'
}

// Required API endpoints:
// GET /api/admin/users - List users with pagination
// PUT /api/admin/users/[id] - Update user
// POST /api/admin/users/[id]/disable - Disable user
// POST /api/admin/users/[id]/role - Change role
```

#### 2. Real Analytics Integration
```typescript
// src/components/admin/system-metrics-card.tsx
// Current: Fallback mock data
// Needed: Real PostHog API integration

interface SystemMetrics {
  totalUsers: number
  activeUsers: number
  totalQuotes: number
  totalRevenue: number
  growthMetrics: {
    userGrowth: number
    quoteGrowth: number
    revenueGrowth: number
  }
}

// Required PostHog queries:
// - User counts and growth
// - Quote creation events  
// - Revenue calculations
// - Activity metrics
```

#### 3. Analytics Pages (Medium Priority)
```typescript
// All placeholder implementations:
// - src/app/(admin)/analytics/custom-queries/page.tsx
// - src/app/(admin)/analytics/funnels/page.tsx  
// - src/app/(admin)/analytics/cohorts/page.tsx

// Required: HogQL integration for custom analytics
```

## Security Considerations

### Authentication Flow
```typescript
// Current implementation in src/app/(admin)/layout.tsx
export default async function AdminLayout({ children }) {
  const supabase = await createSupabaseServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // TODO: Enable admin role checking
  // const isAdmin = await checkAdminRole(user.id)
  // if (!isAdmin) {
  //   redirect('/dashboard')
  // }

  return (/* Admin layout */)
}
```

### Row Level Security
```sql
-- Applied to admin_settings table
CREATE POLICY "Admin users can manage settings" 
ON public.admin_settings FOR ALL 
USING (is_admin(auth.uid()));
```

### API Security
- All admin endpoints verify authentication
- Admin role checking needed (currently commented)
- Sensitive data masking in responses
- Input validation and sanitization

## Performance Considerations

### Current Issues
1. **No pagination** in user management
2. **No caching** for PostHog API calls  
3. **No rate limiting** on admin endpoints
4. **Synchronous PostHog calls** can block UI

### Recommended Solutions
```typescript
// 1. Implement pagination
interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// 2. Add caching for PostHog data
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
const cachedMetrics = new Map<string, { data: any, expires: number }>()

// 3. Rate limiting middleware
import { Ratelimit } from '@upstash/ratelimit'
const ratelimit = new Ratelimit({
  redis: /* redis instance */,
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
})
```

## Error Handling Strategy

### Current State
- Basic try-catch in API routes
- Limited error boundaries in UI
- No centralized error logging

### Improvements Needed
```typescript
// 1. Error boundary component
class AdminErrorBoundary extends Component {
  state = { hasError: false, error: null }
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  
  componentDidCatch(error, errorInfo) {
    // Log to monitoring service
    console.error('Admin panel error:', error, errorInfo)
  }
}

// 2. Centralized error handling
interface AdminError {
  code: string
  message: string
  details?: any
  timestamp: string
}

// 3. User-friendly error messages
const ERROR_MESSAGES = {
  POSTHOG_CONNECTION_FAILED: 'Unable to connect to PostHog. Check your configuration.',
  UNAUTHORIZED_ACCESS: 'You do not have permission to access this resource.',
  USER_UPDATE_FAILED: 'Failed to update user. Please try again.',
}
```

## Testing Strategy

### Unit Testing
```typescript
// Test admin utilities
describe('isAdmin', () => {
  it('should return true for admin users', async () => {
    // Test implementation
  })
})

// Test API endpoints
describe('/api/admin/users', () => {
  it('should require authentication', async () => {
    // Test implementation
  })
})
```

### Integration Testing
```typescript
// Test admin flow end-to-end
describe('Admin User Management', () => {
  it('should allow admin to view and edit users', async () => {
    // Test implementation
  })
})
```

### Security Testing
- Admin role bypass attempts
- SQL injection in user queries
- XSS in admin interfaces
- CSRF protection validation

## Deployment Considerations

### Environment Variables
```bash
# PostHog Configuration
POSTHOG_PROJECT_API_KEY=phc_...
POSTHOG_PERSONAL_API_KEY=phx_...
POSTHOG_HOST=https://us.posthog.com
POSTHOG_PROJECT_ID=12345

# Resend Configuration  
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@domain.com
RESEND_FROM_NAME=LawnQuote

# Admin Configuration
ADMIN_DEFAULT_EMAIL=admin@domain.com
```

### Database Migrations
```bash
# Apply admin-related migrations
supabase db push

# Verify admin_settings table exists
supabase db diff
```

### Admin User Setup
```sql
-- Create first admin user
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'admin@domain.com';
```

## Monitoring & Observability

### Metrics to Track
- Admin login frequency
- Admin action success/failure rates
- PostHog API response times
- User management operation counts

### Logging Strategy
```typescript
// Admin action logging
interface AdminAuditLog {
  admin_user_id: string
  action: string
  target_user_id?: string
  details: any
  timestamp: string
  ip_address: string
}

// Log all admin actions
await logAdminAction({
  admin_user_id: user.id,
  action: 'user_role_changed',
  target_user_id: targetUserId,
  details: { old_role: 'user', new_role: 'admin' },
  timestamp: new Date().toISOString(),
  ip_address: request.ip
})
```

## Next Steps

### Immediate (Sprint 1)
1. **Enable admin role checking** in layout.tsx
2. **Replace mock user data** with real Supabase integration
3. **Implement user management APIs** with proper validation

### Short-term (Sprint 2)  
1. **Real PostHog integration** for dashboard metrics
2. **Custom query builder** for analytics
3. **Performance optimizations** (caching, pagination)

### Medium-term (Sprint 3-4)
1. **Advanced analytics features** (funnels, cohorts)
2. **Email campaign management**
3. **Comprehensive error handling and monitoring**

---

**Ready to begin Sprint 1:** Admin role verification and real user management implementation