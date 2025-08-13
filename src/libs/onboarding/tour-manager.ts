import 'driver.js/dist/driver.css'
import '@/styles/driver-tour.css'

import { Config, Driver, driver, DriveStep } from 'driver.js'

import { fixDriverButtons } from '@/utils/driver-button-fix'

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
}

export type StepChangeCallback = (currentStep: number, totalSteps: number, stepData: TourStep) => void
export type TourCompleteCallback = (tourId: string) => void
export type TourSkipCallback = (tourId: string) => void

class TourManager {
  private driverInstance: Driver | null = null
  private currentTourId: string | null = null
  private currentConfig: TourConfig | null = null
  private stepChangeCallbacks: StepChangeCallback[] = []
  private tourCompleteCallbacks: TourCompleteCallback[] = []
  private tourSkipCallbacks: TourSkipCallback[] = []

  // Theme configuration with proper Driver.js ESC and modal handling
  private getThemeConfig(): Partial<Config> {
    return {
      popoverClass: 'lawnquote-tour',
      stagePadding: 8,
      stageRadius: 6,
      overlayOpacity: 0.1, // Very light overlay to avoid modal conflicts
      smoothScroll: true,
      allowClose: true,
      showProgress: true,
      progressText: '{{current}} of {{total}}',
      nextBtnText: 'Next',
      prevBtnText: 'Previous',
      doneBtnText: 'Done',
      showButtons: ['next', 'previous', 'close'],
      allowKeyboardControl: true, // Driver.js handles ESC properly
      animate: true,
      disableActiveInteraction: false,
      popoverOffset: 10,
      // Custom close handler to ensure modal compatibility
      onCloseClick: () => {
        console.log('🔧 Driver.js close button clicked - using built-in cleanup')
        // Let Driver.js handle the close naturally - no custom intervention needed
        // This will trigger onDestroyStarted -> onDestroyed chain properly
        if (this.driverInstance) {
          this.driverInstance.destroy()
        }
      }
    }
  }

  // Convert TourStep to Driver.js DriveStep
  private convertStep(step: TourStep): DriveStep {
    return {
      element: step.element,
      popover: {
        title: step.title,
        description: step.description,
        side: step.position || 'bottom',
        align: step.align || 'start',
        showButtons: step.showButtons || ['next', 'previous', 'close']
        // Removed custom onNextClick for now to allow default navigation
      },
      onHighlighted: step.onAfterHighlight ? (element?: Element) => step.onAfterHighlight!(element) : undefined,
      onDeselected: () => {
        // Cleanup when leaving step
      }
    }
  }

  // Initialize tour with configuration
  async initializeTour(tourId: string, config: TourConfig): Promise<void> {
    try {
      this.currentTourId = tourId
      this.currentConfig = config

      // Convert steps to driver.js format
      const driverSteps = config.steps.map(step => this.convertStep(step))

      // Create driver configuration with proper built-in handlers
      const driverConfig: Config = {
        ...this.getThemeConfig(),
        popoverClass: config.popoverClass || 'lawnquote-tour',
        showProgress: config.showProgress ?? true,
        allowClose: config.allowClose ?? true,
        steps: driverSteps,
        onHighlighted: (element, step, options) => {
          // Execute onBeforeHighlight if defined
          const currentStepIndex = options.state?.activeIndex ?? 0
          const currentStepConfig = config.steps[currentStepIndex]
          if (currentStepConfig?.onBeforeHighlight) {
            currentStepConfig.onBeforeHighlight(element || undefined)
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
          // Check if tour was completed vs skipped
          if (this.driverInstance?.hasNextStep() === false) {
            // Tour completed - notify callbacks
            this.tourCompleteCallbacks.forEach(callback => {
              if (this.currentTourId) {
                callback(this.currentTourId)
              }
            })
          } else {
            // Tour skipped - notify callbacks  
            this.tourSkipCallbacks.forEach(callback => {
              if (this.currentTourId) {
                callback(this.currentTourId)
              }
            })
          }
        }
      }

      // Create driver instance
      this.driverInstance = driver(driverConfig)

    } catch (error) {
      console.error(`Error initializing tour ${tourId}:`, error)
      throw error
    }
  }

  // Start the tour using Driver.js built-in capabilities
  async startTour(tourId?: string): Promise<void> {
    if (!this.driverInstance) {
      throw new Error('Tour not initialized. Call initializeTour first.')
    }

    try {
      console.log('🚀 Starting tour with Driver.js built-in ESC and close handling')
      this.driverInstance.drive()
      
      // Only fix driver buttons - let Driver.js handle modal interactions
      setTimeout(() => {
        fixDriverButtons()
      }, 200)
      
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

  // Simple cleanup that resets tour state and lets Driver.js handle DOM cleanup
  private cleanShutdown(): void {
    console.log('🔧 Clean shutdown - resetting tour state')
    
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