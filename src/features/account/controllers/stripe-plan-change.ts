/**
 * Stripe Plan Change Controller
 * Handles actual Stripe API integration for plan changes with proration
 */

import { createStripeAdminClient } from '@/libs/stripe/stripe-admin';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

interface PlanChangeResult {
  success: boolean;
  subscription?: any;
  invoice?: any;
  error?: string;
}

interface ProrationPreview {
  immediateTotal: number;
  prorationAmount: number;
  nextInvoiceTotal: number;
  currency: string;
}

/**
 * Preview the proration for a plan change
 */
export async function previewPlanChange(
  stripeCustomerId: string,
  stripeSubscriptionId: string,
  newPriceId: string
): Promise<ProrationPreview> {
  console.log('🔍 Previewing plan change proration:', {
    stripeCustomerId,
    stripeSubscriptionId,
    newPriceId
  });

  const stripe = createStripeAdminClient();

  try {
    // Get the upcoming invoice with the subscription change
    const upcomingInvoice = await stripe.invoices.retrieveUpcoming({
      customer: stripeCustomerId,
      subscription: stripeSubscriptionId,
      subscription_items: [{
        id: stripeSubscriptionId,
        price: newPriceId,
      }],
      subscription_proration_behavior: 'create_prorations',
    });

    // Calculate proration details
    const prorationAmount = upcomingInvoice.lines.data
      .filter(line => line.proration)
      .reduce((sum, line) => sum + line.amount, 0);

    const immediateTotal = upcomingInvoice.amount_due;
    const nextInvoiceTotal = upcomingInvoice.total;

    console.log('✅ Proration preview calculated:', {
      immediateTotal,
      prorationAmount,
      nextInvoiceTotal,
      currency: upcomingInvoice.currency
    });

    return {
      immediateTotal,
      prorationAmount,
      nextInvoiceTotal,
      currency: upcomingInvoice.currency
    };
  } catch (error) {
    console.error('❌ Failed to preview proration:', error);
    throw new Error(`Failed to preview plan change: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Execute a plan change with Stripe
 */
export async function executeStripePlanChange(
  userId: string,
  stripeCustomerId: string,
  stripeSubscriptionId: string,
  newPriceId: string,
  paymentMethodId?: string,
  isUpgrade: boolean = false
): Promise<PlanChangeResult> {
  console.log('🚀 Executing Stripe plan change:', {
    userId,
    stripeCustomerId,
    stripeSubscriptionId,
    newPriceId,
    paymentMethodId,
    isUpgrade
  });

  const stripe = createStripeAdminClient();
  const supabase = await createSupabaseServerClient();

  try {
    // Step 1: Update payment method if provided (for upgrades)
    if (isUpgrade && paymentMethodId) {
      console.log('💳 Setting payment method for upgrade:', paymentMethodId);
      
      // Set the payment method as default for the customer
      await stripe.customers.update(stripeCustomerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      // Update the subscription's default payment method
      await stripe.subscriptions.update(stripeSubscriptionId, {
        default_payment_method: paymentMethodId,
      });
    }

    // Step 2: Get current subscription to find the subscription item
    const currentSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
    const subscriptionItem = currentSubscription.items.data[0];

    if (!subscriptionItem) {
      throw new Error('No subscription items found');
    }

    // Step 3: Update the subscription with the new price
    console.log('📝 Updating Stripe subscription...');
    const updatedSubscription = await stripe.subscriptions.update(stripeSubscriptionId, {
      items: [{
        id: subscriptionItem.id,
        price: newPriceId,
      }],
      proration_behavior: 'create_prorations',
      // For upgrades, charge immediately; for downgrades, wait for next period
      billing_cycle_anchor: isUpgrade ? undefined : 'unchanged',
    });

    console.log('✅ Stripe subscription updated successfully:', {
      id: updatedSubscription.id,
      status: updatedSubscription.status,
      current_period_start: updatedSubscription.current_period_start,
      current_period_end: updatedSubscription.current_period_end
    });

    // Step 4: Generate invoice for upgrades (immediate billing)
    let invoice = null;
    if (isUpgrade) {
      console.log('📄 Creating invoice for upgrade...');
      try {
        invoice = await stripe.invoices.create({
          customer: stripeCustomerId,
          subscription: stripeSubscriptionId,
          auto_advance: true, // Automatically attempt payment
        });

        // Finalize and pay the invoice
        if (invoice.status === 'draft') {
          await stripe.invoices.finalizeInvoice(invoice.id);
          await stripe.invoices.pay(invoice.id);
        }

        console.log('✅ Invoice created and paid:', {
          id: invoice.id,
          status: invoice.status,
          amount_paid: invoice.amount_paid
        });
      } catch (invoiceError) {
        console.error('⚠️ Invoice creation failed:', invoiceError);
        // Don't fail the entire operation if invoice creation fails
        // The subscription change was successful
      }
    }

    // Step 5: Update local database with new subscription data
    console.log('💾 Updating local database...');
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: updatedSubscription.status,
        current_period_start: new Date(updatedSubscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(updatedSubscription.current_period_end * 1000).toISOString(),
        stripe_price_id: newPriceId,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', stripeSubscriptionId)
      .eq('user_id', userId);

    if (updateError) {
      console.error('❌ Failed to update local database:', updateError);
      throw new Error(`Database update failed: ${updateError.message}`);
    }

    console.log('✅ Local database updated successfully');

    return {
      success: true,
      subscription: updatedSubscription,
      invoice: invoice
    };
  } catch (error) {
    console.error('❌ Stripe plan change failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Validate that a payment method is valid for a customer
 */
export async function validatePaymentMethod(
  stripeCustomerId: string,
  paymentMethodId: string
): Promise<boolean> {
  console.log('🔍 Validating payment method:', { stripeCustomerId, paymentMethodId });

  const stripe = createStripeAdminClient();

  try {
    // Retrieve the payment method
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

    // Check if it belongs to the customer
    if (paymentMethod.customer !== stripeCustomerId) {
      console.error('❌ Payment method does not belong to customer');
      return false;
    }

    // Check if it's a valid card (not expired, etc.)
    if (paymentMethod.type === 'card' && paymentMethod.card) {
      const now = new Date();
      const expYear = paymentMethod.card.exp_year;
      const expMonth = paymentMethod.card.exp_month;
      const expirationDate = new Date(expYear, expMonth - 1); // Month is 0-indexed

      if (expirationDate < now) {
        console.error('❌ Payment method is expired');
        return false;
      }
    }

    console.log('✅ Payment method is valid');
    return true;
  } catch (error) {
    console.error('❌ Payment method validation failed:', error);
    return false;
  }
}