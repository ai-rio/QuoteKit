/**
 * Enhanced test to better detect refresh buttons and sections
 */

console.log('🔍 Enhanced detection test...');

async function enhancedDetectionTest() {
  console.log('\n=== 1. Detailed Button Analysis ===');
  
  const allButtons = Array.from(document.querySelectorAll('button'));
  console.log(`📊 Total buttons found: ${allButtons.length}`);
  
  // Analyze all buttons
  allButtons.forEach((btn, index) => {
    const text = btn.textContent?.trim() || '';
    const hasIcon = btn.querySelector('svg') !== null;
    const iconClasses = btn.querySelector('svg')?.getAttribute('class') || '';
    const hasRefreshIcon = iconClasses.includes('lucide-refresh') || 
                          iconClasses.includes('RefreshCw') ||
                          btn.innerHTML.includes('RefreshCw');
    
    if (hasIcon || text.toLowerCase().includes('refresh') || hasRefreshIcon) {
      console.log(`🔍 Button ${index + 1}:`, {
        text: text || '(no text)',
        hasIcon,
        iconClasses,
        hasRefreshIcon,
        innerHTML: btn.innerHTML.substring(0, 100) + '...',
        disabled: btn.disabled,
        visible: window.getComputedStyle(btn).display !== 'none'
      });
    }
  });

  console.log('\n=== 2. Section Detection ===');
  
  // Look for billing history section more broadly
  const possibleBillingSelectors = [
    '[class*="billing"]',
    '[data-testid*="billing"]', 
    'h1:contains("Billing")',
    'h2:contains("Billing")',
    'h3:contains("Billing")',
    '.card:has(h2:contains("Billing"))',
    '.card:has(h3:contains("Billing"))'
  ];
  
  // Since :contains() doesn't work, let's search by text content
  const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  const billingHeadings = headings.filter(h => 
    h.textContent?.toLowerCase().includes('billing') ||
    h.textContent?.toLowerCase().includes('history') ||
    h.textContent?.toLowerCase().includes('invoice')
  );
  
  console.log('📋 Billing-related headings found:', {
    count: billingHeadings.length,
    headings: billingHeadings.map(h => ({
      tag: h.tagName,
      text: h.textContent?.trim(),
      hasParentCard: !!h.closest('.card') || !!h.closest('[class*="card"]')
    }))
  });

  // Look for cards that might contain billing history
  const cards = Array.from(document.querySelectorAll('.card, [class*="card"]'));
  const billingCards = cards.filter(card => {
    const text = card.textContent?.toLowerCase() || '';
    return text.includes('billing') || text.includes('history') || text.includes('invoice');
  });
  
  console.log('💳 Billing-related cards found:', {
    count: billingCards.length,
    cards: billingCards.map(card => ({
      className: card.className,
      hasRefreshButton: !!card.querySelector('button svg'),
      textPreview: card.textContent?.substring(0, 100) + '...'
    }))
  });

  console.log('\n=== 3. Payment Methods Section Detection ===');
  
  const paymentHeadings = headings.filter(h => 
    h.textContent?.toLowerCase().includes('payment') ||
    h.textContent?.toLowerCase().includes('method') ||
    h.textContent?.toLowerCase().includes('card')
  );
  
  console.log('💳 Payment-related headings found:', {
    count: paymentHeadings.length,
    headings: paymentHeadings.map(h => ({
      tag: h.tagName,
      text: h.textContent?.trim()
    }))
  });

  console.log('\n=== 4. Refresh Button Deep Search ===');
  
  // Look for any SVG icons that might be refresh icons
  const svgs = Array.from(document.querySelectorAll('svg'));
  const refreshSvgs = svgs.filter(svg => {
    const classes = svg.getAttribute('class') || '';
    const dataLucide = svg.getAttribute('data-lucide') || '';
    return classes.includes('refresh') || 
           classes.includes('RefreshCw') ||
           dataLucide.includes('refresh') ||
           svg.innerHTML.includes('refresh');
  });
  
  console.log('🔄 Refresh-related SVGs found:', {
    count: refreshSvgs.length,
    svgs: refreshSvgs.map(svg => ({
      classes: svg.getAttribute('class'),
      dataLucide: svg.getAttribute('data-lucide'),
      parentButton: !!svg.closest('button'),
      parentButtonText: svg.closest('button')?.textContent?.trim()
    }))
  });

  // Look for buttons with spinning animations (might be refresh buttons)
  const spinningButtons = allButtons.filter(btn => 
    btn.querySelector('.animate-spin') || 
    btn.innerHTML.includes('animate-spin')
  );
  
  console.log('🌀 Buttons with spinning animations:', {
    count: spinningButtons.length,
    buttons: spinningButtons.map(btn => ({
      text: btn.textContent?.trim(),
      hasSpinning: !!btn.querySelector('.animate-spin')
    }))
  });

  console.log('\n=== 5. Table Detection ===');
  
  // Look for tables that might contain billing data
  const tables = Array.from(document.querySelectorAll('table'));
  console.log('📊 Tables found:', {
    count: tables.length,
    tables: tables.map(table => ({
      headers: Array.from(table.querySelectorAll('th')).map(th => th.textContent?.trim()),
      rowCount: table.querySelectorAll('tr').length
    }))
  });

  return {
    billingHeadings: billingHeadings.length,
    billingCards: billingCards.length,
    refreshSvgs: refreshSvgs.length,
    tables: tables.length
  };
}

enhancedDetectionTest();
