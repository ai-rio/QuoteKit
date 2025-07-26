import Stripe from 'stripe';

import { getEnvVar } from '@/utils/get-env-var';

export const stripeAdmin = new Stripe(getEnvVar(process.env.STRIPE_SECRET_KEY, 'STRIPE_SECRET_KEY'), {
  // https://github.com/stripe/stripe-node#configuration
  apiVersion: '2023-10-16',
  // Register this as an official Stripe plugin.
  // https://stripe.com/docs/building-plugins#setappinfo
  appInfo: {
    name: 'QuoteKit',
    version: '0.1.0',
  },
});
// Stripe admin utility functions
export function createStripeAdminClient(config: { secret_key: string; mode: 'test' | 'live' }) {
  return new Stripe(config.secret_key, {
    apiVersion: '2023-10-16',
    appInfo: {
      name: 'LawnQuote Admin',
      version: '1.0.0',
    },
  });
}

// Interface for Stripe configuration
export interface StripeConfig {
  secret_key: string;
  publishable_key: string;
  webhook_secret: string;
  mode: 'test' | 'live';
}

// Interface for Stripe product
export interface StripeProduct {
  id: string;
  stripe_product_id: string;
  name: string;
  description?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

// Interface for Stripe price  
export interface StripePrice {
  id: string;
  stripe_price_id: string;
  stripe_product_id: string;
  unit_amount: number;
  currency: string;
  recurring_interval?: 'month' | 'year';
  active: boolean;
  created_at: string;
  updated_at: string;
}

// Helper to test Stripe connection
export async function testStripeConnection(config: StripeConfig) {
  try {
    const stripe = createStripeAdminClient(config);
    
    // Test connection by retrieving account information
    const account = await stripe.accounts.retrieve();
    
    return {
      success: true,
      account_id: account.id,
      country: account.country,
      currency: account.default_currency,
      mode: config.mode
    };
  } catch (error) {
    console.error('Stripe connection test failed:', error);
    throw error;
  }
}
