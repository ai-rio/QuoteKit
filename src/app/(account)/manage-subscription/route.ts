import { redirect } from 'next/navigation';

import { getSession } from '@/features/account/controllers/get-session';
import { stripeAdmin } from '@/libs/stripe/stripe-admin';
import { getURL } from '@/utils/get-url';

export const dynamic = 'force-dynamic';

export async function GET() {
  // 1. Get the user from session
  const session = await getSession();

  if (!session || !session.user.id) {
    throw Error('Could not get userId');
  }

  // 2. Retrieve or create the customer in Stripe using enhanced helper
  const { getOrCreateCustomer } = await import('@/features/account/controllers/get-or-create-customer');
  
  let customer;
  try {
    customer = await getOrCreateCustomer({
      userId: session.user.id,
      email: session.user.email!
    });
    
    console.debug('manage-subscription: Got/created customer for billing portal', {
      userId: session.user.id,
      stripeCustomerId: customer
    });
  } catch (customerError) {
    console.error('manage-subscription: Failed to get/create customer', {
      userId: session.user.id,
      error: customerError instanceof Error ? customerError.message : 'Unknown error'
    });
    throw Error('Could not create or retrieve customer record');
  }

  // 3. Create portal link and redirect user
  const { url } = await stripeAdmin.billingPortal.sessions.create({
    customer,
    return_url: `${getURL()}/account`,
  });

  redirect(url);
}
