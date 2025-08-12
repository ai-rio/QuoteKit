# Pricing Component Updates Required

## Update LawnQuotePricing.tsx

Replace the hard-coded price IDs in your component with the new ones:

```typescript
// Add this import at the top
import { getStripePrice } from '@/constants/stripe-prices';

// Update the Free Plan button (around line 56):
<Button 
  onClick={() => onSelectPlan(getStripePrice('free'), 'Free Plan')}
  className="mt-8 w-full bg-paper-white text-forest-green border-2 border-forest-green font-bold px-6 py-4 rounded-lg hover:bg-forest-green hover:text-paper-white transition-all duration-200"
>
  Start for Free
</Button>

// Update the Premium Plan button (around line 119):
<Button 
  onClick={() => onSelectPlan(
    isYearly ? getStripePrice('premium_yearly') : getStripePrice('premium_monthly'), 
    'Pro Plan'
  )}
  className="mt-8 w-full bg-equipment-yellow text-charcoal font-bold px-6 py-4 rounded-lg hover:brightness-110 transition-all duration-200"
>
  Upgrade to Pro
</Button>
```

## New Price IDs Created

- **Free Monthly:** price_1RriYWGgBK1ooXYFFHN7Jgsq
- **Premium Monthly:** price_1RvGIjGgBK1ooXYF4LHswUuU  
- **Premium Yearly:** price_1RvGIkGgBK1ooXYFEwnMclJR

## What This Fixes

- ✅ Account upgrade modal will now show $12/month instead of $29/month
- ✅ Pricing page and account page are now aligned
- ✅ Clean pricing structure: Free ($0), Premium ($12/month, $115.20/year)

## Testing Steps

1. Visit the pricing page - should show $12/month and $9.60/month (yearly)
2. Login and visit account page - upgrade modal should show $12 Premium plan
3. Test free plan signup
4. Test premium plan upgrade (monthly and yearly)
