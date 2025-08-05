import { Database } from '@/libs/supabase/types';

export type BillingInterval = 'year' | 'month';
export type Subscription = Database['public']['Tables']['subscriptions']['Row'];
export type Product = Database['public']['Tables']['stripe_products']['Row'];
export type Price = Database['public']['Tables']['stripe_prices']['Row'] & {
  // Normalize the field name for compatibility with existing code
  // Use the actual interval field from the database, fallback to recurring_interval
  interval: Database['public']['Tables']['stripe_prices']['Row']['interval'] | Database['public']['Tables']['stripe_prices']['Row']['recurring_interval'];
  // The type field already exists in the database schema
  type: Database['public']['Tables']['stripe_prices']['Row']['type'];
};
export type ProductWithPrices = Product & { prices?: Price[] };
export type PriceWithProduct = Price & { products: Product | null };
export type SubscriptionWithProduct = Subscription & { prices: PriceWithProduct | null };
