/**
 * Simple Test: Check if Download Buttons are Restored
 * Run this in browser console to verify buttons are back
 */

console.log('🔍 Checking if download buttons are restored...');

function testDownloadButtonsRestored() {
  console.log('\n=== Download Button Restoration Test ===');
  
  // Check for download buttons
  const allButtons = Array.from(document.querySelectorAll('button'));
  console.log(`Total buttons on page: ${allButtons.length}`);
  
  const downloadButtons = allButtons.filter(btn => {
    const hasDownloadIcon = btn.querySelector('svg') || btn.innerHTML.includes('Download');
    const hasDownloadText = btn.textContent?.toLowerCase().includes('download');
    const hasDownloadTitle = btn.title?.toLowerCase().includes('download');
    return hasDownloadIcon || hasDownloadText || hasDownloadTitle;
  });
  
  console.log(`Download buttons found: ${downloadButtons.length}`);
  
  if (downloadButtons.length > 0) {
    console.log('✅ DOWNLOAD BUTTONS ARE BACK!');
    
    downloadButtons.forEach((btn, index) => {
      console.log(`   Button ${index + 1}:`, {
        text: btn.textContent?.trim(),
        disabled: btn.disabled,
        visible: window.getComputedStyle(btn).display !== 'none',
        title: btn.title,
        hasIcon: !!btn.querySelector('svg')
      });
    });
    
    // Test clicking the first button (but don't actually click)
    if (downloadButtons.length > 0) {
      console.log('\n🧪 First download button details:');
      const firstButton = downloadButtons[0];
      console.log('   - Ready to click:', !firstButton.disabled);
      console.log('   - Has click handler:', typeof firstButton.onclick === 'function' || firstButton.getAttribute('onclick'));
      console.log('   - Parent element:', firstButton.parentElement?.tagName);
    }
    
  } else {
    console.log('❌ NO DOWNLOAD BUTTONS FOUND');
    
    // Check if billing table exists
    const billingElements = Array.from(document.querySelectorAll('*')).filter(el =>
      el.textContent?.toLowerCase().includes('billing') ||
      el.textContent?.toLowerCase().includes('invoice') ||
      el.className?.toLowerCase().includes('billing')
    );
    
    console.log(`Billing-related elements: ${billingElements.length}`);
    
    if (billingElements.length === 0) {
      console.log('❌ No billing elements found - component might not be rendering');
    }
  }
  
  // Check for table structure
  const tables = document.querySelectorAll('table');
  const tableRows = document.querySelectorAll('tbody tr');
  
  console.log(`\nTable structure:`);
  console.log(`   Tables: ${tables.length}`);
  console.log(`   Table rows: ${tableRows.length}`);
  
  if (tables.length > 0 && tableRows.length === 0) {
    console.log('⚠️ Table exists but no rows - might be loading or empty data');
  }
  
  // Check for mobile cards
  const mobileCards = Array.from(document.querySelectorAll('[class*="card"]')).filter(card =>
    card.textContent?.includes('$') || card.textContent?.toLowerCase().includes('invoice')
  );
  
  console.log(`   Mobile cards: ${mobileCards.length}`);
  
  console.log('\n=== Summary ===');
  if (downloadButtons.length > 0) {
    console.log('🎉 SUCCESS: Download buttons are restored and visible!');
    console.log('🔧 The invoice download API route should now work with these buttons');
  } else {
    console.log('❌ ISSUE: Download buttons are still missing');
    console.log('🔧 Try refreshing the page or check browser console for errors');
  }
}

// Helper function to manually refresh billing data
window.refreshBillingData = function() {
  console.log('🔄 Looking for refresh button...');
  
  const refreshButton = Array.from(document.querySelectorAll('button')).find(btn =>
    btn.innerHTML.includes('RefreshCw') || 
    btn.title?.toLowerCase().includes('refresh')
  );
  
  if (refreshButton) {
    console.log('✅ Found refresh button, clicking...');
    refreshButton.click();
    
    // Wait a moment then retest
    setTimeout(() => {
      console.log('🔄 Retesting after refresh...');
      testDownloadButtonsRestored();
    }, 2000);
  } else {
    console.log('❌ No refresh button found');
  }
};

// Run the test
testDownloadButtonsRestored();

console.log('\n🔧 Helper function available:');
console.log('   refreshBillingData() - Try to refresh billing data and retest');
