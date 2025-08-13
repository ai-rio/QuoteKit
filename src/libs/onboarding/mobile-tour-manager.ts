/**
 * Mobile Tour Manager - S2.2 Implementation
 * Handles mobile-specific tour optimizations and responsive behavior
 */

import { TourConfig, TourStep } from './tour-manager'

export type DeviceType = 'desktop' | 'tablet' | 'mobile'

/**
 * Detects the current device type based on screen size and user agent
 */
export function detectDeviceType(): DeviceType {
  if (typeof window === 'undefined') return 'desktop'
  
  const width = window.innerWidth
  const userAgent = navigator.userAgent.toLowerCase()
  
  // Check for mobile devices first
  if (width < 768 || /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)) {
    return width < 640 ? 'mobile' : 'tablet'
  }
  
  return 'desktop'
}

/**
 * Mobile-specific tour step modifications
 */
export interface MobileTourStep extends TourStep {
  mobilePosition?: 'top' | 'bottom' | 'center'
  mobileAlign?: 'start' | 'center' | 'end'
  touchTarget?: boolean // Indicates if element needs touch-friendly sizing
  swipeGesture?: 'left' | 'right' | 'up' | 'down' // Expected swipe direction
  vibration?: boolean // Haptic feedback for mobile devices
}

/**
 * Mobile-optimized tour configuration
 */
export interface MobileTourConfig extends Omit<TourConfig, 'steps'> {
  steps: MobileTourStep[]
  mobileSpecific?: boolean // If true, only show on mobile devices
  touchOptimized?: boolean // Enable touch-specific features
  gestureNavigation?: boolean // Allow swipe navigation between steps
}

/**
 * Adapts a regular tour config for mobile devices
 */
export function adaptTourForMobile(tour: TourConfig): MobileTourConfig {
  const deviceType = detectDeviceType()
  
  if (deviceType === 'desktop') {
    return tour as MobileTourConfig
  }
  
  const mobileTour: MobileTourConfig = {
    ...tour,
    touchOptimized: true,
    gestureNavigation: true,
    steps: tour.steps.map(step => adaptStepForMobile(step, deviceType))
  }
  
  return mobileTour
}

/**
 * Adapts a tour step for mobile devices
 */
function adaptStepForMobile(step: TourStep, deviceType: DeviceType): MobileTourStep {
  const mobileStep: MobileTourStep = {
    ...step,
    touchTarget: true,
    vibration: deviceType === 'mobile'
  }
  
  // Adjust positioning for mobile
  if (deviceType === 'mobile') {
    // On mobile, prefer bottom positioning to avoid keyboard overlap
    if (step.position === 'top') {
      mobileStep.mobilePosition = 'bottom'
    } else if (step.position === 'bottom') {
      mobileStep.mobilePosition = 'bottom'
    } else {
      mobileStep.mobilePosition = 'bottom' // Default to bottom for mobile
    }
    mobileStep.mobileAlign = 'center' // Center align for better mobile UX
  } else if (deviceType === 'tablet') {
    // Tablets can handle more positioning options
    if (step.position === 'top' || step.position === 'bottom') {
      mobileStep.mobilePosition = step.position
    } else {
      mobileStep.mobilePosition = 'bottom'
    }
    mobileStep.mobileAlign = step.align || 'center'
  }
  
  // Add touch-friendly button sizing
  if (step.showButtons) {
    mobileStep.showButtons = step.showButtons.map(button => button)
  }
  
  return mobileStep
}

/**
 * Mobile tour CSS classes for responsive styling
 */
export const MOBILE_TOUR_CLASSES = {
  mobile: 'lawnquote-tour-mobile',
  tablet: 'lawnquote-tour-tablet',
  desktop: 'lawnquote-tour-desktop',
  touchOptimized: 'lawnquote-tour-touch',
  gestureEnabled: 'lawnquote-tour-gesture'
}

/**
 * Applies mobile-specific styling to tour elements
 */
export function applyMobileTourStyling(deviceType: DeviceType, touchOptimized: boolean = true) {
  if (typeof document === 'undefined') return
  
  const body = document.body
  
  // Remove existing mobile classes
  Object.values(MOBILE_TOUR_CLASSES).forEach(className => {
    body.classList.remove(className)
  })
  
  // Apply device-specific class
  body.classList.add(MOBILE_TOUR_CLASSES[deviceType])
  
  if (touchOptimized) {
    body.classList.add(MOBILE_TOUR_CLASSES.touchOptimized)
  }
}

/**
 * Mobile gesture handler for tour navigation
 */
export class MobileGestureHandler {
  private startX: number = 0
  private startY: number = 0
  private threshold: number = 50 // Minimum distance for swipe
  
  constructor(
    private onSwipeLeft: () => void,
    private onSwipeRight: () => void,
    private onSwipeUp: () => void,
    private onSwipeDown: () => void
  ) {
    this.bindEvents()
  }
  
  private bindEvents() {
    if (typeof document === 'undefined') return
    
    document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true })
    document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true })
  }
  
  private handleTouchStart(e: TouchEvent) {
    const touch = e.touches[0]
    this.startX = touch.clientX
    this.startY = touch.clientY
  }
  
  private handleTouchEnd(e: TouchEvent) {
    if (!this.startX || !this.startY) return
    
    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - this.startX
    const deltaY = touch.clientY - this.startY
    
    const absDeltaX = Math.abs(deltaX)
    const absDeltaY = Math.abs(deltaY)
    
    // Determine if it's a horizontal or vertical swipe
    if (absDeltaX > absDeltaY && absDeltaX > this.threshold) {
      // Horizontal swipe
      if (deltaX > 0) {
        this.onSwipeRight()
      } else {
        this.onSwipeLeft()
      }
    } else if (absDeltaY > this.threshold) {
      // Vertical swipe
      if (deltaY > 0) {
        this.onSwipeDown()
      } else {
        this.onSwipeUp()
      }
    }
    
    // Reset
    this.startX = 0
    this.startY = 0
  }
  
  public destroy() {
    document.removeEventListener('touchstart', this.handleTouchStart.bind(this))
    document.removeEventListener('touchend', this.handleTouchEnd.bind(this))
  }
}

/**
 * Haptic feedback for mobile devices
 */
export function triggerHapticFeedback(type: 'light' | 'medium' | 'heavy' = 'light') {
  if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return
  
  const patterns = {
    light: [10],
    medium: [20],
    heavy: [30]
  }
  
  navigator.vibrate(patterns[type])
}

/**
 * Mobile-specific tour utilities
 */
export const MobileTourUtils = {
  /**
   * Checks if the current device supports touch
   */
  isTouchDevice(): boolean {
    return typeof window !== 'undefined' && 'ontouchstart' in window
  },
  
  /**
   * Gets the safe area insets for mobile devices
   */
  getSafeAreaInsets() {
    if (typeof window === 'undefined') return { top: 0, bottom: 0, left: 0, right: 0 }
    
    const style = getComputedStyle(document.documentElement)
    return {
      top: parseInt(style.getPropertyValue('--safe-area-inset-top') || '0'),
      bottom: parseInt(style.getPropertyValue('--safe-area-inset-bottom') || '0'),
      left: parseInt(style.getPropertyValue('--safe-area-inset-left') || '0'),
      right: parseInt(style.getPropertyValue('--safe-area-inset-right') || '0')
    }
  },
  
  /**
   * Adjusts tour positioning for mobile keyboards
   */
  adjustForKeyboard(element: HTMLElement) {
    if (typeof window === 'undefined') return
    
    const viewport = window.visualViewport
    if (!viewport) return
    
    const handleViewportChange = () => {
      const keyboardHeight = window.innerHeight - viewport.height
      if (keyboardHeight > 0) {
        element.style.transform = `translateY(-${keyboardHeight / 2}px)`
      } else {
        element.style.transform = ''
      }
    }
    
    viewport.addEventListener('resize', handleViewportChange)
    return () => viewport.removeEventListener('resize', handleViewportChange)
  },
  
  /**
   * Optimizes tour element sizing for touch
   */
  optimizeForTouch(element: HTMLElement) {
    const minTouchTarget = 44 // iOS HIG minimum touch target size
    const rect = element.getBoundingClientRect()
    
    if (rect.width < minTouchTarget || rect.height < minTouchTarget) {
      element.style.minWidth = `${minTouchTarget}px`
      element.style.minHeight = `${minTouchTarget}px`
      element.style.padding = '8px'
    }
  }
}

/**
 * Mobile tour configuration presets
 */
export const MOBILE_TOUR_PRESETS = {
  /**
   * Quick mobile tour with essential steps only
   */
  quick: {
    maxSteps: 3,
    autoAdvance: true,
    gestureNavigation: true,
    hapticFeedback: true
  },
  
  /**
   * Comprehensive mobile tour with full feature coverage
   */
  comprehensive: {
    maxSteps: 8,
    autoAdvance: false,
    gestureNavigation: true,
    hapticFeedback: true,
    progressIndicator: true
  },
  
  /**
   * Touch-optimized tour for tablets
   */
  tablet: {
    maxSteps: 6,
    autoAdvance: false,
    gestureNavigation: true,
    hapticFeedback: false,
    largerTargets: true
  }
}
