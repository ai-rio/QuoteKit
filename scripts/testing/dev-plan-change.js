#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

async function createDevSubscription(userId, priceId) {
  console.log('🧪 Creating Development Subscription');
  console.log('===================================');

  const supabase = createClient(
    'http://127.0.0.1:54321',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
  );

  try {
    // Get the price details
    const { data: price, error: priceError } = await supabase
      .from('stripe_prices')
      .select('*')
      .eq('id', priceId)
      .single();

    if (priceError || !price) {
      console.error('❌ Price not found:', priceId);
      return;
    }

    console.log('✅ Price found:', {
      id: price.id,
      amount: price.unit_amount,
      interval: price.interval,
      product: price.stripe_product_id
    });

    // Create a development subscription record
    const devSubscription = {
      id: `sub_dev_${Date.now()}`, // Development subscription ID
      user_id: userId,
      status: 'active',
      stripe_price_id: priceId, // This will sync with id via trigger
      price_id: priceId,
      quantity: 1,
      cancel_at_period_end: false,
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      created: new Date().toISOString(),
      trial_start: null,
      trial_end: null
    };

    // Insert the subscription
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .insert(devSubscription)
      .select()
      .single();

    if (subError) {
      console.error('❌ Failed to create subscription:', subError);
      return;
    }

    console.log('✅ Development subscription created:', {
      id: subscription.id,
      user_id: subscription.user_id,
      status: subscription.status,
      price_id: subscription.price_id
    });

    console.log('🎉 Plan change simulation complete!');
    console.log('The user now has an active subscription to:', priceId);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Example usage - you can call this with actual user ID and price ID
if (process.argv.length > 3) {
  const userId = process.argv[2];
  const priceId = process.argv[3];
  createDevSubscription(userId, priceId);
} else {
  console.log('Usage: node dev-plan-change.js <userId> <priceId>');
  console.log('Example: node dev-plan-change.js "user-uuid" "price_pro_monthly"');
}
