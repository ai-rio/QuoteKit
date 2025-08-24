// Helper to ensure Driver.js buttons work properly
// This fixes any CSS or pointer-events issues

export function fixDebugPanelButtons() {
  console.log('🔧 Fixing debug panel buttons...')
  
  const debugPanel = document.querySelector('.onboarding-debug-panel')
  if (debugPanel) {
    const panel = debugPanel as HTMLElement
    
    // Force panel to be interactive
    panel.style.pointerEvents = 'auto'
    panel.style.zIndex = '10004'
    panel.style.position = 'fixed'
    
    // Fix all buttons in debug panel
    const buttons = panel.querySelectorAll('button')
    buttons.forEach((button, index) => {
      console.log(`🔧 Fixing debug panel button ${index}:`, button.textContent?.trim())
      
      button.style.pointerEvents = 'auto'
      button.style.zIndex = '10005'
      button.style.position = 'relative'
      button.style.cursor = 'pointer'
      
      // Add click event listener with debugging
      button.addEventListener('click', (e) => {
        console.log('🎯 Debug panel button clicked successfully:', button.textContent?.trim())
      }, { capture: true })
    })
    
    console.log('🔧 Fixed', buttons.length, 'debug panel buttons')
  }
}

export function fixDriverButtons() {
  // CRITICAL FIX: MINIMAL approach - only check that buttons exist and are clickable
  console.log('🔧 SIMPLIFIED: Checking Driver.js buttons with minimal interference')
  
  setTimeout(() => {
    const popover = document.querySelector('.driver-popover')
    if (popover) {
      const buttons = popover.querySelectorAll('button, [role="button"]')
      console.log(`✅ Found ${buttons.length} buttons in Driver.js popover`)
      
      // ONLY ensure buttons are visible and clickable - NO OTHER CHANGES
      buttons.forEach((button, index) => {
        const element = button as HTMLElement
        
        // Log button info for debugging
        console.log(`Button ${index + 1}: "${element.textContent?.trim()}" - Clickable: ${getComputedStyle(element).pointerEvents !== 'none'}`)
        
        // MINIMAL fix: only ensure pointer-events if it's disabled
        if (getComputedStyle(element).pointerEvents === 'none') {
          element.style.pointerEvents = 'auto'
          console.log(`🔧 Fixed pointer-events for: ${element.textContent?.trim()}`)
        }
      })
      
      // Check specifically for close button
      const closeButton = popover.querySelector('.driver-popover-close-btn, button[aria-label*="close"], button[aria-label*="Close"]')
      if (closeButton) {
        console.log('✅ Close button found and should work')
      } else {
        console.warn('⚠️ No close button found - this may be the issue!')
      }
      
      // REMOVED: All complex modal fixing that was causing issues
    } else {
      console.log('🔍 No Driver.js popover found yet')
    }
  }, 50) // Reduced delay
}

// CRITICAL FIX: Dedicated function for modal interactions during tours
export function fixModalInteractionsDuringTour() {
  const modals = document.querySelectorAll(`
    [data-radix-dialog-content],
    [role="dialog"],
    [aria-modal="true"],
    .fixed.inset-0.z-50
  `)
  
  modals.forEach((modal) => {
    const el = modal as HTMLElement
    el.style.zIndex = '10010'
    el.style.pointerEvents = 'auto'
    el.style.position = 'fixed'
    
    console.log('🔧 Fixed modal during tour:', el.className || el.tagName)
    
    // Fix all interactive elements within modals
    const interactiveElements = el.querySelectorAll(`
      button,
      [role="button"],
      input,
      select,
      textarea,
      a[href],
      [tabindex]:not([tabindex="-1"])
    `)
    
    interactiveElements.forEach((interactive) => {
      const element = interactive as HTMLElement
      element.style.pointerEvents = 'auto'
      element.style.zIndex = '10011'
      element.style.position = 'relative'
      element.style.cursor = 'pointer'
      
      // Special handling for close buttons
      const isCloseButton = element.getAttribute('aria-label')?.toLowerCase().includes('close') ||
                           element.textContent?.includes('×') ||
                           element.innerHTML?.includes('×') ||
                           element.closest('[data-radix-dialog-close]')
      
      if (isCloseButton) {
        element.style.zIndex = '10012'
        console.log('🔧 Fixed modal close button:', element.tagName, element.textContent?.trim())
        
        // Ensure close button clicks work by adding event listener
        element.addEventListener('click', (e) => {
          console.log('🎯 Modal close button clicked successfully')
          // Don't prevent default - let Radix handle it normally
        }, { capture: false, passive: true })
      }
    })
  })
  
  // Fix modal overlays
  const overlays = document.querySelectorAll(`
    [data-radix-dialog-overlay],
    .fixed.inset-0.bg-black\\/50,
    .fixed.inset-0.bg-background\\/80,
    .fixed.inset-0[style*="background"]
  `)
  
  overlays.forEach((overlay) => {
    const el = overlay as HTMLElement
    el.style.zIndex = '10009'
    el.style.pointerEvents = 'auto'
    console.log('🔧 Fixed modal overlay during tour:', el.className || el.tagName)
  })
  
  console.log('🔧 Fixed', modals.length, 'modals and', overlays.length, 'overlays for tour compatibility')
}

// Auto-fix buttons when tour starts
if (typeof window !== 'undefined') {
  // Watch for popover and debug panel appearance
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        const addedNodes = Array.from(mutation.addedNodes)
        addedNodes.forEach((node) => {
          if (node instanceof Element) {
            // Fix Driver.js buttons with minimal delay
            if (node.classList.contains('driver-popover') || 
                node.querySelector('.driver-popover')) {
              setTimeout(fixDriverButtons, 50)
            }
            
            // Fix debug panel buttons
            if (node.classList.contains('onboarding-debug-panel') ||
                node.querySelector('.onboarding-debug-panel')) {
              setTimeout(() => fixDebugPanelButtons(), 50)
            }
            
            // CRITICAL FIX: Auto-fix modals when they appear during tours
            if (node.matches('[data-radix-dialog-content], [role="dialog"], [aria-modal="true"]') ||
                node.querySelector('[data-radix-dialog-content], [role="dialog"], [aria-modal="true"]')) {
              // Check if tour is active
              const driverActive = document.querySelector('.driver-overlay, .driver-popover')
              if (driverActive) {
                setTimeout(() => fixModalInteractionsDuringTour(), 50)
              }
            }
          }
        })
      }
    })
  })
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  })
  
  // Also try to fix debug panel immediately on page load
  if (document.readyState === 'complete') {
    setTimeout(() => fixDebugPanelButtons(), 100)
  } else {
    window.addEventListener('load', () => {
      setTimeout(() => fixDebugPanelButtons(), 100)
    })
  }
}