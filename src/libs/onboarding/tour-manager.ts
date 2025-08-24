import { Config, Driver, driver, DriveStep } from 'driver.js'

// REMOVED: fixDriverButtons import - caused button functionality issues

export interface TourStep {
  id: string
  element?: string
  title: string
  description: string
  position?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  showButtons?: ('next' | 'previous' | 'close')[]
  onBeforeHighlight?: (element?: Element) => Promise<void> | void
  onAfterHighlight?: (element?: Element) => Promise<void> | void
  validation?: () => boolean
  interactive?: boolean
  
  // Enhanced popover configuration
  popover?: {
    title: string;
    description: string;
    side?: 'top' | 'right' | 'bottom' | 'left' | 'auto';
    align?: 'start' | 'center' | 'end';
    showButtons?: string[];
    showProgress?: boolean;
    progressText?: string;
    className?: string;
    showEstimatedTime?: boolean;
    estimatedTimeMinutes?: number;
    responsive?: {
      mobile?: any;
      tablet?: any;
      desktop?: any;
    };
    onNextClick?: (_element?: Element, _step?: any, _options?: any) => void | boolean;
    onPrevClick?: (_element?: Element, _step?: any, _options?: any) => void | boolean;
    onCloseClick?: (_element?: Element, _step?: any, _options?: any) => void | boolean;
  };
  
  // Enhanced lifecycle hooks for step-level control
  onHighlightStarted?: (_element?: Element, _step?: any, _options?: any) => void
  onHighlighted?: (_element?: Element, _step?: any, _options?: any) => void
  onDeselected?: (_element?: Element, _step?: any, _options?: any) => void
}

export interface TourConfig {
  id: string
  name: string
  description: string
  steps: TourStep[]
  prerequisites?: string[]
  userTiers?: ('free' | 'pro' | 'enterprise')[]
  deviceTypes?: ('desktop' | 'mobile' | 'tablet')[]
  popoverClass?: string
  showProgress?: boolean
  allowClose?: boolean
  overlayClickBehavior?: 'close' | 'next' | 'ignore'
  progressText?: string
  
  // Lifecycle hooks for enhanced reliability
  onHighlightStarted?: (_element?: Element, _step?: any, _options?: any) => void
  onHighlighted?: (_element?: Element, _step?: any, _options?: any) => void
  onDeselected?: (_element?: Element, _step?: any, _options?: any) => void
  onDestroyed?: () => void
  onDestroyStarted?: () => void
}

export type StepChangeCallback = (currentStep: number, totalSteps: number, stepData: TourStep) => void
export type TourCompleteCallback = (_tourId: string) => void
export type TourSkipCallback = (_tourId: string) => void

class TourManager {
  private driverInstance: Driver | null = null
  private currentTourId: string | null = null
  private currentConfig: TourConfig | null = null
  private stepChangeCallbacks: StepChangeCallback[] = []
  private tourCompleteCallbacks: TourCompleteCallback[] = []
  private tourSkipCallbacks: TourSkipCallback[] = []

  // UPDATED: Enhanced theme configuration with close button removed
  // Clean UX: ESC key + outside clicks for exit, Done button for completion
  private getThemeConfig(): Partial<Config> {
    return {
      popoverClass: 'lawnquote-tour enhanced-positioning',
      stagePadding: 8,
      stageRadius: 8,
      overlayOpacity: 0.7, // Better contrast for accessibility
      smoothScroll: true,
      allowClose: true,
      showProgress: true,
      progressText: 'Step {{current}} of {{total}}',
      nextBtnText: 'Next',
      prevBtnText: 'Previous', 
      doneBtnText: 'Done',
      // Close button removed - using ESC key and outside clicks instead
      showButtons: ['next', 'previous'], // Remove close button
      allowKeyboardControl: true,
      animate: true,
      disableActiveInteraction: false,
      popoverOffset: 12, // Larger offset for better positioning
      
      // Enhanced callbacks for proper functionality
      onNextClick: (element, step, options) => {
        console.log('➡️ Next button clicked - using Driver.js navigation');
        // Let Driver.js handle navigation naturally
        return; // Don't prevent default behavior
      },
      
      onPrevClick: (element, step, options) => {
        console.log('⬅️ Previous button clicked - using Driver.js navigation');
        // Let Driver.js handle navigation naturally  
        return; // Don't prevent default behavior
      },
      
      onCloseClick: (element, step, options) => {
        console.log('✅ Done button clicked (only available on last step)');
        
        try {
          // This will only be called for the Done button on the last step
          console.log('🏁 Tour completed via Done button');
          // Mark tour as completed
          if (this.currentTourId) {
            this.tourCompleteCallbacks.forEach(callback => {
              try {
                callback(this.currentTourId!);
              } catch (callbackError) {
                console.error('Error in tour complete callback:', callbackError);
              }
            });
          }
          
          // Let Driver.js handle the close event naturally
          return;
        } catch (error) {
          console.error('❌ Error in onCloseClick handler:', error);
          return;
        }
      }
    }
  }

  // Convert TourStep to Driver.js DriveStep with enhanced positioning
  private convertStep(step: TourStep, stepIndex: number, totalSteps: number): DriveStep {
    const isLastStep = stepIndex === totalSteps - 1;
    
    return {
      element: step.element,
      popover: {
        title: step.title,
        description: step.description,
        side: this.getOptimalSide(step.position || 'bottom'),
        align: step.align || 'start',
        showButtons: isLastStep 
          ? ['previous', 'close'] // Last step shows Done button (close = Done on final step)
          : (step.showButtons || ['next', 'previous']), // No close button for regular steps
        
        // Enhanced popover positioning with error handling
        onPopoverRender: (popover: HTMLElement, step: any) => {
          try {
            // CRITICAL: Add null check before calling enhancePopoverForStep
            if (popover) {
              this.enhancePopoverForStep(popover, step, stepIndex, isLastStep);
            } else {
              console.warn('⚠️ Popover is null in onPopoverRender - skipping enhancements');
            }
          } catch (error) {
            console.error('❌ Error in onPopoverRender callback:', error);
            // Don't throw - just log and continue
          }
        }
      },
      
      // Enhanced lifecycle hooks
      onHighlightStarted: (element?: Element) => {
        if (step.onHighlightStarted) {
          step.onHighlightStarted(element, step, { stepIndex, totalSteps });
        }
        
        // Ensure smooth scrolling to element
        if (element) {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          });
        }
      },
      
      onHighlighted: (element?: Element) => {
        if (step.onHighlighted) {
          step.onHighlighted(element, step, { stepIndex, totalSteps });
        }
        if (step.onAfterHighlight) {
          step.onAfterHighlight(element);
        }
        
        // Apply positioning enhancements
        setTimeout(() => {
          const popover = document.querySelector('.driver-popover');
          if (popover) {
            this.applyResponsivePositioning(popover as HTMLElement);
          }
        }, 100);
      },
      
      onDeselected: (element?: Element) => {
        if (step.onDeselected) {
          step.onDeselected(element, step, { stepIndex, totalSteps });
        }
      }
    }
  }

  // Initialize tour with configuration
  async initializeTour(tourId: string, config: TourConfig): Promise<void> {
    try {
      this.currentTourId = tourId
      this.currentConfig = config

      // Convert steps to driver.js format with enhanced positioning
      const driverSteps = config.steps.map((step, index) => 
        this.convertStep(step, index, config.steps.length)
      )

      // Create driver configuration with proper built-in handlers
      const driverConfig: Config = {
        ...this.getThemeConfig(),
        popoverClass: config.popoverClass || 'lawnquote-tour',
        showProgress: config.showProgress ?? true,
        allowClose: config.allowClose ?? true,
        steps: driverSteps,
        onHighlighted: async (element, step, options) => {
          // Execute onBeforeHighlight if defined
          const currentStepIndex = options.state?.activeIndex ?? 0
          const currentStepConfig = config.steps[currentStepIndex]
          if (currentStepConfig?.onBeforeHighlight) {
            try {
              await currentStepConfig.onBeforeHighlight(element || undefined)
            } catch (error) {
              console.error('Error in onBeforeHighlight:', error)
            }
          }

          // Notify step change callbacks
          this.stepChangeCallbacks.forEach(callback => {
            callback(currentStepIndex, config.steps.length, currentStepConfig)
          })
        },
        onDestroyed: () => {
          console.log('🔧 Driver.js destroyed - performing clean shutdown')
          // Simple cleanup - let Driver.js handle its own DOM cleanup
          this.cleanShutdown()
        },
        onDestroyStarted: () => {
          console.log('🔧 Driver.js destroy started')
          // Since we only allow ESC/outside-click for early exit (not close button),
          // early destruction means tour was skipped
          if (this.driverInstance?.hasNextStep() !== false) {
            // Tour skipped via ESC or outside click
            this.tourSkipCallbacks.forEach(callback => {
              if (this.currentTourId) {
                callback(this.currentTourId)
              }
            })
          }
          // Tour completion is handled by onCloseClick (Done button)
        }
      }

      // Create driver instance
      this.driverInstance = driver(driverConfig)

    } catch (error) {
      console.error(`Error initializing tour ${tourId}:`, error)
      throw error
    }
  }

  // CRITICAL FIX: Simplified tour start - removed button fixing that was causing issues
  async startTour(tourId?: string): Promise<void> {
    if (!this.driverInstance) {
      throw new Error('Tour not initialized. Call initializeTour first.')
    }

    try {
      console.log('🚀 SIMPLIFIED: Starting tour with native Driver.js behavior')
      this.driverInstance.drive()
      
      // REMOVED: Button fixing that was causing conflicts
      console.log('✅ Tour started - using native Driver.js buttons')
      
    } catch (error) {
      console.error(`Error starting tour ${tourId || this.currentTourId}:`, error)
      throw error
    }
  }

  // Pause the tour
  async pauseTour(): Promise<void> {
    if (this.driverInstance) {
      // Driver.js doesn't have a pause method, so we'll hide the popover
      this.driverInstance.destroy()
    }
  }

  // Resume the tour
  async resumeTour(): Promise<void> {
    if (this.driverInstance) {
      this.driverInstance.drive()
    }
  }

  // Complete the tour
  async completeTour(): Promise<void> {
    if (this.driverInstance) {
      // Move to the last step and then destroy
      while (this.driverInstance.hasNextStep()) {
        this.driverInstance.moveNext()
      }
      this.driverInstance.destroy()
    }
  }

  // Destroy the tour using Driver.js built-in cleanup
  async destroyTour(): Promise<void> {
    if (this.driverInstance) {
      this.driverInstance.destroy()
    }
    // cleanShutdown will be called by onDestroyed hook automatically
  }

  // Move to next step
  moveNext(): void {
    if (this.driverInstance) {
      this.driverInstance.moveNext()
    }
  }

  // Move to previous step
  movePrevious(): void {
    if (this.driverInstance) {
      this.driverInstance.movePrevious()
    }
  }

  // Move to specific step
  moveTo(stepIndex: number): void {
    if (this.driverInstance) {
      this.driverInstance.moveTo(stepIndex)
    }
  }

  // Get current tour ID
  getCurrentTour(): string | null {
    return this.currentTourId
  }

  // Check if tour is active
  isActive(): boolean {
    return this.driverInstance?.isActive() ?? false
  }

  // Get current step index
  getCurrentStep(): number {
    return this.driverInstance?.getActiveIndex() ?? 0
  }

  // Get total steps
  getTotalSteps(): number {
    return this.currentConfig?.steps.length ?? 0
  }

  // Check if has next step
  hasNextStep(): boolean {
    return this.driverInstance?.hasNextStep() ?? false
  }

  // Check if has previous step
  hasPreviousStep(): boolean {
    return this.driverInstance?.hasPreviousStep() ?? false
  }

  // Force exit tour using Driver.js destroy method
  forceExitTour(): void {
    console.log('🚨 Force exit - using Driver.js built-in cleanup')
    
    if (this.driverInstance) {
      try {
        // Let Driver.js handle cleanup through its own destroy method
        // This will trigger onDestroyStarted -> onDestroyed chain naturally
        this.driverInstance.destroy()
      } catch (error) {
        console.warn('Error destroying driver instance during force exit:', error)
        // Fallback - just clean our state
        this.cleanShutdown()
      }
    } else {
      this.cleanShutdown()
    }
  }

  // Event handlers
  onStepChange(callback: StepChangeCallback): void {
    this.stepChangeCallbacks.push(callback)
  }

  onTourComplete(callback: TourCompleteCallback): void {
    this.tourCompleteCallbacks.push(callback)
  }

  onTourSkip(callback: TourSkipCallback): void {
    this.tourSkipCallbacks.push(callback)
  }

  // Remove event listeners
  removeStepChangeCallback(callback: StepChangeCallback): void {
    const index = this.stepChangeCallbacks.indexOf(callback)
    if (index > -1) {
      this.stepChangeCallbacks.splice(index, 1)
    }
  }

  removeTourCompleteCallback(callback: TourCompleteCallback): void {
    const index = this.tourCompleteCallbacks.indexOf(callback)
    if (index > -1) {
      this.tourCompleteCallbacks.splice(index, 1)
    }
  }

  removeTourSkipCallback(callback: TourSkipCallback): void {
    const index = this.tourSkipCallbacks.indexOf(callback)
    if (index > -1) {
      this.tourSkipCallbacks.splice(index, 1)
    }
  }

  // Enhanced positioning methods
  private getOptimalSide(preferredSide: 'top' | 'right' | 'bottom' | 'left'): 'top' | 'right' | 'bottom' | 'left' {
    // Use viewport size to determine optimal positioning
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };
    
    // On mobile, prefer bottom positioning for better UX
    if (viewport.width < 768) {
      return preferredSide === 'top' ? 'bottom' : preferredSide;
    }
    
    // On tablet/desktop, use preferred side
    return preferredSide;
  }
  
  private enhancePopoverForStep(popover: HTMLElement, step: any, stepIndex: number, isLastStep: boolean): void {
    // CRITICAL FIX: Add null/undefined checks to prevent crashes
    if (!popover || !popover.classList) {
      console.warn('⚠️ Popover element is null or missing classList - skipping enhancements');
      return;
    }
    
    try {
      // Add positioning classes
      popover.classList.add('enhanced-positioning');
      if (isLastStep) {
        popover.classList.add('final-step-popover');
      }
    
      // Apply Done button styling for last step (but don't override functionality)
      if (isLastStep) {
        const closeButton = popover.querySelector('.driver-popover-close-btn, .driver-popover-btn[data-role="close"]');
        if (closeButton) {
          const doneBtn = closeButton as HTMLElement;
          doneBtn.textContent = 'Done';
          doneBtn.classList.add('done-button');
          
          // Just apply styling - let Driver.js handle the click events
          console.log('✅ Done button styled for last step - Driver.js handles clicks');
        }
      }
      
      // Apply responsive styling
      this.applyResponsivePositioning(popover);
    } catch (error) {
      console.error('❌ Error enhancing popover for step:', error);
      // Continue without enhancements to prevent tour crash
    }
  }
  
  private applyResponsivePositioning(popover: HTMLElement): void {
    // CRITICAL FIX: Add null checks to prevent crashes
    if (!popover || !popover.style) {
      console.warn('⚠️ Popover element is null or missing style - skipping responsive positioning');
      return;
    }
    
    try {
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight
      };
      
      // Apply smooth transitions
      popover.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
      popover.style.willChange = 'transform';
    
    // Responsive sizing
    if (viewport.width < 768) {
      // Mobile optimization
      popover.style.maxWidth = 'calc(100vw - 2rem)';
      popover.style.margin = '1rem';
      popover.style.fontSize = '14px';
    } else if (viewport.width < 1024) {
      // Tablet optimization
      popover.style.maxWidth = '400px';
      popover.style.fontSize = '15px';
    } else {
      // Desktop optimization
      popover.style.maxWidth = '450px';
      popover.style.fontSize = '16px';
    }
    
      // Ensure popover stays in viewport
      this.keepPopoverInViewport(popover);
    } catch (error) {
      console.error('❌ Error applying responsive positioning:', error);
      // Continue without responsive positioning to prevent crash
    }
  }
  
  private keepPopoverInViewport(popover: HTMLElement): void {
    // CRITICAL FIX: Add null checks to prevent crashes
    if (!popover || !popover.getBoundingClientRect || !popover.style) {
      console.warn('⚠️ Popover element is null or missing methods - skipping viewport positioning');
      return;
    }
    
    try {
      const rect = popover.getBoundingClientRect();
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight
      };
      const padding = 16;
    
    // Adjust horizontal position
    if (rect.left < padding) {
      popover.style.transform = `translateX(${padding - rect.left}px)`;
    } else if (rect.right > viewport.width - padding) {
      popover.style.transform = `translateX(${viewport.width - padding - rect.right}px)`;
    }
    
      // Adjust vertical position
      if (rect.top < padding) {
        popover.style.transform += ` translateY(${padding - rect.top}px)`;
      } else if (rect.bottom > viewport.height - padding) {
        popover.style.transform += ` translateY(${viewport.height - padding - rect.bottom}px)`;
      }
    } catch (error) {
      console.error('❌ Error keeping popover in viewport:', error);
      // Continue without viewport adjustments to prevent crash
    }
  }
  
  // Simple cleanup that resets tour state and lets Driver.js handle DOM cleanup
  private cleanShutdown(): void {
    console.log('🔧 Clean shutdown - resetting tour state')
    
    // Clean up positioning classes
    document.querySelectorAll('.enhanced-positioning, .final-step-popover').forEach(el => {
      el.classList.remove('enhanced-positioning', 'final-step-popover');
    });
    
    // Simply reset our state - Driver.js handles its own DOM cleanup
    this.currentTourId = null
    this.currentConfig = null
    this.driverInstance = null
    
    console.log('✅ Tour state reset complete')
  }

  // Utility method to check if element exists
  static elementExists(selector: string): boolean {
    return typeof document !== 'undefined' && !!document.querySelector(selector)
  }

  // Utility method to wait for element
  static async waitForElement(selector: string, timeout = 5000): Promise<Element | null> {
    return new Promise((resolve) => {
      if (typeof document === 'undefined') {
        resolve(null)
        return
      }

      const element = document.querySelector(selector)
      if (element) {
        resolve(element)
        return
      }

      const observer = new MutationObserver(() => {
        const element = document.querySelector(selector)
        if (element) {
          observer.disconnect()
          resolve(element)
        }
      })

      observer.observe(document.body, {
        childList: true,
        subtree: true
      })

      // Timeout fallback
      setTimeout(() => {
        observer.disconnect()
        resolve(null)
      }, timeout)
    })
  }
}

// Export singleton instance
export const tourManager = new TourManager()

// Export class for testing
export { TourManager }