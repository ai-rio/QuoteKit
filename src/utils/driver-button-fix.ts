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
  // Wait for DOM to be ready
  setTimeout(() => {
    const popover = document.querySelector('.driver-popover')
    if (popover) {
      console.log('🔍 Found popover, inspecting structure:', popover.innerHTML)
      
      // Find all buttons and ensure they're clickable
      const buttons = popover.querySelectorAll(`
        button, 
        [role="button"], 
        .driver-popover-btn,
        .driver-popover-close-btn,
        .driver-popover-next-btn,
        .driver-popover-prev-btn,
        .driver-popover-done-btn,
        svg,
        [class*="close"],
        [class*="Close"]
      `)
      
      console.log('🔍 Found buttons:', buttons.length)
      
      buttons.forEach((button, index) => {
        const element = button as HTMLElement
        
        // Enhanced close button detection
        const isCloseButton = element.classList.contains('driver-popover-close-btn') || 
                             element.getAttribute('aria-label')?.includes('close') ||
                             element.getAttribute('aria-label')?.includes('Close') ||
                             element.textContent?.includes('×') ||
                             element.innerHTML?.includes('×') ||
                             element.innerHTML?.includes('close') ||
                             element.tagName === 'SVG' ||
                             element.parentElement?.classList.contains('driver-popover-close-btn')
        
        console.log(`🔍 Button ${index}:`, {
          tagName: element.tagName,
          className: element.className,
          isCloseButton,
          textContent: element.textContent,
          innerHTML: element.innerHTML.substring(0, 100),
          ariaLabel: element.getAttribute('aria-label')
        })
        
        // Force pointer events and z-index
        element.style.pointerEvents = 'auto'
        element.style.position = isCloseButton ? 'absolute' : 'relative'
        element.style.zIndex = isCloseButton ? '10003' : '10002'
        element.style.cursor = 'pointer'
        element.style.transform = 'none'
        element.style.willChange = 'auto'
        
        // Force CSS properties via setAttribute for maximum priority
        element.setAttribute('style', 
          `${element.getAttribute('style') || ''}; pointer-events: auto !important; z-index: ${isCloseButton ? '10003' : '10002'} !important; cursor: pointer !important;`
        )
        
        // Remove any existing click handlers
        const newElement = element.cloneNode(true) as HTMLElement
        element.parentNode?.replaceChild(newElement, element)
        
        // Add aggressive click listener for close buttons
        if (isCloseButton) {
          // Multiple event types to ensure capture
          ['click', 'mousedown', 'mouseup', 'touchstart', 'touchend'].forEach(eventType => {
            newElement.addEventListener(eventType, (e) => {
              console.log(`🎯 Close button ${eventType}:`, {
                type: e.type,
                target: e.target,
                currentTarget: e.currentTarget
              })
              
              if (eventType === 'click') {
                e.preventDefault()
                e.stopPropagation()
                
                // Force tour destruction
                const driverInstance = (window as any).driver
                if (driverInstance && typeof driverInstance.destroy === 'function') {
                  console.log('🚫 Forcing tour destruction via window.driver')
                  driverInstance.destroy()
                } else {
                  // Fallback: remove popover directly
                  console.log('🚫 Fallback: removing popover directly')
                  const popover = document.querySelector('.driver-popover')
                  const overlay = document.querySelector('.driver-overlay')
                  if (popover) popover.remove()
                  if (overlay) overlay.remove()
                }
              }
            }, { capture: true, passive: false })
          })
        } else {
          // Regular button handling
          newElement.addEventListener('click', (e) => {
            console.log('🎯 Button clicked:', {
              className: newElement.className,
              isCloseButton,
              textContent: newElement.textContent
            })
          }, { capture: true, passive: false })
        }
      })
      
      console.log('🔧 Fixed', buttons.length, 'Driver.js buttons')
      
      // CRITICAL FIX: Ensure modals and their elements stay interactive
      fixModalInteractionsDuringTour()
      
      // Also ensure debug panel and high z-index elements stay interactive
      const highZIndexElements = document.querySelectorAll(`
        [style*="z-index: 10003"],
        [style*="z-index: 10004"],
        .onboarding-debug-panel,
        .z-\\[10004\\]
      `)
      
      highZIndexElements.forEach((element) => {
        const el = element as HTMLElement
        el.style.pointerEvents = 'auto'
        el.style.zIndex = '10004'
        
        // Ensure all buttons within these elements work
        const buttons = el.querySelectorAll('button, [role="button"]')
        buttons.forEach((btn) => {
          const button = btn as HTMLElement
          button.style.pointerEvents = 'auto'
          button.style.zIndex = '10005'
          button.style.position = 'relative'
          console.log('🔧 Fixed button in high z-index element:', button.textContent?.trim())
        })
      })
    }
  }, 100)
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
            // Fix Driver.js buttons
            if (node.classList.contains('driver-popover') || 
                node.querySelector('.driver-popover')) {
              fixDriverButtons()
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