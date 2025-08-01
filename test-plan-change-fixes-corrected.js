/**
 * Corrected test script to verify plan change dialog and billing refresh fixes
 */

console.log('🧪 Testing plan change dialog and billing refresh fixes (CORRECTED)...');

async function testPlanChangeFixesCorrected() {
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

  console.log('\n=== 5. Billing History Refresh Button Test (CORRECTED) ===');
  
  // CORRECTED: Look for refresh buttons using proper class detection
  const refreshButtons = buttons.filter(btn => {
    const svg = btn.querySelector('svg');
    if (!svg) return false;
    
    const classes = svg.getAttribute('class') || '';
    return classes.includes('lucide-refresh-cw') || classes.includes('refresh');
  });
  
  console.log('🔍 Refresh buttons found (CORRECTED):', {
    count: refreshButtons.length,
    buttons: refreshButtons.map(btn => ({
      text: btn.textContent?.trim() || '(icon only)',
      disabled: btn.disabled,
      visible: window.getComputedStyle(btn).display !== 'none',
      hasSpinning: btn.querySelector('.animate-spin') !== null,
      svgClasses: btn.querySelector('svg')?.getAttribute('class')
    }))
  });

  console.log('\n=== 6. Section Detection (CORRECTED) ===');
  
  // CORRECTED: Look for sections by text content in cards
  const cards = Array.from(document.querySelectorAll('.card, [class*="card"]'));
  const billingCards = cards.filter(card => {
    const text = card.textContent?.toLowerCase() || '';
    return text.includes('billing') || text.includes('history') || text.includes('invoice');
  });
  
  const paymentCards = cards.filter(card => {
    const text = card.textContent?.toLowerCase() || '';
    return text.includes('payment') || text.includes('method') || text.includes('card');
  });
  
  console.log('📋 Section detection (CORRECTED):', {
    totalCards: cards.length,
    billingCards: billingCards.length,
    paymentCards: paymentCards.length,
    billingCardDetails: billingCards.map(card => ({
      hasRefreshButton: !!card.querySelector('svg[class*="refresh"]'),
      hasTable: !!card.querySelector('table'),
      textPreview: card.textContent?.substring(0, 80) + '...'
    })),
    paymentCardDetails: paymentCards.map(card => ({
      hasAddButton: !!card.querySelector('button:has(svg[class*="plus"])'),
      textPreview: card.textContent?.substring(0, 80) + '...'
    }))
  });

  console.log('\n=== 7. Table Analysis ===');
  
  const tables = Array.from(document.querySelectorAll('table'));
  console.log('📊 Tables found:', {
    count: tables.length,
    tables: tables.map((table, index) => ({
      index: index + 1,
      headers: Array.from(table.querySelectorAll('th')).map(th => th.textContent?.trim()),
      rowCount: table.querySelectorAll('tbody tr').length,
      hasData: table.querySelectorAll('tbody tr').length > 0,
      parentCard: !!table.closest('.card') || !!table.closest('[class*="card"]')
    }))
  });

  return {
    eventsCaught,
    planButtons: planButtons.length,
    refreshButtons: refreshButtons.length,
    billingCards: billingCards.length,
    paymentCards: paymentCards.length,
    tables: tables.length
  };
}

// Enhanced helper function to test plan dialog
window.testOpenPlanDialogEnhanced = function() {
  console.log('🔧 Testing plan change dialog (ENHANCED)...');
  
  const buttons = Array.from(document.querySelectorAll('button'));
  const planButton = buttons.find(btn => {
    const text = btn.textContent?.toLowerCase() || '';
    return text.includes('change') || text.includes('upgrade') || text.includes('plan');
  });
  
  if (planButton && !planButton.disabled) {
    console.log('✅ Found plan button, clicking to test dialog...');
    console.log('   Button text:', planButton.textContent?.trim());
    
    // Set up dialog detection
    const checkForDialog = () => {
      const dialog = document.querySelector('[role="dialog"]') || 
                    document.querySelector('.dialog') ||
                    document.querySelector('[data-state="open"]');
      
      if (dialog) {
        console.log('✅ Dialog opened successfully');
        console.log('   Dialog content preview:', dialog.textContent?.substring(0, 150) + '...');
        
        // Check for payment method loading
        const loadingText = dialog.textContent?.toLowerCase() || '';
        if (loadingText.includes('loading payment methods')) {
          console.log('✅ Payment method loading state detected');
        }
        
        // Check for payment methods
        const paymentMethodElements = dialog.querySelectorAll('[class*="payment"], [class*="card"]');
        console.log(`💳 Payment method elements in dialog: ${paymentMethodElements.length}`);
        
        return true;
      }
      return false;
    };
    
    planButton.click();
    
    // Check immediately and after delays
    setTimeout(() => {
      if (!checkForDialog()) {
        console.log('❌ Dialog not found immediately after click');
      }
    }, 100);
    
    setTimeout(() => {
      if (!checkForDialog()) {
        console.log('❌ Dialog still not found after 1 second');
      }
    }, 1000);
    
  } else {
    console.log('❌ No available plan button found or button is disabled');
    console.log('   Available buttons:', buttons.map(btn => btn.textContent?.trim()).filter(Boolean));
  }
};

console.log('\n🔧 Helper functions available:');
console.log('   testOpenPlanDialogEnhanced() - Test opening the plan change dialog with enhanced detection');

testPlanChangeFixesCorrected();
