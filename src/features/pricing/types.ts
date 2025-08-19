import { Database } from '@/types/supabase';

export type BillingInterval = 'year' | 'month';
export type Subscription = Database['public']['Tables']['subscriptions']['Row'];
export type Product = Database['public']['Tables']['stripe_products']['Row'] & {
  // Map id to stripe_product_id for compatibility
  stripe_product_id: string;
};
// Helper function to transform database product row to Product type
export function transformProductRow(row: Database['public']['Tables']['stripe_products']['Row']): Product {
  return {
    ...row,
    stripe_product_id: row.id,
  } as Product;
}

// Helper function to transform Product type to database insert format
export function transformProductForInsert(product: Partial<Product>): Database['public']['Tables']['stripe_products']['Insert'] {
  return {
    id: product.stripe_product_id || product.id!,
    active: product.active,
    name: product.name,
    description: product.description,
    image: product.image,
    metadata: product.metadata || {},
  };
}
export type Price = Database['public']['Tables']['stripe_prices']['Row'] & {
  // Map id to stripe_price_id for compatibility with existing code
  stripe_price_id: string;
  // Add recurring_interval as alias to interval
  recurring_interval: Database['public']['Tables']['stripe_prices']['Row']['interval'];
  // Add recurring_interval_count as alias to interval_count
  recurring_interval_count: Database['public']['Tables']['stripe_prices']['Row']['interval_count'];
};
// Helper function to transform database price row to Price type
export function transformPriceRow(row: Database['public']['Tables']['stripe_prices']['Row']): Price {
  return {
    ...row,
    stripe_price_id: row.id,
    recurring_interval: row.interval,
    recurring_interval_count: row.interval_count,
  } as Price;
}

// Helper function to transform Price type to database insert format
export function transformPriceForInsert(price: Partial<Price>): Database['public']['Tables']['stripe_prices']['Insert'] {
  return {
    id: price.stripe_price_id || price.id!,
    stripe_product_id: price.stripe_product_id,
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
export type PriceWithProduct = Price & { stripe_products: Product | null };
export type SubscriptionWithProduct = Subscription & { stripe_prices: PriceWithProduct | null };
