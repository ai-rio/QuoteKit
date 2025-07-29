/**
 * Type extensions for subscription-related types to bridge schema gaps
 * This provides type-safe access to fields that exist in code but may not be in current schema
 */

import type { Database } from './supabase';

// Extended subscription type that includes all fields referenced in the codebase
export type ExtendedSubscription = Database['public']['Tables']['subscriptions']['Row'] & {
  stripe_subscription_id?: string | null;
  stripe_customer_id?: string | null;
  // Add any other fields that are being accessed in the codebase
};

// Helper type guards
export function hasStripeSubscriptionId(
  subscription: Database['public']['Tables']['subscriptions']['Row']
): subscription is ExtendedSubscription & { stripe_subscription_id: string } {
  return 'stripe_subscription_id' in subscription && subscription.stripe_subscription_id !== null;
}

export function hasStripeCustomerId(
  subscription: Database['public']['Tables']['subscriptions']['Row']
): subscription is ExtendedSubscription & { stripe_customer_id: string } {
  return 'stripe_customer_id' in subscription && subscription.stripe_customer_id !== null;
}

// Safe accessors
export function getStripeSubscriptionId(
  subscription: Database['public']['Tables']['subscriptions']['Row']
): string | null {
  return (subscription as any).stripe_subscription_id || subscription.id || null;
}

export function getStripeCustomerId(
  subscription: Database['public']['Tables']['subscriptions']['Row']
): string | null {
  return (subscription as any).stripe_customer_id || null;
}