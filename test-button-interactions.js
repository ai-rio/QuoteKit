// Test script to verify button interaction fixes
// Run this in the browser console to test button functionality

console.log('🧪 Starting button interaction tests...')

function testButtonInteraction(selector, description) {
  const element = document.querySelector(selector)
  if (element) {
    const computedStyle = window.getComputedStyle(element)
    const rect = element.getBoundingClientRect()
    
    console.log(`\n🔍 Testing: ${description}`)
    console.log(`  Selector: ${selector}`)
    console.log(`  Found: ${element ? 'YES' : 'NO'}`)
    console.log(`  Visible: ${rect.width > 0 && rect.height > 0 ? 'YES' : 'NO'}`)
    console.log(`  Pointer Events: ${computedStyle.pointerEvents}`)
    console.log(`  Z-Index: ${computedStyle.zIndex}`)
    console.log(`  Position: ${computedStyle.position}`)
    console.log(`  Cursor: ${computedStyle.cursor}`)
    
    // Test click event
    try {
      element.addEventListener('click', () => {
        console.log(`✅ ${description} - Click event fired successfully!`)
      }, { once: true })
      
      // Simulate click
      element.click()
    } catch (error) {
      console.log(`❌ ${description} - Click test failed:`, error)
    }
  } else {
    console.log(`\n🔍 Testing: ${description}`)
    console.log(`  Selector: ${selector}`)
    console.log(`  Found: NO - Element not found`)
  }
}

// Test suite
setTimeout(() => {
  console.log('\n🧪 Button Interaction Test Suite\n')
  
  // Test onboarding debug panel
  testButtonInteraction('.onboarding-debug-panel', 'Debug Panel Container')
  testButtonInteraction('.onboarding-debug-panel button', 'First Debug Panel Button')
  
  // Test any modal close buttons
  testButtonInteraction('[data-radix-dialog-content] button', 'Modal Close Button (Radix)')
  testButtonInteraction('button[aria-label*="close"]', 'Generic Close Button')
  testButtonInteraction('button[aria-label*="Close"]', 'Generic Close Button (capitalized)')
  
  // Test Driver.js popover buttons
  testButtonInteraction('.driver-popover-close-btn', 'Driver.js Close Button')
  testButtonInteraction('.driver-popover-next-btn', 'Driver.js Next Button')
  testButtonInteraction('.driver-popover-prev-btn', 'Driver.js Previous Button')
  testButtonInteraction('.driver-popover button', 'Driver.js Generic Button')
  
  console.log('\n🧪 Test suite completed. Check results above.')
  
  // Summary of elements found
  const debugPanel = document.querySelector('.onboarding-debug-panel')
  const driverPopover = document.querySelector('.driver-popover')
  const modalContent = document.querySelector('[data-radix-dialog-content]')
  
  console.log('\n📋 Element Summary:')
  console.log(`  Debug Panel: ${debugPanel ? 'Present' : 'Not found'}`)
  console.log(`  Driver Popover: ${driverPopover ? 'Present' : 'Not found'}`)
  console.log(`  Modal Dialog: ${modalContent ? 'Present' : 'Not found'}`)
  
  if (debugPanel) {
    const buttons = debugPanel.querySelectorAll('button')
    console.log(`  Debug Panel Buttons: ${buttons.length} found`)
    buttons.forEach((btn, idx) => {
      console.log(`    Button ${idx + 1}: "${btn.textContent?.trim()}"`)
    })
  }
}, 1000)

// Export test function for manual use
window.testButtonInteractions = () => {
  console.clear()
  console.log('🧪 Manual Button Test Triggered')
  // Re-run the tests
  setTimeout(() => {
    testButtonInteraction('.onboarding-debug-panel button', 'Debug Panel Button (Manual Test)')
  }, 100)
}

console.log('✅ Test script loaded. Use testButtonInteractions() to run manual tests.')