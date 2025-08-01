/**
 * Billing System Analysis
 * Run this to understand the current billing setup and determine the fix approach
 */

console.log('🔍 Analyzing Billing System Setup...');

async function analyzeBillingSystem() {
  console.log('\n=== 1. Environment Analysis ===');
  
  // Check if this is development or production
  const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname.includes('127.0.0.1');
  const currentUrl = window.location.href;
  
  console.log('🌍 Environment Info:', {
    isDevelopment,
    hostname: window.location.hostname,
    currentUrl,
    isLocalhost: window.location.hostname === 'localhost'
  });

  console.log('\n=== 2. Subscription Data Analysis ===');
  
  // Get subscription status
  try {
    const subscriptionResponse = await fetch('/api/subscription-status', {
      method: 'GET',
      cache: 'no-store'
    });
    
    const subscriptionData = await subscriptionResponse.json();
    
    if (subscriptionData.success) {
      const status = subscriptionData.status;
      
      console.log('📊 Subscription Analysis:', {
        hasStripeCustomer: status?.customer?.hasStripeCustomer,
        stripeCustomerId: status?.customer?.stripeCustomerId,
        subscriptionCount: status?.subscriptions?.count,
        activeSubscriptions: status?.subscriptions?.active?.length || 0,
        allSubscriptions: status?.subscriptions?.all?.length || 0
      });
      
      // Analyze subscription details
      if (status?.subscriptions?.all?.length > 0) {
        console.log('\n📋 Subscription Details:');
        status.subscriptions.all.forEach((sub, index) => {
          console.log(`   Subscription ${index + 1}:`, {
            id: sub.id,
            status: sub.status,
            priceId: sub.priceId,
            hasStripeSubscriptionId: !!sub.stripe_subscription_id,
            created: sub.created,
            isStripeManaged: sub.id?.startsWith('sub_') && sub.id.length > 20 // Stripe IDs are longer
          });
        });
      }
    }
  } catch (error) {
    console.error('💥 Subscription analysis failed:', error);
  }

  console.log('\n=== 3. Billing History Analysis ===');
  
  // Get billing history
  try {
    const billingResponse = await fetch('/api/billing-history', {
      method: 'GET',
      cache: 'no-store'
    });
    
    const billingData = await billingResponse.json();
    
    if (billingData.success) {
      console.log('📊 Billing History Analysis:', {
        totalRecords: billingData.data.length,
        recordTypes: billingData.data.map(r => ({
          id: r.id,
          idType: r.id.startsWith('in_') ? 'stripe-invoice' : 
                  r.id.startsWith('sub_') ? 'local-subscription' : 'unknown',
          hasValidInvoiceUrl: r.invoice_url && r.invoice_url !== '#',
          invoiceUrl: r.invoice_url,
          description: r.description
        }))
      });
      
      // Count record types
      const stripeInvoices = billingData.data.filter(r => r.id.startsWith('in_'));
      const localSubscriptions = billingData.data.filter(r => r.id.startsWith('sub_'));
      const validInvoiceUrls = billingData.data.filter(r => r.invoice_url && r.invoice_url !== '#');
      
      console.log('\n📈 Record Type Summary:', {
        stripeInvoices: stripeInvoices.length,
        localSubscriptions: localSubscriptions.length,
        validInvoiceUrls: validInvoiceUrls.length,
        placeholderUrls: billingData.data.length - validInvoiceUrls.length
      });
    }
  } catch (error) {
    console.error('💥 Billing history analysis failed:', error);
  }

  console.log('\n=== 4. Stripe Integration Check ===');
  
  // Check if Stripe is properly configured
  console.log('🔍 Checking Stripe configuration...');
  
  // Look for Stripe-related elements or scripts
  const stripeScripts = Array.from(document.querySelectorAll('script')).filter(script => 
    script.src?.includes('stripe') || script.innerHTML?.includes('stripe')
  );
  
  const stripeElements = Array.from(document.querySelectorAll('*')).filter(el => 
    el.className?.toLowerCase().includes('stripe') || 
    el.id?.toLowerCase().includes('stripe')
  );
  
  console.log('🔍 Stripe Frontend Integration:', {
    stripeScripts: stripeScripts.length,
    stripeElements: stripeElements.length,
    hasStripeInPage: stripeScripts.length > 0 || stripeElements.length > 0
  });

  console.log('\n=== 5. Diagnosis & Recommendations ===');
  
  // Determine the billing system type and recommend fixes
  const diagnosis = {
    systemType: 'unknown',
    issues: [],
    recommendations: []
  };
  
  // Analyze the system type
  if (isDevelopment) {
    diagnosis.systemType = 'development';
    diagnosis.issues.push('Development environment with local subscription records');
    diagnosis.recommendations.push('Consider using Stripe test mode with real test invoices');
  }
  
  // Check for missing Stripe integration
  const hasStripeCustomer = subscriptionData?.status?.customer?.hasStripeCustomer;
  if (!hasStripeCustomer) {
    diagnosis.issues.push('No Stripe customer record for user with subscriptions');
    diagnosis.recommendations.push('Create Stripe customer and sync existing subscriptions');
  }
  
  // Check for placeholder invoice URLs
  const billingData = await fetch('/api/billing-history').then(r => r.json()).catch(() => null);
  const hasPlaceholderUrls = billingData?.data?.some(r => r.invoice_url === '#');
  if (hasPlaceholderUrls) {
    diagnosis.issues.push('Billing records have placeholder invoice URLs');
    diagnosis.recommendations.push('Generate proper invoice URLs from Stripe or disable download for non-invoice records');
  }
  
  console.log('🎯 System Diagnosis:', diagnosis);
  
  console.log('\n=== 6. Recommended Fix Approach ===');
  
  if (isDevelopment && !hasStripeCustomer) {
    console.log('🔧 RECOMMENDED APPROACH: Development Environment Fix');
    console.log('1. Create a Stripe test customer for the user');
    console.log('2. Generate test invoices for existing subscriptions');
    console.log('3. Update billing history to use real Stripe invoice URLs');
    console.log('4. Test the download functionality with real Stripe invoices');
  } else if (!hasStripeCustomer) {
    console.log('🔧 RECOMMENDED APPROACH: Production Environment Fix');
    console.log('1. Migrate existing users to Stripe customers');
    console.log('2. Create invoices for past subscription changes');
    console.log('3. Update billing history generation logic');
  } else {
    console.log('🔧 RECOMMENDED APPROACH: Invoice Generation Fix');
    console.log('1. Fix the billing history API to generate proper invoice URLs');
    console.log('2. Ensure Stripe invoices are created for subscription changes');
    console.log('3. Test the API route after server restart');
  }
  
  console.log('\n✅ Billing System Analysis Complete!');
}

// Run the analysis
analyzeBillingSystem().catch(error => {
  console.error('💥 Billing system analysis failed:', error);
});

console.log('\n🔧 This analysis will help determine the best fix approach for the invoice download issue.');
