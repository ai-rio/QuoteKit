/**
 * Stripe Customer Diagnostic Script
 * 
 * Use this script to diagnose the exact state of a Stripe customer
 * and identify what went wrong with their subscription creation.
 * 
 * Usage: node scripts/stripe-customer-diagnostic.js cus_SmJryeQUw7znUm
 */

const Stripe = require('stripe');

// Initialize Stripe with your secret key
// Replace with your actual key or set STRIPE_SECRET_KEY environment variable
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_...', {
  apiVersion: '2023-10-16',
});

async function diagnoseCustomer(customerId) {
  console.log(`🔍 DIAGNOSING STRIPE CUSTOMER: ${customerId}`);
  console.log('=' * 60);
  
  try {
    // 1. Get customer details
    console.log('\n📋 1. CUSTOMER DETAILS');
    const customer = await stripe.customers.retrieve(customerId);
    console.log({
      id: customer.id,
      email: customer.email,
      created: new Date(customer.created * 1000).toISOString(),
      default_payment_method: customer.invoice_settings?.default_payment_method || 'None',
      test_mode: customer.livemode ? 'LIVE' : 'TEST'
    });

    // 2. Check subscriptions
    console.log('\n💰 2. SUBSCRIPTIONS');
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 10
    });
    
    console.log(`Found ${subscriptions.data.length} subscriptions:`);
    subscriptions.data.forEach((sub, i) => {
      console.log(`  ${i + 1}. ${sub.id} - Status: ${sub.status}`);
      console.log(`     Created: ${new Date(sub.created * 1000).toISOString()}`);
      console.log(`     Price: ${sub.items.data[0]?.price?.id || 'N/A'}`);
      if (sub.latest_invoice) {
        console.log(`     Latest Invoice: ${sub.latest_invoice}`);
      }
      console.log('');
    });

    // 3. Check payment methods
    console.log('\n💳 3. PAYMENT METHODS');
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card'
    });
    
    console.log(`Found ${paymentMethods.data.length} payment methods:`);
    paymentMethods.data.forEach((pm, i) => {
      console.log(`  ${i + 1}. ${pm.id} - ${pm.card?.brand} ****${pm.card?.last4}`);
      console.log(`     Created: ${new Date(pm.created * 1000).toISOString()}`);
    });

    // 4. Check recent checkout sessions
    console.log('\n🛒 4. RECENT CHECKOUT SESSIONS');
    const checkoutSessions = await stripe.checkout.sessions.list({
      customer: customerId,
      limit: 10
    });
    
    console.log(`Found ${checkoutSessions.data.length} checkout sessions:`);
    checkoutSessions.data.forEach((session, i) => {
      console.log(`  ${i + 1}. ${session.id}`);
      console.log(`     Status: ${session.status}`);
      console.log(`     Payment Status: ${session.payment_status}`);
      console.log(`     Mode: ${session.mode}`);
      console.log(`     Created: ${new Date(session.created * 1000).toISOString()}`);
      console.log(`     Subscription: ${session.subscription || 'None'}`);
      console.log(`     URL: ${session.url || 'Expired'}`);
      console.log('');
    });

    // 5. Check recent payment intents
    console.log('\n💸 5. RECENT PAYMENT INTENTS');
    const paymentIntents = await stripe.paymentIntents.list({
      customer: customerId,
      limit: 5
    });
    
    console.log(`Found ${paymentIntents.data.length} payment intents:`);
    paymentIntents.data.forEach((pi, i) => {
      console.log(`  ${i + 1}. ${pi.id} - Status: ${pi.status}`);
      console.log(`     Amount: ${pi.amount} ${pi.currency}`);
      console.log(`     Created: ${new Date(pi.created * 1000).toISOString()}`);
      if (pi.last_payment_error) {
        console.log(`     ❌ Error: ${pi.last_payment_error.message}`);
      }
      console.log('');
    });

    // 6. Check recent invoices
    console.log('\n📄 6. RECENT INVOICES');
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit: 5
    });
    
    console.log(`Found ${invoices.data.length} invoices:`);
    invoices.data.forEach((invoice, i) => {
      console.log(`  ${i + 1}. ${invoice.id} - Status: ${invoice.status}`);
      console.log(`     Amount: ${invoice.amount_paid}/${invoice.total} ${invoice.currency}`);
      console.log(`     Created: ${new Date(invoice.created * 1000).toISOString()}`);
      if (invoice.subscription) {
        console.log(`     Subscription: ${invoice.subscription}`);
      }
      console.log('');
    });

    // 7. Check recent events for this customer
    console.log('\n📊 7. RECENT EVENTS');
    const events = await stripe.events.list({
      limit: 20,
      types: [
        'checkout.session.completed',
        'customer.subscription.created',
        'customer.subscription.updated',
        'invoice.payment_succeeded',
        'invoice.payment_failed',
        'payment_method.attached'
      ]
    });
    
    const customerEvents = events.data.filter(event => {
      const obj = event.data.object;
      return obj.customer === customerId || 
             (obj.subscription && subscriptions.data.some(s => s.id === obj.subscription));
    });
    
    console.log(`Found ${customerEvents.length} relevant events:`);
    customerEvents.forEach((event, i) => {
      console.log(`  ${i + 1}. ${event.type} (${event.id})`);
      console.log(`     Created: ${new Date(event.created * 1000).toISOString()}`);
      console.log(`     Test Mode: ${event.livemode ? 'LIVE' : 'TEST'}`);
      
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        console.log(`     Session: ${session.id}`);
        console.log(`     Payment Status: ${session.payment_status}`);
        console.log(`     Subscription: ${session.subscription || 'None'}`);
      }
      console.log('');
    });

    // 8. Analysis and recommendations
    console.log('\n🔍 8. ANALYSIS & RECOMMENDATIONS');
    
    if (subscriptions.data.length === 0) {
      console.log('❌ ISSUE: Customer has no subscriptions');
      
      if (checkoutSessions.data.length > 0) {
        const latestSession = checkoutSessions.data[0];
        console.log('🔍 Latest checkout session analysis:');
        console.log(`   - Status: ${latestSession.status}`);
        console.log(`   - Payment Status: ${latestSession.payment_status}`);
        
        if (latestSession.status === 'open') {
          console.log('   ⚠️  Session is still open - user may not have completed payment');
        } else if (latestSession.payment_status === 'unpaid') {
          console.log('   ❌ Payment was not completed');
        } else if (latestSession.payment_status === 'paid' && !latestSession.subscription) {
          console.log('   🚨 CRITICAL: Payment completed but no subscription created!');
          console.log('   💡 Check webhook processing for checkout.session.completed');
        }
      }
      
      if (paymentMethods.data.length === 0) {
        console.log('💡 RECOMMENDATION: User needs to add a payment method');
      }
      
      console.log('💡 RECOMMENDED ACTIONS:');
      console.log('   1. Check webhook endpoint configuration');
      console.log('   2. Verify checkout.session.completed events are being processed');
      console.log('   3. Run manual subscription sync if payment was completed');
      console.log('   4. Have user retry checkout process if payment failed');
    }

    console.log('\n' + '=' * 60);
    console.log('✅ DIAGNOSIS COMPLETE');
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error.message);
    
    if (error.code === 'resource_missing') {
      console.log('💡 Customer ID not found. Check if ID is correct and in the right mode (test vs live)');
    }
  }
}

// Get customer ID from command line argument
const customerId = process.argv[2];

if (!customerId) {
  console.log('❌ Usage: node stripe-customer-diagnostic.js <customer_id>');
  console.log('Example: node stripe-customer-diagnostic.js cus_SmJryeQUw7znUm');
  process.exit(1);
}

// Run the diagnostic
diagnoseCustomer(customerId).catch(console.error);