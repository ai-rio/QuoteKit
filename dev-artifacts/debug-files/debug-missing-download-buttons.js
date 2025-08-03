/**
 * Debug Script: Missing Download Buttons
 * Run this in browser console to diagnose why download buttons disappeared
 */

console.log('🔍 Diagnosing Missing Download Buttons...');

async function debugMissingDownloadButtons() {
  console.log('\n=== 1. Check Billing History Data ===');
  
  let billingData = null;
  try {
    const response = await fetch('/api/billing-history', {
      method: 'GET',
      cache: 'no-store'
    });
    
    billingData = await response.json();
    console.log('📊 Billing History Response:', billingData);
    
    if (billingData.success) {
      console.log(`✅ Found ${billingData.data.length} billing records`);
      
      if (billingData.data.length === 0) {
        console.log('❌ NO BILLING DATA - This explains missing download buttons!');
        console.log('🔧 Download buttons only appear when there are billing records');
        return;
      }
      
      // Show first few records
      billingData.data.slice(0, 3).forEach((record, index) => {
        console.log(`   Record ${index + 1}:`, {
          id: record.id,
          description: record.description,
          amount: record.amount,
          status: record.status,
          invoice_url: record.invoice_url,
          hasValidInvoiceUrl: record.invoice_url && record.invoice_url !== '#'
        });
      });
    } else {
      console.log('❌ Billing History API failed:', billingData.error);
      return;
    }
  } catch (error) {
    console.error('💥 Billing History API error:', error);
    return;
  }

  console.log('\n=== 2. Check DOM Structure ===');
  
  // Check if billing history table exists
  const billingTable = document.querySelector('table') || 
                      document.querySelector('[class*="billing"]') ||
                      document.querySelector('[class*="history"]');
  
  console.log('🔍 Billing Table Found:', !!billingTable);
  
  if (billingTable) {
    console.log('   Table element:', billingTable.tagName);
    console.log('   Table classes:', billingTable.className);
  }

  // Check for any buttons in the page
  const allButtons = Array.from(document.querySelectorAll('button'));
  console.log(`🔍 Total buttons on page: ${allButtons.length}`);
  
  // Look for download-related buttons
  const downloadButtons = allButtons.filter(btn => {
    const text = btn.textContent?.toLowerCase() || '';
    const hasDownloadIcon = btn.querySelector('svg') || btn.innerHTML.includes('Download');
    const hasDownloadText = text.includes('download');
    const hasDownloadTitle = btn.title?.toLowerCase().includes('download');
    return hasDownloadIcon || hasDownloadText || hasDownloadTitle;
  });
  
  console.log(`🔍 Download buttons found: ${downloadButtons.length}`);
  
  if (downloadButtons.length === 0) {
    console.log('❌ NO DOWNLOAD BUTTONS FOUND!');
    
    // Check if there are any table cells that should contain download buttons
    const tableCells = Array.from(document.querySelectorAll('td, th'));
    const invoiceCells = tableCells.filter(cell => 
      cell.textContent?.toLowerCase().includes('invoice') ||
      cell.textContent?.toLowerCase().includes('download')
    );
    
    console.log(`🔍 Invoice-related table cells: ${invoiceCells.length}`);
    
    if (invoiceCells.length > 0) {
      console.log('⚠️ Found invoice cells but no download buttons - rendering issue!');
    }
  } else {
    downloadButtons.forEach((btn, index) => {
      console.log(`   Button ${index + 1}:`, {
        text: btn.textContent?.trim(),
        disabled: btn.disabled,
        visible: window.getComputedStyle(btn).display !== 'none',
        title: btn.title
      });
    });
  }

  console.log('\n=== 3. Check Table Structure ===');
  
  // Look for table headers to understand structure
  const tableHeaders = Array.from(document.querySelectorAll('th'));
  console.log(`🔍 Table headers found: ${tableHeaders.length}`);
  
  tableHeaders.forEach((header, index) => {
    console.log(`   Header ${index + 1}: "${header.textContent?.trim()}"`);
  });
  
  // Look for table rows
  const tableRows = Array.from(document.querySelectorAll('tbody tr'));
  console.log(`🔍 Table rows found: ${tableRows.length}`);
  
  if (tableRows.length === 0) {
    console.log('❌ NO TABLE ROWS - Table might not be rendering!');
    
    // Check for mobile card view instead
    const mobileCards = Array.from(document.querySelectorAll('[class*="card"]')).filter(card =>
      card.textContent?.includes('$') || card.textContent?.toLowerCase().includes('invoice')
    );
    
    console.log(`🔍 Mobile billing cards found: ${mobileCards.length}`);
    
    if (mobileCards.length > 0) {
      console.log('✅ Found mobile cards - checking for download buttons in cards');
      
      mobileCards.slice(0, 3).forEach((card, index) => {
        const cardButtons = Array.from(card.querySelectorAll('button'));
        const cardDownloadButtons = cardButtons.filter(btn => 
          btn.textContent?.toLowerCase().includes('download') ||
          btn.querySelector('svg')
        );
        
        console.log(`   Card ${index + 1}: ${cardDownloadButtons.length} download buttons`);
      });
    }
  } else {
    // Check first few rows for download buttons
    tableRows.slice(0, 3).forEach((row, index) => {
      const rowButtons = Array.from(row.querySelectorAll('button'));
      const rowDownloadButtons = rowButtons.filter(btn => 
        btn.textContent?.toLowerCase().includes('download') ||
        btn.querySelector('svg')
      );
      
      console.log(`   Row ${index + 1}: ${rowButtons.length} total buttons, ${rowDownloadButtons.length} download buttons`);
    });
  }

  console.log('\n=== 4. Check Component Rendering ===');
  
  // Check if the component is in loading state
  const loadingElements = Array.from(document.querySelectorAll('[class*="loading"], [class*="skeleton"]'));
  console.log(`🔍 Loading elements: ${loadingElements.length}`);
  
  if (loadingElements.length > 0) {
    console.log('⚠️ Component might be in loading state');
  }
  
  // Check for error states
  const errorElements = Array.from(document.querySelectorAll('[class*="error"]')).filter(el =>
    el.textContent?.toLowerCase().includes('error') ||
    el.textContent?.toLowerCase().includes('failed')
  );
  
  console.log(`🔍 Error elements: ${errorElements.length}`);
  
  if (errorElements.length > 0) {
    console.log('❌ Component might be in error state');
    errorElements.forEach((el, index) => {
      console.log(`   Error ${index + 1}: "${el.textContent?.trim()}"`);
    });
  }

  console.log('\n=== 5. Check Console Errors ===');
  
  // Check if there are any React/JavaScript errors
  console.log('🔍 Check browser console for any React errors or warnings');
  console.log('🔍 Look for errors related to:');
  console.log('   - Component rendering');
  console.log('   - Missing imports');
  console.log('   - TypeScript errors');
  console.log('   - API call failures');

  console.log('\n=== 6. Diagnosis Summary ===');
  
  const issues = [];
  const fixes = [];
  
  if (!billingData || billingData.data.length === 0) {
    issues.push('No billing data available');
    fixes.push('User needs billing history to see download buttons');
  }
  
  if (downloadButtons.length === 0 && billingData?.data?.length > 0) {
    issues.push('Billing data exists but no download buttons rendered');
    fixes.push('Check for component rendering errors');
    fixes.push('Verify BillingHistoryTable component is loading correctly');
    fixes.push('Check browser console for React errors');
  }
  
  if (tableRows.length === 0 && billingData?.data?.length > 0) {
    issues.push('Billing data exists but table not rendering');
    fixes.push('Component might be stuck in loading state');
    fixes.push('Check for API call errors or infinite loading');
  }
  
  console.log('🚨 Issues Found:', issues);
  console.log('🔧 Recommended Fixes:', fixes);
  
  console.log('\n✅ Diagnosis Complete!');
}

// Helper function to force refresh the billing component
window.debugRefreshBilling = function() {
  console.log('🔄 Attempting to refresh billing component...');
  
  // Look for refresh button
  const refreshButton = Array.from(document.querySelectorAll('button')).find(btn =>
    btn.innerHTML.includes('RefreshCw') || 
    btn.title?.toLowerCase().includes('refresh') ||
    btn.textContent?.toLowerCase().includes('refresh')
  );
  
  if (refreshButton) {
    console.log('✅ Found refresh button, clicking...');
    refreshButton.click();
  } else {
    console.log('❌ No refresh button found');
    console.log('🔧 Try manually refreshing the page');
  }
};

// Helper function to check specific billing record
window.debugCheckBillingRecord = function(index = 0) {
  console.log(`🔍 Checking billing record ${index}...`);
  
  // This would need to access the component's data
  console.log('🔧 Run the main debug script first to see billing data');
};

// Run the diagnosis
debugMissingDownloadButtons().catch(error => {
  console.error('💥 Diagnosis failed:', error);
});

console.log('\n🔧 Helper functions available:');
console.log('   debugRefreshBilling() - Try to refresh the billing component');
console.log('   debugCheckBillingRecord(index) - Check specific billing record');
