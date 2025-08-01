# Debug Payment Methods Issue

## Issue Description
Payment method is successfully added (success message appears) but doesn't show up in the Payment Methods list.

## Debugging Steps

### 1. Check Browser Console
After adding a payment method, check the browser console for:
- `🔄 Fetching payment methods...`
- `📊 Payment methods API response:` 
- `✅ Found X payment methods` or `❌ API error:`

### 2. Check Network Tab
1. Open browser DevTools → Network tab
2. Add a payment method
3. Look for these requests:
   - `POST /api/payment-methods` (should return success)
   - `GET /api/payment-methods` (should return the new payment method)

### 3. Manual Sync Test
1. After adding a payment method, click the new **Sync** button (⟲ icon)
2. This will force fetch from Stripe directly
3. Check if the payment method appears after sync

### 4. Check Stripe Dashboard
1. Go to Stripe Dashboard → Customers
2. Find your test customer
3. Check if the payment method appears in Stripe
4. If it's in Stripe but not in the app, it's a sync issue

### 5. API Response Format
The API should return:
```json
{
  "success": true,
  "data": [
    {
      "id": "pm_xxx",
      "type": "card",
      "card": {
        "brand": "visa",
        "last4": "4242",
        "exp_month": 12,
        "exp_year": 2025
      },
      "is_default": true
    }
  ]
}
```

## Possible Causes

### 1. Database Schema Issues
- The `payment_methods` table might not exist
- The API might be failing due to TypeScript errors we discovered

### 2. Webhook Timing
- Stripe webhook might not be processing fast enough
- Database sync might be failing

### 3. Caching Issues
- Browser or API caching old data
- Need to force refresh from Stripe

### 4. Authentication Issues
- User session might not be properly linked to Stripe customer
- Customer ID mismatch

## Quick Fixes to Try

### 1. Use the Sync Button
Click the new Sync button (⟲) after adding a payment method.

### 2. Hard Refresh
Try refreshing the entire page after adding a payment method.

### 3. Check Different Browser
Test in incognito mode or different browser to rule out caching.

### 4. Manual API Test
Open browser console and run:
```javascript
fetch('/api/payment-methods', { cache: 'no-store' })
  .then(r => r.json())
  .then(console.log)
```

## Expected Behavior
1. User adds payment method → Success message
2. Dialog closes
3. Payment methods list automatically refreshes (1 second delay)
4. New payment method appears in the list

## Let me know:
1. What you see in the browser console
2. What the Network tab shows
3. If the Sync button helps
4. If the payment method appears in Stripe Dashboard
