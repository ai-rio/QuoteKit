// Test script for modal interaction fixes
// Run this in the browser console to test the fixes

console.log('🧪 Testing modal interaction fixes...');

// Test 1: Check if modals have proper z-index during tours
function testModalZIndex() {
  console.log('\n--- Test 1: Modal Z-Index ---');
  
  const modals = document.querySelectorAll(`
    [data-radix-dialog-content],
    [role="dialog"],
    [aria-modal="true"]
  `);
  
  modals.forEach((modal, index) => {
    const computed = window.getComputedStyle(modal);
    console.log(`Modal ${index + 1}:`, {
      zIndex: computed.zIndex,
      pointerEvents: computed.pointerEvents,
      position: computed.position,
      element: modal
    });
  });
  
  return modals.length;
}

// Test 2: Check if close buttons are clickable
function testCloseButtons() {
  console.log('\n--- Test 2: Close Button Accessibility ---');
  
  const closeButtons = document.querySelectorAll(`
    [data-radix-dialog-close],
    button[aria-label*="close" i],
    button[aria-label*="Close"]
  `);
  
  closeButtons.forEach((button, index) => {
    const computed = window.getComputedStyle(button);
    const isClickable = computed.pointerEvents !== 'none';
    
    console.log(`Close Button ${index + 1}:`, {
      isClickable,
      zIndex: computed.zIndex,
      pointerEvents: computed.pointerEvents,
      cursor: computed.cursor,
      element: button
    });
    
    // Test click event
    if (isClickable) {
      button.addEventListener('click', () => {
        console.log(`✅ Close button ${index + 1} click event works!`);
      }, { once: true });
    }
  });
  
  return closeButtons.length;
}

// Test 3: Check ESC key handling
function testEscKeyHandling() {
  console.log('\n--- Test 3: ESC Key Handling ---');
  
  // Simulate ESC key press
  const escEvent = new KeyboardEvent('keydown', {
    key: 'Escape',
    keyCode: 27,
    bubbles: true,
    cancelable: true
  });
  
  console.log('Simulating ESC key press...');
  document.dispatchEvent(escEvent);
  
  // Check if custom handler is active
  const hasCustomHandler = window.__driverEscHandler || 
                          document.__modalKeyboardHandler;
  
  console.log('Custom ESC handler active:', !!hasCustomHandler);
  
  return true;
}

// Test 4: Check Driver.js state
function testDriverState() {
  console.log('\n--- Test 4: Driver.js State ---');
  
  const driverOverlay = document.querySelector('.driver-overlay');
  const driverPopover = document.querySelector('.driver-popover');
  const driverInstance = window.driver;
  
  console.log('Driver state:', {
    overlayPresent: !!driverOverlay,
    popoverPresent: !!driverPopover,
    instanceExists: !!driverInstance,
    isActive: driverInstance?.isActive?.() || false
  });
  
  return true;
}

// Run all tests
function runAllTests() {
  console.log('🧪 Running comprehensive modal interaction tests...\n');
  
  const results = {
    modalsFound: testModalZIndex(),
    closeButtonsFound: testCloseButtons(),
    escKeyTested: testEscKeyHandling(),
    driverStateTested: testDriverState()
  };
  
  console.log('\n--- Test Summary ---');
  console.log('Results:', results);
  
  // Provide recommendations
  if (results.modalsFound === 0) {
    console.log('⚠️  No modals found. Try opening a modal dialog first.');
  } else {
    console.log('✅ Found', results.modalsFound, 'modal(s)');
  }
  
  if (results.closeButtonsFound === 0) {
    console.log('⚠️  No close buttons found. Check if modals have proper close buttons.');
  } else {
    console.log('✅ Found', results.closeButtonsFound, 'close button(s)');
  }
  
  return results;
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
  // Wait a bit for page load
  setTimeout(runAllTests, 1000);
}

// Export for manual use
window.testModalFixes = {
  runAllTests,
  testModalZIndex,
  testCloseButtons,
  testEscKeyHandling,
  testDriverState
};

console.log('📝 Test functions available on window.testModalFixes');