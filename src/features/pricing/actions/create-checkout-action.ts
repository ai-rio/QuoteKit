'use server';

import { redirect } from 'next/navigation';

import { getOrCreateCustomer } from '@/features/account/controllers/get-or-create-customer';
import { getSession } from '@/features/account/controllers/get-session';
import { Price } from '@/features/pricing/types';
import { stripeAdmin } from '@/libs/stripe/stripe-admin';
import { getURL } from '@/utils/get-url';

export async function createCheckoutAction({ price }: { price: Price }) {
  // DEBUG: Log immediately at function start
  console.error('🚨 CHECKOUT ACTION CALLED!');
  console.error('🚨 Price object type check:', {
    hasType: 'type' in price,
    typeValue: price.type,
    hasInterval: 'interval' in price,
    intervalValue: price.interval,
    recurringInterval: price.recurring_interval
  });
  
  // DEBUG: Log the price object to understand the issue
  console.error('🔍 DEBUG: Price object passed to createCheckoutAction:', {
    id: price.id,
    stripe_price_id: price.stripe_price_id,
    recurring_interval: price.recurring_interval,
    interval: price.interval,
    type: price.type,
    unit_amount: price.unit_amount,
    full_price_object: price
  });

  // 1. Get the user from session
  const session = await getSession();

  if (!session?.user) {
    return redirect(`${getURL()}/signup`);
  }

  if (!session.user.email) {
    throw Error('Could not get email');
  }

  // 2. Retrieve or create the customer in Stripe
  const customer = await getOrCreateCustomer({
    userId: session.user.id,
    email: session.user.email,
  });

  // DEBUG: Log the mode being determined - use recurring_interval directly instead of type field
  const checkoutMode = price.recurring_interval ? 'subscription' : 'payment';
  console.error(`🔍 DEBUG: Checkout mode determined: ${checkoutMode} (recurring_interval: ${price.recurring_interval})`);
  console.error(`🔍 DEBUG: About to create Stripe checkout with mode: ${checkoutMode}`);

  // 3. Create a checkout session in Stripe
  const checkoutSession = await stripeAdmin.checkout.sessions.create({
    payment_method_types: ['card'],
    billing_address_collection: 'required',
    customer,
    customer_update: {
      address: 'auto',
    },
    line_items: [
      {
        price: price.stripe_price_id,
        quantity: 1,
      },
    ],
    mode: checkoutMode,
    allow_promotion_codes: true,
    success_url: `${getURL()}/account`,
    cancel_url: `${getURL()}/`,
  });

  if (!checkoutSession || !checkoutSession.url) {
    throw Error('checkoutSession is not defined');
  }

  // 4. Redirect to checkout url
  redirect(checkoutSession.url);
}
