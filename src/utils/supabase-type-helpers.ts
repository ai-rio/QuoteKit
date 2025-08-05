/**
 * Supabase Type Helpers
 * 
 * Provides type-safe utilities for working with Supabase database types.
 * These helpers make it easier to work with generated Supabase types.
 */

// Import the generated types (this will be available after running generate-types)
import type { Database } from '@/libs/supabase/types';

/**
 * Extract table row types from the Database schema
 */
export type Tables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Row'];

/**
 * Extract table insert types from the Database schema
 */
export type TablesInsert<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Insert'];

/**
 * Extract table update types from the Database schema
 */
export type TablesUpdate<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Update'];

/**
 * Extract enum types from the Database schema
 */
export type Enums<T extends keyof Database['public']['Enums']> = 
  Database['public']['Enums'][T];

/**
 * Extract function types from the Database schema
 */
export type Functions<T extends keyof Database['public']['Functions']> = 
  Database['public']['Functions'][T];

/**
 * Common table type aliases for easier usage
 */
export type User = Tables<'users'>;
export type Quote = Tables<'quotes'>;
export type Subscription = Tables<'subscriptions'>;
export type BillingHistory = Tables<'billing_history'>;
export type Product = Tables<'products'>;
export type Price = Tables<'prices'>;

/**
 * Insert type aliases
 */
export type UserInsert = TablesInsert<'users'>;
export type QuoteInsert = TablesInsert<'quotes'>;
export type SubscriptionInsert = TablesInsert<'subscriptions'>;
export type BillingHistoryInsert = TablesInsert<'billing_history'>;
export type ProductInsert = TablesInsert<'products'>;
export type PriceInsert = TablesInsert<'prices'>;

/**
 * Update type aliases
 */
export type UserUpdate = TablesUpdate<'users'>;
export type QuoteUpdate = TablesUpdate<'quotes'>;
export type SubscriptionUpdate = TablesUpdate<'subscriptions'>;
export type BillingHistoryUpdate = TablesUpdate<'billing_history'>;
export type ProductUpdate = TablesUpdate<'products'>;
export type PriceUpdate = TablesUpdate<'prices'>;

/**
 * Type guard to check if a Supabase response has data
 */
export function hasData<T>(
  response: { data: T | null; error: any }
): response is { data: T; error: null } {
  return response.data !== null && response.error === null;
}

/**
 * Type guard to check if a Supabase response has an error
 */
export function hasError<T>(
  response: { data: T | null; error: any }
): response is { data: null; error: any } {
  return response.error !== null;
}

/**
 * Helper to safely extract data from Supabase response
 */
export function extractData<T>(
  response: { data: T | null; error: any }
): T | null {
  return hasData(response) ? response.data : null;
}

/**
 * Helper to safely extract error from Supabase response
 */
export function extractError<T>(
  response: { data: T | null; error: any }
): any | null {
  return hasError(response) ? response.error : null;
}

/**
 * Type-safe wrapper for Supabase operations
 */
export async function safeSupabaseOperation<T>(
  operation: () => Promise<{ data: T | null; error: any }>,
  context: string = 'Supabase operation'
): Promise<{ success: true; data: T } | { success: false; error: any }> {
  try {
    const response = await operation();
    
    if (hasData(response)) {
      return { success: true, data: response.data };
    } else {
      console.error(`${context} failed:`, response.error);
      return { success: false, error: response.error };
    }
  } catch (error) {
    console.error(`${context} threw an error:`, error);
    return { success: false, error };
  }
}

/**
 * Type definitions for common Supabase response patterns
 */
export type SupabaseOperationResult<T> = 
  | { success: true; data: T; error?: never }
  | { success: false; data?: never; error: any };

/**
 * Helper to create type-safe Supabase error responses
 */
export function createSupabaseErrorResponse(error: any): { success: false; error: any } {
  return { success: false, error };
}

/**
 * Helper to create type-safe Supabase success responses
 */
export function createSupabaseSuccessResponse<T>(data: T): { success: true; data: T } {
  return { success: true, data };
}

/**
 * Utility to handle Supabase RLS (Row Level Security) errors
 */
export function isRLSError(error: any): boolean {
  return error?.code === 'PGRST116' || error?.message?.includes('row-level security');
}

/**
 * Utility to handle Supabase unique constraint errors
 */
export function isUniqueConstraintError(error: any): boolean {
  return error?.code === '23505' || error?.message?.includes('duplicate key');
}

/**
 * Utility to handle Supabase foreign key constraint errors
 */
export function isForeignKeyConstraintError(error: any): boolean {
  return error?.code === '23503' || error?.message?.includes('foreign key');
}

/**
 * Get user-friendly error message for common Supabase errors
 */
export function getSupabaseErrorMessage(error: any): string {
  if (isRLSError(error)) {
    return 'You do not have permission to perform this action.';
  }
  
  if (isUniqueConstraintError(error)) {
    return 'This record already exists.';
  }
  
  if (isForeignKeyConstraintError(error)) {
    return 'Cannot perform this action due to related records.';
  }
  
  return error?.message || 'An unexpected database error occurred.';
}
