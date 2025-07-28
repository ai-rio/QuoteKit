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

/**
 * Get or create a Stripe customer using regular server client (for user-facing functions)
 * This version handles cases where existing users don't have customer records
 */
export async function getOrCreateCustomerForUser({ userId, email, supabaseClient }: { 
  userId: string; 
  email: string;
  supabaseClient: any; // Supabase client (server or admin)
}) {
  console.debug('getOrCreateCustomerForUser: Starting customer lookup/creation', { userId, email });

  // First try to get existing customer record using maybeSingle to avoid PGRST116 errors
  const { data, error } = await supabaseClient
    .from('customers')
    .select('stripe_customer_id')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('getOrCreateCustomerForUser: Database error during customer lookup', { 
      userId, 
      error: error.message,
      code: error.code 
    });
    throw error;
  }

  // If customer record exists and has Stripe customer ID, return it
  if (data?.stripe_customer_id) {
    console.debug('getOrCreateCustomerForUser: Found existing customer', { 
      userId, 
      stripeCustomerId: data.stripe_customer_id 
    });
    return data.stripe_customer_id;
  }

  // Customer record doesn't exist or exists without Stripe customer ID
  // We need admin client to create/update customer records
  const { supabaseAdminClient } = await import('@/libs/supabase/supabase-admin');
  const { stripeAdmin } = await import('@/libs/stripe/stripe-admin');

  console.debug('getOrCreateCustomerForUser: Creating new Stripe customer', { userId, email });

  try {
    // Create Stripe customer
    const customerData = {
      email,
      metadata: {
        userId,
      },
    } as const;

    const customer = await stripeAdmin.customers.create(customerData);
    
    console.debug('getOrCreateCustomerForUser: Created Stripe customer', { 
      userId, 
      stripeCustomerId: customer.id 
    });

    // If customer record exists, update it with Stripe customer ID
    if (data) {
      const { error: updateError } = await supabaseAdminClient
        .from('customers')
        .update({ stripe_customer_id: customer.id })
        .eq('id', userId);

      if (updateError) {
        console.error('getOrCreateCustomerForUser: Failed to update existing customer record', {
          userId,
          stripeCustomerId: customer.id,
          error: updateError.message
        });
        throw updateError;
      }

      console.debug('getOrCreateCustomerForUser: Updated existing customer record', { 
        userId, 
        stripeCustomerId: customer.id 
      });
    } else {
      // Create new customer record
      const { error: insertError } = await supabaseAdminClient
        .from('customers')
        .insert([{ id: userId, stripe_customer_id: customer.id }]);

      if (insertError) {
        console.error('getOrCreateCustomerForUser: Failed to create customer record', {
          userId,
          stripeCustomerId: customer.id,
          error: insertError.message
        });
        throw insertError;
      }

      console.debug('getOrCreateCustomerForUser: Created new customer record', { 
        userId, 
        stripeCustomerId: customer.id 
      });
    }

    return customer.id;
  } catch (stripeError) {
    console.error('getOrCreateCustomerForUser: Stripe customer creation failed', {
      userId,
      email,
      error: stripeError instanceof Error ? stripeError.message : 'Unknown error'
    });
    throw stripeError;
  }
}
