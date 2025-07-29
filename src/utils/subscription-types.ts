/**
 * Type assertion utilities for subscription data
 * These utilities help bridge the gap between generated types and actual database schema
 */

import type { Database } from '@/types/supabase';

type SubscriptionRow = Database['public']['Tables']['subscriptions']['Row'];

// Type guard to check if subscription has stripe fields
export function hasStripeFields(subscription: any): subscription is SubscriptionRow & {
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
} {
  return typeof subscription === 'object' && subscription !== null;
}

// Safe accessor for stripe_subscription_id
export function getStripeSubscriptionId(subscription: any): string | null {
  if (!subscription) return null;
  return subscription.stripe_subscription_id || subscription.id || null;
}

// Safe accessor for stripe_customer_id  
export function getStripeCustomerId(subscription: any): string | null {
  if (!subscription) return null;
  return subscription.stripe_customer_id || null;
}

// Type assertion helper for subscriptions with extended fields
export function asExtendedSubscription(subscription: any): SubscriptionRow & {
  stripe_subscription_id?: string | null;
  stripe_customer_id?: string | null;
} {
  return subscription as any;
}