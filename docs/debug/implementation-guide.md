# TypeScript Errors Implementation Guide

## Quick Reference
This guide provides specific code fixes for each TypeScript error identified in the codebase. Use this alongside the main strategy document for implementation.

## File-by-File Fix Instructions

### 1. `src/features/admin/actions/customer-actions.ts` (14 errors)

#### Issue: Missing admin_customers view in types
**Lines affected:** 54, 73-85

#### Immediate Fix (Temporary):
```typescript
// Add at top of file
interface AdminCustomer {
  id: string;
  email: string;
  name: string;
  stripe_customer_id: string;
  created_at: string;
  last_sign_in_at: string | null;
  subscription_id: string;
  subscription_status: string;
  subscription_current_period_end: string;
  subscription_cancel_at_period_end: boolean;
  price_unit_amount: number;
  price_currency: string;
  price_interval: string;
  product_name: string;
}

// Replace line 54
let query = supabase.from('admin_customers').select('*') as any;

// Update the mapping function (lines 73-85)
const customers = (data as AdminCustomer[]).map(customer => ({
  id: customer.id,
  email: customer.email || 'N/A',
  name: customer.name || null,
  stripe_customer_id: customer.stripe_customer_id,
  created_at: customer.created_at || '',
  last_sign_in_at: customer.last_sign_in_at || null,
  subscription_id: customer.subscription_id,
  subscription_status: customer.subscription_status,
  subscription_current_period_end: customer.subscription_current_period_end,
  subscription_cancel_at_period_end: customer.subscription_cancel_at_period_end,
  price_unit_amount: customer.price_unit_amount,
  price_currency: customer.price_currency,
  price_interval: customer.price_interval,
  product_name: customer.product_name,
}));
```

#### Long-term Fix:
1. Regenerate Supabase types
2. Add admin_customers view to database types
3. Remove temporary interface

### 2. `src/features/clients/actions.ts` (5 errors)

#### Issue: Null safety for created_at field
**Lines affected:** 30, 104, 132, 188, 246

#### Fix:
```typescript
// Update Client interface (create/update in types file)
interface Client {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  created_at: string; // Keep as string, handle null in transformation
  updated_at: string | null;
}

// Add transformation helper
const transformClientData = (data: any): Client => ({
  ...data,
  created_at: data.created_at || new Date().toISOString(),
  updated_at: data.updated_at || null,
});

// Apply to all return statements (lines 30, 132, 188, 246)
return { data: transformClientData(data), error: null };

// For arrays (lines 30, 104)
return { data: (data || []).map(transformClientData), error: null };

// For ClientWithAnalytics (line 104)
const transformClientWithAnalytics = (data: any): ClientWithAnalytics => ({
  ...transformClientData(data),
  total_quotes: data.total_quotes || 0,
  accepted_quotes: data.accepted_quotes || 0,
  declined_quotes: data.declined_quotes || 0,
  total_quote_value: data.total_quote_value || 0,
  average_quote_value: data.average_quote_value || 0,
  last_quote_date: data.last_quote_date || null,
  conversion_rate: data.conversion_rate || 0,
  total_revenue: data.total_revenue || 0,
});
```

### 3. `src/features/clients/components/ClientList.tsx` (2 errors)

#### Issue: Type mismatch in callback functions
**Lines affected:** 437, 453

#### Fix:
```typescript
// Update callback handlers
const handleCreateClient = (client: Client | ClientWithAnalytics) => {
  // Convert to ClientWithAnalytics if needed
  const clientWithAnalytics: ClientWithAnalytics = {
    ...client,
    total_quotes: 0,
    accepted_quotes: 0,
    declined_quotes: 0,
    total_quote_value: 0,
    average_quote_value: 0,
    last_quote_date: null,
    conversion_rate: 0,
    total_revenue: 0,
  };
  
  setClients(prev => [clientWithAnalytics, ...prev]);
  setIsCreateDialogOpen(false);
};

const handleEditClient = (updatedClient: Client | ClientWithAnalytics) => {
  setClients(prev => prev.map(client => 
    client.id === updatedClient.id 
      ? { ...client, ...updatedClient }
      : client
  ));
  setEditingClient(null);
};
```

### 4. `src/features/items/components/add-item-dialog.tsx` (1 error)

#### Issue: Undefined response check
**Line affected:** 73

#### Fix:
```typescript
// Replace line 73
if (response?.data) {
  console.log('Item created successfully:', response.data);
  // ... rest of success handling
}
```

### 5. `src/features/items/global-actions.ts` (6 errors)

#### Issue: Null safety for access_tier and other fields
**Lines affected:** 38, 91, 155, 229, 283, 349

#### Fix:
```typescript
// Add type helpers
type ItemAccessTier = 'free' | 'paid' | 'premium';

const normalizeAccessTier = (tier: string | null): ItemAccessTier => {
  if (tier === 'free' || tier === 'paid' || tier === 'premium') {
    return tier;
  }
  return 'free'; // default
};

const transformGlobalCategory = (data: any): GlobalCategory => ({
  ...data,
  access_tier: normalizeAccessTier(data.access_tier),
  is_active: data.is_active ?? true,
  sort_order: data.sort_order ?? 0,
});

const transformGlobalItem = (data: any): GlobalItem => ({
  ...data,
  category_id: data.category_id || '',
  access_tier: normalizeAccessTier(data.access_tier),
  is_active: data.is_active ?? true,
  cost: data.cost ?? 0,
});

const transformUserGlobalItemUsage = (data: any): UserGlobalItemUsage => ({
  ...data,
  is_favorite: data.is_favorite ?? false,
  usage_count: data.usage_count ?? 0,
});

// Apply transformations to return statements
// Line 38
return { data: (data || []).map(transformGlobalCategory), error: null };

// Line 91
return { data: (data || []).map(transformGlobalItem), error: null };

// Line 155 - Fix custom_cost
const insertData = {
  user_id: userId,
  global_item_id: globalItemId,
  custom_cost: customCost ?? undefined, // Use undefined instead of null
};

// Line 229
return { data: (data || []).map(transformUserGlobalItemUsage), error: null };

// Line 283
return { data: transformGlobalCategory(data), error: null };

// Line 349
return { data: transformGlobalItem(data), error: null };
```

### 6. `src/features/pricing/components/price-card.tsx` (7 errors)

#### Issue: Null safety and missing properties
**Lines affected:** 80, 87, 121, 123

#### Fix:
```typescript
// Update metadata interface
interface PriceMetadata {
  priceCardVariant: 'pro' | 'basic' | 'enterprise';
  generatedImages: string | number;
  imageEditor: 'pro' | 'basic';
  supportLevel: 'email' | 'live';
  features?: string[]; // Add features property
}

// Fix null safety for unit_amount (lines 80, 87)
const formatPrice = (unitAmount: number | null): string => {
  return unitAmount ? (unitAmount / 100).toFixed(0) : '0';
};

// Replace line 80
${formatPrice(currentPrice.unit_amount)}

// Replace line 87
${formatPrice((monthPrice * 12) - (currentPrice.unit_amount || 0))} saved annually

// Fix features mapping (lines 121, 123)
{metadata.features && metadata.features.length > 0 && (
  <ul>
    {metadata.features.map((feature: string, index: number) => (
      <li key={index}>{feature}</li>
    ))}
  </ul>
)}
```

### 7. `src/features/quotes/actions.ts` (1 error)

#### Issue: String not assignable to enum
**Line affected:** 261

#### Fix:
```typescript
// Ensure status is properly typed
type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'declined' | 'expired' | 'converted';

// Update the function to accept proper type
export async function updateQuoteStatus(id: string, status: QuoteStatus) {
  const { data, error } = await supabase
    .from('quotes')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return { data: null, error };
  }

  return { data, error: null };
}
```

### 8. Quote Components - Async Result Handling

#### Files affected:
- `src/features/quotes/components/QuoteViewer.tsx` (2 errors)
- `src/features/quotes/components/QuotesManager.tsx` (15 errors)
- `src/features/quotes/hooks/useDuplicateQuote.ts` (4 errors)

#### Universal Fix Pattern:
```typescript
// Create utility function (add to utils)
export const handleAsyncResult = <T>(
  result: { data?: T; error?: { message: string } } | undefined,
  onSuccess: (data: T) => void,
  onError: (error: string) => void
) => {
  if (!result) {
    onError('Operation failed - no result returned');
    return;
  }
  
  if (result.error) {
    onError(result.error.message || 'Unknown error');
    return;
  }
  
  if (result.data) {
    onSuccess(result.data);
  }
};

// Apply to all affected lines
// Instead of: if (result.error)
// Use: handleAsyncResult(result, 
//   (data) => { /* success */ },
//   (error) => alert(`Failed: ${error}`)
// );
```

### 9. `src/features/emails/quote-email.tsx` (6 errors)

#### Issue: Null logo_url
**Line affected:** 133

#### Fix:
```typescript
// Add null check for logo
logo: companySettings?.logo_url || undefined,

// Or provide default
logo: companySettings?.logo_url || '/default-logo.png',
```

## Testing Each Fix

### Verification Commands
```bash
# After each file fix
npx tsc --noEmit

# Check specific file
npx tsc --noEmit src/features/admin/actions/customer-actions.ts

# Run tests
npm run test

# Build check
npm run build
```

### Expected Progress
- After admin actions fix: ~49 errors remaining
- After client actions fix: ~44 errors remaining
- After component fixes: ~25 errors remaining
- After items fixes: ~19 errors remaining
- After pricing fixes: ~12 errors remaining
- After quotes fixes: ~1 error remaining
- After email fix: 0 errors

## Common Patterns

### Null Safety Pattern
```typescript
// Instead of: data.field
// Use: data.field || defaultValue
// Or: data.field ?? defaultValue
```

### Type Assertion Pattern
```typescript
// Temporary fix for missing types
const result = supabase.from('table').select('*') as any;
```

### Transformation Pattern
```typescript
const transform = (data: any): TypedInterface => ({
  ...data,
  nullableField: data.nullableField || defaultValue,
});
```

This implementation guide provides specific, actionable fixes for every TypeScript error in the codebase.