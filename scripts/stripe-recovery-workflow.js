/**
 * Stripe Recovery Workflow Script
 * 
 * This script helps recover users who have incomplete or failed subscription flows.
 * It can either create a new checkout session or manually create a subscription
 * if payment was completed but webhook processing failed.
 * 
 * Usage: 
 * node scripts/stripe-recovery-workflow.js cus_SmJryeQUw7znUm recovery
 * node scripts/stripe-recovery-workflow.js cus_SmJryeQUw7znUm checkout price_1234567890
 */

const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_...', {
  apiVersion: '2023-10-16',
});

async function recoverCustomerSubscription(customerId, action, priceId = null) {
  console.log(`🔧 STARTING RECOVERY FOR CUSTOMER: ${customerId}`);
  console.log('=' * 60);
  
  try {
    // First, get customer details
    console.log('\n📋 Getting customer details...');
    const customer = await stripe.customers.retrieve(customerId);
    console.log(`Customer: ${customer.email} (${customer.id})`);
    
    // Check existing subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all'
    });
    
    console.log(`Found ${subscriptions.data.length} existing subscriptions`);
    
    if (action === 'recovery') {
      // Analyze the situation and provide recovery options
      console.log('\n🔍 ANALYZING RECOVERY OPTIONS...');
      
      const checkoutSessions = await stripe.checkout.sessions.list({
        customer: customerId,
        limit: 5
      });
      
      const paymentIntents = await stripe.paymentIntents.list({
        customer: customerId,
        limit: 5
      });
      
      // Check if there are any completed payments without subscriptions
      const completedPayments = paymentIntents.data.filter(pi => 
        pi.status === 'succeeded' && 
        pi.invoice === null // Not associated with a subscription invoice
      );
      
      if (completedPayments.length > 0) {
        console.log('🚨 FOUND COMPLETED PAYMENTS WITHOUT SUBSCRIPTIONS:');
        completedPayments.forEach((pi, i) => {
          console.log(`  ${i + 1}. ${pi.id} - ${pi.amount} ${pi.currency}`);
          console.log(`     Created: ${new Date(pi.created * 1000).toISOString()}`);
          
          // Try to find associated checkout session
          const associatedSession = checkoutSessions.data.find(session => 
            session.payment_intent === pi.id
          );
          
          if (associatedSession) {
            console.log(`     Checkout Session: ${associatedSession.id}`);
            console.log(`     Mode: ${associatedSession.mode}`);
            if (associatedSession.mode === 'subscription' && !associatedSession.subscription) {
              console.log('     🚨 CRITICAL: Subscription mode but no subscription created!');
            }
          }
        });
        
        console.log('\n💡 RECOVERY RECOMMENDATION:');
        console.log('   Payment completed but subscription not created.');
        console.log('   This suggests webhook processing failed.');
        console.log('   Actions:');
        console.log('   1. Check webhook logs in Stripe dashboard');
        console.log('   2. Manually trigger subscription creation');
        console.log('   3. Or refund and have user retry');
      }
      
      // Check for incomplete checkout sessions
      const incompleteCheckouts = checkoutSessions.data.filter(session =>
        session.status === 'open' || session.payment_status === 'unpaid'
      );
      
      if (incompleteCheckouts.length > 0) {
        console.log('\n⏰ FOUND INCOMPLETE CHECKOUT SESSIONS:');
        incompleteCheckouts.forEach((session, i) => {
          console.log(`  ${i + 1}. ${session.id}`);
          console.log(`     Status: ${session.status}`);
          console.log(`     Payment Status: ${session.payment_status}`);
          console.log(`     Created: ${new Date(session.created * 1000).toISOString()}`);
          console.log(`     URL: ${session.url || 'Expired'}`);
        });
        
        console.log('\n💡 RECOVERY RECOMMENDATION:');
        console.log('   User started but did not complete checkout.');
        console.log('   Actions:');
        console.log('   1. Send reminder email with checkout link');
        console.log('   2. Create new checkout session');
        console.log('   3. Contact user for assistance');
      }
      
      // Check for payment method issues
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: 'card'
      });
      
      if (paymentMethods.data.length === 0) {
        console.log('\n💳 NO PAYMENT METHODS FOUND');
        console.log('💡 RECOVERY RECOMMENDATION:');
        console.log('   User needs to add a payment method before subscribing.');
        console.log('   Actions:');
        console.log('   1. Direct user to add payment method');
        console.log('   2. Create setup intent for payment method collection');
      }
      
    } else if (action === 'checkout' && priceId) {
      // Create a new checkout session for recovery
      console.log(`\n🛒 CREATING NEW CHECKOUT SESSION FOR PRICE: ${priceId}`);
      
      // First verify the price exists
      const price = await stripe.prices.retrieve(priceId);
      console.log(`Price: ${price.id} - ${price.unit_amount} ${price.currency}`);
      
      const checkoutSession = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        billing_address_collection: 'required',
        line_items: [{
          price: priceId,
          quantity: 1,
        }],
        mode: price.recurring ? 'subscription' : 'payment',
        success_url: 'https://your-domain.com/success?session_id={CHECKOUT_SESSION_ID}',
        cancel_url: 'https://your-domain.com/cancel',
        allow_promotion_codes: true,
      });
      
      console.log('✅ NEW CHECKOUT SESSION CREATED:');
      console.log(`   Session ID: ${checkoutSession.id}`);
      console.log(`   URL: ${checkoutSession.url}`);
      console.log(`   Expires: ${new Date(checkoutSession.expires_at * 1000).toISOString()}`);
      
      console.log('\n💡 NEXT STEPS:');
      console.log('   1. Send this URL to the user');
      console.log('   2. Monitor for checkout.session.completed webhook');
      console.log('   3. Verify subscription creation after payment');
      
    } else if (action === 'manual_subscription' && priceId) {
      // Manually create subscription (use carefully!)
      console.log(`\n⚠️  MANUALLY CREATING SUBSCRIPTION FOR PRICE: ${priceId}`);
      console.log('WARNING: Only use this if you\'re certain payment was completed!');
      
      // Check if customer has a payment method
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: 'card'
      });
      
      if (paymentMethods.data.length === 0) {
        console.log('❌ Cannot create subscription: No payment methods found');
        return;
      }
      
      // Set default payment method if not set
      if (!customer.invoice_settings?.default_payment_method) {
        await stripe.customers.update(customerId, {
          invoice_settings: {
            default_payment_method: paymentMethods.data[0].id
          }
        });
        console.log(`Set default payment method: ${paymentMethods.data[0].id}`);
      }
      
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{
          price: priceId
        }],
        payment_behavior: 'default_incomplete',
        payment_settings: {
          save_default_payment_method: 'on_subscription'
        },
        expand: ['latest_invoice.payment_intent']
      });
      
      console.log('✅ SUBSCRIPTION CREATED:');
      console.log(`   Subscription ID: ${subscription.id}`);
      console.log(`   Status: ${subscription.status}`);
      console.log(`   Latest Invoice: ${subscription.latest_invoice?.id}`);
      
      // If subscription needs payment confirmation
      if (subscription.status === 'incomplete') {
        const invoice = subscription.latest_invoice;
        const paymentIntent = invoice.payment_intent;
        
        console.log('\n💳 PAYMENT CONFIRMATION NEEDED:');
        console.log(`   Payment Intent: ${paymentIntent.id}`);
        console.log(`   Status: ${paymentIntent.status}`);
        console.log(`   Client Secret: ${paymentIntent.client_secret}`);
        
        console.log('\n💡 NEXT STEPS:');
        console.log('   1. Use client secret to confirm payment on frontend');
        console.log('   2. Or manually confirm payment intent in Stripe dashboard');
      }
      
    } else {
      console.log('\n❌ INVALID ACTION');
      console.log('Valid actions:');
      console.log('  recovery - Analyze and recommend recovery options');
      console.log('  checkout <price_id> - Create new checkout session');
      console.log('  manual_subscription <price_id> - Manually create subscription (CAUTION)');
    }
    
    console.log('\n' + '=' * 60);
    console.log('✅ RECOVERY WORKFLOW COMPLETE');
    
  } catch (error) {
    console.error('❌ Recovery failed:', error.message);
    
    if (error.code === 'resource_missing') {
      console.log('💡 Resource not found. Check IDs and test/live mode settings.');
    }
  }
}

// Parse command line arguments
const [,, customerId, action, priceId] = process.argv;

if (!customerId || !action) {
  console.log('❌ Usage: node stripe-recovery-workflow.js <customer_id> <action> [price_id]');
  console.log('');
  console.log('Actions:');
  console.log('  recovery - Analyze and recommend recovery options');
  console.log('  checkout <price_id> - Create new checkout session');
  console.log('  manual_subscription <price_id> - Manually create subscription');
  console.log('');
  console.log('Examples:');
  console.log('  node stripe-recovery-workflow.js cus_SmJryeQUw7znUm recovery');
  console.log('  node stripe-recovery-workflow.js cus_SmJryeQUw7znUm checkout price_1234567890');
  process.exit(1);
}

// Run the recovery workflow
recoverCustomerSubscription(customerId, action, priceId).catch(console.error);