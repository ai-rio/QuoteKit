/**
 * CRITICAL FIX: Comprehensive tour cleanup utilities
 * Ensures complete removal of driver.js elements and restoration of page interactivity
 */

/**
 * Gently removes driver.js related elements from the DOM (with null checks)
 */
export function forceRemoveDriverElements(): void {
  if (typeof window === 'undefined') return;

  console.log('🔧 Gently removing driver.js elements...');

  // List of specific driver.js related selectors (avoid broad wildcards)
  const driverSelectors = [
    '.driver-overlay',
    '.driver-overlay-custom',
    '.driver-popover',
    '.driver-highlighted-element',
    '.driver-stage',
    '.driver-fix-stacking'
  ];

  // Remove specific driver elements only
  driverSelectors.forEach(selector => {
    try {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        if (el && el.parentNode) {
          el.remove();
        }
      });
    } catch (error) {
      console.warn(`Could not remove elements with selector ${selector}:`, error);
    }
  });

  // Safely remove driver-active classes with null checks
  if (document.body && document.body.classList) {
    document.body.classList.remove('driver-active');
  }
  if (document.documentElement && document.documentElement.classList) {
    document.documentElement.classList.remove('driver-active');
  }
}

/**
 * Gently restores page interactivity without breaking modals
 */
export function restorePageInteractivity(): void {
  if (typeof window === 'undefined') return;

  console.log('🔧 Gently restoring page interactivity...');

  // Safely restore body styles with null checks
  if (document.body) {
    if (document.body.style.pointerEvents === 'none') {
      document.body.style.pointerEvents = 'auto';
    }
    if (document.body.style.overflow === 'hidden') {
      document.body.style.overflow = 'auto';
    }
    // Don't force position to static as it might break layouts
  }

  // GENTLE APPROACH: Only target specific driver.js affected elements
  // Don't iterate through ALL elements as this can be expensive and risky
  const driverAffectedElements = document.querySelectorAll(`
    .driver-highlighted-element,
    [style*="pointer-events: none"],
    [data-driver-highlighted]
  `);
  
  driverAffectedElements.forEach(el => {
    const element = el as HTMLElement;
    
    // Skip modal elements - they manage their own state
    if (element.closest('[data-radix-dialog-overlay], [data-radix-dialog-content], [role="dialog"]')) {
      return;
    }

    // Remove driver-specific attributes and styles
    element.removeAttribute('data-driver-highlighted');
    element.classList.remove('driver-highlighted-element');
    
    // Only restore pointer events if they were explicitly set to none
    if (element.style.pointerEvents === 'none') {
      element.style.pointerEvents = '';
    }
  });
}

/**
 * Destroys any remaining driver.js instances
 */
export function destroyDriverInstances(): void {
  if (typeof window === 'undefined') return;

  console.log('🔧 Destroying driver instances...');

  // Check for global driver instance
  const globalDriver = (window as any).driver;
  if (globalDriver && typeof globalDriver.destroy === 'function') {
    try {
      globalDriver.destroy();
    } catch (error) {
      console.warn('Error destroying global driver instance:', error);
    }
  }

  // Check for any driver instances stored on window
  Object.keys(window as any).forEach(key => {
    const value = (window as any)[key];
    if (value && typeof value === 'object' && typeof value.destroy === 'function' && key.includes('driver')) {
      try {
        value.destroy();
      } catch (error) {
        console.warn(`Error destroying driver instance ${key}:`, error);
      }
    }
  });
}

/**
 * Gentle tour cleanup - combines all cleanup methods safely
 */
export function performCompleteTourCleanup(): void {
  console.log('🔧 Starting gentle tour cleanup...');
  
  try {
    forceRemoveDriverElements();
    destroyDriverInstances();
    restorePageInteractivity();
    
    // Force a repaint to ensure changes are applied (with null check)
    if (document.body) {
      document.body.offsetHeight;
    }
    
    console.log('✅ Gentle tour cleanup finished successfully');
  } catch (error) {
    console.error('❌ Error during tour cleanup:', error);
  }
}

/**
 * Emergency gentle cleanup - for ESC key situations
 * This is even more conservative and only removes tour UI elements
 */
export function performGentleCleanup(): void {
  console.log('🔧 Performing emergency gentle cleanup...');
  
  try {
    // Only remove visible driver elements
    const driverElements = document.querySelectorAll('.driver-popover, .driver-overlay');
    driverElements.forEach(el => {
      if (el && el.parentNode) {
        el.remove();
      }
    });
    
    // Remove driver-active class only
    if (document.body && document.body.classList) {
      document.body.classList.remove('driver-active');
    }
    
    console.log('✅ Emergency gentle cleanup completed');
  } catch (error) {
    console.error('❌ Error during gentle cleanup:', error);
  }
}

/**
 * Setup global ESC key handler for emergency tour cleanup
 * @param forceExitCallback - Optional callback to handle force exit (should be tourManager.forceExitTour)
 */
export function setupEmergencyEscapeHandler(forceExitCallback?: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  // This emergency handler is now DISABLED to prevent conflicts with modal-keyboard-fix
  // The modal-keyboard-fix handles ESC keys more intelligently
  console.log('🔧 Emergency ESC handler setup - delegating to modal-keyboard-fix');

  // Return a no-op cleanup function
  return () => {
    console.log('🔧 Emergency ESC handler cleanup - no-op');
  };
}