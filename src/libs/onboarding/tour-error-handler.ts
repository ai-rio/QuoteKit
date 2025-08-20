/**
 * Tour Error Handling System
 * Provides comprehensive error handling for Driver.js tours
 * Following established type-safety and error handling patterns
 */

export interface TourErrorContext {
  stepId: string;
  tourId: string;
  selectors: string[];
  timestamp: number;
  userAgent?: string;
  viewport?: {
    width: number;
    height: number;
  };
}

export interface TourRecoveryOptions {
  skipStep?: boolean;
  retryCount?: number;
  fallbackElement?: Element;
  showUserMessage?: boolean;
  continueOnError?: boolean;
}

export class TourErrorHandler {
  private static instance: TourErrorHandler;
  private errorLog: TourErrorContext[] = [];
  private maxRetries = 3;
  private retryDelay = 500;

  static getInstance(): TourErrorHandler {
    if (!TourErrorHandler.instance) {
      TourErrorHandler.instance = new TourErrorHandler();
    }
    return TourErrorHandler.instance;
  }

  /**
   * Handle missing element with fallback strategies
   */
  handleMissingElement(
    stepId: string,
    tourId: string,
    selectors: string[],
    options: TourRecoveryOptions = {}
  ): Element | null {
    try {
      // Log the error context
      const errorContext: TourErrorContext = {
        stepId,
        tourId,
        selectors,
        timestamp: Date.now(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        viewport: typeof window !== 'undefined' ? {
          width: window.innerWidth,
          height: window.innerHeight
        } : undefined
      };

      this.errorLog.push(errorContext);
      console.warn(`Tour step element not found: ${stepId}`, errorContext);

      // Try fallback selectors with retry logic
      return this.tryFallbackSelectors(selectors, options);

    } catch (error) {
      console.error('Error in handleMissingElement:', error);
      return null;
    }
  }

  /**
   * Try multiple selectors with retry logic
   */
  private tryFallbackSelectors(
    selectors: string[],
    options: TourRecoveryOptions,
    attempt: number = 1
  ): Element | null {
    for (const selector of selectors) {
      try {
        const element = document.querySelector(selector);
        if (element) {
          console.log(`Found element with selector: ${selector} (attempt ${attempt})`);
          return element;
        }
      } catch (error) {
        console.warn(`Invalid selector: ${selector}`, error);
        continue;
      }
    }

    // If no element found and we haven't exceeded retry limit
    if (attempt < this.maxRetries) {
      console.log(`Retrying element search (attempt ${attempt + 1}/${this.maxRetries})`);
      return new Promise<Element | null>((resolve) => {
        setTimeout(() => {
          resolve(this.tryFallbackSelectors(selectors, options, attempt + 1));
        }, this.retryDelay);
      }) as any; // Will be handled by caller
    }

    // All fallbacks failed
    console.warn('All fallback selectors failed');
    return options.fallbackElement || null;
  }

  /**
   * Handle dynamic content loading
   */
  async waitForElement(
    selectors: string[],
    timeout: number = 5000,
    checkInterval: number = 100
  ): Promise<Element | null> {
    const startTime = Date.now();

    return new Promise((resolve) => {
      const checkForElement = () => {
        // Try each selector
        for (const selector of selectors) {
          try {
            const element = document.querySelector(selector);
            if (element) {
              console.log(`Element found after waiting: ${selector}`);
              resolve(element);
              return;
            }
          } catch (error) {
            console.warn(`Invalid selector during wait: ${selector}`, error);
          }
        }

        // Check if timeout exceeded
        if (Date.now() - startTime > timeout) {
          console.warn(`Timeout waiting for element. Selectors: ${selectors.join(', ')}`);
          resolve(null);
          return;
        }

        // Continue checking
        setTimeout(checkForElement, checkInterval);
      };

      checkForElement();
    });
  }

  /**
   * Show user-friendly error message
   */
  showTourError(message: string, options: {
    type?: 'warning' | 'error' | 'info';
    duration?: number;
    allowDismiss?: boolean;
  } = {}): void {
    try {
      const {
        type = 'warning',
        duration = 3000,
        allowDismiss = true
      } = options;

      // Create error notification element
      const notification = document.createElement('div');
      notification.className = `tour-error-notification tour-error-${type}`;
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#fee2e2' : type === 'warning' ? '#fef3c7' : '#dbeafe'};
        border: 1px solid ${type === 'error' ? '#fca5a5' : type === 'warning' ? '#fcd34d' : '#93c5fd'};
        color: ${type === 'error' ? '#991b1b' : type === 'warning' ? '#92400e' : '#1e40af'};
        padding: 12px 16px;
        border-radius: 8px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        z-index: 10000;
        max-width: 300px;
        font-size: 14px;
        line-height: 1.4;
        transition: all 0.3s ease;
      `;

      notification.innerHTML = `
        <div style="display: flex; align-items: flex-start; gap: 8px;">
          <div style="flex: 1;">${message}</div>
          ${allowDismiss ? '<button style="background: none; border: none; font-size: 18px; cursor: pointer; padding: 0; margin-left: 8px;">&times;</button>' : ''}
        </div>
      `;

      // Add dismiss functionality
      if (allowDismiss) {
        const dismissBtn = notification.querySelector('button');
        if (dismissBtn) {
          dismissBtn.addEventListener('click', () => {
            this.removeNotification(notification);
          });
        }
      }

      // Add to DOM
      document.body.appendChild(notification);

      // Auto-remove after duration
      if (duration > 0) {
        setTimeout(() => {
          this.removeNotification(notification);
        }, duration);
      }

    } catch (error) {
      console.error('Error showing tour notification:', error);
      // Fallback to alert
      alert(message);
    }
  }

  /**
   * Remove notification with animation
   */
  private removeNotification(notification: HTMLElement): void {
    try {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    } catch (error) {
      console.error('Error removing notification:', error);
    }
  }

  /**
   * Validate tour step context
   */
  validateStepContext(stepId: string, requiredElements: string[] = []): {
    isValid: boolean;
    missingElements: string[];
    suggestions: string[];
  } {
    const missingElements: string[] = [];
    const suggestions: string[] = [];

    try {
      // Check for required elements
      for (const selector of requiredElements) {
        if (!document.querySelector(selector)) {
          missingElements.push(selector);
        }
      }

      // Generate suggestions based on missing elements
      if (missingElements.length > 0) {
        if (missingElements.some(sel => sel.includes('client'))) {
          suggestions.push('Make sure you\'re on the quote creation page');
          suggestions.push('Try refreshing the page if elements are missing');
        }
        if (missingElements.some(sel => sel.includes('item'))) {
          suggestions.push('Ensure you have items in your library');
          suggestions.push('Check that the line items section has loaded');
        }
      }

      return {
        isValid: missingElements.length === 0,
        missingElements,
        suggestions
      };

    } catch (error) {
      console.error('Error validating step context:', error);
      return {
        isValid: false,
        missingElements: ['validation-error'],
        suggestions: ['Please try refreshing the page']
      };
    }
  }

  /**
   * Get error statistics for debugging
   */
  getErrorStats(): {
    totalErrors: number;
    errorsByStep: Record<string, number>;
    errorsByTour: Record<string, number>;
    recentErrors: TourErrorContext[];
  } {
    const errorsByStep: Record<string, number> = {};
    const errorsByTour: Record<string, number> = {};

    this.errorLog.forEach(error => {
      errorsByStep[error.stepId] = (errorsByStep[error.stepId] || 0) + 1;
      errorsByTour[error.tourId] = (errorsByTour[error.tourId] || 0) + 1;
    });

    return {
      totalErrors: this.errorLog.length,
      errorsByStep,
      errorsByTour,
      recentErrors: this.errorLog.slice(-10) // Last 10 errors
    };
  }

  /**
   * Clear error log (useful for testing)
   */
  clearErrorLog(): void {
    this.errorLog = [];
  }
}

// Export singleton instance
export const tourErrorHandler = TourErrorHandler.getInstance();

// Export utility functions for easy use
export const handleMissingElement = (
  stepId: string,
  tourId: string,
  selectors: string[],
  options?: TourRecoveryOptions
) => tourErrorHandler.handleMissingElement(stepId, tourId, selectors, options);

export const waitForElement = (
  selectors: string[],
  timeout?: number,
  checkInterval?: number
) => tourErrorHandler.waitForElement(selectors, timeout, checkInterval);

export const showTourError = (
  message: string,
  options?: {
    type?: 'warning' | 'error' | 'info';
    duration?: number;
    allowDismiss?: boolean;
  }
) => tourErrorHandler.showTourError(message, options);

export const validateStepContext = (
  stepId: string,
  requiredElements?: string[]
) => tourErrorHandler.validateStepContext(stepId, requiredElements);
