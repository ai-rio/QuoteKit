# Stripe Pricing Structure Cleanup Guide

## Overview
This guide will help you clean up your Stripe pricing structure and align everything with your intended pricing:
- **Free Plan:** $0/month (5 quotes, basic features)
- **Premium Plan:** $12/month or $115.20/year (unlimited quotes, advanced features)

## Current Issues Found

1. **Frontend Mismatch:** Your pricing page shows $12/month but account upgrade shows $29
2. **Stripe Dashboard Clutter:** Multiple test products and prices that don't match your structure
3. **Price ID Confusion:** Different price IDs being used in different parts of the application

## Step-by-Step Cleanup Process

### Option 1: Automated Cleanup (Recommended)

Run the provided cleanup script to automatically archive old data and create clean structure:

```bash
# Install required dependencies
npm install stripe dotenv

# Run the cleanup script
node stripe-cleanup-script.js
```

### Option 2: Manual Cleanup with Stripe CLI

If you prefer manual control, follow these steps:

#### Step 1: Install and Setup Stripe CLI

```bash
# Install Stripe CLI (if not already installed)
# macOS
brew install stripe/stripe-cli/stripe

# Windows
scoop install stripe

# Linux
wget -O- https://packages.stripe.dev/api/security/keypairs/stripe-cli-gpg/public | gpg --dearmor | sudo tee /usr/share/keyrings/stripe.gpg
echo "deb [signed-by=/usr/share/keyrings/stripe.gpg] https://packages.stripe.dev/stripe-cli-debian-local stable main" | sudo tee -a /etc/apt/sources.list.d/stripe.list
sudo apt update
sudo apt install stripe

# Login to Stripe
stripe login
```

#### Step 2: Archive Existing Products and Prices

```bash
# List all active products
stripe products list --active=true

# Archive unwanted products (replace PRODUCT_ID with actual IDs)
stripe products update PRODUCT_ID --active=false

# List all active prices
stripe prices list --active=true

# Archive unwanted prices (replace PRICE_ID with actual IDs)
stripe prices update PRICE_ID --active=false
```

#### Step 3: Create Clean Product Structure

```bash
# Create Free Plan product
stripe products create \
  --name "Free Plan" \
  --description "Basic features for new businesses getting started" \
  --metadata tier=free \
  --metadata max_quotes=5 \
  --metadata pdf_export=true \
  --metadata analytics_access=false \
  --metadata custom_branding=false \
  --metadata priority_support=false

# Create Premium Plan product
stripe products create \
  --name "Premium Plan" \
  --description "Advanced features for growing businesses" \
  --metadata tier=premium \
  --metadata max_quotes=-1 \
  --metadata pdf_export=true \
  --metadata analytics_access=true \
  --metadata custom_branding=true \
  --metadata priority_support=true
```

#### Step 4: Create Pricing Structure

```bash
# Create Free Plan price ($0/month)
stripe prices create \
  --product PRODUCT_ID_FOR_FREE_PLAN \
  --unit-amount 0 \
  --currency usd \
  --recurring interval=month

# Create Premium Plan Monthly price ($12/month)
stripe prices create \
  --product PRODUCT_ID_FOR_PREMIUM_PLAN \
  --unit-amount 1200 \
  --currency usd \
  --recurring interval=month

# Create Premium Plan Yearly price ($115.20/year - 20% discount)
stripe prices create \
  --product PRODUCT_ID_FOR_PREMIUM_PLAN \
  --unit-amount 11520 \
  --currency usd \
  --recurring interval=year
```

## Frontend Updates Required

After creating the clean structure, you need to update your frontend code with the new price IDs:

### 1. Update LawnQuotePricing Component

Replace the hard-coded price IDs in `/src/components/pricing/LawnQuotePricing.tsx`:

```typescript
// Replace lines 117-120 with:
onClick={() => onSelectPlan(
  isYearly ? getStripePrice('premium_yearly') : getStripePrice('premium_monthly'), 
  'Pro Plan'
)}
```

### 2. Update Free Plan Handler

Replace line 55 with:
```typescript
onClick={() => onSelectPlan(getStripePrice('free'), 'Free Plan')}
```

### 3. Import the Constants

Add this import at the top of the file:
```typescript
import { getStripePrice } from '@/constants/stripe-prices';
```

## Verification Steps

1. **Check Stripe Dashboard:** Ensure only 2 products and 3 prices are active
2. **Test Frontend:** Visit `/pricing` and verify correct pricing display
3. **Test Account Page:** Check that upgrade modal shows $12 plan, not $29
4. **Test Functionality:** Try upgrading from free to premium

## Expected Final Structure

### Products (2 total)
- **Free Plan:** Basic features, 5 quotes/month
- **Premium Plan:** Advanced features, unlimited quotes

### Prices (3 total)
- **Free Monthly:** $0.00/month
- **Premium Monthly:** $12.00/month  
- **Premium Yearly:** $115.20/year ($9.60/month effective)

## Troubleshooting

### Issue: "Cannot archive product with prices"
**Solution:** Archive all prices for the product first, then archive the product.

### Issue: Price IDs not updating in frontend
**Solution:** 
1. Update the constants file with new price IDs
2. Restart your development server
3. Clear browser cache

### Issue: Account page still shows wrong price
**Solution:** Check your database for any cached price data that needs updating.

## Database Cleanup (If Needed)

If your database has cached price information, you may need to update it:

```sql
-- Check current subscription prices in your database
SELECT * FROM subscriptions WHERE stripe_price_id IS NOT NULL;

-- Update any subscriptions that reference old price IDs
-- (Be careful with this - backup first!)
UPDATE subscriptions 
SET stripe_price_id = 'NEW_PRICE_ID' 
WHERE stripe_price_id = 'OLD_PRICE_ID';
```

## Post-Cleanup Verification Checklist

- [ ] Stripe dashboard shows only 2 products (Free Plan, Premium Plan)
- [ ] Stripe dashboard shows only 3 prices ($0/month, $12/month, $115.20/year)
- [ ] Pricing page displays correct pricing ($12/month, $9.60/month yearly)
- [ ] Account page upgrade modal shows $12 plan (not $29)
- [ ] Free plan signup works correctly
- [ ] Premium plan upgrade works correctly
- [ ] Yearly plan upgrade works correctly

## Support

If you encounter any issues during the cleanup process:

1. Check the Stripe dashboard logs for error details
2. Review the application logs for API errors
3. Ensure all environment variables are correctly set
4. Verify that your Stripe webhook endpoints are functioning

Remember to test everything thoroughly in your development environment before applying changes to production!