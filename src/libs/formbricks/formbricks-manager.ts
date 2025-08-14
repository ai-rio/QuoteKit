'use client';

import formbricks from '@formbricks/js';

/**
 * FormbricksManager - Singleton service for managing Formbricks SDK integration
 * Implements the technical architecture from the Formbricks integration docs
 * with proper error handling and graceful fallbacks
 */
export class FormbricksManager {
  private static instance: FormbricksManager;
  private initialized = false;
  private initializationPromise: Promise<void> | null = null;
  private isAvailable = false;

  private constructor() {
    // Private constructor for singleton pattern
  }

  /**
   * Get the singleton instance of FormbricksManager
   */
  static getInstance(): FormbricksManager {
    if (!FormbricksManager.instance) {
      FormbricksManager.instance = new FormbricksManager();
    }
    return FormbricksManager.instance;
  }

  /**
   * Initialize the Formbricks SDK with proper error handling
   * @param config Configuration object with environmentId and appUrl
   */
  async initialize(config: { environmentId: string; appUrl?: string }): Promise<void> {
    // Prevent multiple initializations
    if (this.initialized) {
      return;
    }

    // Return existing initialization promise if one is in progress
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.performInitialization(config);
    return this.initializationPromise;
  }

  /**
   * Perform the actual SDK initialization
   */
  private async performInitialization(config: { environmentId: string; appUrl?: string }): Promise<void> {
    try {
      // Validate required configuration
      if (!config.environmentId) {
        throw new Error('Formbricks environmentId is required');
      }

      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        console.warn('Formbricks can only be initialized in browser environment');
        return;
      }

      // Initialize Formbricks SDK using v4 API
      formbricks.setup({
        environmentId: config.environmentId,
        appUrl: config.appUrl || 'https://app.formbricks.com',
      });

      this.initialized = true;
      this.isAvailable = true;
      
      console.log('✅ Formbricks SDK initialized successfully');
    } catch (error) {
      console.error('❌ Formbricks initialization failed:', error);
      this.handleInitializationError(error);
    }
  }

  /**
   * Handle initialization errors with graceful degradation
   */
  private handleInitializationError(error: unknown): void {
    this.initialized = false;
    this.isAvailable = false;
    
    // Log error details in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Formbricks initialization error details:', error);
    }

    // In production, fail silently to not break the user experience
    // The app will continue to work without feedback collection
  }

  /**
   * Set user attributes for personalized surveys
   */
  setAttributes(attributes: Record<string, any>): void {
    if (!this.isInitialized()) {
      console.warn('Formbricks not initialized, skipping setAttributes');
      return;
    }

    try {
      formbricks.setAttributes(attributes);
    } catch (error) {
      console.error('Failed to set Formbricks attributes:', error);
    }
  }

  /**
   * Track custom events for survey triggers
   */
  track(eventName: string, properties?: Record<string, any>): void {
    if (!this.isInitialized()) {
      console.warn('Formbricks not initialized, skipping track event:', eventName);
      return;
    }

    try {
      // Formbricks v4 expects specific structure - adapt our properties
      const trackProperties = properties ? {
        ...properties,
        hiddenFields: properties.hiddenFields || {}
      } : undefined;
      
      formbricks.track(eventName, trackProperties);
    } catch (error) {
      console.error('Failed to track Formbricks event:', error);
    }
  }

  /**
   * Register route changes for page-based surveys
   */
  registerRouteChange(): void {
    if (!this.isInitialized()) {
      console.warn('Formbricks not initialized, skipping registerRouteChange');
      return;
    }

    try {
      formbricks.registerRouteChange();
    } catch (error) {
      console.error('Failed to register Formbricks route change:', error);
    }
  }

  /**
   * Check if Formbricks is properly initialized and available
   */
  isInitialized(): boolean {
    return this.initialized && this.isAvailable;
  }

  /**
   * Reset the initialization state (useful for testing)
   */
  reset(): void {
    this.initialized = false;
    this.isAvailable = false;
    this.initializationPromise = null;
  }

  /**
   * Get initialization status for debugging
   */
  getStatus(): { initialized: boolean; available: boolean } {
    return {
      initialized: this.initialized,
      available: this.isAvailable,
    };
  }
}

/**
 * Export a convenience function to get the singleton instance
 */
export const getFormbricksManager = () => FormbricksManager.getInstance();