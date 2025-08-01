'use server';

import { revalidatePath } from 'next/cache';

import { getSession } from '@/features/account/controllers/get-session';
import { getSubscription } from '@/features/account/controllers/get-subscription';
import { createStripeAdminClient } from '@/libs/stripe/stripe-admin';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { executeStripePlanChange, validatePaymentMethod } from '../controllers/stripe-plan-change';


export async function changePlan(priceId: string, isUpgrade: boolean, paymentMethodId?: string) {
  console.log('🔄 changePlan called with:', { priceId, isUpgrade, paymentMethodId });
  
  // Enhanced environment detection logging
  console.log('🌍 Environment detection:', {
    NODE_ENV: process.env.NODE_ENV,
    SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('127.0.0.1'),
    isDevelopment: process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('127.0.0.1'),
    STRIPE_SECRET_KEY_EXISTS: !!process.env.STRIPE_SECRET_KEY,
    STRIPE_PUBLISHABLE_KEY_EXISTS: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  });
  
  try {
    // Check authentication
    const session = await getSession();
    if (!session?.user) {
      console.error('❌ No authenticated user found');
      throw new Error('Unauthorized - please log in');
    }

    console.log('✅ User authenticated:', { userId: session.user.id, email: session.user.email });

    if (!priceId) {
      console.error('❌ No price ID provided');
      throw new Error('Price ID is required');
    }

    // Get user's subscription
    const supabase = await createSupabaseServerClient();
    
    console.log('🔍 Querying user subscriptions...');
    
    const { data: subscriptions, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', session.user.id)
      .in('status', ['trialing', 'active', 'past_due'])
      .order('created', { ascending: false })
      .limit(1);

    if (subscriptionError) {
      console.error('❌ Subscription query error:', subscriptionError);
      throw new Error(`Failed to query subscription: ${subscriptionError.message}`);
    }

    console.log('📊 Subscription query result:', { 
      subscriptionsFound: subscriptions?.length || 0,
      subscriptions: subscriptions?.map(s => ({ id: s.id, status: s.status, stripe_price_id: s.stripe_price_id }))
    });

    const subscription = subscriptions?.[0];

    // Get price data separately if subscription has a price ID
    let priceData = null;
    if (subscription?.stripe_price_id) {
      const { data: price, error: priceError } = await supabase
        .from('stripe_prices')
        .select(`
          *,
          stripe_products (
            name,
            stripe_product_id
          )
        `)
        .eq('id', subscription.stripe_price_id)
        .single();

      if (!priceError && price) {
        priceData = price;
      }
    }

    // Enhance subscription with price data
    const enhancedSubscription = {
      ...subscription,
      stripe_prices: priceData
    };

    // Check if this is a free plan user (no Stripe subscription ID) - Handle as new paid subscription
    if (!enhancedSubscription?.stripe_subscription_id) {
      console.log('User has free plan, creating new paid subscription');
      
      // First, validate the new price exists and is active
      const { data: newPrice, error: priceError } = await supabase
        .from('stripe_prices')
        .select(`
          *,
          stripe_products!stripe_prices_stripe_product_id_fkey (*)
        `)
        .eq('id', priceId)
        .eq('active', true)
        .single();

      if (priceError || !newPrice) {
        console.error('Price validation failed:', {
          priceId,
          priceError: priceError?.message,
          foundPrice: !!newPrice,
          userId: session.user.id
        });
        throw new Error(`Invalid or inactive price: ${priceId}. Error: ${priceError?.message || 'Price not found'}`);
      }

      // Development mode: Create local subscription without Stripe
      // TEMPORARY DEBUG FLAG - Set to true to test production Stripe path
      const FORCE_PRODUCTION_PATH = false; // Change this to true to test Stripe integration
      const isDevelopment = !FORCE_PRODUCTION_PATH && (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('127.0.0.1'));
      
      console.log('🎯 Path Selection (New Subscription):', {
        FORCE_PRODUCTION_PATH,
        isDevelopment,
        willUseStripe: !isDevelopment,
        pathSelected: isDevelopment ? 'DEVELOPMENT (Database Only)' : 'PRODUCTION (Stripe Integration)'
      });
      
      if (isDevelopment) {
        console.log('🧪 Development mode: Creating local subscription without Stripe');
        
        // For upgrades in development, validate payment method is provided
        if (isUpgrade && !paymentMethodId) {
          console.error('❌ Payment method required for upgrades in development mode');
          throw new Error('Payment method is required for plan upgrades. Please select a payment method.');
        }
        
        if (isUpgrade && paymentMethodId) {
          console.log('💳 Development mode: Payment method provided for upgrade:', paymentMethodId);
          // In production, this would validate the payment method with Stripe
        }
        
        // Create a development subscription record
        const devSubscription = {
          id: `sub_dev_${Date.now()}`,
          user_id: session.user.id,
          status: 'active',
          stripe_price_id: priceId,
          quantity: 1,
          cancel_at_period_end: false,
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          created: new Date().toISOString(),
          trial_start: null,
          trial_end: null,
          // Don't set stripe_subscription_id for development subscriptions
          stripe_subscription_id: null
        };

        console.log('📝 Creating subscription with data:', {
          id: devSubscription.id,
          user_id: devSubscription.user_id,
          status: devSubscription.status,
          stripe_price_id: devSubscription.stripe_price_id
        });

        const { data: subscription, error: subError } = await supabase
          .from('subscriptions')
          .insert(devSubscription)
          .select()
          .single();

        if (subError) {
          console.error('❌ Failed to create development subscription:', {
            error: subError,
            code: subError.code,
            message: subError.message,
            details: subError.details,
            hint: subError.hint
          });
          throw new Error(`Failed to create subscription: ${subError.message} (Code: ${subError.code})`);
        }

        console.log('✅ Development subscription created successfully:', {
          id: subscription.id,
          user_id: subscription.user_id,
          status: subscription.status,
          stripe_price_id: subscription.stripe_price_id
        });
        
        // Create billing history entry for new subscription
        const billingEntry = {
          id: `bill_${subscription.id}_${Date.now()}`,
          user_id: session.user.id,
          subscription_id: subscription.id,
          amount: newPrice.unit_amount || 0,
          currency: 'usd',
          status: 'paid',
          description: `New subscription to ${newPrice.stripe_products?.name || 'Plan'}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          invoice_url: null,
          stripe_invoice_id: null
        };

        // Insert billing history (best effort - don't fail if this fails)
        try {
          await supabase.from('billing_history').insert(billingEntry);
          console.log('✅ Billing history entry created');
        } catch (billingError) {
          console.warn('⚠️ Failed to create billing history entry:', billingError);
        }
        
        // Note: Event dispatching moved to client-side component
        // Server actions cannot dispatch window events
        
        return { success: true, subscription, needsBillingRefresh: true };
      }

      // Production mode: Create new Stripe subscription
      console.log('🏭 Production mode: Creating new Stripe subscription');
      
      // For new subscriptions (free to paid), we need to create a Stripe subscription
      // This requires customer creation and payment method setup
      if (isUpgrade && !paymentMethodId) {
        throw new Error('Payment method is required for new paid subscriptions');
      }
      
      // TODO: Implement new subscription creation with Stripe
      // This would involve:
      // 1. Creating Stripe customer if doesn't exist
      // 2. Attaching payment method to customer
      // 3. Creating subscription with the new price
      // 4. Handling payment confirmation
      // 5. Updating local database
      
      throw new Error('New subscription creation not yet implemented. Please contact support.');
    }

    // Handle existing subscription changes
    console.log('User has existing subscription, updating plan');
    
    // Validate the new price exists and is active
    const { data: newPrice, error: priceError } = await supabase
      .from('stripe_prices')
      .select(`
        *,
        stripe_products!stripe_prices_stripe_product_id_fkey (*)
      `)
      .eq('id', priceId)
      .eq('active', true)
      .single();

    if (priceError || !newPrice) {
      console.error('Price validation failed for existing subscription:', {
        priceId,
        priceError: priceError?.message,
        foundPrice: !!newPrice,
        userId: session.user.id
      });
      throw new Error(`Invalid or inactive price: ${priceId}. Error: ${priceError?.message || 'Price not found'}`);
    }

    // Development mode: Update existing subscription
    // TEMPORARY DEBUG FLAG - Set to true to test production Stripe path
    const FORCE_PRODUCTION_PATH = false; // Change this to true to test Stripe integration
    const isDevelopment = !FORCE_PRODUCTION_PATH && (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('127.0.0.1'));
    
    console.log('🎯 Path Selection (Existing Subscription):', {
      FORCE_PRODUCTION_PATH,
      isDevelopment,
      willUseStripe: !isDevelopment,
      pathSelected: isDevelopment ? 'DEVELOPMENT (Database Only)' : 'PRODUCTION (Stripe Integration)',
      hasStripeIds: {
        customerId: !!enhancedSubscription.stripe_customer_id,
        subscriptionId: !!enhancedSubscription.stripe_subscription_id
      }
    });
    
    if (isDevelopment) {
      console.log('🧪 Development mode: Updating existing subscription');
      
      // For upgrades in development, validate payment method is provided
      if (isUpgrade && !paymentMethodId) {
        console.error('❌ Payment method required for upgrades in development mode');
        throw new Error('Payment method is required for plan upgrades. Please select a payment method.');
      }
      
      if (isUpgrade && paymentMethodId) {
        console.log('💳 Development mode: Payment method provided for upgrade:', paymentMethodId);
        // In production, this would validate the payment method with Stripe
      }
      
      // Update the existing subscription with new price
      const subscriptionUpdate = {
        stripe_price_id: priceId,
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        updated_at: new Date().toISOString()
      };

      console.log('📝 Updating subscription with data:', {
        id: enhancedSubscription.id,
        old_price_id: enhancedSubscription.stripe_price_id,
        new_price_id: priceId,
        user_id: session.user.id
      });

      const { data: updatedSubscription, error: updateError } = await supabase
        .from('subscriptions')
        .update(subscriptionUpdate)
        .eq('id', enhancedSubscription.id)
        .eq('user_id', session.user.id) // Ensure user can only update their own subscription
        .select()
        .single();

      if (updateError) {
        console.error('❌ Failed to update subscription:', {
          error: updateError,
          code: updateError.code,
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint
        });
        throw new Error(`Failed to update subscription: ${updateError.message} (Code: ${updateError.code})`);
      }

      console.log('✅ Subscription updated successfully:', {
        id: updatedSubscription.id,
        old_price_id: enhancedSubscription.stripe_price_id,
        new_price_id: updatedSubscription.stripe_price_id,
        status: updatedSubscription.status
      });
      
      // Create billing history entry for subscription change
      const billingEntry = {
        id: `bill_change_${updatedSubscription.id}_${Date.now()}`,
        user_id: session.user.id,
        subscription_id: updatedSubscription.id,
        amount: newPrice.unit_amount || 0,
        currency: 'usd',
        status: 'paid',
        description: `Plan change to ${newPrice.stripe_products?.name || 'Plan'}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        invoice_url: null,
        stripe_invoice_id: null
      };

      // Insert billing history (best effort - don't fail if this fails)
      try {
        await supabase.from('billing_history').insert(billingEntry);
        console.log('✅ Billing history entry created for plan change');
      } catch (billingError) {
        console.warn('⚠️ Failed to create billing history entry:', billingError);
      }
      
      // Revalidate the account page to refresh the UI
      revalidatePath('/account');
      
      // Note: Event dispatching moved to client-side component
      // Server actions cannot dispatch window events
      
      return { 
        success: true, 
        subscription: {
          ...updatedSubscription,
          stripe_prices: newPrice
        },
        needsBillingRefresh: true
      };
    }

    // Production mode: Update existing Stripe subscription
    console.log('🏭 Production mode: Updating existing Stripe subscription');
    
    // Get Stripe customer and subscription IDs
    const stripeCustomerId = enhancedSubscription.stripe_customer_id;
    const stripeSubscriptionId = enhancedSubscription.stripe_subscription_id;
    
    if (!stripeCustomerId || !stripeSubscriptionId) {
      throw new Error('Missing Stripe customer or subscription ID. Please contact support.');
    }
    
    // For upgrades, validate payment method if provided
    if (isUpgrade && paymentMethodId) {
      console.log('💳 Validating payment method for upgrade...');
      const isValidPaymentMethod = await validatePaymentMethod(stripeCustomerId, paymentMethodId);
      if (!isValidPaymentMethod) {
        throw new Error('Invalid or expired payment method. Please add a valid payment method.');
      }
    }
    
    // Execute the plan change with Stripe
    const result = await executeStripePlanChange(
      session.user.id,
      stripeCustomerId,
      stripeSubscriptionId,
      priceId,
      paymentMethodId,
      isUpgrade
    );
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to update subscription with Stripe');
    }
    
    console.log('✅ Stripe plan change completed successfully');
    
    // Revalidate the account page to refresh the UI
    revalidatePath('/account');
    
    // Note: Event dispatching moved to client-side component
    // Server actions cannot dispatch window events
    
    return {
      success: true,
      subscription: result.subscription,
      invoice: result.invoice,
      needsBillingRefresh: true
    };

  } catch (error) {
    console.error('❌ Plan change error:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      priceId,
      isUpgrade,
      paymentMethodId,
      timestamp: new Date().toISOString()
    });
    
    // Re-throw with more context
    if (error instanceof Error) {
      throw new Error(`Plan change failed: ${error.message}`);
    } else {
      throw new Error(`Plan change failed: ${JSON.stringify(error)}`);
    }
  }
}

export async function getAvailablePlans() {
  try {
    const supabase = await createSupabaseServerClient();
    
    // First get products
    const { data: products, error: productsError } = await supabase
      .from('stripe_products')
      .select('*')
      .eq('active', true)
      .order('created_at');

    if (productsError) {
      console.error('Error fetching products:', productsError);
      throw new Error('Failed to fetch available plans');
    }

    // Then get prices for each product - use product.id instead of stripe_product_id
    const { data: prices, error: pricesError } = await supabase
      .from('stripe_prices')
      .select('*')
      .eq('active', true)
      .in('stripe_product_id', products.map(p => p.id));

    if (pricesError) {
      console.error('Error fetching prices:', pricesError);
      throw new Error('Failed to fetch plan prices');
    }

    // Transform prices to match expected Price type
    const transformedPrices = prices.map(price => ({
      ...price,
      interval: price.interval,
      type: price.interval ? 'recurring' as const : 'one_time' as const,
      stripe_price_id: price.id
    }));

    // Combine products with their transformed prices
    const productsWithPrices = products.map(product => ({
      ...product,
      stripe_product_id: product.id,
      prices: transformedPrices.filter(price => price.stripe_product_id === product.id)
    }));

    return productsWithPrices;
  } catch (error) {
    console.error('Get available plans error:', error);
    throw error;
  }
}

// Placeholder functions for the other exports
export async function cancelSubscription(cancelAtPeriodEnd: boolean = true, reason?: string) {
  throw new Error('cancelSubscription not implemented yet');
}

export async function reactivateSubscription() {
  throw new Error('reactivateSubscription not implemented yet');
}
