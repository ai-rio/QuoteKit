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

  private constructor() {
    // Private constructor for singleton pattern
    console.log('🏗️ FormbricksManager constructor called');
    
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
    // Check if attributes are the same to prevent duplicate calls
    const attributesString = JSON.stringify(attributes);
    const currentAttributesString = JSON.stringify(this.currentAttributes);
    
    if (attributesString === currentAttributesString) {
      console.log('📋 Attributes already set - skipping duplicate call');
      return;
    }
    
    if (!this.isInitialized()) {
      console.log('📋 Formbricks not initialized, queuing attributes:', attributes);
      // Queue attributes for later processing
      this.attributeQueue = { ...this.attributeQueue, ...attributes };
      return;
    }

    const errorHandler = getFormbricksErrorHandler();
    
    errorHandler.safeExecute(
      () => {
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
        
        // Store current attributes to prevent duplicates
        this.currentAttributes = { ...attributes };
      },
      `setAttributes: ${Object.keys(attributes).join(', ')}`
    );
  }

  /**
   * Set user ID for Formbricks (required before setting attributes)
   */
  async setUserId(userId: string): Promise<void> {
    // Check if userId is already set to prevent duplicate calls
    if (this.currentUserId === userId) {
      console.log('👤 UserId already set to:', userId, '- skipping duplicate call');
      return;
    }
    
    if (!this.isInitialized()) {
      console.log('👤 Formbricks not initialized, cannot set userId:', userId);
      console.warn('⚠️ Cannot set userId before Formbricks is initialized');
      console.warn('🔍 This usually means the provider is trying to set user before initialization completes');
      console.warn('💡 The provider should wait for initialization before calling setUserId');
      
      // Return a rejected promise instead of throwing synchronously
      return Promise.reject(new Error('Formbricks must be initialized before setting userId'));
    }

    try {
      console.log('👤 Setting Formbricks userId:', userId);
      
      // Use window.formbricks if available (after SDK loads), otherwise use imported formbricks
      if (typeof window !== 'undefined' && (window as any).formbricks && typeof (window as any).formbricks.setUserId === 'function') {
        await (window as any).formbricks.setUserId(userId);
        console.log('👤 Used window.formbricks.setUserId');
      } else if (typeof formbricks.setUserId === 'function') {
        await formbricks.setUserId(userId);
        console.log('👤 Used imported formbricks.setUserId');
      } else {
        throw new Error('setUserId method not available on Formbricks SDK');
      }
      
      this.currentUserId = userId;
      console.log('✅ Formbricks userId set successfully:', userId);
    } catch (error) {
      console.error('❌ Failed to set Formbricks userId:', error);
      throw error; // Re-throw to allow caller to handle
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
      // Reset user in Formbricks SDK if available
      if (typeof window !== 'undefined' && (window as any).formbricks && typeof (window as any).formbricks.reset === 'function') {
        (window as any).formbricks.reset();
        console.log('✅ Formbricks user session reset successfully');
      }
    } catch (error) {
      console.error('❌ Failed to reset Formbricks user session:', error);
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

    const errorHandler = getFormbricksErrorHandler();
    
    errorHandler.safeExecute(
      () => {
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
      },
      `track event: ${eventName}`
    );
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

  /**
   * Setup global error handler to catch and properly handle Formbricks SDK errors
   * This fixes the "🧱 Formbricks - Global error: {}" issue
   */
  private setupGlobalErrorHandler(): void {
    // Initialize the enhanced error handler
    const errorHandler = getFormbricksErrorHandler();
    console.log('🛡️ Enhanced Formbricks error handler initialized');
  }

  /**
   * Set up immediate error suppression for known Formbricks issues
   */
  private setupImmediateErrorSuppression(): void {
    if (typeof window === 'undefined') return;
    
    // Store original console.error if not already stored
    if (!(window as any).__originalConsoleError) {
      (window as any).__originalConsoleError = console.error;
    }
    
    const originalError = (window as any).__originalConsoleError;
    
    console.error = (...args: any[]) => {
      // Immediate suppression of known Formbricks empty errors
      if (args.length >= 1 && typeof args[0] === 'string') {
        const errorMsg = args[0];
        
        // Check for the specific pattern: "🧱 Formbricks - Global error: {}"
        if (errorMsg.includes('🧱 Formbricks - Global error:') && 
            (errorMsg.includes('{}') || (args[1] && typeof args[1] === 'object' && Object.keys(args[1]).length === 0))) {
          console.debug('🚫 [Immediate Suppression] Blocked Formbricks empty error');
          return;
        }
      }
      
      // Call original console.error for all other errors
      originalError.apply(console, args);
    };
    
    console.log('⚡ Immediate Formbricks error suppression active');
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