import { Database } from '@/libs/supabase/types';

export type BillingInterval = 'year' | 'month';
export type Subscription = Database['public']['Tables']['subscriptions']['Row'];
export type Product = Database['public']['Tables']['products']['Row'] & {
  // Map id to stripe_product_id for compatibility
  stripe_product_id: string;
};
// Helper function to transform database product row to Product type
export function transformProductRow(row: Database['public']['Tables']['products']['Row']): Product {
  return {
    ...row,
    stripe_product_id: row.id,
  } as Product;
}

// Helper function to transform Product type to database insert format
export function transformProductForInsert(product: Partial<Product>): Database['public']['Tables']['products']['Insert'] {
  return {
    id: product.stripe_product_id || product.id!,
    active: product.active,
    name: product.name,
    description: product.description,
    image: product.image,
    metadata: product.metadata || {},
  };
}
export type Price = Database['public']['Tables']['prices']['Row'] & {
  // Map id to stripe_price_id for compatibility with existing code
  stripe_price_id: string;
  // Map product_id to stripe_product_id for compatibility
  stripe_product_id: string | null;
  // Add recurring_interval as alias to interval
  recurring_interval: Database['public']['Tables']['prices']['Row']['interval'];
  // Add recurring_interval_count as alias to interval_count
  recurring_interval_count: Database['public']['Tables']['prices']['Row']['interval_count'];
};
// Helper function to transform database price row to Price type
export function transformPriceRow(row: Database['public']['Tables']['prices']['Row']): Price {
  return {
    ...row,
    stripe_price_id: row.id,
    stripe_product_id: row.product_id,
    recurring_interval: row.interval,
    recurring_interval_count: row.interval_count,
  } as Price;
}

// Helper function to transform Price type to database insert format
export function transformPriceForInsert(price: Partial<Price>): Database['public']['Tables']['prices']['Insert'] {
  return {
    id: price.stripe_price_id || price.id!,
    product_id: price.stripe_product_id || price.product_id,
    active: price.active,
    description: price.description,
    unit_amount: price.unit_amount,
    currency: price.currency,
    type: price.type,
    interval: price.recurring_interval || price.interval,
    interval_count: price.recurring_interval_count || price.interval_count,
    trial_period_days: price.trial_period_days,
    metadata: price.metadata,
  };
}
export type ProductWithPrices = Product & { prices?: Price[] };
export type PriceWithProduct = Price & { products: Product | null };
export type SubscriptionWithProduct = Subscription & { prices: PriceWithProduct | null };
