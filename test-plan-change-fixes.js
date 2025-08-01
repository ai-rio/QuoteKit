/**
 * Test script to verify plan change dialog and billing refresh fixes
 */

console.log('🧪 Testing plan change dialog and billing refresh fixes...');

async function testPlanChangeFixes() {
  console.log('\n=== 1. Payment Methods API Test ===');
  
  try {
    const response = await fetch('/api/payment-methods', {
      method: 'GET',
      cache: 'no-store'
    });
    
    const data = await response.json();
    console.log('📊 Payment Methods API Response:', data);
    
    if (data.success) {
      console.log('✅ Payment methods API working correctly');
      console.log(`   Found ${data.data.length} payment methods`);
      
      if (data.data.length > 0) {
        console.log('   Payment methods available for plan upgrades');
        data.data.forEach((pm, index) => {
          console.log(`     ${index + 1}. ${pm.card?.brand || pm.brand} ****${pm.card?.last4 || pm.last4} (${pm.is_default ? 'DEFAULT' : 'not default'})`);
        });
      } else {
        console.log('   No payment methods found - users will see "Add Payment Method" option');
      }
    } else {
      console.error('❌ Payment methods API failed:', data.error);
    }
  } catch (error) {
    console.error('💥 Payment methods API error:', error);
  }

  console.log('\n=== 2. Plan Change Button Detection ===');
  
  // Look for plan change/upgrade buttons
  const buttons = Array.from(document.querySelectorAll('button'));
  const planButtons = buttons.filter(btn => {
    const text = btn.textContent?.toLowerCase() || '';
    return text.includes('change') || text.includes('upgrade') || text.includes('plan');
  });
  
  console.log('🔍 Plan-related buttons found:', {
    count: planButtons.length,
    buttons: planButtons.map(btn => ({
      text: btn.textContent?.trim(),
      disabled: btn.disabled,
      visible: window.getComputedStyle(btn).display !== 'none'
    }))
  });

  console.log('\n=== 3. Billing History Refresh Events Test ===');
  
  // Set up event listeners to test billing refresh
  let eventsCaught = [];
  
  const eventTypes = [
    'plan-change-completed',
    'billing-history-updated', 
    'invalidate-billing-history'
  ];
  
  eventTypes.forEach(eventType => {
    window.addEventListener(eventType, (event) => {
      eventsCaught.push({
        type: eventType,
        timestamp: new Date().toISOString(),
        detail: event.detail || null
      });
      console.log(`📡 Caught event: ${eventType}`, event.detail || '(no detail)');
    });
  });
  
  console.log('✅ Event listeners set up for billing refresh testing');
  console.log('   Listening for:', eventTypes.join(', '));
  
  // Test manual event dispatch
  console.log('\n=== 4. Manual Event Dispatch Test ===');
  
  console.log('🧪 Dispatching test billing refresh events...');
  window.dispatchEvent(new CustomEvent('billing-history-updated'));
  window.dispatchEvent(new CustomEvent('invalidate-billing-history'));
  
  // Wait a moment for events to be processed
  await new Promise(resolve => setTimeout(resolve, 100));
  
  console.log('📊 Events caught during test:', {
    count: eventsCaught.length,
    events: eventsCaught
  });

  console.log('\n=== 5. Billing History Refresh Button Test ===');
  
  // Look for billing history refresh button
  const refreshButtons = buttons.filter(btn => {
    const hasRefreshIcon = btn.querySelector('svg') && 
                          (btn.innerHTML.includes('RefreshCw') || 
                           btn.querySelector('[data-lucide="refresh-cw"]'));
    return hasRefreshIcon;
  });
  
  console.log('🔍 Refresh buttons found:', {
    count: refreshButtons.length,
    buttons: refreshButtons.map(btn => ({
      text: btn.textContent?.trim(),
      disabled: btn.disabled,
      visible: window.getComputedStyle(btn).display !== 'none',
      hasSpinning: btn.querySelector('.animate-spin') !== null
    }))
  });

  console.log('\n=== 6. DOM Elements Summary ===');
  
  console.log('📋 Summary of key elements:', {
    totalButtons: buttons.length,
    planChangeButtons: planButtons.length,
    refreshButtons: refreshButtons.length,
    billingHistorySection: !!document.querySelector('[class*="billing"]') || !!document.querySelector('[data-testid*="billing"]'),
    paymentMethodsSection: !!document.querySelector('[class*="payment"]') || !!document.querySelector('[data-testid*="payment"]')
  });

  return {
    eventsCaught,
    planButtons: planButtons.length,
    refreshButtons: refreshButtons.length
  };
}

// Helper function to manually trigger plan change dialog (if available)
window.testOpenPlanDialog = function() {
  console.log('🔧 Attempting to open plan change dialog for testing...');
  
  const buttons = Array.from(document.querySelectorAll('button'));
  const planButton = buttons.find(btn => {
    const text = btn.textContent?.toLowerCase() || '';
    return text.includes('change') || text.includes('upgrade') || text.includes('plan');
  });
  
  if (planButton && !planButton.disabled) {
    console.log('✅ Found plan button, clicking to test dialog...');
    console.log('   Button text:', planButton.textContent?.trim());
    planButton.click();
    
    // Wait a moment then check if dialog opened
    setTimeout(() => {
      const dialog = document.querySelector('[role="dialog"]') || document.querySelector('.dialog');
      if (dialog) {
        console.log('✅ Dialog opened successfully');
        console.log('   Dialog content preview:', dialog.textContent?.substring(0, 100) + '...');
      } else {
        console.log('❌ Dialog did not open or not found');
      }
    }, 500);
  } else {
    console.log('❌ No available plan button found or button is disabled');
  }
};

console.log('\n🔧 Helper functions available:');
console.log('   testOpenPlanDialog() - Test opening the plan change dialog');

testPlanChangeFixes();
