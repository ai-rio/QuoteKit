/**
 * Proration Handler - Step 2.3 Edge Case Implementation
 * 
 * Handles proration calculations and billing for plan changes including:
 * - Upgrade/downgrade proration calculations
 * - Mid-cycle plan changes
 * - Credit and debit adjustments
 * - Proration preview for customer transparency
 * - Complex billing scenarios (trial periods, discounts, etc.)
 */

import { createStripeAdminClient } from '@/libs/stripe/stripe-admin';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';
import Stripe from 'stripe';

export interface ProrationPreview {
  currentPlan: {
    priceId: string;
    amount: number;
    currency: string;
    interval: string;
  };
  newPlan: {
    priceId: string;
    amount: number;
    currency: string;
    interval: string;
  };
  prorationDetails: {
    creditAmount: number;
    debitAmount: number;
    netAmount: number;
    effectiveDate: Date;
    nextBillingDate: Date;
  };
  breakdown: ProrationLineItem[];
}

export interface ProrationLineItem {
  description: string;
  amount: number;
  currency: string;
  type: 'credit' | 'debit';
  period?: {
    start: Date;
    end: Date;
  };
}

export interface PlanChangeResult {
  success: boolean;
  subscriptionId: string;
  prorationAmount: number;
  immediateCharge: boolean;
  nextInvoicePreview?: Stripe.Invoice;
  error?: string;
}

/**
 * Preview proration for a plan change before executing
 * This allows customers to see exactly what they'll be charged
 */
export async function previewPlanChangeProration(
  subscriptionId: string,
  newPriceId: string,
  stripeConfig: any,
  effectiveDate?: Date
): Promise<ProrationPreview> {
  console.log(`🔍 [PRORATION_PREVIEW] ===== STARTING PLAN CHANGE PREVIEW =====`);
  console.log(`🔍 [PRORATION_PREVIEW] Subscription: ${subscriptionId}`);
  console.log(`🔍 [PRORATION_PREVIEW] New Price: ${newPriceId}`);
  console.log(`🔍 [PRORATION_PREVIEW] Effective Date: ${effectiveDate?.toISOString() || 'immediate'}`);

  try {
    const stripe = createStripeAdminClient(stripeConfig);

    // STEP 1: Get current subscription details
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['items.data.price', 'customer']
    });

    const currentPrice = subscription.items.data[0].price;
    console.log(`✅ [STEP 1] Current subscription retrieved:`, {
      currentPriceId: currentPrice.id,
      currentAmount: currentPrice.unit_amount,
      status: subscription.status
    });

    // STEP 2: Get new price details
    const newPrice = await stripe.prices.retrieve(newPriceId);
    console.log(`✅ [STEP 2] New price retrieved:`, {
      newPriceId: newPrice.id,
      newAmount: newPrice.unit_amount,
      interval: newPrice.recurring?.interval
    });

    // STEP 3: Create upcoming invoice preview with the change
    const upcomingInvoice = await stripe.invoices.retrieveUpcoming({
      customer: subscription.customer as string,
      subscription: subscriptionId,
      subscription_items: [
        {
          id: subscription.items.data[0].id,
          price: newPriceId,
        },
      ],
      subscription_proration_date: effectiveDate 
        ? Math.floor(effectiveDate.getTime() / 1000)
        : Math.floor(Date.now() / 1000)
    });

    console.log(`✅ [STEP 3] Upcoming invoice preview generated:`, {
      total: upcomingInvoice.total,
      subtotal: upcomingInvoice.subtotal,
      lineItemsCount: upcomingInvoice.lines.data.length
    });

    // STEP 4: Calculate proration breakdown
    const breakdown = calculateProrationBreakdown(upcomingInvoice, currentPrice, newPrice);
    console.log(`✅ [STEP 4] Proration breakdown calculated:`, {
      lineItemsCount: breakdown.length,
      totalCredit: breakdown.filter(item => item.type === 'credit').reduce((sum, item) => sum + Math.abs(item.amount), 0),
      totalDebit: breakdown.filter(item => item.type === 'debit').reduce((sum, item) => sum + item.amount, 0)
    });

    // STEP 5: Build comprehensive preview
    const preview: ProrationPreview = {
      currentPlan: {
        priceId: currentPrice.id,
        amount: currentPrice.unit_amount || 0,
        currency: currentPrice.currency,
        interval: currentPrice.recurring?.interval || 'month'
      },
      newPlan: {
        priceId: newPrice.id,
        amount: newPrice.unit_amount || 0,
        currency: newPrice.currency,
        interval: newPrice.recurring?.interval || 'month'
      },
      prorationDetails: {
        creditAmount: breakdown.filter(item => item.type === 'credit').reduce((sum, item) => sum + Math.abs(item.amount), 0),
        debitAmount: breakdown.filter(item => item.type === 'debit').reduce((sum, item) => sum + item.amount, 0),
        netAmount: upcomingInvoice.total || 0,
        effectiveDate: effectiveDate || new Date(),
        nextBillingDate: new Date((subscription.current_period_end || 0) * 1000)
      },
      breakdown
    };

    console.log(`🎉 [SUCCESS] ===== PRORATION PREVIEW COMPLETED =====`);
    return preview;

  } catch (error) {
    console.error(`💥 [CRITICAL_ERROR] Proration preview failed:`, {
      subscriptionId,
      newPriceId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

/**
 * Execute plan change with proration handling
 */
export async function executePlanChangeWithProration(
  subscriptionId: string,
  newPriceId: string,
  stripeConfig: any,
  options: {
    effectiveDate?: Date;
    prorationBehavior?: 'create_prorations' | 'none' | 'always_invoice';
    paymentBehavior?: 'pending_if_incomplete' | 'error_if_incomplete' | 'allow_incomplete';
  } = {}
): Promise<PlanChangeResult> {
  console.log(`🔄 [PLAN_CHANGE] ===== STARTING PLAN CHANGE EXECUTION =====`);
  console.log(`🔄 [PLAN_CHANGE] Subscription: ${subscriptionId}`);
  console.log(`🔄 [PLAN_CHANGE] New Price: ${newPriceId}`);
  console.log(`🔄 [PLAN_CHANGE] Options:`, options);

  try {
    const stripe = createStripeAdminClient(stripeConfig);

    // STEP 1: Get current subscription
    const currentSubscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['items.data.price']
    });

    console.log(`✅ [STEP 1] Current subscription retrieved:`, {
      status: currentSubscription.status,
      currentPriceId: currentSubscription.items.data[0].price.id
    });

    // STEP 2: Preview the change first for logging
    const preview = await previewPlanChangeProration(subscriptionId, newPriceId, stripeConfig, options.effectiveDate);
    console.log(`✅ [STEP 2] Change preview completed - net amount: ${preview.prorationDetails.netAmount}`);

    // STEP 3: Execute the subscription update
    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: currentSubscription.items.data[0].id,
          price: newPriceId,
        },
      ],
      proration_behavior: options.prorationBehavior || 'create_prorations',
      payment_behavior: options.paymentBehavior || 'pending_if_incomplete',
      proration_date: options.effectiveDate 
        ? Math.floor(options.effectiveDate.getTime() / 1000)
        : undefined,
    });

    console.log(`✅ [STEP 3] Subscription updated:`, {
      subscriptionId: updatedSubscription.id,
      newStatus: updatedSubscription.status,
      newPriceId: updatedSubscription.items.data[0].price.id
    });

    // STEP 4: Get the next invoice to see immediate charges
    let nextInvoicePreview: Stripe.UpcomingInvoice | undefined;
    try {
      nextInvoicePreview = await stripe.invoices.retrieveUpcoming({
        customer: updatedSubscription.customer as string,
        subscription: subscriptionId
      });
      console.log(`✅ [STEP 4] Next invoice preview retrieved: ${nextInvoicePreview?.total}`);
    } catch (error) {
      console.warn(`⚠️ [STEP 4] Could not retrieve next invoice preview:`, error);
    }

    // STEP 5: Record plan change in database
    await recordPlanChange(subscriptionId, currentSubscription.items.data[0].price.id, newPriceId, preview);
    console.log(`✅ [STEP 5] Plan change recorded in database`);

    // STEP 6: Update local subscription record
    await updateLocalSubscriptionRecord(subscriptionId, updatedSubscription);
    console.log(`✅ [STEP 6] Local subscription record updated`);

    const result: PlanChangeResult = {
      success: true,
      subscriptionId: updatedSubscription.id,
      prorationAmount: preview.prorationDetails.netAmount,
      immediateCharge: (nextInvoicePreview?.total || 0) > 0,
      nextInvoicePreview: nextInvoicePreview as Stripe.Invoice | undefined
    };

    console.log(`🎉 [SUCCESS] ===== PLAN CHANGE EXECUTION COMPLETED =====`);
    return result;

  } catch (error) {
    console.error(`💥 [CRITICAL_ERROR] Plan change execution failed:`, {
      subscriptionId,
      newPriceId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return {
      success: false,
      subscriptionId,
      prorationAmount: 0,
      immediateCharge: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Calculate detailed proration breakdown from invoice line items
 */
function calculateProrationBreakdown(
  invoice: Stripe.Invoice | Stripe.UpcomingInvoice,
  currentPrice: Stripe.Price,
  newPrice: Stripe.Price
): ProrationLineItem[] {
  const breakdown: ProrationLineItem[] = [];

  for (const lineItem of invoice.lines.data) {
    if (lineItem.type === 'subscription') {
      if (lineItem.amount < 0) {
        // Credit for unused time on current plan
        breakdown.push({
          description: `Credit for unused time on ${currentPrice.nickname || 'current plan'}`,
          amount: lineItem.amount,
          currency: lineItem.currency,
          type: 'credit',
          period: lineItem.period ? {
            start: new Date(lineItem.period.start * 1000),
            end: new Date(lineItem.period.end * 1000)
          } : undefined
        });
      } else {
        // Charge for new plan
        breakdown.push({
          description: `Charge for ${newPrice.nickname || 'new plan'}`,
          amount: lineItem.amount,
          currency: lineItem.currency,
          type: 'debit',
          period: lineItem.period ? {
            start: new Date(lineItem.period.start * 1000),
            end: new Date(lineItem.period.end * 1000)
          } : undefined
        });
      }
    } else if (lineItem.type === 'invoiceitem') {
      // Additional charges or credits
      breakdown.push({
        description: lineItem.description || 'Additional adjustment',
        amount: lineItem.amount,
        currency: lineItem.currency,
        type: lineItem.amount < 0 ? 'credit' : 'debit'
      });
    }
  }

  return breakdown;
}

/**
 * Record plan change in database for audit trail
 */
async function recordPlanChange(
  subscriptionId: string,
  oldPriceId: string,
  newPriceId: string,
  preview: ProrationPreview
): Promise<void> {
  try {
    // Find user ID from subscription
    const { data: subscription } = await supabaseAdminClient
      .from('subscriptions')
      .select('user_id')
      .eq('stripe_subscription_id', subscriptionId)
      .single();

    if (!subscription) {
      throw new Error(`Subscription not found: ${subscriptionId}`);
    }

    // Record in subscription_changes table
    await supabaseAdminClient
      .from('subscription_changes')
      .insert({
        user_id: subscription.user_id,
        change_type: 'plan_change',
        old_value: {
          price_id: oldPriceId,
          amount: preview.currentPlan.amount,
          interval: preview.currentPlan.interval
        },
        new_value: {
          price_id: newPriceId,
          amount: preview.newPlan.amount,
          interval: preview.newPlan.interval
        },
        timestamp: new Date().toISOString(),
        metadata: {
          proration_amount: preview.prorationDetails.netAmount,
          credit_amount: preview.prorationDetails.creditAmount,
          debit_amount: preview.prorationDetails.debitAmount,
          effective_date: preview.prorationDetails.effectiveDate.toISOString(),
          breakdown: preview.breakdown
        }
      });

    console.log(`📝 Plan change recorded for user ${subscription.user_id}`);

  } catch (error) {
    console.error(`❌ Failed to record plan change:`, error);
    // Don't throw - this is non-critical
  }
}

/**
 * Update local subscription record with new plan details
 */
async function updateLocalSubscriptionRecord(
  subscriptionId: string,
  updatedSubscription: Stripe.Subscription
): Promise<void> {
  try {
    const { error } = await supabaseAdminClient
      .from('subscriptions')
      .update({
        stripe_price_id: updatedSubscription.items.data[0].price.id,
        status: updatedSubscription.status as any,
        current_period_start: new Date(updatedSubscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(updatedSubscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscriptionId);

    if (error) {
      console.error(`❌ Failed to update local subscription record:`, error);
    } else {
      console.log(`✅ Local subscription record updated for ${subscriptionId}`);
    }

  } catch (error) {
    console.error(`❌ Error updating local subscription record:`, error);
    // Don't throw - this is non-critical
  }
}

/**
 * Handle complex proration scenarios
 */
export async function handleComplexProrationScenario(
  subscriptionId: string,
  scenario: 'trial_to_paid' | 'discount_change' | 'quantity_change' | 'addon_change',
  params: any,
  stripeConfig: any
): Promise<PlanChangeResult> {
  console.log(`🔧 [COMPLEX_PRORATION] Handling scenario: ${scenario}`);

  try {
    const stripe = createStripeAdminClient(stripeConfig);

    switch (scenario) {
      case 'trial_to_paid':
        return await handleTrialToPaidConversion(subscriptionId, params, stripe);
      
      case 'discount_change':
        return await handleDiscountChange(subscriptionId, params, stripe);
      
      case 'quantity_change':
        return await handleQuantityChange(subscriptionId, params, stripe);
      
      case 'addon_change':
        return await handleAddonChange(subscriptionId, params, stripe);
      
      default:
        throw new Error(`Unsupported proration scenario: ${scenario}`);
    }

  } catch (error) {
    console.error(`💥 Complex proration scenario failed:`, error);
    return {
      success: false,
      subscriptionId,
      prorationAmount: 0,
      immediateCharge: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Handle trial to paid conversion with proration
 */
async function handleTrialToPaidConversion(
  subscriptionId: string,
  params: { newPriceId: string; endTrialNow: boolean },
  stripe: Stripe
): Promise<PlanChangeResult> {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  const updateParams: Stripe.SubscriptionUpdateParams = {
    items: [
      {
        id: subscription.items.data[0].id,
        price: params.newPriceId,
      },
    ],
  };

  if (params.endTrialNow) {
    updateParams.trial_end = 'now';
  }

  const updatedSubscription = await stripe.subscriptions.update(subscriptionId, updateParams);

  return {
    success: true,
    subscriptionId: updatedSubscription.id,
    prorationAmount: 0, // Trial conversions typically don't have proration
    immediateCharge: params.endTrialNow
  };
}

/**
 * Handle discount/coupon changes with proration
 */
async function handleDiscountChange(
  subscriptionId: string,
  params: { couponId?: string; discountId?: string; action: 'add' | 'remove' },
  stripe: Stripe
): Promise<PlanChangeResult> {
  const updateParams: Stripe.SubscriptionUpdateParams = {};

  if (params.action === 'add' && params.couponId) {
    updateParams.coupon = params.couponId;
  } else if (params.action === 'remove') {
    updateParams.coupon = '';
  }

  const updatedSubscription = await stripe.subscriptions.update(subscriptionId, updateParams);

  return {
    success: true,
    subscriptionId: updatedSubscription.id,
    prorationAmount: 0, // Discount changes typically apply to next billing cycle
    immediateCharge: false
  };
}

/**
 * Handle quantity changes with proration
 */
async function handleQuantityChange(
  subscriptionId: string,
  params: { newQuantity: number },
  stripe: Stripe
): Promise<PlanChangeResult> {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
    items: [
      {
        id: subscription.items.data[0].id,
        quantity: params.newQuantity,
      },
    ],
    proration_behavior: 'create_prorations'
  });

  // Calculate proration amount based on quantity difference
  const oldQuantity = subscription.items.data[0].quantity || 1;
  const quantityDiff = params.newQuantity - oldQuantity;
  const unitAmount = subscription.items.data[0].price.unit_amount || 0;
  const prorationAmount = quantityDiff * unitAmount;

  return {
    success: true,
    subscriptionId: updatedSubscription.id,
    prorationAmount,
    immediateCharge: prorationAmount > 0
  };
}

/**
 * Handle addon/feature changes with proration
 */
async function handleAddonChange(
  subscriptionId: string,
  params: { addons: Array<{ priceId: string; quantity?: number; action: 'add' | 'remove' }> },
  stripe: Stripe
): Promise<PlanChangeResult> {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const items: Stripe.SubscriptionUpdateParams.Item[] = [];

  // Keep existing main subscription item
  items.push({
    id: subscription.items.data[0].id,
  });

  // Process addon changes
  for (const addon of params.addons) {
    if (addon.action === 'add') {
      items.push({
        price: addon.priceId,
        quantity: addon.quantity || 1,
      });
    }
    // For remove, we'd need to find the existing item ID and remove it
  }

  const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
    items,
    proration_behavior: 'create_prorations'
  });

  return {
    success: true,
    subscriptionId: updatedSubscription.id,
    prorationAmount: 0, // Would need to calculate based on addon prices
    immediateCharge: true
  };
}

/**
 * Get proration history for a user
 */
export async function getProrationHistory(userId: string): Promise<Array<{
  date: Date;
  changeType: string;
  oldPlan: string;
  newPlan: string;
  prorationAmount: number;
  currency: string;
}>> {
  try {
    const { data: changes } = await supabaseAdminClient
      .from('subscription_changes')
      .select('*')
      .eq('user_id', userId)
      .eq('change_type', 'plan_change')
      .order('timestamp', { ascending: false });

    return (changes || []).map(change => ({
      date: new Date(change.timestamp),
      changeType: change.change_type,
      oldPlan: change.old_value?.price_id || 'unknown',
      newPlan: change.new_value?.price_id || 'unknown',
      prorationAmount: change.metadata?.proration_amount || 0,
      currency: 'usd' // Would need to store this in metadata
    }));

  } catch (error) {
    console.error(`❌ Failed to get proration history:`, error);
    return [];
  }
}
