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
  private eventQueue: Array<{ eventName: string; properties?: Record<string, any> }> = [];
  private attributeQueue: Record<string, any> = {};

  private constructor() {
    // Private constructor for singleton pattern
    console.log('🏗️ FormbricksManager constructor called');
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
    const maxAttempts = 50; // 5 seconds with 100ms intervals
    const intervalMs = 100;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`🔍 Attempt ${attempt}/${maxAttempts}: Checking if Formbricks SDK is ready...`);
        
        // Check if the SDK is properly loaded and initialized
        if (typeof window !== 'undefined' && (window as any).formbricks) {
          const fb = (window as any).formbricks;
          console.log('🔍 Found window.formbricks object:', {
            type: typeof fb,
            hasTrack: typeof fb.track === 'function',
            hasSetAttributes: typeof fb.setAttributes === 'function',
            hasRegisterRouteChange: typeof fb.registerRouteChange === 'function',
            keys: Object.keys(fb || {})
          });
          
          // Check if essential methods are available
          if (typeof fb.track === 'function' && 
              typeof fb.setAttributes === 'function' && 
              typeof fb.registerRouteChange === 'function') {
            console.log('✅ Formbricks SDK is fully ready! All methods are available.');
            return;
          }
        }
        
        // Also check if the imported formbricks object has the methods
        if (typeof formbricks.track === 'function' && 
            typeof formbricks.setAttributes === 'function' && 
            typeof formbricks.registerRouteChange === 'function') {
          console.log('✅ Formbricks SDK ready via import! All methods are available.');
          return;
        }
        
        console.log(`⏳ SDK not ready yet (attempt ${attempt}/${maxAttempts}), waiting...`);
        await new Promise(resolve => setTimeout(resolve, intervalMs));
      } catch (error) {
        console.warn(`⚠️ Error checking SDK readiness on attempt ${attempt}:`, error);
        await new Promise(resolve => setTimeout(resolve, intervalMs));
      }
    }
    
    console.warn('⚠️ Formbricks SDK did not become ready within timeout, but continuing...');
    console.warn('🔍 Final SDK state check:', {
      windowFormbricks: typeof window !== 'undefined' ? typeof (window as any).formbricks : 'N/A',
      importedFormbricks: typeof formbricks,
      importedTrack: typeof formbricks.track,
      importedSetAttributes: typeof formbricks.setAttributes,
      importedRegisterRouteChange: typeof formbricks.registerRouteChange,
    });
  }

  /**
   * Perform the actual SDK initialization
   */
  private async performInitialization(config: { environmentId: string; appUrl?: string }): Promise<void> {
    try {
      console.log('🔄 Starting Formbricks initialization - DETAILED...');
      console.log('🔄 Config received:', {
        environmentId: config.environmentId,
        environmentIdLength: config.environmentId?.length,
        appUrl: config.appUrl,
        window: typeof window !== 'undefined' ? 'available' : 'undefined',
        formbricksImported: typeof formbricks !== 'undefined' ? 'YES' : 'NO',
        formbricksSetupFunction: typeof formbricks?.setup === 'function' ? 'YES' : 'NO'
      });

      // Enhanced debugging: Check current window state
      if (typeof window !== 'undefined') {
        console.log('🌐 Window environment details:', {
          userAgent: window.navigator.userAgent,
          location: window.location.href,
          protocol: window.location.protocol,
          hostname: window.location.hostname,
          hasDocument: typeof document !== 'undefined',
          readyState: document?.readyState,
          existingFormbricks: !!(window as any).formbricks,
          existingFormbricksType: typeof (window as any).formbricks,
        });
      }

      // Validate required configuration
      if (!config.environmentId) {
        throw new Error('Formbricks environmentId is required');
      }

      if (config.environmentId.length < 10) {
        throw new Error(`Formbricks environmentId seems invalid: "${config.environmentId}" (too short)`);
      }

      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        console.warn('⚠️ Formbricks can only be initialized in browser environment');
        return;
      }

      // Check if Formbricks SDK is properly imported
      if (typeof formbricks === 'undefined' || typeof formbricks.setup !== 'function') {
        throw new Error('Formbricks SDK not properly imported or setup function not available');
      }

      console.log('🌍 Browser environment detected, proceeding with SDK setup...');
      console.log('📦 Formbricks SDK is properly imported and ready');

      // Initialize Formbricks SDK using v4 API with enhanced error handling
      const setupConfig = {
        environmentId: config.environmentId,
        appUrl: config.appUrl || 'https://app.formbricks.com',
        debug: true, // Enable debug mode for better error reporting
      };

      console.log('⚙️ About to call formbricks.setup() with config:', setupConfig);
      console.log('🔍 Pre-setup SDK state:', {
        formbricks: typeof formbricks,
        setupMethod: typeof formbricks.setup,
        formbricksKeys: Object.keys(formbricks || {}),
        setupConfigValid: !!(setupConfig.environmentId && setupConfig.appUrl),
        windowLocation: typeof window !== 'undefined' ? window.location.origin : 'N/A',
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent.substring(0, 100) : 'N/A',
      });
      
      // Wait a moment to ensure DOM is ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Pre-flight check: Validate environment ID exists before attempting SDK setup
      console.log('🔍 Pre-flight check: Validating environment ID...');
      const isValidEnvironment = await this.validateEnvironmentId(config.environmentId, config.appUrl);
      if (!isValidEnvironment) {
        throw new Error(`Environment ID validation failed: ${config.environmentId} not found in Formbricks account`);
      }
      
      // Add a try-catch specifically around the setup call with retry logic
      let setupAttempts = 0;
      const maxSetupAttempts = 3;
      
      while (setupAttempts < maxSetupAttempts) {
        try {
          setupAttempts++;
          console.log(`📞 Calling formbricks.setup() now (attempt ${setupAttempts}/${maxSetupAttempts})...`);
          
          // Call setup with await if it returns a promise
          const setupResult = await Promise.resolve(formbricks.setup(setupConfig));
          
          console.log('📦 Formbricks SDK setup() call completed successfully');
          console.log('📦 Setup result:', setupResult);
          
          // Break out of retry loop on success
          break;
          
        } catch (setupError) {
          console.error(`💥 Error during formbricks.setup() call (attempt ${setupAttempts}/${maxSetupAttempts}):`, setupError);
          console.error('💥 Setup error details:', {
            message: setupError instanceof Error ? setupError.message : 'Unknown error',
            name: setupError instanceof Error ? setupError.name : 'Unknown',
            stack: setupError instanceof Error ? setupError.stack : undefined,
            type: typeof setupError,
            setupConfig,
            attempt: setupAttempts,
            timestamp: new Date().toISOString(),
          });
          
          // Check if this is the specific validation error we're debugging
          if (setupError instanceof Error && 
              (setupError.message.includes('network_error') || 
               setupError.message.includes('404') ||
               setupError.message.includes('Environment not found'))) {
            console.error('🎯 DETECTED ENVIRONMENT ID VALIDATION ERROR!');
            console.error('🔍 The environment ID does not exist in your Formbricks account');
            console.error('🔍 Environment ID format check:', {
              envId: config.environmentId,
              length: config.environmentId.length,
              startsWithCme: config.environmentId.startsWith('cme'),
              isValidFormat: /^cme[a-z0-9]+$/.test(config.environmentId),
            });
            console.error('🔍 API URL check:', {
              apiUrl: config.appUrl,
              isHttps: config.appUrl?.startsWith('https://'),
              isFormbricksApp: config.appUrl?.includes('app.formbricks.com'),
            });
            
            // For environment not found errors, don't retry
            if (setupError.message.includes('404') || setupError.message.includes('Environment not found')) {
              console.error('💥 Environment ID not found - skipping retries and failing gracefully');
              throw new Error(`Formbricks Environment ID not found: ${config.environmentId}. Please verify the environment ID in your Formbricks account.`);
            }
          }
          
          // If this is the last attempt, throw the error
          if (setupAttempts >= maxSetupAttempts) {
            console.error('💥 All setup attempts failed, throwing error...');
            throw setupError;
          }
          
          // Wait before retrying
          console.log(`⏳ Waiting 1 second before retry attempt ${setupAttempts + 1}...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // Check immediate post-setup state
      console.log('🔍 Post-setup immediate state:', {
        windowFormbricks: typeof window !== 'undefined' ? typeof (window as any).formbricks : 'N/A',
        windowFormbricksKeys: typeof window !== 'undefined' && (window as any).formbricks ? Object.keys((window as any).formbricks) : 'N/A',
        setupComplete: true,
        attempts: setupAttempts,
      });

      // Wait for the SDK to fully initialize and verify it's actually ready
      await this.waitForSDKReady();

      this.initialized = true;
      this.isAvailable = true;
      
      console.log('✅ Formbricks SDK initialized successfully', {
        initialized: this.initialized,
        available: this.isAvailable,
        queuedEvents: this.eventQueue.length,
        queuedAttributes: Object.keys(this.attributeQueue).length,
        timestamp: new Date().toISOString()
      });

      // Process queued events and attributes
      this.processQueue();
      
      console.log('🎉 FORMBRICKS INITIALIZATION COMPLETE - MANAGER IS READY! 🎉');
    } catch (error) {
      console.error('❌ Formbricks initialization failed:', error);
      console.error('🔍 Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined,
        config,
        timestamp: new Date().toISOString(),
        
        // Additional debugging for network/validation errors
        isNetworkError: error instanceof Error && error.message.includes('network_error'),
        isValidationError: error instanceof Error && error.message.includes('Validation failed'),
        
        // Environment and network context
        networkContext: {
          online: typeof navigator !== 'undefined' ? navigator.onLine : 'unknown',
          connection: typeof navigator !== 'undefined' && 'connection' in navigator ? (navigator as any).connection?.effectiveType : 'unknown',
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        }
      });
      
      // If this is the specific validation error, provide debugging suggestions
      if (error instanceof Error && (error.message.includes('network_error') || error.message.includes('Validation failed'))) {
        console.error('🎯 DEBUGGING SUGGESTIONS for Validation Error:');
        console.error('1. ✅ Check Environment ID format - should be like: dev_cm5u8x9y6000114qg8x9y6000');
        console.error('2. ✅ Verify Environment ID exists in your Formbricks account');
        console.error('3. ✅ Check API connectivity to https://app.formbricks.com');
        console.error('4. ✅ Verify the environment is correctly configured in Formbricks dashboard');
        console.error('5. ✅ Check for any CORS or network issues');
        console.error('6. ✅ Test the environment ID manually in Formbricks dashboard');
        
        // Attempt to provide more context about the error
        this.debugValidationError(config);
      }
      
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
          console.error('\n🎯 FORMBRICKS VALIDATION ERROR DETECTED');
          console.error('╔════════════════════════════════════════════════════════════════╗');
          console.error('║ The environment ID in your .env file is not valid or missing  ║');
          console.error('║ from your Formbricks account.                                 ║');
          console.error('╚════════════════════════════════════════════════════════════════╝');
          console.error('\n💡 TO FIX THIS ISSUE:');
          console.error('1. Go to https://app.formbricks.com');
          console.error('2. Log into your account');
          console.error('3. Create a new project or select an existing one');
          console.error('4. Go to Settings > General');
          console.error('5. Copy the Environment ID');
          console.error('6. Update NEXT_PUBLIC_FORMBRICKS_ENV_ID in your .env file');
          console.error('\n🔍 CURRENT CONFIGURATION:');
          console.error(`   Environment ID: ${process.env.NEXT_PUBLIC_FORMBRICKS_ENV_ID || 'NOT SET'}`);
          console.error(`   API Host: ${process.env.NEXT_PUBLIC_FORMBRICKS_API_HOST || 'NOT SET'}`);
          console.error('\n🧪 VERIFY YOUR SETUP:');
          console.error('   Run: node scripts/debug-formbricks-validation.js');
          console.error('\n⚠️  Until fixed, user feedback collection will be disabled.');
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
    if (!this.isInitialized()) {
      console.log('📋 Formbricks not initialized, queuing attributes:', attributes);
      // Queue attributes for later processing
      this.attributeQueue = { ...this.attributeQueue, ...attributes };
      return;
    }

    try {
      console.log('📋 Setting Formbricks attributes:', attributes);
      
      // Use window.formbricks if available (after SDK loads), otherwise use imported formbricks
      if (typeof window !== 'undefined' && (window as any).formbricks && typeof (window as any).formbricks.setAttributes === 'function') {
        (window as any).formbricks.setAttributes(attributes);
        console.log('📋 Used window.formbricks.setAttributes');
      } else if (typeof formbricks.setAttributes === 'function') {
        formbricks.setAttributes(attributes);
        console.log('📋 Used imported formbricks.setAttributes');
      } else {
        throw new Error('setAttributes method not available on Formbricks SDK');
      }
    } catch (error) {
      console.error('Failed to set Formbricks attributes:', error);
    }
  }

  /**
   * Track custom events for survey triggers
   */
  track(eventName: string, properties?: Record<string, any>): void {
    if (!this.isInitialized()) {
      console.log('📊 Formbricks not initialized, queuing event:', eventName, properties);
      // Queue event for later processing
      this.eventQueue.push({ eventName, properties });
      return;
    }

    try {
      console.log('📊 Tracking Formbricks event:', eventName, properties);
      // Formbricks v4 expects specific structure - adapt our properties
      const trackProperties = properties ? {
        ...properties,
        hiddenFields: properties.hiddenFields || {}
      } : undefined;
      
      // Use window.formbricks if available (after SDK loads), otherwise use imported formbricks
      if (typeof window !== 'undefined' && (window as any).formbricks && typeof (window as any).formbricks.track === 'function') {
        (window as any).formbricks.track(eventName, trackProperties);
        console.log('📊 Used window.formbricks.track');
      } else if (typeof formbricks.track === 'function') {
        formbricks.track(eventName, trackProperties);
        console.log('📊 Used imported formbricks.track');
      } else {
        throw new Error('track method not available on Formbricks SDK');
      }
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
      // Use window.formbricks if available (after SDK loads), otherwise use imported formbricks
      if (typeof window !== 'undefined' && (window as any).formbricks && typeof (window as any).formbricks.registerRouteChange === 'function') {
        (window as any).formbricks.registerRouteChange();
        console.log('📍 Used window.formbricks.registerRouteChange');
      } else if (typeof formbricks.registerRouteChange === 'function') {
        formbricks.registerRouteChange();
        console.log('📍 Used imported formbricks.registerRouteChange');
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
    // Basic initialization check
    const basicCheck = this.initialized && this.isAvailable;
    
    // Enhanced verification - check if SDK methods are actually available
    let sdkMethodsAvailable = false;
    try {
      if (typeof window !== 'undefined') {
        // Check window.formbricks first (this is what gets set after SDK loads)
        const windowFb = (window as any).formbricks;
        if (windowFb && 
            typeof windowFb.track === 'function' && 
            typeof windowFb.setAttributes === 'function') {
          sdkMethodsAvailable = true;
        }
        
        // Fallback to imported formbricks
        if (!sdkMethodsAvailable &&
            typeof formbricks.track === 'function' && 
            typeof formbricks.setAttributes === 'function') {
          sdkMethodsAvailable = true;
        }
      }
    } catch (error) {
      console.warn('⚠️ Error checking SDK methods availability:', error);
    }
    
    const result = basicCheck && sdkMethodsAvailable;
    
    console.log('🔍 FormbricksManager.isInitialized() ENHANCED check:', {
      initialized: this.initialized,
      available: this.isAvailable,
      basicCheck,
      sdkMethodsAvailable,
      result,
      queuedEvents: this.eventQueue.length,
      queuedAttributes: Object.keys(this.attributeQueue).length,
      windowFormbricksType: typeof window !== 'undefined' ? typeof (window as any).formbricks : 'N/A',
      importedFormbricksType: typeof formbricks,
    });
    
    return result;
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
    console.log('⚡ Processing Formbricks queue...', {
      events: this.eventQueue.length,
      attributes: Object.keys(this.attributeQueue).length
    });

    // Determine which formbricks instance to use
    const getFormbricksInstance = () => {
      if (typeof window !== 'undefined' && (window as any).formbricks) {
        console.log('⚡ Using window.formbricks for queue processing');
        return (window as any).formbricks;
      } else {
        console.log('⚡ Using imported formbricks for queue processing');
        return formbricks;
      }
    };

    const fb = getFormbricksInstance();

    // Process queued attributes
    if (Object.keys(this.attributeQueue).length > 0) {
      try {
        if (typeof fb.setAttributes === 'function') {
          fb.setAttributes(this.attributeQueue);
          console.log('✅ Processed queued attributes:', this.attributeQueue);
          this.attributeQueue = {};
        } else {
          console.error('❌ setAttributes method not available during queue processing');
        }
      } catch (error) {
        console.error('❌ Failed to process queued attributes:', error);
      }
    }

    // Process queued events
    this.eventQueue.forEach(({ eventName, properties }) => {
      try {
        if (typeof fb.track === 'function') {
          const trackProperties = properties ? {
            ...properties,
            hiddenFields: properties.hiddenFields || {}
          } : undefined;
          
          fb.track(eventName, trackProperties);
          console.log('✅ Processed queued event:', eventName, properties);
        } else {
          console.error('❌ track method not available during queue processing for event:', eventName);
        }
      } catch (error) {
        console.error('❌ Failed to process queued event:', eventName, error);
      }
    });

    // Clear the queue
    this.eventQueue = [];
    console.log('🧹 Queue processing complete');
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
}

/**
 * Export a convenience function to get the singleton instance
 */
export const getFormbricksManager = () => FormbricksManager.getInstance();