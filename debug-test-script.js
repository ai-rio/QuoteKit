/**
 * Comprehensive Debug Test Script
 * Run this in the browser console to test the entire payment flow
 */

console.log('🚀 Starting comprehensive debug test...');

async function debugPaymentFlow() {
  console.log('\n=== 1. Testing Payment Methods API ===');
  
  try {
    const paymentMethodsResponse = await fetch('/api/payment-methods', {
      method: 'GET',
      cache: 'no-store'
    });
    
    const paymentMethodsData = await paymentMethodsResponse.json();
    console.log('📊 Payment Methods API Response:', paymentMethodsData);
    
    if (paymentMethodsData.success) {
      console.log(`✅ Found ${paymentMethodsData.data.length} payment methods`);
      paymentMethodsData.data.forEach((pm, index) => {
        console.log(`   ${index + 1}. ${pm.card?.brand} ****${pm.card?.last4} (${pm.is_default ? 'DEFAULT' : 'not default'})`);
      });
    } else {
      console.error('❌ Payment Methods API failed:', paymentMethodsData.error);
    }
  } catch (error) {
    console.error('💥 Payment Methods API error:', error);
  }

  console.log('\n=== 2. Testing Billing History API ===');
  
  try {
    const billingResponse = await fetch('/api/billing-history', {
      method: 'GET',
      cache: 'no-store'
    });
    
    const billingData = await billingResponse.json();
    console.log('📊 Billing History API Response:', billingData);
    
    if (billingData.success) {
      console.log(`✅ Found ${billingData.data.length} billing records`);
    } else {
      console.error('❌ Billing History API failed:', billingData.error);
    }
  } catch (error) {
    console.error('💥 Billing History API error:', error);
  }

  console.log('\n=== 3. Testing Subscription Status ===');
  
  try {
    const subscriptionResponse = await fetch('/api/subscription-status', {
      method: 'GET',
      cache: 'no-store'
    });
    
    const subscriptionData = await subscriptionResponse.json();
    console.log('📊 Subscription Status API Response:', subscriptionData);
    
    if (subscriptionData.success) {
      console.log('✅ Subscription status retrieved');
      
      // Get the active subscription (first one if multiple)
      const activeSubscription = subscriptionData.status?.subscriptions?.active?.[0];
      const customerInfo = subscriptionData.status?.customer;
      
      // Extract plan information from price_id
      const priceId = activeSubscription?.stripe_price_id || subscriptionData.status?.subscriptions?.all?.[0]?.priceId;
      let planName = 'Unknown Plan';
      if (priceId) {
        if (priceId.includes('free')) planName = 'Free Plan';
        else if (priceId.includes('basic')) planName = 'Basic Plan';
        else if (priceId.includes('pro')) planName = 'Pro Plan';
        else if (priceId.includes('premium')) planName = 'Premium Plan';
        else planName = `Plan (${priceId})`;
      }
      
      console.log('   Current Plan:', planName);
      console.log('   Status:', activeSubscription?.status || subscriptionData.status?.subscriptions?.all?.[0]?.status || 'Unknown');
      console.log('   Stripe Customer ID:', customerInfo?.stripeCustomerId ? customerInfo.stripeCustomerId.substring(0, 8) + '...' : 'Missing');
      console.log('   Stripe Subscription ID:', activeSubscription?.stripe_subscription_id ? activeSubscription.stripe_subscription_id.substring(0, 8) + '...' : 'Missing');
      console.log('   Subscription Count:', subscriptionData.status?.subscriptions?.count || 0);
      console.log('   Has Stripe Customer:', customerInfo?.hasStripeCustomer || false);
      
      // Show diagnostics if any
      if (subscriptionData.diagnostics?.length > 0) {
        console.log('   Diagnostics:');
        subscriptionData.diagnostics.forEach(diag => {
          console.log(`     ${diag.level.toUpperCase()}: ${diag.issue} - ${diag.description}`);
        });
      }
    } else {
      console.error('❌ Subscription Status API failed:', subscriptionData.error);
    }
  } catch (error) {
    console.error('💥 Subscription Status API error:', error);
  }

  console.log('\n=== 4. Environment Check ===');
  
  console.log('🌍 Client Environment:', {
    userAgent: navigator.userAgent,
    url: window.location.href,
    timestamp: new Date().toISOString(),
    authentication: {
      hasSupabaseSessionInLocalStorage: !!localStorage.getItem('sb-127.0.0.1:54321-auth-token') || !!localStorage.getItem('supabase.auth.token'),
      hasSupabaseSessionInCookies: document.cookie.includes('sb-127-auth-token') || document.cookie.includes('supabase-auth-token'),
      cookieBasedAuth: document.cookie.split(';').filter(c => c.includes('sb-') || c.includes('supabase')).length > 0,
      totalCookies: document.cookie.split(';').length
    }
  });

  console.log('\n=== 5. DOM Elements Check ===');
  
  // Find plan change button using valid selectors
  const planChangeButton = document.querySelector('[data-testid="change-plan-button"]') || 
                          document.querySelector('[aria-label*="Change"]') ||
                          document.querySelector('[aria-label*="Plan"]');
  
  // If not found by attributes, search by text content
  let buttonFoundByText = null;
  if (!planChangeButton) {
    const allButtons = Array.from(document.querySelectorAll('button'));
    buttonFoundByText = allButtons.find(btn => {
      const text = btn.textContent?.toLowerCase() || '';
      return text.includes('change') || text.includes('upgrade') || text.includes('plan');
    });
  }
  
  const foundButton = planChangeButton || buttonFoundByText;
  
  console.log('🔍 Plan Change Button:', {
    found: !!foundButton,
    foundBy: planChangeButton ? 'attribute' : buttonFoundByText ? 'text-content' : 'none',
    text: foundButton?.textContent?.trim(),
    disabled: foundButton?.disabled,
    visible: foundButton ? window.getComputedStyle(foundButton).display !== 'none' : false,
    className: foundButton?.className,
    id: foundButton?.id
  });

  // Additional UI elements check
  const uiElements = {
    paymentMethodsSection: document.querySelector('[data-testid*="payment"]') || 
                          document.querySelector('.payment-methods') ||
                          document.querySelector('[class*="payment"]'),
    subscriptionSection: document.querySelector('[data-testid*="subscription"]') || 
                        document.querySelector('.subscription') ||
                        document.querySelector('[class*="subscription"]'),
    accountPage: document.querySelector('[data-testid="account"]') || 
                document.querySelector('.account-page') ||
                document.querySelector('main')
  };

  console.log('🔍 UI Elements:', {
    paymentMethodsSection: !!uiElements.paymentMethodsSection,
    subscriptionSection: !!uiElements.subscriptionSection,
    accountPage: !!uiElements.accountPage,
    totalButtons: document.querySelectorAll('button').length,
    totalForms: document.querySelectorAll('form').length
  });

  console.log('\n✅ Debug test completed! Check the logs above for issues.');
}

// Run the debug test
debugPaymentFlow().catch(error => {
  console.error('💥 Debug test failed:', error);
});

// Helper function to manually trigger plan change dialog
window.debugOpenPlanDialog = function() {
  console.log('🔧 Attempting to open plan change dialog...');
  
  // Try to find the change plan button using multiple methods
  let planButton = document.querySelector('[data-testid="change-plan-button"]') || 
                   document.querySelector('[aria-label*="Change"]') ||
                   document.querySelector('[aria-label*="Plan"]');
  
  // If not found by attributes, search by text content
  if (!planButton) {
    const buttons = Array.from(document.querySelectorAll('button'));
    planButton = buttons.find(btn => {
      const text = btn.textContent?.toLowerCase() || '';
      return text.includes('change') || 
             text.includes('upgrade') || 
             text.includes('plan') ||
             text.includes('modify') ||
             text.includes('switch');
    });
  }
  
  if (planButton) {
    console.log('✅ Found plan button:', {
      text: planButton.textContent?.trim(),
      disabled: planButton.disabled,
      visible: window.getComputedStyle(planButton).display !== 'none'
    });
    
    if (planButton.disabled) {
      console.log('⚠️ Button is disabled');
    } else if (window.getComputedStyle(planButton).display === 'none') {
      console.log('⚠️ Button is hidden');
    } else {
      console.log('🖱️ Clicking button...');
      planButton.click();
    }
  } else {
    console.error('❌ Could not find plan change button');
    
    // Show available buttons for debugging
    const allButtons = Array.from(document.querySelectorAll('button'));
    console.log('🔍 Available buttons:', allButtons.map(btn => ({
      text: btn.textContent?.trim(),
      className: btn.className,
      id: btn.id,
      disabled: btn.disabled
    })).filter(btn => btn.text));
  }
};

console.log('\n🔧 Helper functions available:');
console.log('   debugOpenPlanDialog() - Manually open plan change dialog');
console.log('   Run this script again anytime with: debugPaymentFlow()');
