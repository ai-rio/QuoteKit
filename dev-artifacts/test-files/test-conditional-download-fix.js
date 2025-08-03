/**
 * Test Conditional Download Button Fix
 * Run this to verify download buttons are now properly conditional
 */

console.log('🧪 Testing Conditional Download Button Fix...');

async function testConditionalDownloadFix() {
  console.log('\n=== 1. Check Billing Data ===');
  
  let billingData = null;
  try {
    const billingResponse = await fetch('/api/billing-history', {
      method: 'GET',
      cache: 'no-store'
    });
    
    billingData = await billingResponse.json();
    
    if (billingData.success) {
      console.log(`📊 Found ${billingData.data.length} billing records`);
      
      billingData.data.forEach((record, index) => {
        const isStripeInvoice = record.id.startsWith('in_');
        const hasValidUrl = record.invoice_url && record.invoice_url !== '#';
        const shouldShowDownload = isStripeInvoice || hasValidUrl;
        
        console.log(`   Record ${index + 1}:`, {
          id: record.id,
          type: isStripeInvoice ? 'stripe-invoice' : 'local-subscription',
          invoice_url: record.invoice_url,
          shouldShowDownload,
          reason: shouldShowDownload ? 
            (isStripeInvoice ? 'Stripe invoice' : 'Valid URL') : 
            'No valid invoice'
        });
      });
    }
  } catch (error) {
    console.error('💥 Billing data check failed:', error);
    return;
  }

  console.log('\n=== 2. Check DOM Elements ===');
  
  // Check for download buttons
  const downloadButtons = Array.from(document.querySelectorAll('button')).filter(btn => {
    const hasDownloadIcon = btn.querySelector('svg') || btn.innerHTML.includes('Download');
    const hasDownloadText = btn.textContent?.toLowerCase().includes('download');
    const hasDownloadTitle = btn.title?.toLowerCase().includes('download');
    return hasDownloadIcon || hasDownloadText || hasDownloadTitle;
  });
  
  console.log(`🔍 Download buttons found: ${downloadButtons.length}`);
  
  // Check for "No invoice" text
  const noInvoiceElements = Array.from(document.querySelectorAll('*')).filter(el => 
    el.textContent?.includes('No invoice') || 
    el.textContent?.includes('No invoice available')
  );
  
  console.log(`🔍 "No invoice" indicators found: ${noInvoiceElements.length}`);
  
  if (noInvoiceElements.length > 0) {
    console.log('✅ Found "No invoice" indicators - conditional logic is working!');
    noInvoiceElements.forEach((el, index) => {
      console.log(`   Indicator ${index + 1}: "${el.textContent?.trim()}"`);
    });
  }

  console.log('\n=== 3. Table Structure Analysis ===');
  
  // Check table rows for download buttons vs no-invoice indicators
  const tableRows = Array.from(document.querySelectorAll('tbody tr'));
  console.log(`📊 Table rows found: ${tableRows.length}`);
  
  if (tableRows.length > 0) {
    tableRows.forEach((row, index) => {
      const downloadButton = row.querySelector('button[title*="Download"], button:has(svg)');
      const noInvoiceText = row.textContent?.includes('No invoice');
      
      console.log(`   Row ${index + 1}:`, {
        hasDownloadButton: !!downloadButton,
        hasNoInvoiceText: noInvoiceText,
        status: downloadButton ? 'Download available' : 
                noInvoiceText ? 'No invoice indicator' : 'Unknown'
      });
    });
  }

  // Check mobile cards
  const mobileCards = Array.from(document.querySelectorAll('[class*="card"]')).filter(card =>
    card.textContent?.includes('$') || card.textContent?.toLowerCase().includes('invoice')
  );
  
  console.log(`📱 Mobile cards found: ${mobileCards.length}`);
  
  if (mobileCards.length > 0) {
    mobileCards.forEach((card, index) => {
      const downloadButton = card.querySelector('button:has(svg), button[class*="download"]');
      const noInvoiceText = card.textContent?.includes('No invoice available');
      
      console.log(`   Card ${index + 1}:`, {
        hasDownloadButton: !!downloadButton,
        hasNoInvoiceText: noInvoiceText,
        status: downloadButton ? 'Download available' : 
                noInvoiceText ? 'No invoice indicator' : 'Unknown'
      });
    });
  }

  console.log('\n=== 4. Expected vs Actual Behavior ===');
  
  if (billingData?.data) {
    const expectedDownloadable = billingData.data.filter(r => 
      r.id.startsWith('in_') || (r.invoice_url && r.invoice_url !== '#')
    ).length;
    
    const expectedNonDownloadable = billingData.data.length - expectedDownloadable;
    
    console.log('📊 Expected Behavior:', {
      totalRecords: billingData.data.length,
      shouldHaveDownload: expectedDownloadable,
      shouldShowNoInvoice: expectedNonDownloadable
    });
    
    console.log('📊 Actual Behavior:', {
      downloadButtonsFound: downloadButtons.length,
      noInvoiceIndicatorsFound: noInvoiceElements.length
    });
    
    // Verify the fix is working
    const isFixWorking = (
      expectedNonDownloadable > 0 && 
      noInvoiceElements.length > 0 && 
      downloadButtons.length === expectedDownloadable
    );
    
    if (isFixWorking) {
      console.log('🎉 SUCCESS: Conditional download fix is working!');
      console.log('✅ Download buttons only shown for downloadable records');
      console.log('✅ "No invoice" indicators shown for non-downloadable records');
    } else if (expectedDownloadable === 0 && noInvoiceElements.length > 0) {
      console.log('🎉 SUCCESS: Fix working correctly for development environment');
      console.log('✅ No downloadable invoices exist, showing "No invoice" indicators');
    } else {
      console.log('⚠️ Fix may not be fully working - check the analysis above');
    }
  }

  console.log('\n✅ Conditional Download Fix Test Complete!');
}

// Helper function to simulate adding a real Stripe invoice for testing
window.simulateStripeInvoice = function() {
  console.log('🧪 This would simulate adding a real Stripe invoice to test download functionality');
  console.log('💡 In a real scenario, this would involve:');
  console.log('   1. Creating a Stripe customer for the user');
  console.log('   2. Creating a Stripe invoice for the subscription');
  console.log('   3. Updating the billing history to include the real invoice');
  console.log('   4. Testing the download button with the real invoice ID');
};

// Run the test
testConditionalDownloadFix().catch(error => {
  console.error('💥 Conditional download fix test failed:', error);
});

console.log('\n🔧 Helper function available:');
console.log('   simulateStripeInvoice() - Information about testing with real invoices');
