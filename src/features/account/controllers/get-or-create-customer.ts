import { stripeAdmin } from '@/libs/stripe/stripe-admin';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';

export async function getOrCreateCustomer({ userId, email }: { userId: string; email: string }) {
  const { data, error } = await supabaseAdminClient
    .from('customers')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single();

  // If customer record doesn't exist at all, create both Stripe customer and database record
  if (error) {
    const customerData = {
      email,
      metadata: {
        userId,
      },
    } as const;

    const customer = await stripeAdmin.customers.create(customerData);

    // Insert the customer ID into our Supabase mapping table.
    const { error: supabaseError } = await supabaseAdminClient
      .from('customers')
      .insert([{ id: userId, stripe_customer_id: customer.id }]);

    if (supabaseError) {
      throw supabaseError;
    }

    return customer.id;
  }

  // If customer record exists but no Stripe customer ID, create Stripe customer and update record
  if (!data?.stripe_customer_id) {
    const customerData = {
      email,
      metadata: {
        userId,
      },
    } as const;

    const customer = await stripeAdmin.customers.create(customerData);

    // Update the existing customer record with the new Stripe customer ID
    const { error: updateError } = await supabaseAdminClient
      .from('customers')
      .update({ stripe_customer_id: customer.id })
      .eq('id', userId);

    if (updateError) {
      throw updateError;
    }

    return customer.id;
  }

  // Customer record exists with Stripe customer ID
  return data.stripe_customer_id;
}
