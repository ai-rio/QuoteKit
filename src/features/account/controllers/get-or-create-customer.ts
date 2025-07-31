import { createStripeAdminClient } from '@/libs/stripe/stripe-admin';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';

export async function getOrCreateCustomer({ userId, email }: { userId: string; email: string }) {
  // Get Stripe configuration - try database first, fallback to environment
  const { data: stripeConfigRecord, error: configError } = await supabaseAdminClient
    .from('admin_settings')
    .select('value')
    .eq('key', 'stripe_config')
    .maybeSingle();

  let stripeConfig: any = null;

  // Check if we got valid config from database
  if (!configError && stripeConfigRecord?.value) {
    stripeConfig = stripeConfigRecord.value as any;
  } else {
    // Fallback to environment variables
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (secretKey) {
      stripeConfig = {
        secret_key: secretKey,
        mode: process.env.STRIPE_MODE || 'test'
      };
    }
  }

  if (!stripeConfig?.secret_key) {
    console.error('getOrCreateCustomer: Stripe configuration error', {
      configError: configError?.message,
      hasConfigRecord: !!stripeConfigRecord?.value,
      hasEnvKey: !!process.env.STRIPE_SECRET_KEY
    });
    throw new Error('Stripe not configured - cannot create customer');
  }

  // Initialize Stripe admin client
  const stripeAdmin = createStripeAdminClient({
    secret_key: stripeConfig.secret_key,
    mode: stripeConfig.mode || 'test'
  });

  // Check if customer record exists
  const { data, error } = await supabaseAdminClient
    .from('stripe_customers')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .maybeSingle();

  // If customer exists and has a valid Stripe customer ID, return it
  if (!error && data?.stripe_customer_id) {
    try {
      // Verify the customer still exists in Stripe
      const stripeCustomer = await stripeAdmin.customers.retrieve(data.stripe_customer_id);
      if (typeof stripeCustomer !== 'string' && !stripeCustomer.deleted) {
        return data.stripe_customer_id;
      } else {
        console.warn(`Stripe customer ${data.stripe_customer_id} was deleted, creating new one`);
        // Continue to create new customer
      }
    } catch (stripeError) {
      console.warn(`Failed to verify Stripe customer ${data.stripe_customer_id}, creating new one:`, stripeError);
      // Continue to create new customer
    }
  }

  // Customer doesn't exist or needs to be recreated - create new Stripe customer
  try {
    const customerData = {
      email,
      metadata: {
        userId,
      },
    } as const;

    const customer = await stripeAdmin.customers.create(customerData);

    // If customer database record doesn't exist, create it
    if (error) {
      const { error: insertError } = await supabaseAdminClient
        .from('stripe_customers')
        .insert([{ user_id: userId, stripe_customer_id: customer.id, email }]);

      if (insertError) {
        // If there's a unique constraint violation, another request might have created the record
        // Try to get the existing record
        if (insertError.code === '23505') { // Unique violation
          const { data: existingData, error: fetchError } = await supabaseAdminClient
            .from('stripe_customers')
            .select('stripe_customer_id')
            .eq('user_id', userId)
            .maybeSingle();

          if (!fetchError && existingData?.stripe_customer_id) {
            console.log(`Customer record was created concurrently, using existing: ${existingData.stripe_customer_id}`);
            // We created a new Stripe customer but found an existing DB record
            // We should use the existing Stripe customer and delete the one we just created
            try {
              await stripeAdmin.customers.del(customer.id);
              return existingData.stripe_customer_id;
            } catch (deleteError) {
              console.warn('Failed to delete duplicate Stripe customer:', deleteError);
              // Use the new customer we created
              return customer.id;
            }
          }
        }
        
        console.error('Failed to insert customer record:', insertError);
        throw insertError;
      }
    } else {
      // Customer record exists but needs Stripe customer ID - update it
      const { error: updateError } = await supabaseAdminClient
        .from('stripe_customers')
        .update({ stripe_customer_id: customer.id, email })
        .eq('user_id', userId);

      if (updateError) {
        console.error('Failed to update customer record with Stripe ID:', updateError);
        throw updateError;
      }
    }

    console.log(`Created new Stripe customer ${customer.id} for user ${userId}`);
    return customer.id;

  } catch (stripeError) {
    console.error('getOrCreateCustomer: Failed to create Stripe customer', {
      userId,
      email,
      error: stripeError instanceof Error ? stripeError.message : 'Unknown error',
      stack: stripeError instanceof Error ? stripeError.stack : undefined,
      stripeConfigMode: stripeConfig?.mode,
      hasStripeSecretKey: !!stripeConfig?.secret_key
    });
    throw stripeError;
  }
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
    .from('stripe_customers')
    .select('stripe_customer_id')
    .eq('user_id', userId)
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
  const { createStripeAdminClient } = await import('@/libs/stripe/stripe-admin');

  console.debug('getOrCreateCustomerForUser: Creating new Stripe customer', { userId, email });

  // Get Stripe configuration - try database first, fallback to environment
  const { data: stripeConfigRecord, error: configError } = await supabaseAdminClient
    .from('admin_settings')
    .select('value')
    .eq('key', 'stripe_config')
    .maybeSingle();

  let stripeConfig: any = null;

  // Check if we got valid config from database
  if (!configError && stripeConfigRecord?.value) {
    stripeConfig = stripeConfigRecord.value as any;
  } else {
    // Fallback to environment variables
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (secretKey) {
      stripeConfig = {
        secret_key: secretKey,
        mode: process.env.STRIPE_MODE || 'test'
      };
    }
  }

  if (!stripeConfig?.secret_key) {
    console.error('getOrCreateCustomerForUser: Stripe configuration error', {
      configError: configError?.message,
      hasConfigRecord: !!stripeConfigRecord?.value,
      hasEnvKey: !!process.env.STRIPE_SECRET_KEY
    });
    throw new Error('Stripe not configured - cannot create customer');
  }

  // Initialize Stripe admin client
  const stripeAdmin = createStripeAdminClient({
    secret_key: stripeConfig.secret_key,
    mode: stripeConfig.mode || 'test'
  });

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
        .from('stripe_customers')
        .update({ stripe_customer_id: customer.id, email })
        .eq('user_id', userId);

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
        .from('stripe_customers')
        .insert([{ user_id: userId, stripe_customer_id: customer.id, email }]);

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
      error: stripeError instanceof Error ? stripeError.message : 'Unknown error',
      stack: stripeError instanceof Error ? stripeError.stack : undefined,
      stripeConfigMode: stripeConfig?.mode,
      hasStripeSecretKey: !!stripeConfig?.secret_key
    });
    throw stripeError;
  }
}
