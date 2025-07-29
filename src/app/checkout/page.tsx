import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { createCheckoutAction } from '@/features/pricing/actions/create-checkout-action';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

export const metadata: Metadata = {
  title: 'Checkout - QuoteKit',
  description: 'Complete your QuoteKit subscription',
};

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ price_id?: string }>;
}) {
  const { price_id } = await searchParams;

  if (!price_id) {
    redirect('/pricing');
  }

  const supabase = await createSupabaseServerClient();

  // Get the price details from database
  const { data: priceData, error } = await supabase
    .from('stripe_prices')
    .select(`
      *,
      stripe_products (*)
    `)
    .eq('stripe_price_id', price_id)
    .single();

  if (error || !priceData) {
    console.error('Price not found:', price_id);
    redirect('/pricing');
  }

  // Transform the price data to match the expected format
  const price = {
    stripe_price_id: priceData.stripe_price_id,
    stripe_product_id: priceData.stripe_product_id,
    unit_amount: priceData.unit_amount,
    currency: priceData.currency,
    recurring_interval: priceData.recurring_interval,
    recurring_interval_count: priceData.recurring_interval_count,
    active: priceData.active,
    metadata: priceData.metadata || {},
    created_at: priceData.created_at,
    updated_at: priceData.updated_at,
    interval: priceData.recurring_interval,
    type: priceData.recurring_interval ? 'recurring' as const : 'one_time' as const,
    products: priceData.stripe_products
  };

  // Immediately trigger the checkout action
  await createCheckoutAction({ price });

  // This should never be reached due to the redirect in createCheckoutAction
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p>Redirecting to checkout...</p>
      </div>
    </div>
  );
}