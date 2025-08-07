# Authentication Integration Analysis

## Current Authentication Architecture

### Authentication Flow
QuoteKit uses Supabase Auth with the following pattern:

1. **Server-Side Authentication** (`supabase-server-client.ts`):
   - Uses `@supabase/ssr` for server-side rendering
   - Cookie-based session management via Next.js
   - Automatic token refresh and session handling

2. **Admin Role Management** (`admin-utils.ts`):
   - Database-driven role system using `user_roles` table
   - RPC functions for admin checks: `is_admin(user_id)`
   - Admin actions logging (TODO: implement `admin_actions` table)

3. **Middleware Integration** (`middleware.ts`):
   - Global session updates using `updateSession`
   - Protects all routes by default with pattern matching

## Edge Functions Authentication Requirements

### JWT Token Validation
Edge Functions need to validate JWT tokens directly without cookie support:

```typescript
// Current API Route Pattern
const supabase = await createSupabaseServerClient();
const { data: { user }, error } = await supabase.auth.getUser();

// Edge Function Pattern  
const authorization = request.headers.get('Authorization');
const token = authorization.replace('Bearer ', '');
const { data: { user }, error } = await supabase.auth.getUser(token);
```

### Admin Role Verification
Edge Functions will use the same RPC pattern:

```typescript
// Consistent across API routes and Edge Functions
const { data } = await supabase.rpc('is_admin', { user_id: userId });
```

## Integration Strategy

### 1. Token Extraction
- Extract JWT from `Authorization: Bearer <token>` header
- Fallback to query parameter for webhook scenarios
- Validate token format and expiration

### 2. User Context
- Create consistent user context across API routes and Edge Functions
- Maintain same user object structure
- Preserve admin role checking logic

### 3. Feature Access Control
Edge Functions need to replicate the current feature access pattern:

```typescript
// Current pattern in API routes
const { data: subscription } = await supabase
  .from('subscriptions')
  .select(`
    *,
    stripe_prices!inner (
      *,
      stripe_products!inner (metadata)
    )
  `)
  .eq('user_id', userId)
  .eq('status', 'active')
  .single();

const features = parseStripeMetadata(subscription?.stripe_prices?.stripe_products?.metadata);
```

### 4. Database RPC Functions Compatibility
Edge Functions will use the same database RPC functions:
- `is_admin(user_id)` - Admin role checking  
- `get_current_usage(user_id)` - Feature usage tracking
- `increment_usage(user_id, usage_type, amount)` - Usage increment
- `generate_quote_number(user_uuid)` - Quote numbering

## Edge Function Authentication Implementation

### Shared Authentication Module
Created `/supabase/functions/_shared/auth.ts` with:

1. **`getUser(request)`** - Extract and validate JWT token
2. **`getSupabaseAdmin()`** - Create admin client for database operations
3. **`isAdmin(userId)`** - Check admin role using existing RPC
4. **`requireAuth(request)`** - Authentication middleware
5. **`requireAdmin(request)`** - Admin-only middleware

### Example Usage Pattern
```typescript
import { requireAuth, isAdmin } from '../_shared/auth.ts';

Deno.serve(async (req) => {
  // Authenticate user
  const { response: authResponse, user } = await requireAuth(req);
  if (authResponse) return authResponse;
  
  // Check admin access if needed
  if (await isAdmin(user.id)) {
    // Admin-only logic
  }
  
  // Regular user logic
});
```

## Migration Considerations

### 1. Client-Side Changes
Current client code using fetch with cookies needs minimal changes:

```javascript
// Current pattern works with Edge Functions
const response = await fetch('/api/endpoint', {
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  },
});
```

### 2. Session Management
- Edge Functions receive tokens directly via headers
- No cookie parsing needed
- Same JWT validation logic as current API routes

### 3. Database Access Patterns
- Use same connection patterns via `SUPABASE_SERVICE_ROLE_KEY`
- Maintain RPC function compatibility
- Preserve RLS policy behavior

## Security Considerations

### 1. Token Handling
- Validate JWT signature and expiration
- Check token issuer matches Supabase project
- Handle token refresh scenarios

### 2. Admin Access
- Maintain same admin role verification
- Log admin actions consistently
- Preserve audit trail functionality  

### 3. Rate Limiting
- Implement per-user rate limiting in Edge Functions
- Track usage metrics for cost optimization
- Prevent abuse and maintain performance

## Testing Strategy

### 1. Authentication Flow Testing
- Verify JWT token validation
- Test admin role checking
- Validate feature access control

### 2. Compatibility Testing  
- Ensure same behavior as API routes
- Test session handling edge cases
- Verify database access patterns

### 3. Security Testing
- Test token validation edge cases
- Verify admin access controls
- Test rate limiting implementation

## Implementation Benefits

### 1. Consistent Auth Experience
- Same authentication flow for users
- Identical admin access patterns
- Preserved security model

### 2. Simplified Client Code
- No client-side changes required
- Same header-based authentication
- Consistent error handling

### 3. Enhanced Security
- Direct JWT validation without cookies
- Reduced attack surface
- Better token handling in serverless environment

---

*Analysis Date: 2025-08-07*
*Status: Ready for implementation*
*Next: Create subscription status Edge Function*