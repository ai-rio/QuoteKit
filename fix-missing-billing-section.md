# Fix: Missing Billing Section for Newly Upgraded Users

## Issue Description
After a user upgrades from free to paid plan, the `BillingHistoryTable` component disappears from the account page instead of showing "No billing history available".

## Root Cause Analysis
1. **getBillingHistory() returns empty array** for newly upgraded users who don't have Stripe customers yet
2. **Component should still render** with "No billing history available" message
3. **Suspense boundary or component error** might be preventing rendering

## Potential Causes
1. **Stripe Customer Missing**: User has subscription but no Stripe customer created
2. **getBillingHistory Logic**: Function returns `[]` instead of showing local subscription data
3. **Component Error**: BillingHistoryTable crashes with empty data
4. **Suspense Issue**: Async data loading fails silently

## Recommended Fixes

### Fix 1: Update getBillingHistory to handle newly upgraded users
```typescript
// In getBillingHistory function, instead of returning [] for users without Stripe customers,
// return local subscription data as billing history
```

### Fix 2: Ensure BillingHistoryTable always renders
```typescript
// Make sure the component handles empty data gracefully and always shows the card
```

### Fix 3: Add error boundaries
```typescript
// Add error boundary around BillingHistoryTable to catch rendering errors
```

## Testing Steps
1. Run debug-missing-billing-section.js to identify the specific issue
2. Check if billing section exists in DOM
3. Verify getBillingHistory API response
4. Check user subscription status vs Stripe customer status

## Expected Behavior
- **Free users**: No billing section (current behavior is correct)
- **Paid users with Stripe customer**: Billing section with invoice data
- **Newly upgraded users**: Billing section with "No billing history available" message
- **Never**: Billing section completely missing for any paid user
