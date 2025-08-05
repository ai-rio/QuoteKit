/**
 * Stripe Error Type Guards
 * 
 * Provides type-safe error handling for Stripe API operations.
 * Use these guards to properly handle unknown errors from Stripe operations.
 */

import { Stripe } from 'stripe';

/**
 * Type guard to check if an error is a Stripe error
 */
export function isStripeError(error: unknown): error is Stripe.StripeRawError {
  return (
    error instanceof Error &&
    'type' in error &&
    'code' in error &&
    typeof (error as any).type === 'string'
  );
}

/**
 * Type guard for Stripe card errors
 */
export function isStripeCardError(error: unknown): error is Stripe.errors.StripeCardError {
  return isStripeError(error) && error.type === 'card_error';
}

/**
 * Type guard for Stripe invalid request errors
 */
export function isStripeInvalidRequestError(error: unknown): error is Stripe.errors.StripeInvalidRequestError {
  return isStripeError(error) && error.type === 'invalid_request_error';
}

/**
 * Type guard for Stripe API errors
 */
export function isStripeAPIError(error: unknown): error is Stripe.errors.StripeAPIError {
  return isStripeError(error) && error.type === 'api_error';
}

/**
 * Type guard for Stripe connection errors
 */
export function isStripeConnectionError(error: unknown): error is Stripe.errors.StripeConnectionError {
  return isStripeError(error) && (error as any).type === 'api_connection_error';
}

/**
 * Type guard for Stripe authentication errors
 */
export function isStripeAuthenticationError(error: unknown): error is Stripe.errors.StripeAuthenticationError {
  return isStripeError(error) && error.type === 'authentication_error';
}

/**
 * Type guard for Stripe permission errors
 */
export function isStripePermissionError(error: unknown): error is Stripe.errors.StripePermissionError {
  return isStripeError(error) && error.type === 'invalid_request_error' && error.code === 'account_invalid';
}

/**
 * Type guard for Stripe rate limit errors
 */
export function isStripeRateLimitError(error: unknown): error is Stripe.errors.StripeRateLimitError {
  return isStripeError(error) && error.type === 'rate_limit_error';
}

/**
 * Comprehensive error handler that provides user-friendly messages
 */
export function handleStripeError(error: unknown): {
  message: string;
  code?: string;
  type: 'card_error' | 'invalid_request' | 'api_error' | 'connection_error' | 'authentication_error' | 'rate_limit' | 'unknown';
  shouldRetry: boolean;
} {
  if (isStripeCardError(error)) {
    return {
      message: getCardErrorMessage(error.code),
      code: error.code,
      type: 'card_error',
      shouldRetry: false
    };
  }

  if (isStripeInvalidRequestError(error)) {
    return {
      message: error.message || 'Invalid request to payment processor',
      code: error.code,
      type: 'invalid_request',
      shouldRetry: false
    };
  }

  if (isStripeAPIError(error)) {
    return {
      message: 'Payment processor error. Please try again.',
      code: error.code,
      type: 'api_error',
      shouldRetry: true
    };
  }

  if (isStripeConnectionError(error)) {
    return {
      message: 'Connection error. Please check your internet connection and try again.',
      code: error.code,
      type: 'connection_error',
      shouldRetry: true
    };
  }

  if (isStripeAuthenticationError(error)) {
    return {
      message: 'Authentication error. Please contact support.',
      code: error.code,
      type: 'authentication_error',
      shouldRetry: false
    };
  }

  if (isStripeRateLimitError(error)) {
    return {
      message: 'Too many requests. Please wait a moment and try again.',
      code: error.code,
      type: 'rate_limit',
      shouldRetry: true
    };
  }

  // Fallback for unknown errors
  return {
    message: error instanceof Error ? error.message : 'An unexpected error occurred',
    type: 'unknown',
    shouldRetry: false
  };
}

/**
 * Get user-friendly message for card error codes
 */
function getCardErrorMessage(code?: string): string {
  switch (code) {
    case 'card_declined':
      return 'Your card was declined. Please try a different payment method.';
    case 'insufficient_funds':
      return 'Insufficient funds. Please try a different payment method.';
    case 'expired_card':
      return 'Your card has expired. Please update your payment method.';
    case 'incorrect_cvc':
      return 'Your card\'s security code is incorrect. Please check and try again.';
    case 'incorrect_number':
      return 'Your card number is incorrect. Please check and try again.';
    case 'invalid_expiry_month':
      return 'Your card\'s expiration month is invalid.';
    case 'invalid_expiry_year':
      return 'Your card\'s expiration year is invalid.';
    case 'processing_error':
      return 'An error occurred processing your card. Please try again.';
    default:
      return 'Your card could not be processed. Please try a different payment method.';
  }
}

/**
 * Type-safe wrapper for Stripe operations
 */
export async function safeStripeOperation<T>(
  operation: () => Promise<T>,
  context: string = 'Stripe operation'
): Promise<{ success: true; data: T } | { success: false; error: ReturnType<typeof handleStripeError> }> {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (error) {
    console.error(`${context} failed:`, error);
    return { success: false, error: handleStripeError(error) };
  }
}

/**
 * Type definitions for common Stripe response patterns
 */
export type StripeOperationResult<T> = 
  | { success: true; data: T; error?: never }
  | { success: false; data?: never; error: ReturnType<typeof handleStripeError> };

/**
 * Helper to create type-safe Stripe error responses
 */
export function createStripeErrorResponse(error: unknown): { success: false; error: ReturnType<typeof handleStripeError> } {
  return { success: false, error: handleStripeError(error) };
}

/**
 * Helper to create type-safe Stripe success responses
 */
export function createStripeSuccessResponse<T>(data: T): { success: true; data: T } {
  return { success: true, data };
}
