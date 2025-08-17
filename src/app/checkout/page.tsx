import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { UpgradeFlowTracker } from '@/components/feedback/upgrade-flow-tracker';
import { createCheckoutAction } from '@/features/pricing/actions/create-checkout-action';
import { transformPriceRow } from '@/features/pricing/types';
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
    .from('prices')
    .select(`
      *,
      products (*)
    `)
    .eq('id', price_id)
    .single();

  if (error || !priceData) {
    console.error('Price not found:', price_id);
    redirect('/pricing');
  }

  // Transform the database row to the Price type using our helper
  const price = transformPriceRow(priceData);

  // DEBUG: Log the transformed price object for troubleshooting
  console.log('🔍 CHECKOUT PAGE: Transformed price object:', {
    stripe_price_id: price.stripe_price_id,
    unit_amount: price.unit_amount,
    recurring_interval: price.recurring_interval,
    interval: price.interval,
    type: price.type,
    has_recurring_interval: !!price.recurring_interval,
    is_subscription: price.type === 'recurring'
  });

  // Immediately trigger the checkout action
  await createCheckoutAction({ price });

  // This should never be reached due to the redirect in createCheckoutAction
  return (
    <UpgradeFlowTracker page="checkout" isActive={true}>
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Redirecting to checkout...</p>
        </div>
      </div>
    </UpgradeFlowTracker>
  );
}