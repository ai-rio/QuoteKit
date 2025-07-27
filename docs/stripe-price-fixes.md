# Stripe Price Synchronization Fixes

## Problem Summary
The application was experiencing issues with inactive Stripe prices causing checkout failures. The specific error was:
- "The price specified is inactive. This field only accepts active prices."
- Database showed `price_1RVyAPGgBK1ooXYFwt6viuQs` as active, but Stripe API indicated it was inactive.

## Solutions Implemented

### 1. Enhanced Price Synchronization (`src/features/pricing/controllers/upsert-price.ts`)
- **Full Sync**: Updated `syncStripeProductsAndPrices()` to fetch ALL prices (active and inactive) from Stripe
- **Status Tracking**: Now properly syncs the `active` status from Stripe to database
- **Better Logging**: Added detailed logging for sync operations with counts of active vs inactive prices

### 2. Price Status Validation (`src/features/pricing/actions/create-checkout-action.ts`)
- **Pre-checkout Validation**: Added validation to check price status before creating Stripe checkout sessions
- **Real-time Verification**: Validates price status in both database and Stripe before proceeding
- **Enhanced Error Messages**: Provides specific error messages for inactive price scenarios
- **Free Plan Handling**: Special handling for $0 prices with better error messaging

### 3. Active Price Filtering (`src/features/pricing/controllers/get-products.ts`)
- **Database Filtering**: Now only fetches active prices from database to prevent inactive price display
- **Monitoring**: Added logging to track active vs total prices for monitoring
- **Inactive Price Alerts**: Logs warnings when inactive prices are found in database

### 4. Pricing Card Protection (`src/features/pricing/components/price-card.tsx`)
- **Active Price Filter**: Filters out inactive prices before displaying options
- **Fallback Logic**: Graceful fallbacks when selected billing interval has no active prices
- **Warning Logs**: Logs warnings when products have no active prices

### 5. Admin Utilities

#### Manual Price Fix Endpoint: `/api/admin/fix-price-status`
**POST** - Fix specific price status:
```bash
# Fix single price
curl -X POST /api/admin/fix-price-status \
  -H "Content-Type: application/json" \
  -d '{"priceId": "price_1RVyAPGgBK1ooXYFwt6viuQs"}'

# Fix multiple prices
curl -X POST /api/admin/fix-price-status \
  -H "Content-Type: application/json" \
  -d '{"priceIds": ["price_1RVyAPGgBK1ooXYFwt6viuQs", "price_1234"]}'
```

**GET** - Check price status:
```bash
curl /api/admin/fix-price-status
```

#### Full Sync Endpoint: `/api/admin/sync-stripe`
```bash
curl -X POST /api/admin/sync-stripe
```

## Quick Fix for Current Issue

To fix the specific inactive price `price_1RVyAPGgBK1ooXYFwt6viuQs`:

1. **Check Stripe Dashboard**: Verify if this price is actually active in Stripe
2. **Run Sync**: Use `/api/admin/sync-stripe` to sync all prices
3. **Manual Fix**: If needed, use `/api/admin/fix-price-status` with the specific price ID
4. **Verify**: Check logs for "Active prices from database" to confirm fix

## Prevention Strategy

1. **Regular Sync**: Set up regular sync of price status (can be done via cron job calling sync endpoint)
2. **Webhook Enhancement**: Ensure `price.updated` webhooks properly update price status
3. **Monitoring**: Watch logs for inactive price warnings
4. **Admin Dashboard**: Consider adding price status monitoring to admin interface

## Testing

After implementing fixes:
1. Verify free plan signup works without Stripe API errors
2. Check that only active prices appear in pricing page
3. Confirm checkout flow validates price status before proceeding
4. Test manual sync endpoints work correctly

## Database Schema Note

The `stripe_prices` table properly tracks the `active` field from Stripe, ensuring database reflects actual Stripe price status.