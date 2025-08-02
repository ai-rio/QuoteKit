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
 * FIXED: Prevents duplicate customer creation by checking Stripe first
 */
export async function getOrCreateCustomerForUser({
  userId, 
  email, 
  supabaseClient, 
  forceCreate = false // CHANGED: Default to false to prevent unnecessary creation
}: { 
  userId: string; 
  email: string;
  supabaseClient: any; // Supabase client (server or admin)
  forceCreate?: boolean; // Create customer by default for paid users
}) {
  console.log('getOrCreateCustomerForUser: Starting customer lookup/creation', {
    userId,
    email,
    forceCreate
  });

  try {
    // We need admin client to create/update customer records
    const { supabaseAdminClient } = await import('@/libs/supabase/supabase-admin');
    const { createStripeAdminClient } = await import('@/libs/stripe/stripe-admin');

    // Get Stripe configuration
    const { data: stripeConfigRecord, error: configError } = await supabaseAdminClient
      .from('admin_settings')
      .select('value')
      .eq('key', 'stripe_config')
      .maybeSingle();

    let stripeConfig: any = null;
    if (!configError && stripeConfigRecord?.value) {
      stripeConfig = stripeConfigRecord.value as any;
    } else {
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

    const stripeAdmin = createStripeAdminClient({
      secret_key: stripeConfig.secret_key,
      mode: stripeConfig.mode || 'test'
    });

    // Step 1: ALWAYS check local database first for existing customer
    console.log('getOrCreateCustomerForUser: Checking database for existing customer');
    const { data: existingCustomer, error: lookupError } = await supabaseAdminClient
      .from('customers')
      .select('stripe_customer_id')
      .eq('id', userId)
      .maybeSingle();

    if (!lookupError && existingCustomer?.stripe_customer_id) {
      console.log('getOrCreateCustomerForUser: Found existing customer in database', {
        userId,
        stripeCustomerId: existingCustomer.stripe_customer_id
      });

      // Verify the customer still exists in Stripe
      try {
        const stripeCustomer = await stripeAdmin.customers.retrieve(existingCustomer.stripe_customer_id);
        if (typeof stripeCustomer !== 'string' && !stripeCustomer.deleted) {
          console.log('getOrCreateCustomerForUser: Verified customer exists in Stripe');
          return existingCustomer.stripe_customer_id;
        } else {
          console.warn('getOrCreateCustomerForUser: Customer was deleted in Stripe, will create new one');
          // Continue to create new customer
        }
      } catch (stripeError: any) {
        if (stripeError.code === 'resource_missing') {
          console.warn('getOrCreateCustomerForUser: Customer exists in database but not in Stripe, will create new one');
          // Continue to create new customer
        } else {
          console.error('getOrCreateCustomerForUser: Error verifying Stripe customer:', stripeError);
          throw stripeError;
        }
      }
    }

    // Step 2: Check if customer already exists in Stripe by email (to prevent duplicates)
    console.log('getOrCreateCustomerForUser: Searching Stripe for existing customer by email');
    const existingCustomers = await stripeAdmin.customers.list({
      email: email,
      limit: 10 // Get more results to handle potential duplicates
    });

    // Find the most recent non-deleted customer
    const validCustomer = existingCustomers.data.find(customer => !customer.deleted);
    
    if (validCustomer) {
      console.log('getOrCreateCustomerForUser: Found existing customer in Stripe', {
        userId,
        stripeCustomerId: validCustomer.id,
        email: validCustomer.email
      });

      // Update our database with the existing customer
      const { error: upsertError } = await supabaseAdminClient
        .from('customers')
        .upsert({
          id: userId,
          stripe_customer_id: validCustomer.id
        }, {
          onConflict: 'id'
        });

      if (upsertError) {
        console.error('getOrCreateCustomerForUser: Failed to update database with existing customer:', upsertError);
        // Don't throw - we still have the customer ID
      } else {
        console.log('getOrCreateCustomerForUser: Successfully updated database with existing customer');
      }

      return validCustomer.id;
    }

    // Step 3: Only create new customer if none exists and we're allowed to
    if (!forceCreate) {
      console.log('getOrCreateCustomerForUser: No existing customer found and forceCreate is false');
      throw new Error('Customer not found and creation not forced');
    }

    console.log('getOrCreateCustomerForUser: Creating new Stripe customer', {
      userId,
      email
    });

    const newCustomer = await stripeAdmin.customers.create({
      email: email,
      metadata: {
        user_id: userId,
        created_by: 'quotekit_app',
        created_at: new Date().toISOString()
      }
    });

    console.log('getOrCreateCustomerForUser: Created Stripe customer', {
      userId,
      stripeCustomerId: newCustomer.id
    });

    // Step 4: Save to database with retry logic
    console.log('getOrCreateCustomerForUser: Saving customer to database');
    let saveAttempts = 0;
    const maxSaveAttempts = 3;
    
    while (saveAttempts < maxSaveAttempts) {
      try {
        const { error: insertError } = await supabaseAdminClient
          .from('customers')
          .upsert({
            id: userId,
            stripe_customer_id: newCustomer.id
          }, {
            onConflict: 'id'
          });

        if (insertError) {
          throw insertError;
        }

        console.log('getOrCreateCustomerForUser: Successfully saved customer record');
        break;
        
      } catch (saveError) {
        saveAttempts++;
        console.error(`getOrCreateCustomerForUser: Save attempt ${saveAttempts} failed:`, saveError);
        
        if (saveAttempts >= maxSaveAttempts) {
          console.error('getOrCreateCustomerForUser: All save attempts failed, but customer exists in Stripe');
          // Don't throw - customer was created in Stripe successfully
          break;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 100 * saveAttempts));
      }
    }

    console.log('getOrCreateCustomerForUser: Successfully created new customer');
    return newCustomer.id;

  } catch (error) {
    console.error('getOrCreateCustomerForUser: Error:', error);
    throw new Error(`Failed to get or create customer: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Helper function to check if a user has a paid subscription that requires Stripe customer
 */
export async function userNeedsStripeCustomer(userId: string, supabaseClient: any): Promise<boolean> {
  try {
    // Check if user has any paid subscriptions (non-null stripe_subscription_id)
    // Include 'incomplete' status for subscriptions that need payment confirmation
    const { data: paidSubscriptions, error } = await supabaseClient
      .from('subscriptions')
      .select('stripe_subscription_id')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing', 'past_due', 'incomplete'])
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
      subscriptionCount: paidSubscriptions?.length || 0,
      includedStatuses: ['active', 'trialing', 'past_due', 'incomplete']
    });

    return needsCustomer;
  } catch (error) {
    console.error('userNeedsStripeCustomer: Unexpected error', { userId, error });
    return false;
  }
}
