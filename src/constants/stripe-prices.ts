/**
 * Stripe Price IDs - Updated by pricing alignment fix
 * Last updated: 2025-08-12T11:23:34.537Z
 */

export const STRIPE_PRICE_IDS = {
  FREE_MONTHLY: 'price_1RriYWGgBK1ooXYFFHN7Jgsq',
  PREMIUM_MONTHLY: 'price_1RvGIjGgBK1ooXYF4LHswUuU',
  PREMIUM_YEARLY: 'price_1RvGIkGgBK1ooXYFEwnMclJR',
} as const;

export const STRIPE_PRODUCT_IDS = {
  FREE_PLAN: 'prod_free_plan',
  PREMIUM_PLAN: 'prod_premium_plan',
} as const;

// Helper function to get price by type
export function getStripePrice(type: 'free' | 'premium_monthly' | 'premium_yearly'): string {
  switch (type) {
    case 'free':
      return STRIPE_PRICE_IDS.FREE_MONTHLY;
    case 'premium_monthly':
      return STRIPE_PRICE_IDS.PREMIUM_MONTHLY;
    case 'premium_yearly':
      return STRIPE_PRICE_IDS.PREMIUM_YEARLY;
    default:
      throw new Error(`Unknown price type: ${type}`);
  }
}

// Pricing configuration for display
export const PRICING_CONFIG = {
  FREE: {
    name: 'Free Plan',
    monthlyPrice: 0,
    features: ['5 Quotes / Month', 'Unlimited Item Library', 'Real-time Quote Calculator', 'Professional PDF Generation']
  },
  PREMIUM: {
    name: 'Premium Plan', 
    monthlyPrice: 12,
    yearlyDiscount: 0.20,
    get yearlyPrice() {
      return this.monthlyPrice * 12 * (1 - this.yearlyDiscount);
    },
    get monthlyPriceWhenYearly() {
      return this.monthlyPrice * (1 - this.yearlyDiscount);
    },
    features: ['Unlimited Quotes', 'Remove LawnQuote Branding', 'Client Management', 'Quote Templates', 'Business Dashboard & Analytics']
  }
} as const;
