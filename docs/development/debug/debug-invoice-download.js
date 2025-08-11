/**
 * Invoice Download Debug Script
 * Run this in the browser console to test invoice download functionality
 * 
 * Usage: Copy and paste this entire script into browser console on /account page
 */

console.log('🧾 Starting Invoice Download Debug Test...');

async function debugInvoiceDownload() {
  console.log('\n=== 1. Testing Billing History API ===');
  
  let billingData = null;
  
  try {
    const billingResponse = await fetch('/api/billing-history', {
      method: 'GET',
      cache: 'no-store'
    });
    
    billingData = await billingResponse.json();
    console.log('📊 Billing History API Response:', billingData);
    
    if (billingData.success) {
      console.log(`✅ Found ${billingData.data.length} billing records`);
      
      // Analyze each billing record for invoice URLs
      billingData.data.forEach((record, index) => {
        console.log(`\n   📄 Record ${index + 1}:`, {
          id: record.id,
          date: record.date,
          amount: `$${(record.amount / 100).toFixed(2)}`,
          status: record.status,
          description: record.description,
          invoice_url: record.invoice_url,
          hasValidInvoiceUrl: record.invoice_url && record.invoice_url !== '#',
          invoiceUrlType: record.invoice_url?.startsWith('http') ? 'external' : 
                         record.invoice_url === '#' ? 'placeholder' : 'unknown'
        });
      });
      
      // Count valid vs invalid invoice URLs
      const validInvoices = billingData.data.filter(r => r.invoice_url && r.invoice_url !== '#');
      const invalidInvoices = billingData.data.filter(r => !r.invoice_url || r.invoice_url === '#');
      
      console.log(`\n📊 Invoice URL Analysis:`, {
        totalRecords: billingData.data.length,
        validInvoiceUrls: validInvoices.length,
        invalidInvoiceUrls: invalidInvoices.length,
        validPercentage: billingData.data.length > 0 ? 
          Math.round((validInvoices.length / billingData.data.length) * 100) + '%' : '0%'
      });
      
    } else {
      console.error('❌ Billing History API failed:', billingData.error);
      return;
    }
  } catch (error) {
    console.error('💥 Billing History API error:', error);
    return;
  }

  console.log('\n=== 2. Testing Invoice Download API Route ===');
  
  // Check if there's a dedicated invoice download API
  const testInvoiceId = billingData?.data?.[0]?.id;
  if (testInvoiceId) {
    try {
      const invoiceDownloadResponse = await fetch(`/api/billing-history/${testInvoiceId}/invoice`, {
        method: 'GET',
        cache: 'no-store'
      });
      
      console.log('📊 Invoice Download API Response Status:', invoiceDownloadResponse.status);
      
      if (invoiceDownloadResponse.ok) {
        console.log('✅ Invoice download API exists and responds');
        
        // Check content type
        const contentType = invoiceDownloadResponse.headers.get('content-type');
        console.log('📄 Content Type:', contentType);
        
        if (contentType?.includes('application/pdf')) {
          console.log('✅ Returns PDF content');
        } else if (contentType?.includes('application/json')) {
          const jsonResponse = await invoiceDownloadResponse.json();
          console.log('📊 JSON Response:', jsonResponse);
        } else {
          console.log('⚠️ Unexpected content type:', contentType);
        }
      } else if (invoiceDownloadResponse.status === 404) {
        console.log('❌ Invoice download API route does not exist (404)');
        console.log('🔧 This is likely the root cause of the issue!');
      } else {
        console.log('❌ Invoice download API error:', invoiceDownloadResponse.status);
        const errorText = await invoiceDownloadResponse.text();
        console.log('Error details:', errorText);
      }
    } catch (error) {
      console.error('💥 Invoice download API test error:', error);
    }
  } else {
    console.log('⚠️ No billing records found to test invoice download');
  }

  console.log('\n=== 3. Testing DOM Download Buttons ===');
  
  // Find all download buttons in the billing table
  const downloadButtons = Array.from(document.querySelectorAll('button')).filter(btn => {
    const hasDownloadIcon = btn.querySelector('svg') || btn.innerHTML.includes('Download');
    const hasDownloadText = btn.textContent?.toLowerCase().includes('download');
    const hasDownloadTitle = btn.title?.toLowerCase().includes('download');
    return hasDownloadIcon || hasDownloadText || hasDownloadTitle;
  });
  
  console.log(`🔍 Found ${downloadButtons.length} download buttons in DOM`);
  
  downloadButtons.forEach((button, index) => {
    console.log(`\n   🔘 Button ${index + 1}:`, {
      text: button.textContent?.trim(),
      title: button.title,
      disabled: button.disabled,
      visible: window.getComputedStyle(button).display !== 'none',
      className: button.className,
      hasClickHandler: button.onclick !== null || button.addEventListener !== undefined,
      parentElement: button.parentElement?.tagName
    });
  });

  console.log('\n=== 4. Testing Download Button Functionality ===');
  
  if (downloadButtons.length > 0 && billingData?.data?.length > 0) {
    const firstButton = downloadButtons[0];
    const firstRecord = billingData.data[0];
    
    console.log('🧪 Testing first download button with first billing record...');
    console.log('Button:', firstButton.textContent?.trim());
    console.log('Record:', {
      id: firstRecord.id,
      invoice_url: firstRecord.invoice_url,
      hasValidUrl: firstRecord.invoice_url && firstRecord.invoice_url !== '#'
    });
    
    if (firstRecord.invoice_url && firstRecord.invoice_url !== '#') {
      console.log('✅ Record has valid invoice URL, testing direct access...');
      
      // Test if the URL is accessible
      try {
        const urlTest = await fetch(firstRecord.invoice_url, { 
          method: 'HEAD',
          mode: 'no-cors' // Avoid CORS issues for external URLs
        });
        console.log('✅ Invoice URL is accessible');
      } catch (error) {
        console.log('⚠️ Invoice URL test failed (might be CORS):', error.message);
        console.log('🔧 This could indicate the URL is external (Stripe hosted)');
      }
      
      // Test the button click (but don't actually click to avoid opening tabs)
      console.log('🔧 Button click would open:', firstRecord.invoice_url);
      
    } else {
      console.log('❌ Record has invalid invoice URL:', firstRecord.invoice_url);
      console.log('🔧 This is the root cause - no valid invoice URLs in billing data');
    }
  } else {
    console.log('⚠️ No download buttons or billing records found to test');
  }

  console.log('\n=== 5. Stripe Integration Check ===');
  
  // Check if we can access Stripe customer data
  try {
    const subscriptionResponse = await fetch('/api/subscription-status', {
      method: 'GET',
      cache: 'no-store'
    });
    
    const subscriptionData = await subscriptionResponse.json();
    
    if (subscriptionData.success) {
      const customerInfo = subscriptionData.status?.customer;
      console.log('🔍 Stripe Customer Info:', {
        hasStripeCustomer: customerInfo?.hasStripeCustomer,
        stripeCustomerId: customerInfo?.stripeCustomerId ? 
          customerInfo.stripeCustomerId.substring(0, 8) + '...' : 'Missing',
        subscriptionCount: subscriptionData.status?.subscriptions?.count || 0
      });
      
      if (!customerInfo?.hasStripeCustomer) {
        console.log('❌ No Stripe customer found - this explains missing invoice URLs');
        console.log('🔧 User needs to have paid subscriptions to generate invoices');
      } else if (subscriptionData.status?.subscriptions?.count === 0) {
        console.log('⚠️ Stripe customer exists but no subscriptions found');
        console.log('🔧 Invoices are only generated for paid subscriptions');
      } else {
        console.log('✅ Stripe customer and subscriptions exist');
        console.log('🔧 Issue might be in invoice URL generation or API route');
      }
    }
  } catch (error) {
    console.error('💥 Subscription status check failed:', error);
  }

  console.log('\n=== 6. Recommended Fixes ===');
  
  const issues = [];
  const fixes = [];
  
  // Analyze the findings and provide recommendations
  if (billingData?.data?.length === 0) {
    issues.push('No billing history found');
    fixes.push('User needs to have billing activity (paid subscriptions)');
  }
  
  const validInvoices = billingData?.data?.filter(r => r.invoice_url && r.invoice_url !== '#') || [];
  if (billingData?.data?.length > 0 && validInvoices.length === 0) {
    issues.push('Billing records exist but no valid invoice URLs');
    fixes.push('Need to implement proper invoice URL generation from Stripe');
    fixes.push('Check if Stripe invoices have hosted_invoice_url or invoice_pdf fields');
  }
  
  if (downloadButtons.length === 0) {
    issues.push('No download buttons found in DOM');
    fixes.push('Check if BillingHistoryTable component is rendering properly');
  }
  
  // Test for missing API route
  const hasApiRoute = await testApiRoute();
  if (!hasApiRoute) {
    issues.push('Invoice download API route missing');
    fixes.push('Create /api/billing-history/[id]/invoice route');
    fixes.push('Implement proper invoice download with Stripe integration');
  }
  
  console.log('🚨 Issues Found:', issues);
  console.log('🔧 Recommended Fixes:', fixes);
  
  console.log('\n✅ Invoice Download Debug Test Completed!');
  console.log('📋 Summary: Check the analysis above for specific issues and fixes needed.');
}

// Helper function to test if API route exists
async function testApiRoute() {
  try {
    const response = await fetch('/api/billing-history/test/invoice', {
      method: 'GET',
      cache: 'no-store'
    });
    return response.status !== 404;
  } catch (error) {
    return false;
  }
}

// Helper function to manually test invoice download
window.debugTestInvoiceDownload = function(invoiceId, invoiceUrl) {
  console.log('🧪 Manual Invoice Download Test');
  console.log('Invoice ID:', invoiceId);
  console.log('Invoice URL:', invoiceUrl);
  
  if (!invoiceUrl || invoiceUrl === '#') {
    console.error('❌ Invalid invoice URL provided');
    return;
  }
  
  console.log('🔗 Opening invoice URL in new tab...');
  window.open(invoiceUrl, '_blank', 'noopener,noreferrer');
};

// Helper function to simulate button click
window.debugClickDownloadButton = function(buttonIndex = 0) {
  const downloadButtons = Array.from(document.querySelectorAll('button')).filter(btn => {
    const hasDownloadIcon = btn.querySelector('svg') || btn.innerHTML.includes('Download');
    const hasDownloadText = btn.textContent?.toLowerCase().includes('download');
    const hasDownloadTitle = btn.title?.toLowerCase().includes('download');
    return hasDownloadIcon || hasDownloadText || hasDownloadTitle;
  });
  
  if (downloadButtons[buttonIndex]) {
    console.log(`🖱️ Clicking download button ${buttonIndex + 1}...`);
    downloadButtons[buttonIndex].click();
  } else {
    console.error(`❌ Download button ${buttonIndex + 1} not found`);
    console.log(`Available buttons: ${downloadButtons.length}`);
  }
};

// Run the debug test
debugInvoiceDownload().catch(error => {
  console.error('💥 Invoice download debug test failed:', error);
});

console.log('\n🔧 Helper functions available:');
console.log('   debugTestInvoiceDownload(invoiceId, invoiceUrl) - Test specific invoice download');
console.log('   debugClickDownloadButton(index) - Click a download button by index');
console.log('   Run this script again with: debugInvoiceDownload()');
