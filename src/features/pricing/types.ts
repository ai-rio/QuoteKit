import { Database } from '@/libs/supabase/types';

export type BillingInterval = 'year' | 'month';
export type Subscription = Database['public']['Tables']['subscriptions']['Row'];
export type Product = Database['public']['Tables']['stripe_products']['Row'];
export type Price = Database['public']['Tables']['stripe_prices']['Row'] & {
  // Normalize the field name for compatibility with existing code
  interval: Database['public']['Tables']['stripe_prices']['Row']['recurring_interval'];
  // Add type field to distinguish between recurring and one-time prices
  type: 'recurring' | 'one_time';
};
export type ProductWithPrices = Product & { prices?: Price[] };
export type PriceWithProduct = Price & { products: Product | null };
export type SubscriptionWithProduct = Subscription & { prices: PriceWithProduct | null };
