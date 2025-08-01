/**
 * Test to verify DOM elements check fix
 */

console.log('🧪 Testing DOM elements check fix...');

async function testDOMFix() {
  console.log('\n=== 1. DOM Elements Check (Fixed) ===');
  
  try {
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

    console.log('✅ SUCCESS: DOM elements check completed without errors');
    return true;

  } catch (error) {
    console.error('❌ FAILED: DOM elements check still has errors:', error.message);
    return false;
  }
}

console.log('\n=== 2. Helper Function Test ===');

// Test the helper function
try {
  if (typeof window.debugOpenPlanDialog === 'function') {
    console.log('✅ Helper function debugOpenPlanDialog is available');
    console.log('   You can call debugOpenPlanDialog() to test plan dialog opening');
  } else {
    console.log('❌ Helper function debugOpenPlanDialog not found');
  }
} catch (error) {
  console.error('💥 Helper function test error:', error.message);
}

testDOMFix();
