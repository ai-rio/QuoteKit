/**
 * Unified subscription type safety utilities
 * Consolidates all stripe_subscription_id handling into a single, consistent approach
 * Resolves TypeScript compilation errors with robust type guards and safe accessors
 */

import type { Database } from './supabase';

// Base subscription type from database schema
type DatabaseSubscription = Database['public']['Tables']['subscriptions']['Row'];

// Extended subscription type that includes all possible fields referenced in codebase
export interface SafeSubscription extends DatabaseSubscription {
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  // Include all other fields that might be accessed through joins
  prices?: any;
  customer?: any;
}

// Type guard to check if subscription has stripe_subscription_id
export function hasStripeSubscriptionId(
  subscription: any
): subscription is SafeSubscription & { stripe_subscription_id: string } {
  return (
    subscription &&
    typeof subscription === 'object' &&
    'stripe_subscription_id' in subscription &&
    typeof subscription.stripe_subscription_id === 'string' &&
    subscription.stripe_subscription_id !== null &&
    subscription.stripe_subscription_id.length > 0
  );
}

// Type guard to check if subscription has stripe_customer_id
export function hasStripeCustomerId(
  subscription: any
): subscription is SafeSubscription & { stripe_customer_id: string } {
  return (
    subscription &&
    typeof subscription === 'object' &&
    'stripe_customer_id' in subscription &&
    typeof subscription.stripe_customer_id === 'string' &&
    subscription.stripe_customer_id !== null &&
    subscription.stripe_customer_id.length > 0
  );
}

// Safe accessor for stripe_subscription_id with fallback to subscription.id
export function getStripeSubscriptionId(subscription: any): string | null {
  if (!subscription || typeof subscription !== 'object') {
    return null;
  }

  // Primary: Use stripe_subscription_id if available
  if (subscription.stripe_subscription_id && typeof subscription.stripe_subscription_id === 'string') {
    return subscription.stripe_subscription_id;
  }

  // Fallback: Use subscription.id for Stripe subscriptions that use id field
  if (subscription.id && typeof subscription.id === 'string' && subscription.id.startsWith('sub_')) {
    return subscription.id;
  }

  return null;
}

// Safe accessor for stripe_customer_id
export function getStripeCustomerId(subscription: any): string | null {
  if (!subscription || typeof subscription !== 'object') {
    return null;
  }

  if (subscription.stripe_customer_id && typeof subscription.stripe_customer_id === 'string') {
    return subscription.stripe_customer_id;
  }

  return null;
}

// Check if subscription is a paid subscription (has Stripe subscription ID)
export function isPaidSubscription(subscription: any): boolean {
  return hasStripeSubscriptionId(subscription);
}

// Check if subscription is a free subscription (no Stripe subscription ID)
export function isFreeSubscription(subscription: any): boolean {
  return !hasStripeSubscriptionId(subscription);
}

// Type assertion helper that safely casts any subscription object
export function asSafeSubscription(subscription: any): SafeSubscription {
  if (!subscription || typeof subscription !== 'object') {
    throw new Error('Invalid subscription object provided');
  }
  
  return subscription as SafeSubscription;
}

// Helper to get subscription type as string
export function getSubscriptionType(subscription: any): 'paid' | 'free' | 'unknown' {
  if (!subscription) return 'unknown';
  
  if (hasStripeSubscriptionId(subscription)) {
    return 'paid';
  }
  
  // If it has a proper subscription structure but no Stripe ID, it's likely free
  if (subscription.id && subscription.status) {
    return 'free';
  }
  
  return 'unknown';
}

// Comprehensive subscription validator
export function validateSubscription(subscription: any): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!subscription) {
    errors.push('Subscription is null or undefined');
    return { isValid: false, errors, warnings };
  }

  if (typeof subscription !== 'object') {
    errors.push('Subscription is not an object');
    return { isValid: false, errors, warnings };
  }

  // Check required fields
  if (!subscription.id) {
    errors.push('Subscription missing required id field');
  }

  if (!subscription.user_id) {
    errors.push('Subscription missing required user_id field');
  }

  if (!subscription.status) {
    errors.push('Subscription missing required status field');
  }

  // Check for inconsistencies
  if (subscription.stripe_subscription_id && !subscription.stripe_price_id) {
    warnings.push('Paid subscription missing price_id');
  }

  if (!subscription.stripe_subscription_id && subscription.stripe_price_id) {
    warnings.push('Free subscription has price_id (might be inconsistent)');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// SafeSubscription is already exported above via interface declaration