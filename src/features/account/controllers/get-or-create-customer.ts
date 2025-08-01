import { createStripeAdminClient } from '@/libs/stripe/stripe-admin';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';

export async function getOrCreateCustomer({ userId, email }: { userId: string; email: string }) {
  console.log(`🔄 [GET_OR_CREATE_CUSTOMER] Starting for user ${userId} with email ${email}`)
  
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
  console.log(`🔍 [STEP 1] Checking if customer record exists for user ${userId}`)
  const { data, error } = await supabaseAdminClient
    .from('customers')  // Use 'customers' instead of 'stripe_customers'
    .select('stripe_customer_id')
    .eq('id', userId)   // Use 'id' instead of 'user_id'
    .maybeSingle();

  // If customer exists and has a valid Stripe customer ID, return it
  if (!error && data?.stripe_customer_id) {
    console.log(`✅ [STEP 1] Found existing customer record: ${data.stripe_customer_id}`)
    try {
      // Verify the customer still exists in Stripe
      const stripeCustomer = await stripeAdmin.customers.retrieve(data.stripe_customer_id);
      if (typeof stripeCustomer !== 'string' && !stripeCustomer.deleted) {
        console.log(`✅ [SUCCESS] Returning existing Stripe customer: ${data.stripe_customer_id}`)
        return data.stripe_customer_id;
      } else {
        console.warn(`⚠️ [WARNING] Stripe customer ${data.stripe_customer_id} was deleted, creating new one`)
        // Continue to create new customer
      }
    } catch (stripeError) {
      console.warn(`⚠️ [WARNING] Failed to verify Stripe customer ${data.stripe_customer_id}, creating new one:`, stripeError)
      // Continue to create new customer
    }
  }

  // Customer doesn't exist or needs to be recreated - create new Stripe customer
  console.log(`🆕 [STEP 2] Creating new Stripe customer for user ${userId}`)
  try {
    const customerData = {
      email,
      metadata: {
        userId,
      },
    } as const;

    // CRITICAL: Create Stripe customer first
    console.log(`📞 [STEP 2A] Creating customer in Stripe...`)
    const customer = await stripeAdmin.customers.create(customerData);
    console.log(`✅ [STEP 2A SUCCESS] Stripe customer created: ${customer.id}`)

    // CRITICAL: Immediately save to database with retry logic
    console.log(`💾 [STEP 2B] Saving customer to database immediately...`)
    let dbSaveSuccess = false
    let retryCount = 0
    const maxRetries = 3
    const retryDelay = 200 // ms
    
    while (!dbSaveSuccess && retryCount <= maxRetries) {
      try {
        // Use upsert to handle potential race conditions
        const { error: upsertError } = await supabaseAdminClient
          .from('customers')  // Use 'customers' instead of 'stripe_customers'
          .upsert([{ 
            id: userId,  // Use 'id' instead of 'user_id'
            stripe_customer_id: customer.id
          }], {
            onConflict: 'id',  // Use 'id' instead of 'user_id'
            ignoreDuplicates: false
          });

        if (upsertError) {
          if (retryCount < maxRetries) {
            console.warn(`⚠️ [STEP 2B RETRY ${retryCount + 1}/${maxRetries}] Database upsert failed, retrying in ${retryDelay}ms:`, upsertError.message)
            retryCount++
            await new Promise(resolve => setTimeout(resolve, retryDelay))
            continue
          }
          
          console.error('💥 [STEP 2B CRITICAL ERROR] Failed to save customer to database after retries:', upsertError);
          
          // Cleanup: Delete the Stripe customer we just created
          try {
            await stripeAdmin.customers.del(customer.id);
            console.log(`🧹 [CLEANUP] Deleted orphaned Stripe customer ${customer.id}`)
          } catch (deleteError) {
            console.error('💥 [CLEANUP ERROR] Failed to delete orphaned Stripe customer:', deleteError);
          }
          
          throw upsertError;
        }
        
        dbSaveSuccess = true
        console.log(`✅ [STEP 2B SUCCESS] Customer saved to database successfully`)
        
      } catch (dbError) {
        if (retryCount < maxRetries) {
          console.warn(`⚠️ [STEP 2B RETRY ${retryCount + 1}/${maxRetries}] Database save failed, retrying in ${retryDelay}ms:`, dbError)
          retryCount++
          await new Promise(resolve => setTimeout(resolve, retryDelay))
          continue
        }
        
        console.error('💥 [STEP 2B CRITICAL ERROR] Database save failed after all retries:', dbError);
        
        // Cleanup: Delete the Stripe customer we just created
        try {
          await stripeAdmin.customers.del(customer.id);
          console.log(`🧹 [CLEANUP] Deleted orphaned Stripe customer ${customer.id}`)
        } catch (deleteError) {
          console.error('💥 [CLEANUP ERROR] Failed to delete orphaned Stripe customer:', deleteError);
        }
        
        throw dbError;
      }
    }

    // CRITICAL: Verify the customer was saved before returning
    console.log(`🔍 [STEP 2C] Verifying customer was saved to database...`)
    const { data: verifyData, error: verifyError } = await supabaseAdminClient
      .from('customers')  // Use 'customers' instead of 'stripe_customers'
      .select('stripe_customer_id, id')  // Use 'id' instead of 'user_id'
      .eq('id', userId)   // Use 'id' instead of 'user_id'
      .eq('stripe_customer_id', customer.id)
      .single();

    if (verifyError || !verifyData) {
      console.error('💥 [STEP 2C CRITICAL ERROR] Customer verification failed:', {
        verifyError,
        hasVerifyData: !!verifyData,
        userId,
        customerId: customer.id
      });
      
      // Cleanup: Delete the Stripe customer
      try {
        await stripeAdmin.customers.del(customer.id);
        console.log(`🧹 [CLEANUP] Deleted unverified Stripe customer ${customer.id}`)
      } catch (deleteError) {
        console.error('💥 [CLEANUP ERROR] Failed to delete unverified Stripe customer:', deleteError);
      }
      
      throw new Error(`Customer creation verification failed: ${verifyError?.message || 'Record not found'}`);
    }

    console.log(`✅ [STEP 2C SUCCESS] Customer verification confirmed:`, {
      stripeCustomerId: verifyData.stripe_customer_id,
      userId: verifyData.id  // Use 'id' instead of 'user_id'
    });

    console.log(`🎉 [SUCCESS] Created and verified new Stripe customer ${customer.id} for user ${userId}`)
    return customer.id;

  } catch (stripeError) {
    console.error('💥 [CRITICAL ERROR] getOrCreateCustomer: Failed to create Stripe customer', {
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
 * Only creates Stripe customers when actually needed for payment processing
 */
export async function getOrCreateCustomerForUser({
  userId, 
  email, 
  supabaseClient, 
  forceCreate = false 
}: { 
  userId: string; 
  email: string;
  supabaseClient: any; // Supabase client (server or admin)
  forceCreate?: boolean; // Only create customer if this is true
}) {
  console.debug('getOrCreateCustomerForUser: Starting customer lookup/creation', { userId, email, forceCreate });

  // First try to get existing customer record using maybeSingle to avoid PGRST116 errors
  const { data, error } = await supabaseClient
    .from('customers')  // Use 'customers' instead of 'stripe_customers'
    .select('stripe_customer_id')
    .eq('id', userId)   // Use 'id' instead of 'user_id'
    .maybeSingle();

  if (error) {
    console.error('getOrCreateCustomerForUser: Database error during customer lookup', { 
      userId, 
      error: error.message || 'Unknown database error',
      code: error.code || 'NO_CODE',
      details: error.details || 'No details',
      hint: error.hint || 'No hint'
    });
    throw new Error(`Database error during customer lookup: ${error.message || 'Unknown error'}`);
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
  // Only create if explicitly requested (forceCreate = true)
  if (!forceCreate) {
    console.debug('getOrCreateCustomerForUser: No existing customer and forceCreate=false, returning null', { userId });
    return null;
  }

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
        .from('customers')  // Use 'customers' instead of 'stripe_customers'
        .update({ stripe_customer_id: customer.id })
        .eq('id', userId);  // Use 'id' instead of 'user_id'

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
        .from('customers')  // Use 'customers' instead of 'stripe_customers'
        .insert([{ id: userId, stripe_customer_id: customer.id }]);  // Use 'id' instead of 'user_id', remove email

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
    // If creation fails and forceCreate is false, return null instead of throwing
    if (!forceCreate) {
      console.warn('getOrCreateCustomerForUser: Stripe customer creation failed, returning null since forceCreate=false', {
        userId,
        error: stripeError instanceof Error ? stripeError.message : 'Unknown error'
      });
      return null;
    }
    throw stripeError;
  }
}

/**
 * Helper function to check if a user has a paid subscription that requires Stripe customer
 */
export async function userNeedsStripeCustomer(userId: string, supabaseClient: any): Promise<boolean> {
  try {
    // Check if user has any paid subscriptions (non-null stripe_subscription_id)
    const { data: paidSubscriptions, error } = await supabaseClient
      .from('subscriptions')
      .select('stripe_subscription_id')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing', 'past_due'])
      .not('stripe_subscription_id', 'is', null)
      .limit(1);

    if (error) {
      console.error('userNeedsStripeCustomer: Error checking for paid subscriptions', { userId, error });
      return false;
    }

    const needsCustomer = (paidSubscriptions && paidSubscriptions.length > 0);
    console.debug('userNeedsStripeCustomer: Checked subscription status', {
      userId,
      hasPaidSubscription: needsCustomer,
      subscriptionCount: paidSubscriptions?.length || 0
    });

    return needsCustomer;
  } catch (error) {
    console.error('userNeedsStripeCustomer: Unexpected error', { userId, error });
    return false;
  }
}
