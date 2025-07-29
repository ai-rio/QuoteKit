/**
 * Subscription type overrides to resolve TypeScript compilation errors
 * 
 * This file provides type-safe access to subscription fields that exist in the database
 * but may not be properly reflected in generated types due to query transformations.
 */

// Declare global type augmentation for subscriptions with stripe fields
declare global {
  namespace SubscriptionTypes {
    interface ExtendedSubscription {
      id: string | null;
      internal_id: string;
      user_id: string;
      status: 'incomplete' | 'incomplete_expired' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid';
      price_id: string | null;
      stripe_subscription_id: string | null;
      stripe_customer_id: string | null;
      metadata: any | null;
      cancel_at_period_end: boolean | null;
      created: string;
      current_period_start: string;
      current_period_end: string;
      ended_at: string | null;
      cancel_at: string | null;
      canceled_at: string | null;
      trial_start: string | null;
      trial_end: string | null;
      updated_at: string;
      // Additional fields from joins
      prices?: any;
    }
  }
}

// Type assertion helpers
export function asExtendedSubscription(sub: any): SubscriptionTypes.ExtendedSubscription {
  return sub as SubscriptionTypes.ExtendedSubscription;
}

export function getStripeSubscriptionId(sub: any): string | null {
  return sub?.stripe_subscription_id || sub?.id || null;
}

export function getStripeCustomerId(sub: any): string | null {
  return sub?.stripe_customer_id || null;
}

export function hasStripeSubscriptionId(sub: any): boolean {
  return !!(sub?.stripe_subscription_id || sub?.id);
}

export {};  // Make this a module