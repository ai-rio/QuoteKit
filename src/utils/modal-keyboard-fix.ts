/**
 * CRITICAL FIX: Modal keyboard interaction utilities
 * Ensures ESC key and modal interactions work properly during driver.js tours
 */

import { performCompleteTourCleanup } from './tour-cleanup'

let isCustomEscHandlerActive = false;
let originalEscHandler: ((event: KeyboardEvent) => void) | null = null;

/**
 * Sets up custom ESC key handling that prioritizes modals over tours
 */
export function setupModalKeyboardHandling() {
  if (typeof window === 'undefined' || isCustomEscHandlerActive) return;

  const customEscHandler = (event: KeyboardEvent) => {
    if (event.key === 'Escape' || event.keyCode === 27) {
      console.log('🔧 Custom ESC handler: checking for open modals...');

      // Priority 1: Check for open Radix UI dialogs
      const openRadixDialog = document.querySelector('[data-radix-dialog-content][data-state="open"]');
      if (openRadixDialog) {
        console.log('🔧 Found open Radix dialog, letting it handle ESC');
        // Let Radix handle it - don't prevent default
        return;
      }

      // Priority 2: Check for generic modals
      const openModal = document.querySelector('[role="dialog"][aria-modal="true"]:not([style*="display: none"])');
      if (openModal) {
        console.log('🔧 Found open modal, letting it handle ESC');
        // Let modal handle it - don't prevent default
        return;
      }

      // Priority 3: Check for any visible dialog
      const visibleDialog = Array.from(document.querySelectorAll('[role="dialog"], [aria-modal="true"]'))
        .find((dialog) => {
          const el = dialog as HTMLElement;
          return el.offsetParent !== null && // Element is visible
                 window.getComputedStyle(el).display !== 'none' &&
                 window.getComputedStyle(el).visibility !== 'hidden';
        });
      
      if (visibleDialog) {
        console.log('🔧 Found visible dialog, letting it handle ESC');
        return;
      }

      // Priority 4: If no modals are open, handle tour ESC gently
      const driverPopover = document.querySelector('.driver-popover');
      const driverOverlay = document.querySelector('.driver-overlay, .driver-overlay-custom');
      
      if (driverPopover || driverOverlay) {
        console.log('🔧 No modals open, handling tour ESC gently');
        event.preventDefault();
        event.stopPropagation();
        
        // GENTLE TOUR EXIT: Just close driver.js, don't trigger full cleanup
        // Let driver.js handle its own cleanup through normal channels
        if ((window as any).driver && typeof (window as any).driver.destroy === 'function') {
          (window as any).driver.destroy();
        } else {
          // Fallback: Find and trigger close button
          const closeButton = document.querySelector('.driver-popover button[aria-label*="close"], .driver-popover button[aria-label*="Close"]');
          if (closeButton) {
            (closeButton as HTMLElement).click();
          }
        }
      }
    }
  };

  // Store reference and add listener with high priority
  originalEscHandler = customEscHandler;
  document.addEventListener('keydown', customEscHandler, { capture: true });
  isCustomEscHandlerActive = true;
  
  console.log('🔧 Custom modal keyboard handling activated');
}

/**
 * Removes custom ESC key handling
 */
export function removeModalKeyboardHandling() {
  if (typeof window === 'undefined' || !isCustomEscHandlerActive) return;

  if (originalEscHandler) {
    document.removeEventListener('keydown', originalEscHandler, { capture: true });
    originalEscHandler = null;
  }
  
  isCustomEscHandlerActive = false;
  console.log('🔧 Custom modal keyboard handling deactivated');
}

/**
 * Ensures modal elements can receive focus and keyboard events
 */
export function ensureModalFocusManagement() {
  if (typeof window === 'undefined') return;

  const modals = document.querySelectorAll(`
    [data-radix-dialog-content],
    [role="dialog"],
    [aria-modal="true"]
  `);

  modals.forEach((modal) => {
    const el = modal as HTMLElement;
    
    // Ensure modal can receive focus
    if (!el.hasAttribute('tabindex')) {
      el.setAttribute('tabindex', '-1');
    }
    
    // Ensure close buttons are focusable
    const closeButtons = el.querySelectorAll(`
      button[aria-label*="close" i],
      button[aria-label*="Close"],
      [data-radix-dialog-close],
      button:has(svg)
    `);
    
    closeButtons.forEach((button) => {
      const btn = button as HTMLElement;
      btn.style.pointerEvents = 'auto';
      btn.style.zIndex = '10012';
      btn.style.position = 'relative';
      
      // Ensure it's focusable
      if (!btn.hasAttribute('tabindex') || btn.getAttribute('tabindex') === '-1') {
        btn.setAttribute('tabindex', '0');
      }
    });
    
    console.log('🔧 Ensured focus management for modal:', el.className || el.tagName);
  });
}

/**
 * Auto-setup function that should be called when tours start
 */
export function initializeModalKeyboardFix() {
  setupModalKeyboardHandling();
  ensureModalFocusManagement();
  
  // Re-check focus management periodically during tours
  const focusInterval = setInterval(() => {
    const driverActive = document.querySelector('.driver-overlay, .driver-popover');
    if (driverActive) {
      ensureModalFocusManagement();
    } else {
      clearInterval(focusInterval);
    }
  }, 1000);
}


/**
 * Cleanup function that should be called when tours end
 */
export function cleanupModalKeyboardFix() {
  removeModalKeyboardHandling();
  // Note: Tour cleanup is now handled by tour-manager's performFullCleanup method
}