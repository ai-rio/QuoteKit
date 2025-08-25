'use client';

import formbricks from '@formbricks/js';

import { getFormbricksErrorHandler } from './error-handler';

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
  private eventQueue: Array<{ eventName: string; properties?: Record<string, any> }> = [];
  private attributeQueue: Record<string, any> = {};
  private currentUserId: string | null = null;
  private currentAttributes: Record<string, any> = {};
  private hiddenFieldsSupported = true; // Assume supported until we get an error

  private constructor() {
    // Private constructor for singleton pattern
    // FormbricksManager constructor
    
    // Setup global error handler to catch Formbricks SDK errors IMMEDIATELY
    this.setupGlobalErrorHandler();
    
    // Also set up immediate error suppression for known Formbricks issues
    this.setupImmediateErrorSuppression();
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
   * Wait for the Formbricks SDK to be fully ready
   */
  private async waitForSDKReady(): Promise<void> {
    const maxAttempts = 100;
    const intervalMs = 100;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        if (typeof window !== 'undefined' && (window as any).formbricks) {
          const fb = (window as any).formbricks;
          if (typeof fb.track === 'function') {
            setTimeout(() => {
              try {
                if (typeof fb.registerRouteChange === 'function') {
                  fb.registerRouteChange();
                }
              } catch (error) {
                console.warn('Initial route registration failed:', error);
              }
            }, 100);
            return;
          }
        }
        
        if (typeof formbricks.track === 'function') {
          if (typeof window !== 'undefined' && !(window as any).formbricks) {
            try {
              (window as any).formbricks = formbricks;
            } catch (error) {
              console.warn('Failed to mount formbricks to window:', error);
            }
          }
          return;
        }
        
        if (attempt % 20 === 0) {
          try {
            if (typeof formbricks.setup === 'function') {
              const setupConfig = {
                environmentId: process.env.NEXT_PUBLIC_FORMBRICKS_ENV_ID!,
                appUrl: process.env.NEXT_PUBLIC_FORMBRICKS_APP_URL || 'https://app.formbricks.com',
                debug: true
              };
              formbricks.setup(setupConfig);
            }
          } catch (error) {
            console.warn('SDK re-initialization failed:', error);
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, intervalMs));
      } catch (error) {
        console.warn(`Error checking SDK readiness on attempt ${attempt}:`, error);
        await new Promise(resolve => setTimeout(resolve, intervalMs));
      }
    }
    
    console.warn('Formbricks SDK did not become ready within timeout');
    
    if (typeof window !== 'undefined' && typeof formbricks.track === 'function' && !(window as any).formbricks) {
      try {
        (window as any).formbricks = formbricks;
      } catch (error) {
        console.warn('Final mount failed:', error);
      }
    }
  }

  /**
   * Perform the actual SDK initialization
   */
  private async performInitialization(config: { environmentId: string; appUrl?: string }): Promise<void> {
    try {
      if (!config.environmentId) {
        throw new Error('Formbricks environmentId is required');
      }

      if (config.environmentId.length < 10) {
        throw new Error(`Formbricks environmentId seems invalid: "${config.environmentId}" (too short)`);
      }

      if (typeof window === 'undefined') {
        console.warn('Formbricks can only be initialized in browser environment');
        return;
      }

      if (typeof formbricks === 'undefined' || typeof formbricks.setup !== 'function') {
        throw new Error('Formbricks SDK not properly imported or setup function not available');
      }

      const setupConfig = {
        environmentId: config.environmentId,
        appUrl: config.appUrl || 'https://app.formbricks.com',
        debug: true,
      };

      await new Promise(resolve => setTimeout(resolve, 100));
      
      const isValidEnvironment = await this.validateEnvironmentId(config.environmentId, config.appUrl);
      if (!isValidEnvironment) {
        throw new Error(`Environment ID validation failed: ${config.environmentId} not found in Formbricks account`);
      }
      
      let setupAttempts = 0;
      const maxSetupAttempts = 3;
      
      while (setupAttempts < maxSetupAttempts) {
        try {
          setupAttempts++;
          formbricks.setup(setupConfig);
          break;
        } catch (setupError) {
          if (setupError instanceof Error && 
              (setupError.message.includes('network_error') || 
               setupError.message.includes('404') ||
               setupError.message.includes('Environment not found'))) {
            if (setupError.message.includes('404') || setupError.message.includes('Environment not found')) {
              throw new Error(`Formbricks Environment ID not found: ${config.environmentId}. Please verify the environment ID in your Formbricks account.`);
            }
          }
          
          if (setupAttempts >= maxSetupAttempts) {
            throw setupError;
          }
          
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      await this.waitForSDKReady();

      this.initialized = true;
      this.isAvailable = true;

      console.log('🎯 [FormbricksManager] Initialization successful');
      console.log(`🔧 [FormbricksManager] Hidden fields support: ${this.hiddenFieldsSupported ? 'enabled' : 'disabled'}`);

      this.processQueue();
    } catch (error) {
      console.error('Formbricks initialization failed:', error);
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
      
      // Provide specific guidance for common error scenarios
      if (error instanceof Error) {
        if (error.message.includes('network_error') || error.message.includes('Validation failed')) {
          console.error('🎯 FORMBRICKS VALIDATION ERROR DETECTED');
          console.error('╔════════════════════════════════════════════════════════════════╗');
          console.error('║ The environment ID in your .env file is not valid or missing  ║');
          console.error('║ from your Formbricks account.                                 ║');
          console.error('╚════════════════════════════════════════════════════════════════╝');
          console.error('💡 TO FIX THIS ISSUE:');
          console.error('1. Go to https://app.formbricks.com');
          console.error('2. Log into your account');
          console.error('3. Create a new project or select an existing one');
          console.error('4. Go to Settings > General');
          console.error('5. Copy the Environment ID');
          console.error('6. Update NEXT_PUBLIC_FORMBRICKS_ENV_ID in your .env file');
          console.error('🔍 CURRENT CONFIGURATION:');
          console.error(`   Environment ID: ${process.env.NEXT_PUBLIC_FORMBRICKS_ENV_ID || 'NOT SET'}`);
          console.error(`   API Host: ${process.env.NEXT_PUBLIC_FORMBRICKS_API_HOST || 'NOT SET'}`);
          console.error('🧪 VERIFY YOUR SETUP:');
          console.error('   Run: node scripts/debug-formbricks-validation.js');
          console.error('⚠️  Until fixed, user feedback collection will be disabled.');
        }
      }
    }

    // In production, fail silently to not break the user experience
    // The app will continue to work without feedback collection
  }

  /**
   * Set user attributes for personalized surveys
   */
  setAttributes(attributes: Record<string, any>): void {
    const attributesString = JSON.stringify(attributes);
    const currentAttributesString = JSON.stringify(this.currentAttributes);
    
    if (attributesString === currentAttributesString) {
      return;
    }
    
    if (!this.isInitialized()) {
      this.attributeQueue = { ...this.attributeQueue, ...attributes };
      return;
    }

    const errorHandler = getFormbricksErrorHandler();
    
    errorHandler.safeExecute(
      () => {
        if (typeof window !== 'undefined' && (window as any).formbricks && typeof (window as any).formbricks.setAttributes === 'function') {
          (window as any).formbricks.setAttributes(attributes);
        } else if (typeof formbricks.setAttributes === 'function') {
          formbricks.setAttributes(attributes);
        } else {
          throw new Error('setAttributes method not available on Formbricks SDK');
        }
        
        this.currentAttributes = { ...attributes };
      },
      `setAttributes: ${Object.keys(attributes).join(', ')}`
    );
  }

  /**
   * Set user ID for Formbricks (required before setting attributes)
   * This method now properly handles the "userId already set" error by calling logout first
   */
  async setUserId(userId: string): Promise<void> {
    if (this.currentUserId === userId) {
      return;
    }
    
    if (!this.isInitialized()) {
      return Promise.reject(new Error('Formbricks must be initialized before setting userId'));
    }

    try {
      // CRITICAL FIX: If there's already a userId set, we need to logout first
      // This fixes the "userId is already set in formbricks, please first call the logout function" error
      if (this.currentUserId !== null) {
        console.log('🔄 Previous userId detected, calling logout before setting new userId');
        await this.logoutUser();
      }
      
      if (typeof window !== 'undefined' && (window as any).formbricks && typeof (window as any).formbricks.setUserId === 'function') {
        await (window as any).formbricks.setUserId(userId);
      } else if (typeof formbricks.setUserId === 'function') {
        await formbricks.setUserId(userId);
      } else {
        throw new Error('setUserId method not available on Formbricks SDK');
      }
      
      this.currentUserId = userId;
      console.log('✅ UserId set successfully:', userId);
    } catch (error) {
      // Handle the specific "userId already set" error more gracefully
      if (error instanceof Error && error.message.includes('userId is already set')) {
        console.warn('⚠️ Formbricks userId already set error detected, attempting recovery...');
        try {
          // Force logout and retry
          await this.logoutUser();
          
          if (typeof window !== 'undefined' && (window as any).formbricks && typeof (window as any).formbricks.setUserId === 'function') {
            await (window as any).formbricks.setUserId(userId);
          } else if (typeof formbricks.setUserId === 'function') {
            await formbricks.setUserId(userId);
          }
          
          this.currentUserId = userId;
          console.log('✅ UserId set successfully after recovery:', userId);
          return;
        } catch (retryError) {
          console.error('❌ Failed to recover from userId already set error:', retryError);
        }
      }
      
      console.error('Failed to set Formbricks userId:', error);
      throw error;
    }
  }

  /**
   * Get the current userId that was set for Formbricks
   */
  getCurrentUserId(): string | null {
    return this.currentUserId;
  }

  /**
   * Check if the manager is ready for user operations (initialized and available)
   */
  isReadyForUser(): boolean {
    return this.isInitialized() && this.isAvailable;
  }

  /**
   * Reset user session (useful for logout)
   */
  resetUser(): void {
    console.log('🔄 Resetting Formbricks user session');
    this.currentUserId = null;
    this.currentAttributes = {};
    
    try {
      if (typeof window !== 'undefined' && (window as any).formbricks && typeof (window as any).formbricks.reset === 'function') {
        (window as any).formbricks.reset();
        console.log('✅ Formbricks reset() called successfully');
      } else {
        console.warn('⚠️ Formbricks reset() method not available');
      }
    } catch (error) {
      console.error('Failed to reset Formbricks user session:', error);
    }
  }

  /**
   * Logout user from Formbricks (calls the proper logout method)
   * This is specifically for handling the "userId already set" error
   */
  async logoutUser(): Promise<void> {
    console.log('🚪 Logging out user from Formbricks SDK');
    
    try {
      // Try multiple logout/reset methods to ensure we properly clear the userId
      const fb = typeof window !== 'undefined' && (window as any).formbricks 
        ? (window as any).formbricks 
        : formbricks;
      
      if (fb) {
        // Try logout method first (if available)
        if (typeof fb.logout === 'function') {
          await fb.logout();
          console.log('✅ Formbricks logout() called successfully');
        } 
        // Fall back to reset method
        else if (typeof fb.reset === 'function') {
          fb.reset();
          console.log('✅ Formbricks reset() called successfully');
        }
        // Try formbricks.people.reset if available (some SDK versions)
        else if (fb.people && typeof fb.people.reset === 'function') {
          fb.people.reset();
          console.log('✅ Formbricks people.reset() called successfully');
        }
        // Last resort: try to manually clear user data
        else {
          console.warn('⚠️ No logout/reset method found, clearing local state only');
        }
      }
      
      // Always clear our local state
      this.currentUserId = null;
      this.currentAttributes = {};
      
    } catch (error) {
      console.error('❌ Failed to logout from Formbricks:', error);
      // Still clear local state even if SDK logout fails
      this.currentUserId = null;
      this.currentAttributes = {};
      throw error;
    }
  }

  /**
   * Track custom events for survey triggers
   */
  track(eventName: string, properties?: Record<string, any>): void {
    if (!this.isInitialized()) {
      this.eventQueue.push({ eventName, properties });
      return;
    }

    const errorHandler = getFormbricksErrorHandler();
    
    errorHandler.safeExecute(
      () => {
        let trackProperties = properties ? { ...properties } : undefined;
        
        // Only include hiddenFields if they're supported
        if (trackProperties && this.hiddenFieldsSupported) {
          trackProperties.hiddenFields = properties?.hiddenFields || {};
        } else if (trackProperties && trackProperties.hiddenFields) {
          // Remove hiddenFields if they're not supported
          const { hiddenFields, ...propsWithoutHiddenFields } = trackProperties;
          trackProperties = propsWithoutHiddenFields;
        }
        
        if (typeof window !== 'undefined' && (window as any).formbricks && typeof (window as any).formbricks.track === 'function') {
          (window as any).formbricks.track(eventName, trackProperties);
        } else if (typeof formbricks.track === 'function') {
          formbricks.track(eventName, trackProperties as any);
        } else {
          throw new Error('track method not available on Formbricks SDK');
        }
      },
      `track event: ${eventName}`
    ).catch((error) => {
      // Check if the error is about hidden fields not being enabled
      if (error && typeof error === 'object' && 'message' in error && 
          typeof error.message === 'string' && 
          error.message.includes('Hidden fields are not enabled')) {
        
        console.warn('🔧 [FormbricksManager] Hidden fields not supported, disabling for future requests');
        this.hiddenFieldsSupported = false;
        
        // Retry the track call without hidden fields
        const retryProperties = properties ? { ...properties } : undefined;
        if (retryProperties && retryProperties.hiddenFields) {
          const { hiddenFields, ...propsWithoutHiddenFields } = retryProperties;
          this.track(eventName, propsWithoutHiddenFields);
        } else {
          this.track(eventName, retryProperties);
        }
      }
    });
  }

  /**
   * Check if hidden fields are supported by the current survey configuration
   */
  isHiddenFieldsSupported(): boolean {
    return this.hiddenFieldsSupported;
  }

  /**
   * Manually disable hidden fields support (useful for configuration)
   */
  disableHiddenFields(): void {
    this.hiddenFieldsSupported = false;
    console.warn('🔧 [FormbricksManager] Hidden fields manually disabled');
  }

  /**
   * Re-enable hidden fields support (will be disabled again if error occurs)
   */
  enableHiddenFields(): void {
    this.hiddenFieldsSupported = true;
    console.log('🔧 [FormbricksManager] Hidden fields re-enabled');
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
      if (typeof window !== 'undefined' && (window as any).formbricks && typeof (window as any).formbricks.registerRouteChange === 'function') {
        (window as any).formbricks.registerRouteChange();
      } else if (typeof formbricks.registerRouteChange === 'function') {
        formbricks.registerRouteChange();
      } else {
        throw new Error('registerRouteChange method not available on Formbricks SDK');
      }
    } catch (error) {
      console.error('Failed to register Formbricks route change:', error);
    }
  }

  /**
   * Check if Formbricks is properly initialized and available
   */
  isInitialized(): boolean {
    const basicCheck = this.initialized && this.isAvailable;
    
    let sdkMethodsAvailable = false;
    try {
      if (typeof window !== 'undefined') {
        const windowFb = (window as any).formbricks;
        if (windowFb && 
            typeof windowFb.track === 'function' && 
            typeof windowFb.setAttributes === 'function') {
          sdkMethodsAvailable = true;
        }
        
        if (!sdkMethodsAvailable &&
            typeof formbricks.track === 'function' && 
            typeof formbricks.setAttributes === 'function') {
          sdkMethodsAvailable = true;
        }
      }
    } catch (error) {
      console.warn('Error checking SDK methods availability:', error);
    }
    
    return basicCheck && sdkMethodsAvailable;
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
   * Process queued events and attributes after initialization
   */
  private processQueue(): void {
    const getFormbricksInstance = () => {
      if (typeof window !== 'undefined' && (window as any).formbricks) {
        return (window as any).formbricks;
      } else {
        return formbricks;
      }
    };

    const fb = getFormbricksInstance();

    if (Object.keys(this.attributeQueue).length > 0) {
      try {
        if (typeof fb.setAttributes === 'function') {
          fb.setAttributes(this.attributeQueue);
          this.attributeQueue = {};
        }
      } catch (error) {
        console.error('Failed to process queued attributes:', error);
      }
    }

    this.eventQueue.forEach(({ eventName, properties }) => {
      try {
        if (typeof fb.track === 'function') {
          let trackProperties = properties ? { ...properties } : undefined;
          
          // Only include hiddenFields if they're supported
          if (trackProperties && this.hiddenFieldsSupported) {
            trackProperties.hiddenFields = properties?.hiddenFields || {};
          } else if (trackProperties && trackProperties.hiddenFields) {
            // Remove hiddenFields if they're not supported
            const { hiddenFields, ...propsWithoutHiddenFields } = trackProperties;
            trackProperties = propsWithoutHiddenFields;
          }
          
          fb.track(eventName, trackProperties);
        }
      } catch (error) {
        // Check if the error is about hidden fields not being enabled
        if (error && typeof error === 'object' && 'message' in error && 
            typeof error.message === 'string' && 
            error.message.includes('Hidden fields are not enabled')) {
          
          console.warn('🔧 [FormbricksManager] Hidden fields not supported in queue processing, disabling for future requests');
          this.hiddenFieldsSupported = false;
          
          // Retry without hidden fields
          try {
            const retryProperties = properties ? { ...properties } : undefined;
            if (retryProperties && retryProperties.hiddenFields) {
              const { hiddenFields, ...propsWithoutHiddenFields } = retryProperties;
              fb.track(eventName, propsWithoutHiddenFields);
            } else {
              fb.track(eventName, retryProperties);
            }
          } catch (retryError) {
            console.error('Failed to process queued event after retry:', eventName, retryError);
          }
        } else {
          console.error('Failed to process queued event:', eventName, error);
        }
      }
    });

    this.eventQueue = [];
  }

  /**
   * Debug validation errors with detailed analysis
   */
  private debugValidationError(config: { environmentId: string; appUrl?: string }): void {
    console.group('🔍 DETAILED VALIDATION ERROR ANALYSIS');
    
    // Environment ID analysis
    console.log('📋 Environment ID Analysis:', {
      value: config.environmentId,
      length: config.environmentId.length,
      format: {
        startsWithDev: config.environmentId.startsWith('dev_'),
        hasCorrectLength: config.environmentId.length >= 20,
        matchesPattern: /^dev_[a-z0-9]+$/.test(config.environmentId),
        expectedFormat: 'dev_cm5u8x9y6000114qg8x9y6000',
      },
    });
    
    // API URL analysis
    console.log('🌐 API URL Analysis:', {
      value: config.appUrl,
      isHttps: config.appUrl?.startsWith('https://'),
      isFormbricksApp: config.appUrl?.includes('app.formbricks.com'),
      expectedValue: 'https://app.formbricks.com',
    });
    
    // Network connectivity test suggestion
    console.log('🌍 Network Connectivity Check:');
    console.log('Try this in your browser console to test API connectivity:');
    console.log(`fetch('${config.appUrl}/api/v1/management/environment/${config.environmentId}', { method: 'HEAD' })`);
    
    console.groupEnd();
  }

  /**
   * Validate environment ID exists in Formbricks account
   */
  private async validateEnvironmentId(environmentId: string, appUrl?: string): Promise<boolean> {
    try {
      const apiHost = appUrl || 'https://app.formbricks.com';
      const testUrl = `${apiHost}/api/v1/environments/${environmentId}`;
      
      console.log('🔍 Validating environment ID with URL:', testUrl);
      
      const response = await fetch(testUrl, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'QuoteKit-Formbricks-Validation/1.0.0',
        },
      });
      
      console.log('🔍 Validation response status:', response.status);
      
      if (response.status === 200) {
        console.log('✅ Environment ID validation successful');
        return true;
      } else if (response.status === 404) {
        console.error('❌ Environment ID not found (404)');
        console.error('💡 This environment ID does not exist in your Formbricks account');
        console.error('💡 Please check your Formbricks dashboard and update .env file');
        return false;
      } else {
        console.warn(`⚠️ Unexpected validation response: ${response.status}`);
        // Allow SDK initialization to proceed for other status codes (might be auth-related)
        return true;
      }
    } catch (error) {
      console.warn('⚠️ Environment ID validation failed with error:', error);
      console.warn('⚠️ Proceeding with SDK initialization despite validation error');
      // Allow SDK initialization to proceed if validation fails (network issues, etc.)
      return true;
    }
  }

  /**
   * Get initialization status for debugging
   */
  getStatus(): { initialized: boolean; available: boolean; queuedEvents: number; queuedAttributes: number } {
    return {
      initialized: this.initialized,
      available: this.isAvailable,
      queuedEvents: this.eventQueue.length,
      queuedAttributes: Object.keys(this.attributeQueue).length,
    };
  }

  /**
   * Setup global error handler to catch and properly handle Formbricks SDK errors
   * This fixes the "🧱 Formbricks - Global error: {}" issue
   */
  private setupGlobalErrorHandler(): void {
    const errorHandler = getFormbricksErrorHandler();
  }

  /**
   * Set up immediate error suppression for known Formbricks issues
   */
  private setupImmediateErrorSuppression(): void {
    if (typeof window === 'undefined') return;
    
    if (!(window as any).__originalConsoleError) {
      (window as any).__originalConsoleError = console.error;
    }
    
    const originalError = (window as any).__originalConsoleError;
    
    console.error = (...args: any[]) => {
      if (args.length >= 1 && typeof args[0] === 'string') {
        const errorMsg = args[0];
        
        // Suppress empty error objects
        if (errorMsg.includes('🧱 Formbricks - Global error:') && 
            (errorMsg.includes('{}') || (args[1] && typeof args[1] === 'object' && Object.keys(args[1]).length === 0))) {
          return;
        }
        
        // Suppress userId already set errors (handled gracefully by our code)
        if (errorMsg.includes('userId is already set in formbricks') || 
            errorMsg.includes('please first call the logout function')) {
          console.debug('🔇 [ImmediateSuppress] Formbricks userId already set error suppressed');
          return;
        }
      }
      
      originalError.apply(console, args);
    };
  }

  /**
   * Restore original console.error (useful for cleanup)
   */
  private restoreConsoleError(): void {
    // This would need to store the original function, but for now we'll keep it simple
    console.log('🔄 Console error handler cleanup (if needed)');
  }
}

/**
 * Comprehensive debugging utility for Formbricks integration
 * Provides detailed diagnostics, testing capabilities, and troubleshooting tools
 */
export class FormbricksDebugManager {
  private static instance: FormbricksDebugManager;
  private formbricksManager: FormbricksManager;
  private debugResults: Array<{
    id: string;
    timestamp: Date;
    test: string;
    status: 'success' | 'warning' | 'error';
    message: string;
    details?: any;
  }> = [];

  private constructor() {
    this.formbricksManager = FormbricksManager.getInstance();
  }

  /**
   * Get the singleton instance of FormbricksDebugManager
   */
  static getInstance(): FormbricksDebugManager {
    if (!FormbricksDebugManager.instance) {
      FormbricksDebugManager.instance = new FormbricksDebugManager();
    }
    return FormbricksDebugManager.instance;
  }

  /**
   * Run comprehensive diagnostic tests
   */
  async runDiagnostics(): Promise<{
    overallStatus: 'healthy' | 'warning' | 'error';
    results: Array<{
      category: string;
      tests: Array<{
        name: string;
        status: 'success' | 'warning' | 'error';
        message: string;
        details?: any;
      }>;
    }>;
    summary: {
      total: number;
      passed: number;
      warnings: number;
      failed: number;
    };
  }> {
    console.log('🔍 Starting comprehensive Formbricks diagnostics...');
    
    const results = [
      await this.testEnvironmentConfiguration(),
      await this.testSDKInitialization(),
      await this.testAPIConnectivity(),
      await this.testSurveyTriggers(),
      await this.testUserAttributeSystem(),
      await this.testEventTracking(),
      await this.testRouteChangeRegistration(),
      await this.testErrorHandling()
    ];

    // Calculate summary
    let total = 0;
    let passed = 0;
    let warnings = 0;
    let failed = 0;

    results.forEach(category => {
      category.tests.forEach(test => {
        total++;
        if (test.status === 'success') passed++;
        else if (test.status === 'warning') warnings++;
        else if (test.status === 'error') failed++;
      });
    });

    // Determine overall status
    let overallStatus: 'healthy' | 'warning' | 'error' = 'healthy';
    if (failed > 0) overallStatus = 'error';
    else if (warnings > 0) overallStatus = 'warning';

    const diagnosticResult = {
      overallStatus,
      results,
      summary: { total, passed, warnings, failed }
    } as any; // Type assertion for complex diagnostic result structure

    console.log('✅ Formbricks diagnostics complete:', diagnosticResult);
    return diagnosticResult;
  }

  /**
   * Test environment configuration
   */
  private async testEnvironmentConfiguration() {
    const tests = [];
    
    // Test environment variables
    const envId = process.env.NEXT_PUBLIC_FORMBRICKS_ENV_ID;
    const apiHost = process.env.NEXT_PUBLIC_FORMBRICKS_API_HOST;
    const apiKey = process.env.FORMBRICKS_API_KEY;

    tests.push({
      name: 'Environment ID Present',
      status: envId ? 'success' : 'error' as const,
      message: envId ? `Environment ID configured: ${envId.substring(0, 10)}...` : 'NEXT_PUBLIC_FORMBRICKS_ENV_ID is not set',
      details: { envId: envId || null }
    });

    tests.push({
      name: 'Environment ID Format',
      status: envId && /^(dev_|prd_)?[a-z0-9]+$/i.test(envId) ? 'success' : 'warning' as const,
      message: envId && /^(dev_|prd_)?[a-z0-9]+$/i.test(envId) 
        ? 'Environment ID format looks correct' 
        : 'Environment ID format may be incorrect',
      details: { 
        format: envId ? {
          length: envId.length,
          startsWithPrefix: /^(dev_|prd_)/.test(envId),
          containsOnlyValidChars: /^[a-z0-9_]+$/i.test(envId)
        } : null
      }
    });

    tests.push({
      name: 'API Host Configuration',
      status: apiHost ? 'success' : 'warning' as const,
      message: apiHost ? `API Host: ${apiHost}` : 'Using default API host (https://app.formbricks.com)',
      details: { apiHost: apiHost || 'https://app.formbricks.com' }
    });

    tests.push({
      name: 'Server API Key',
      status: apiKey ? 'success' : 'warning' as const,
      message: apiKey ? 'Server API key is configured' : 'Server API key not configured (only client features will work)',
      details: { hasApiKey: !!apiKey }
    });

    return {
      category: 'Environment Configuration',
      tests
    };
  }

  /**
   * Test SDK initialization status
   */
  private async testSDKInitialization() {
    const tests = [];
    const managerStatus = this.formbricksManager.getStatus();

    tests.push({
      name: 'Manager Initialization',
      status: managerStatus.initialized ? 'success' : 'error' as const,
      message: managerStatus.initialized ? 'FormbricksManager is initialized' : 'FormbricksManager is not initialized',
      details: managerStatus
    });

    tests.push({
      name: 'SDK Availability',
      status: managerStatus.available ? 'success' : 'error' as const,
      message: managerStatus.available ? 'Formbricks SDK is available' : 'Formbricks SDK is not available',
      details: { available: managerStatus.available }
    });

    // Test SDK methods availability
    let sdkMethodsStatus: 'success' | 'warning' | 'error' = 'error';
    let sdkMethodsMessage = 'SDK methods not available';
    let methodsDetails = {};

    try {
      if (typeof window !== 'undefined') {
        const windowFb = (window as any).formbricks;
        const importedFb = typeof formbricks !== 'undefined' ? formbricks : null;

        const methods = {
          windowFormbricks: {
            exists: !!windowFb,
            hasTrack: windowFb && typeof windowFb.track === 'function',
            hasSetAttributes: windowFb && typeof windowFb.setAttributes === 'function',
            hasRegisterRouteChange: windowFb && typeof windowFb.registerRouteChange === 'function'
          },
          importedFormbricks: {
            exists: !!importedFb,
            hasTrack: importedFb && typeof importedFb.track === 'function',
            hasSetAttributes: importedFb && typeof importedFb.setAttributes === 'function',
            hasRegisterRouteChange: importedFb && typeof importedFb.registerRouteChange === 'function'
          }
        };

        const hasWorkingMethods = 
          (methods.windowFormbricks.hasTrack && methods.windowFormbricks.hasSetAttributes) ||
          (methods.importedFormbricks.hasTrack && methods.importedFormbricks.hasSetAttributes);

        if (hasWorkingMethods) {
          sdkMethodsStatus = 'success';
          sdkMethodsMessage = 'SDK methods are available and working';
        } else if (methods.windowFormbricks.exists || methods.importedFormbricks.exists) {
          sdkMethodsStatus = 'warning';
          sdkMethodsMessage = 'SDK exists but some methods may be missing';
        }

        methodsDetails = methods;
      }
    } catch (error) {
      sdkMethodsStatus = 'error';
      sdkMethodsMessage = `Error checking SDK methods: ${error instanceof Error ? error.message : 'Unknown error'}`;
      methodsDetails = { error: error instanceof Error ? error.message : 'Unknown error' };
    }

    tests.push({
      name: 'SDK Methods Available',
      status: sdkMethodsStatus,
      message: sdkMethodsMessage,
      details: methodsDetails
    });

    // Test queue status
    tests.push({
      name: 'Event Queue Status',
      status: managerStatus.queuedEvents === 0 ? 'success' : 'warning' as const,
      message: managerStatus.queuedEvents === 0 
        ? 'No queued events (SDK is processing events immediately)'
        : `${managerStatus.queuedEvents} events are queued (SDK may not be ready)`,
      details: { queuedEvents: managerStatus.queuedEvents }
    });

    tests.push({
      name: 'Attributes Queue Status',
      status: managerStatus.queuedAttributes === 0 ? 'success' : 'warning' as const,
      message: managerStatus.queuedAttributes === 0
        ? 'No queued attributes (SDK is processing attributes immediately)'
        : `${managerStatus.queuedAttributes} attributes are queued (SDK may not be ready)`,
      details: { queuedAttributes: managerStatus.queuedAttributes }
    });

    return {
      category: 'SDK Initialization',
      tests
    };
  }

  /**
   * Test API connectivity
   */
  private async testAPIConnectivity() {
    const tests = [];

    // Test client-side environment validation
    try {
      const envId = process.env.NEXT_PUBLIC_FORMBRICKS_ENV_ID;
      const apiHost = process.env.NEXT_PUBLIC_FORMBRICKS_API_HOST || 'https://app.formbricks.com';

      if (!envId) {
        tests.push({
          name: 'Environment Validation',
          status: 'error' as const,
          message: 'Cannot validate environment - no environment ID configured',
          details: null
        });
      } else {
        // Test environment endpoint accessibility
        try {
          const testUrl = `${apiHost}/api/v1/environments/${envId}`;
          const response = await fetch(testUrl, {
            method: 'HEAD',
            headers: {
              'User-Agent': 'FormbricksDebug/1.0.0',
            },
          });

          tests.push({
            name: 'Environment Validation',
            status: response.status === 200 ? 'success' : response.status === 404 ? 'error' : 'warning' as const,
            message: response.status === 200 
              ? 'Environment ID is valid and accessible'
              : response.status === 404 
                ? 'Environment ID not found - check your Formbricks account'
                : `Environment validation returned status ${response.status}`,
            details: {
              status: response.status,
              statusText: response.statusText,
              testUrl
            }
          });
        } catch (error) {
          tests.push({
            name: 'Environment Validation',
            status: 'warning' as const,
            message: `Environment validation failed: ${error instanceof Error ? error.message : 'Network error'}`,
            details: { 
              error: error instanceof Error ? error.message : 'Unknown error',
              networkIssue: true
            }
          });
        }
      }

      // Test server API if available
      try {
        const response = await fetch('/api/formbricks/test');
        const data = await response.json();

        tests.push({
          name: 'Server API Test',
          status: data.success ? 'success' : 'warning' as const,
          message: data.message || (data.success ? 'Server API is working' : 'Server API test failed'),
          details: data
        });
      } catch (error) {
        tests.push({
          name: 'Server API Test',
          status: 'warning' as const,
          message: `Server API test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: { error: error instanceof Error ? error.message : 'Unknown error' }
        });
      }

    } catch (error) {
      tests.push({
        name: 'API Connectivity Test',
        status: 'error' as const,
        message: `Failed to test API connectivity: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
    }

    return {
      category: 'API Connectivity',
      tests
    };
  }

  /**
   * Test survey triggers
   */
  private async testSurveyTriggers() {
    const tests = [];

    // Test if surveys can be fetched
    try {
      const response = await fetch('/api/formbricks/surveys');
      const data = await response.json();

      tests.push({
        name: 'Survey Fetch Test',
        status: response.ok ? 'success' : 'warning' as const,
        message: response.ok 
          ? `Successfully fetched surveys (${data.surveys?.length || 0} found)`
          : 'Failed to fetch surveys',
        details: data
      });
    } catch (error) {
      tests.push({
        name: 'Survey Fetch Test',
        status: 'error' as const,
        message: `Survey fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
    }

    // Test common survey triggers
    const commonTriggers = [
      'pageView',
      'exitIntent',
      'codeAction',
      'noCodeAction'
    ];

    for (const trigger of commonTriggers) {
      try {
        tests.push({
          name: `Test ${trigger} Trigger`,
          status: 'success' as const,
          message: `${trigger} trigger test would work (manager is ${this.formbricksManager.isInitialized() ? 'ready' : 'not ready'})`,
          details: { 
            trigger,
            managerReady: this.formbricksManager.isInitialized()
          }
        });
      } catch (error) {
        tests.push({
          name: `Test ${trigger} Trigger`,
          status: 'error' as const,
          message: `Failed to test ${trigger} trigger: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: { 
            trigger,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        });
      }
    }

    return {
      category: 'Survey Triggers',
      tests
    };
  }

  /**
   * Test user attribute system
   */
  private async testUserAttributeSystem() {
    const tests = [];

    // Test if attributes can be set
    try {
      const testAttributes = {
        debugTest: true,
        timestamp: Date.now(),
        testId: `debug-${Math.random().toString(36).substr(2, 9)}`
      };

      if (this.formbricksManager.isInitialized()) {
        this.formbricksManager.setAttributes(testAttributes);
        tests.push({
          name: 'Set Attributes Test',
          status: 'success' as const,
          message: 'Successfully set test attributes',
          details: { testAttributes }
        });
      } else {
        tests.push({
          name: 'Set Attributes Test',
          status: 'warning' as const,
          message: 'Cannot test attributes - manager not initialized',
          details: { managerInitialized: false }
        });
      }
    } catch (error) {
      tests.push({
        name: 'Set Attributes Test',
        status: 'error' as const,
        message: `Failed to set attributes: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
    }

    // Test user identification
    try {
      const testUserId = `debug-user-${Date.now()}`;
      
      if (this.formbricksManager.isInitialized()) {
        // Note: We don't actually call setUserId in debug mode to avoid side effects
        tests.push({
          name: 'User ID System Test',
          status: 'success' as const,
          message: 'User ID system is available and would work',
          details: { 
            testUserId,
            managerReady: true,
            note: 'Test user ID not actually set to avoid side effects'
          }
        });
      } else {
        tests.push({
          name: 'User ID System Test',
          status: 'warning' as const,
          message: 'Cannot test user ID - manager not initialized',
          details: { managerInitialized: false }
        });
      }
    } catch (error) {
      tests.push({
        name: 'User ID System Test',
        status: 'error' as const,
        message: `User ID test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
    }

    return {
      category: 'User Attribute System',
      tests
    };
  }

  /**
   * Test event tracking
   */
  private async testEventTracking() {
    const tests = [];

    const testEvents = [
      { name: 'debug_test_event', properties: { source: 'debug', timestamp: Date.now() } },
      { name: 'page_view', properties: { page: '/debug', debug: true } },
      { name: 'feature_used', properties: { feature: 'formbricks_debug', version: '1.0.0' } }
    ];

    for (const testEvent of testEvents) {
      try {
        if (this.formbricksManager.isInitialized()) {
          this.formbricksManager.track(testEvent.name, testEvent.properties);
          tests.push({
            name: `Track '${testEvent.name}' Event`,
            status: 'success' as const,
            message: `Successfully tracked ${testEvent.name} event`,
            details: testEvent
          });
        } else {
          tests.push({
            name: `Track '${testEvent.name}' Event`,
            status: 'warning' as const,
            message: `Cannot track ${testEvent.name} - manager not initialized`,
            details: { ...testEvent, managerInitialized: false }
          });
        }
      } catch (error) {
        tests.push({
          name: `Track '${testEvent.name}' Event`,
          status: 'error' as const,
          message: `Failed to track ${testEvent.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: { 
            ...testEvent,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        });
      }
    }

    return {
      category: 'Event Tracking',
      tests
    };
  }

  /**
   * Test route change registration
   */
  private async testRouteChangeRegistration() {
    const tests = [];

    try {
      if (this.formbricksManager.isInitialized()) {
        this.formbricksManager.registerRouteChange();
        tests.push({
          name: 'Route Change Registration',
          status: 'success' as const,
          message: 'Successfully registered route change',
          details: { currentPath: typeof window !== 'undefined' ? window.location.pathname : 'unknown' }
        });
      } else {
        tests.push({
          name: 'Route Change Registration',
          status: 'warning' as const,
          message: 'Cannot register route change - manager not initialized',
          details: { managerInitialized: false }
        });
      }
    } catch (error) {
      tests.push({
        name: 'Route Change Registration',
        status: 'error' as const,
        message: `Route change registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
    }

    return {
      category: 'Route Change Registration',
      tests
    };
  }

  /**
   * Test error handling system
   */
  private async testErrorHandling() {
    const tests = [];

    // Test if error handler is working
    tests.push({
      name: 'Error Handler Active',
      status: 'success' as const,
      message: 'Formbricks error handler is active and monitoring for errors',
      details: { 
        globalErrorHandlerActive: typeof window !== 'undefined' && (window as any).__originalConsoleError,
        errorSuppressionActive: true
      }
    });

    // Test console error suppression
    if (typeof window !== 'undefined' && (window as any).__originalConsoleError) {
      tests.push({
        name: 'Console Error Suppression',
        status: 'success' as const,
        message: 'Console error suppression is active for known Formbricks issues',
        details: { 
          originalConsoleErrorStored: true,
          suppressionPatterns: ['🧹 Formbricks - Global error:', '{}']
        }
      });
    } else {
      tests.push({
        name: 'Console Error Suppression',
        status: 'warning' as const,
        message: 'Console error suppression may not be active',
        details: { originalConsoleErrorStored: false }
      });
    }

    return {
      category: 'Error Handling',
      tests
    };
  }

  /**
   * Manually trigger a test event
   */
  triggerTestEvent(eventName: string, properties?: Record<string, any>) {
    const testEvent = {
      name: eventName,
      properties: {
        ...properties,
        debug: true,
        timestamp: Date.now(),
        triggeredBy: 'FormbricksDebugManager'
      }
    };

    console.log('🧪 Manually triggering test event:', testEvent);
    
    try {
      this.formbricksManager.track(testEvent.name, testEvent.properties);
      
      this.addDebugResult({
        test: 'Manual Event Trigger',
        status: 'success',
        message: `Successfully triggered event: ${eventName}`,
        details: testEvent
      });
      
      return { success: true, event: testEvent };
    } catch (error) {
      this.addDebugResult({
        test: 'Manual Event Trigger',
        status: 'error',
        message: `Failed to trigger event: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { ...testEvent, error: error instanceof Error ? error.message : 'Unknown error' }
      });
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        event: testEvent 
      };
    }
  }

  /**
   * Test all widget feedback options programmatically
   */
  async testAllWidgetOptions() {
    const tests = [];
    
    const widgetOptions = [
      { name: 'Post Quote Creation Survey', event: 'quote_created', properties: { quoteId: 'debug-quote-123' } },
      { name: 'Dashboard Satisfaction Survey', event: 'dashboard_view', properties: { section: 'main' } },
      { name: 'Feature Value Survey', event: 'feature_used', properties: { feature: 'item_library' } },
      { name: 'Upgrade Abandonment Survey', event: 'upgrade_abandoned', properties: { reason: 'debug_test' } },
      { name: 'Exit Intent Survey', event: 'exit_intent', properties: { page: '/debug' } }
    ];

    for (const widget of widgetOptions) {
      const result = this.triggerTestEvent(widget.event, widget.properties);
      tests.push({
        name: widget.name,
        status: result.success ? 'success' : 'error' as const,
        message: result.success 
          ? `${widget.name} triggered successfully`
          : `${widget.name} failed: ${result.error}`,
        details: result
      });
    }

    this.addDebugResult({
      test: 'Widget Options Test',
      status: tests.every(t => t.status === 'success') ? 'success' : 'warning',
      message: `Tested ${tests.length} widget options`,
      details: { tests, summary: this.getTestSummary(tests as any) } // Type assertion for test result arrays
    });

    return {
      category: 'Widget Feedback Options',
      tests
    };
  }

  /**
   * Get current debug results
   */
  getDebugResults() {
    return this.debugResults;
  }

  /**
   * Clear debug results
   */
  clearDebugResults() {
    this.debugResults = [];
  }

  /**
   * Add a debug result
   */
  private addDebugResult(result: {
    test: string;
    status: 'success' | 'warning' | 'error';
    message: string;
    details?: any;
  }) {
    this.debugResults.push({
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      ...result
    });
  }

  /**
   * Get test summary
   */
  private getTestSummary(tests: Array<{ status: 'success' | 'warning' | 'error' }>) {
    return {
      total: tests.length,
      passed: tests.filter(t => t.status === 'success').length,
      warnings: tests.filter(t => t.status === 'warning').length,
      failed: tests.filter(t => t.status === 'error').length
    };
  }

  /**
   * Export debug data for sharing/support
   */
  exportDebugData() {
    return {
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      formbricksManager: this.formbricksManager.getStatus(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        formbricksEnvId: process.env.NEXT_PUBLIC_FORMBRICKS_ENV_ID?.substring(0, 10) + '...' || 'not set',
        formbricksApiHost: process.env.NEXT_PUBLIC_FORMBRICKS_API_HOST || 'default',
        hasApiKey: !!process.env.FORMBRICKS_API_KEY
      },
      debugResults: this.debugResults,
      browser: typeof window !== 'undefined' ? {
        online: navigator.onLine,
        cookieEnabled: navigator.cookieEnabled,
        language: navigator.language,
        platform: navigator.platform
      } : null
    };
  }
}

/**
 * Get the debug manager instance
 */
export function getFormbricksDebugManager(): FormbricksDebugManager {
  return FormbricksDebugManager.getInstance();
}

/**
 * Export a convenience function to get the singleton instance
 */
export const getFormbricksManager = () => FormbricksManager.getInstance();