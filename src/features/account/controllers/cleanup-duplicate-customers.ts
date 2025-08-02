import { createStripeAdminClient } from '@/libs/stripe/stripe-admin';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';

/**
 * Clean up duplicate Stripe customers for a user
 * This function should be called when we detect multiple customers for the same email
 */
export async function cleanupDuplicateCustomers(email: string, userId: string): Promise<string> {
  console.log('🧹 cleanupDuplicateCustomers: Starting cleanup for', { email, userId });

  try {
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
      throw new Error('Stripe not configured');
    }

    const stripeAdmin = createStripeAdminClient({
      secret_key: stripeConfig.secret_key,
      mode: stripeConfig.mode || 'test'
    });

    // Find all customers with this email
    const allCustomers = await stripeAdmin.customers.list({
      email: email,
      limit: 100 // Get all customers with this email
    });

    console.log(`🔍 Found ${allCustomers.data.length} customers with email ${email}`);

    if (allCustomers.data.length <= 1) {
      // No duplicates to clean up
      if (allCustomers.data.length === 1) {
        const customer = allCustomers.data[0];
        console.log('✅ Single customer found, updating database record');
        
        // Update database record
        await supabaseAdminClient
          .from('customers')
          .upsert({
            id: userId,
            stripe_customer_id: customer.id,
            email: email,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'id'
          });

        return customer.id;
      } else {
        throw new Error('No customers found');
      }
    }

    // Find the "best" customer to keep
    const validCustomers = allCustomers.data.filter(customer => !customer.deleted);
    
    if (validCustomers.length === 0) {
      throw new Error('All customers are deleted');
    }

    // Sort customers by:
    // 1. Has active subscriptions (priority)
    // 2. Has payment methods (secondary)
    // 3. Most recent creation date (tertiary)
    const customersWithData = await Promise.all(
      validCustomers.map(async (customer) => {
        try {
          // Check for active subscriptions
          const subscriptions = await stripeAdmin.subscriptions.list({
            customer: customer.id,
            status: 'active',
            limit: 1
          });

          // Check for payment methods
          const paymentMethods = await stripeAdmin.paymentMethods.list({
            customer: customer.id,
            type: 'card',
            limit: 1
          });

          return {
            customer,
            hasActiveSubscriptions: subscriptions.data.length > 0,
            hasPaymentMethods: paymentMethods.data.length > 0,
            subscriptionCount: subscriptions.data.length,
            paymentMethodCount: paymentMethods.data.length
          };
        } catch (error) {
          console.warn(`Error checking customer ${customer.id}:`, error);
          return {
            customer,
            hasActiveSubscriptions: false,
            hasPaymentMethods: false,
            subscriptionCount: 0,
            paymentMethodCount: 0
          };
        }
      })
    );

    // Sort to find the best customer to keep
    customersWithData.sort((a, b) => {
      // Priority 1: Active subscriptions
      if (a.hasActiveSubscriptions && !b.hasActiveSubscriptions) return -1;
      if (!a.hasActiveSubscriptions && b.hasActiveSubscriptions) return 1;
      
      // Priority 2: Payment methods
      if (a.hasPaymentMethods && !b.hasPaymentMethods) return -1;
      if (!a.hasPaymentMethods && b.hasPaymentMethods) return 1;
      
      // Priority 3: More subscriptions
      if (a.subscriptionCount !== b.subscriptionCount) {
        return b.subscriptionCount - a.subscriptionCount;
      }
      
      // Priority 4: More payment methods
      if (a.paymentMethodCount !== b.paymentMethodCount) {
        return b.paymentMethodCount - a.paymentMethodCount;
      }
      
      // Priority 5: Most recent
      return b.customer.created - a.customer.created;
    });

    const customerToKeep = customersWithData[0].customer;
    const customersToDelete = customersWithData.slice(1);

    console.log(`🎯 Keeping customer ${customerToKeep.id}, deleting ${customersToDelete.length} duplicates`);

    // Delete duplicate customers (only if they have no active subscriptions)
    for (const customerData of customersToDelete) {
      const customer = customerData.customer;
      
      if (customerData.hasActiveSubscriptions) {
        console.warn(`⚠️ Skipping deletion of customer ${customer.id} - has active subscriptions`);
        continue;
      }

      try {
        // Move payment methods to the customer we're keeping
        if (customerData.hasPaymentMethods) {
          console.log(`🔄 Moving payment methods from ${customer.id} to ${customerToKeep.id}`);
          
          const paymentMethods = await stripeAdmin.paymentMethods.list({
            customer: customer.id,
            type: 'card'
          });

          for (const pm of paymentMethods.data) {
            try {
              // Detach from old customer
              await stripeAdmin.paymentMethods.detach(pm.id);
              // Attach to new customer
              await stripeAdmin.paymentMethods.attach(pm.id, {
                customer: customerToKeep.id
              });
              console.log(`✅ Moved payment method ${pm.id}`);
            } catch (pmError) {
              console.warn(`⚠️ Failed to move payment method ${pm.id}:`, pmError);
            }
          }
        }

        // Delete the duplicate customer
        await stripeAdmin.customers.del(customer.id);
        console.log(`🗑️ Deleted duplicate customer ${customer.id}`);
        
      } catch (deleteError) {
        console.warn(`⚠️ Failed to delete customer ${customer.id}:`, deleteError);
      }
    }

    // Update database with the customer we kept
    await supabaseAdminClient
      .from('customers')
      .upsert({
        id: userId,
        stripe_customer_id: customerToKeep.id,
        email: email,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      });

    console.log(`✅ Cleanup complete, kept customer ${customerToKeep.id}`);
    return customerToKeep.id;

  } catch (error) {
    console.error('💥 cleanupDuplicateCustomers failed:', error);
    throw error;
  }
}

/**
 * Check if a user has duplicate customers and clean them up if needed
 */
export async function checkAndCleanupDuplicates(email: string, userId: string): Promise<string | null> {
  try {
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
      return null;
    }

    const stripeAdmin = createStripeAdminClient({
      secret_key: stripeConfig.secret_key,
      mode: stripeConfig.mode || 'test'
    });

    // Check for duplicates
    const customers = await stripeAdmin.customers.list({
      email: email,
      limit: 10
    });

    const validCustomers = customers.data.filter(c => !c.deleted);
    
    if (validCustomers.length > 1) {
      console.log(`🚨 Found ${validCustomers.length} duplicate customers for ${email}, cleaning up...`);
      return await cleanupDuplicateCustomers(email, userId);
    } else if (validCustomers.length === 1) {
      return validCustomers[0].id;
    }

    return null;
  } catch (error) {
    console.error('checkAndCleanupDuplicates failed:', error);
    return null;
  }
}
