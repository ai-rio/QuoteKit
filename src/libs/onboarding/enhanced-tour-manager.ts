/**
 * Enhanced Tour Manager - Sprint 3 Implementation
 * Integrates mobile optimization, tier-aware features, and personalized onboarding
 */

import { adaptTourForMobile, applyMobileTourStyling, detectDeviceType, MobileGestureHandler, triggerHapticFeedback } from './mobile-tour-manager'
import { TOUR_CONFIGS } from './tour-configs'
import { TourConfig,TourManager } from './tour-manager'
import { detectUserTier, getPersonalizedContent, getTierSpecificTours, UserTierInfo } from './user-tier-manager'

export class EnhancedTourManager extends TourManager {
  private userTierInfo: UserTierInfo | null = null
  private deviceType = detectDeviceType()
  private gestureHandler: MobileGestureHandler | null = null
  private personalizedContent: any = null
  private currentActiveTour: any = null

  constructor() {
    super()
    this.initializeEnhancedFeatures()
  }

  /**
   * Initialize enhanced features for Sprint 3
   */
  private async initializeEnhancedFeatures() {
    // Detect user tier and personalize experience
    this.userTierInfo = await detectUserTier()
    this.personalizedContent = getPersonalizedContent(this.userTierInfo)
    
    // Apply mobile-specific styling
    applyMobileTourStyling(this.deviceType, true)
    
    // Set up gesture navigation for mobile
    if (this.deviceType === 'mobile' || this.deviceType === 'tablet') {
      this.setupMobileGestures()
    }
    
    console.log('Enhanced tour manager initialized:', {
      userTier: this.userTierInfo?.tier,
      deviceType: this.deviceType,
      personalizedContent: !!this.personalizedContent
    })
  }

  /**
   * Set up mobile gesture navigation
   */
  private setupMobileGestures() {
    this.gestureHandler = new MobileGestureHandler(
      () => this.handleNextStep(), // Swipe left = next
      () => this.handlePreviousStep(), // Swipe right = previous
      () => this.handleExitTour(), // Swipe up = exit
      () => {} // Swipe down = no action
    )
  }

  /**
   * Handle next step with enhanced features
   */
  private async handleNextStep() {
    try {
      // Use parent class method
      super.moveNext()
      
      // Trigger haptic feedback on mobile
      if (this.deviceType === 'mobile') {
        triggerHapticFeedback('light')
      }
      
      // Update progress indicator
      if (this.deviceType === 'mobile') {
        this.updateMobileProgressIndicator()
      }
    } catch (error) {
      console.error('Error in enhanced next step:', error)
    }
  }

  /**
   * Handle previous step with enhanced features
   */
  private async handlePreviousStep() {
    try {
      // Use parent class method
      super.movePrevious()
      
      // Trigger haptic feedback on mobile
      if (this.deviceType === 'mobile') {
        triggerHapticFeedback('light')
      }
      
      // Update progress indicator
      if (this.deviceType === 'mobile') {
        this.updateMobileProgressIndicator()
      }
    } catch (error) {
      console.error('Error in enhanced previous step:', error)
    }
  }

  /**
   * Handle exit tour with enhanced features
   */
  private async handleExitTour() {
    try {
      // Clean up mobile enhancements
      if (this.gestureHandler) {
        this.gestureHandler.destroy()
        this.gestureHandler = null
      }

      // Trigger haptic feedback on mobile
      if (this.deviceType === 'mobile') {
        triggerHapticFeedback('medium')
      }

      // Use parent class method
      super.destroyTour()
    } catch (error) {
      console.error('Error in enhanced exit tour:', error)
    }
  }

  /**
   * Start a tour with enhanced features
   */
  async startTour(tourId: string): Promise<void> {
    if (!this.userTierInfo) {
      this.userTierInfo = await detectUserTier()
    }

    const tourConfig = TOUR_CONFIGS[tourId]
    if (!tourConfig) {
      throw new Error(`Tour configuration not found: ${tourId}`)
    }

    // Check if user tier has access to this tour
    if (!this.canAccessTour(tourConfig)) {
      console.warn(`User tier ${this.userTierInfo.tier} cannot access tour: ${tourId}`)
      return
    }

    // Adapt tour for mobile if needed
    const adaptedTour = this.deviceType !== 'desktop' 
      ? adaptTourForMobile(tourConfig)
      : tourConfig

    // Personalize tour content
    const personalizedTour = this.personalizeTour(adaptedTour)

    // IMPORTANT: Initialize the tour first before starting
    await super.initializeTour(personalizedTour.id, personalizedTour)

    // Start the tour with enhanced features
    await super.startTour(personalizedTour.id)

    // Store current tour info
    this.currentActiveTour = {
      tourId: personalizedTour.id,
      currentStep: 0,
      totalSteps: personalizedTour.steps.length
    }

    // Add mobile-specific enhancements
    if (this.deviceType === 'mobile') {
      this.addMobileEnhancements()
    }

    // Trigger haptic feedback on mobile
    if (this.deviceType === 'mobile') {
      triggerHapticFeedback('light')
    }
  }

  /**
   * Check if user can access a tour based on tier
   */
  private canAccessTour(tour: TourConfig): boolean {
    if (!this.userTierInfo || !tour.userTiers) return true
    return tour.userTiers.includes(this.userTierInfo.tier)
  }

  /**
   * Personalize tour content based on user tier and profile
   */
  private personalizeTour(tour: TourConfig): TourConfig {
    if (!this.userTierInfo || !this.personalizedContent) return tour

    const personalizedTour = { ...tour }

    // Customize welcome message for personalized tours
    if (tour.id === 'personalized-onboarding') {
      personalizedTour.steps = tour.steps.map(step => {
        if (step.id === 'personalization-intro') {
          return {
            ...step,
            description: this.personalizedContent.welcomeMessage
          }
        }
        return step
      })
    }

    // Add tier-specific content to freemium highlights
    if (tour.id === 'freemium-highlights' && this.userTierInfo.tier === 'free') {
      const quotesRemaining = this.userTierInfo.quotesLimit - this.userTierInfo.quotesUsed
      personalizedTour.steps = tour.steps.map(step => {
        if (step.id === 'freemium-intro') {
          return {
            ...step,
            description: `You have ${quotesRemaining} quotes remaining on your free plan. Discover powerful features available with our Premium plan to grow your business faster.`
          }
        }
        return step
      })
    }

    return personalizedTour
  }

  /**
   * Add mobile-specific enhancements to active tour
   */
  private addMobileEnhancements() {
    if (typeof document === 'undefined') return

    // Add progress indicator
    this.addMobileProgressIndicator()

    // Add swipe hints
    this.addSwipeHints()

    // Optimize for keyboard
    this.handleMobileKeyboard()
  }

  /**
   * Add mobile progress indicator
   */
  private addMobileProgressIndicator() {
    const popover = document.querySelector('.driver-popover')
    if (!popover || !this.currentActiveTour) return

    const progress = document.createElement('div')
    progress.className = 'driver-popover-progress'
    
    const progressBar = document.createElement('div')
    progressBar.className = 'driver-popover-progress-bar'
    
    const currentStep = this.currentActiveTour.currentStep
    const totalSteps = this.currentActiveTour.totalSteps || 1
    const progressPercent = ((currentStep + 1) / totalSteps) * 100
    
    progressBar.style.width = `${progressPercent}%`
    progress.appendChild(progressBar)
    
    popover.insertBefore(progress, popover.firstChild)
  }

  /**
   * Add swipe gesture hints
   */
  private addSwipeHints() {
    const popover = document.querySelector('.driver-popover')
    if (!popover) return

    const hint = document.createElement('div')
    hint.className = 'driver-popover-swipe-hint'
    popover.appendChild(hint)
  }

  /**
   * Handle mobile keyboard interactions
   */
  private handleMobileKeyboard() {
    if (typeof window === 'undefined' || !window.visualViewport) return

    const handleViewportChange = () => {
      const popover = document.querySelector('.driver-popover') as HTMLElement
      if (!popover) return

      const keyboardHeight = window.innerHeight - window.visualViewport!.height
      if (keyboardHeight > 0) {
        popover.style.transform = `translateY(-${keyboardHeight / 2}px)`
      } else {
        popover.style.transform = ''
      }
    }

    window.visualViewport.addEventListener('resize', handleViewportChange)
  }

  /**
   * Get recommended tours based on user tier and progress
   */
  async getRecommendedTours(): Promise<string[]> {
    if (!this.userTierInfo) {
      this.userTierInfo = await detectUserTier()
    }

    const tierSpecificTours = getTierSpecificTours(this.userTierInfo)
    
    // Mock completed tours for now - in real implementation this would come from database
    const completedTours: string[] = []
    
    // Filter out completed tours and return recommendations
    return tierSpecificTours.filter(tourId => !completedTours.includes(tourId))
  }

  /**
   * Start personalized onboarding flow
   */
  async startPersonalizedOnboarding(): Promise<void> {
    try {
      if (!this.userTierInfo) {
        this.userTierInfo = await detectUserTier()
      }

      const recommendedTours = await this.getRecommendedTours()
      
      // Start with personalized tour if available
      if (recommendedTours.includes('personalized-onboarding')) {
        console.log('🎯 Starting personalized onboarding tour')
        await this.startTour('personalized-onboarding')
      } else {
        // Fall back to welcome tour
        console.log('🎯 Starting fallback welcome tour')
        await this.startTour('welcome')
      }
    } catch (error) {
      console.error('❌ Error in startPersonalizedOnboarding:', error)
      // Fallback to basic welcome tour if everything else fails
      try {
        console.log('🔄 Attempting fallback to welcome tour')
        await this.startTour('welcome')
      } catch (fallbackError) {
        console.error('❌ Fallback tour also failed:', fallbackError)
        throw fallbackError
      }
    }
  }

  /**
   * Show freemium highlights for free users
   */
  async showFreemiumHighlights(): Promise<void> {
    if (!this.userTierInfo) {
      this.userTierInfo = await detectUserTier()
    }

    if (this.userTierInfo.tier === 'free') {
      await this.startTour('freemium-highlights')
    }
  }

  /**
   * Start interactive tutorial
   */
  async startInteractiveTutorial(): Promise<void> {
    await this.startTour('interactive-tutorial')
  }

  /**
   * Update mobile progress indicator
   */
  private updateMobileProgressIndicator() {
    const progressBar = document.querySelector('.driver-popover-progress-bar') as HTMLElement
    if (!progressBar || !this.currentActiveTour) return

    const currentStep = this.currentActiveTour.currentStep
    const totalSteps = this.currentActiveTour.totalSteps || 1
    const progressPercent = ((currentStep + 1) / totalSteps) * 100
    
    progressBar.style.width = `${progressPercent}%`
  }

  /**
   * Get user tier information
   */
  getUserTierInfo(): UserTierInfo | null {
    return this.userTierInfo
  }

  /**
   * Get device type
   */
  getDeviceType() {
    return this.deviceType
  }

  /**
   * Get personalized content
   */
  getPersonalizedContent() {
    return this.personalizedContent
  }

  /**
   * Refresh user tier information
   */
  async refreshUserTier(): Promise<void> {
    this.userTierInfo = await detectUserTier()
    this.personalizedContent = getPersonalizedContent(this.userTierInfo)
  }
}

// Export singleton instance
export const enhancedTourManager = new EnhancedTourManager()
