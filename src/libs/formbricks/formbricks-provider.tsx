'use client';

import { User } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

import { createSupabaseClientClient } from '@/libs/supabase/supabase-client-client';

import { FormbricksManager } from './formbricks-manager';
import { FormbricksUserAttributes } from './types';

/**
 * FormbricksProvider - React component that initializes Formbricks SDK
 * and handles user context synchronization throughout the app
 */
export function FormbricksProvider() {
  const [user, setUser] = useState<User | null>(null);
  const [formbricksInitialized, setFormbricksInitialized] = useState(false);
  const [initializationTimeout, setInitializationTimeout] = useState(false);
  
  // Get current user from Supabase
  useEffect(() => {
    const supabase = createSupabaseClientClient();
    
    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const newUser = session?.user ?? null;
      
      // If user logged out, reset Formbricks session
      if (!newUser && user) {
        console.log('🔄 User logged out, resetting Formbricks session');
        const manager = FormbricksManager.getInstance();
        manager.resetUser();
      }
      
      setUser(newUser);
    });
    
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    console.log('🚀 FormbricksProvider useEffect triggered - START');
    console.log('🔍 Current timestamp:', new Date().toISOString());
    
    // Only initialize if we have environment variables configured
    const environmentId = process.env.NEXT_PUBLIC_FORMBRICKS_ENV_ID;
    const appUrl = process.env.NEXT_PUBLIC_FORMBRICKS_API_HOST;
    const debugMode = process.env.FORMBRICKS_DEBUG;

    console.log('🔧 DETAILED Environment variables check:', {
      environmentId: environmentId || 'NOT SET',
      environmentIdLength: environmentId?.length || 0,
      appUrl: appUrl || 'NOT SET',
      debugMode: debugMode || 'NOT SET',
      nodeEnv: process.env.NODE_ENV,
      windowDefined: typeof window !== 'undefined',
      documentDefined: typeof document !== 'undefined',
      locationHref: typeof window !== 'undefined' ? window.location.href : 'N/A',
      allFormbricksEnvVars: {
        NEXT_PUBLIC_FORMBRICKS_ENV_ID: process.env.NEXT_PUBLIC_FORMBRICKS_ENV_ID,
        NEXT_PUBLIC_FORMBRICKS_API_HOST: process.env.NEXT_PUBLIC_FORMBRICKS_API_HOST,
        FORMBRICKS_DEBUG: process.env.FORMBRICKS_DEBUG,
      },
      // Show all NEXT_PUBLIC environment variables for debugging
      allNextPublicVars: Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC')).reduce((acc, key) => {
        acc[key] = process.env[key];
        return acc;
      }, {} as Record<string, string | undefined>)
    });

    if (!environmentId) {
      console.error('❌ CRITICAL: Formbricks environment ID not configured!');
      console.error('💡 Expected environment variable: NEXT_PUBLIC_FORMBRICKS_ENV_ID');
      console.error('💡 Current value:', environmentId);
      console.error('💡 Make sure your .env file has the correct variable name and is loaded');
      return;
    }

    if (environmentId.length < 10) {
      console.error('❌ CRITICAL: Formbricks environment ID seems invalid (too short)');
      console.error('💡 Current value:', environmentId);
      console.error('💡 Environment IDs should be longer strings like: dev_cm5u8x9y6000114qg8x9y6000');
      return;
    }

    // Only initialize in browser environment
    if (typeof window === 'undefined') {
      console.log('🚫 Server-side rendering detected, skipping Formbricks initialization');
      return;
    }

    console.log('🎯 Environment ID found and browser detected, proceeding with initialization...');
    console.log('🎯 Using Environment ID:', environmentId);
    console.log('🎯 Using App URL:', appUrl);

    const manager = FormbricksManager.getInstance();
    
    // Check if already initialized
    if (manager.isInitialized()) {
      console.log('✅ FormbricksManager already initialized, skipping');
      console.log('📊 Current manager status:', manager.getStatus());
      return;
    }
    
    console.log('📞 Calling manager.initialize() with config:', {
      environmentId,
      appUrl,
    });
    
    // Initialize Formbricks SDK with better error handling
    manager.initialize({
      environmentId,
      appUrl,
    }).then(() => {
      console.log('🏁 FormbricksProvider initialization promise resolved - SUCCESS!');
      console.log('📊 Manager status after initialization:', manager.getStatus());
      
      // Mark Formbricks as initialized
      setFormbricksInitialized(true);
      
      // Test that the manager is working
      setTimeout(() => {
        const finalStatus = manager.getStatus();
        console.log('🔍 Manager status after 1 second:', finalStatus);
        if (finalStatus.initialized && finalStatus.available) {
          console.log('✨ FORMBRICKS IS FULLY OPERATIONAL! 🎉');
          console.log('🚀 You should now be able to track events successfully');
        } else {
          console.error('❌ Formbricks initialization completed but not operational');
          console.error('🔍 This means the SDK loaded but something went wrong during setup');
        }
      }, 1000);
      
    }).catch((error) => {
      console.error('💥 FormbricksProvider initialization promise rejected:', error);
      
      // Reset initialization state on error
      setFormbricksInitialized(false);
      console.error('🔍 Error message:', error?.message);
      
      // Provide specific guidance for environment ID errors
      if (error?.message?.includes('Environment ID validation failed') || 
          error?.message?.includes('not found in Formbricks account')) {
        console.error('\n🎯 FORMBRICKS ENVIRONMENT ID ERROR');
        console.error('═══════════════════════════════════════════════════════════════════════════');
        console.error('❌ The environment ID in your .env file does not exist in your Formbricks account');
        console.error('\n💡 TO FIX THIS:');
        console.error('1. Go to https://app.formbricks.com');
        console.error('2. Log into your account (or create a new one)');
        console.error('3. Create a new project or select an existing one');
        console.error('4. Go to Project Settings > General');
        console.error('5. Copy the Environment ID');
        console.error('6. Update NEXT_PUBLIC_FORMBRICKS_ENV_ID in your .env file');
        console.error('\n🔍 CURRENT CONFIGURATION:');
        console.error(`   Environment ID: ${environmentId}`);
        console.error(`   API Host: ${appUrl}`);
        console.error('\n⚠️ Until this is fixed, feedback collection will be disabled but the app will continue to work normally.');
        console.error('═══════════════════════════════════════════════════════════════════════════\n');
      } else {
        console.error('🔍 Error stack:', error?.stack);
        console.error('🔍 Error type:', typeof error);
        console.error('🔍 Error properties:', Object.keys(error || {}));
      }
    });
    
    console.log('🚀 FormbricksProvider useEffect triggered - END');
    
    // Set a timeout to prevent waiting indefinitely
    const timeoutId = setTimeout(() => {
      if (!formbricksInitialized) {
        console.warn('⏰ Formbricks initialization timeout after 10 seconds');
        console.warn('🔍 This may indicate a network issue or invalid configuration');
        setInitializationTimeout(true);
      }
    }, 10000); // 10 second timeout
    
    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    console.log('👤 User effect triggered:', { 
      hasUser: !!user?.id, 
      userId: user?.id, 
      formbricksInitialized 
    });
    
    if (user?.id && formbricksInitialized) {
      const manager = FormbricksManager.getInstance();
      
      // Double-check that the manager is ready for user operations
      if (!manager.isReadyForUser()) {
        console.log('⏳ Manager not ready for user operations yet, waiting...');
        return;
      }
      
      // CRITICAL FIX: Set userId BEFORE setting attributes
      // This fixes the "Formbricks can't set attributes without a userId" error
      const userId = user.id;
      
      console.log('👤 Setting Formbricks userId:', userId);
      
      // Set the userId first (required by Formbricks v4+)
      if (!userId) {
        console.error('❌ Cannot set Formbricks userId: userId is null or undefined');
        return;
      }
      
      // Check if userId is already set to prevent the "userId already set" error
      const currentUserId = manager.getCurrentUserId();
      if (currentUserId === userId) {
        console.log('👤 UserId already set to:', currentUserId, '- skipping duplicate call');
        
        // Still set attributes even if userId is already set
        const attributes = mapUserToFormbricksAttributes(user);
        manager.setAttributes(attributes);
        console.log('✅ User attributes updated successfully:', attributes);
        return;
      }
      
      manager.setUserId(userId).then(() => {
        console.log('✅ UserId set successfully, now setting attributes');
        
        // Now set user attributes for personalized surveys
        const attributes = mapUserToFormbricksAttributes(user);
        manager.setAttributes(attributes);
        
        console.log('✅ User attributes set successfully:', attributes);
      }).catch((error) => {
        console.error('❌ Failed to set Formbricks userId:', error);
        console.error('🔍 This will prevent attributes from being set');
      });
    } else if (user?.id && !formbricksInitialized) {
      if (initializationTimeout) {
        console.error('❌ Formbricks initialization timed out, cannot set user');
      } else {
        console.log('⏳ User found but Formbricks not initialized yet, waiting...');
      }
    } else if (!user?.id && formbricksInitialized) {
      console.log('🔍 Formbricks initialized but no user found');
    }
  }, [user, formbricksInitialized, initializationTimeout]);

  return null; // This component doesn't render anything
}

/**
 * Maps QuoteKit user data to Formbricks user attributes
 */
function mapUserToFormbricksAttributes(user: User): FormbricksUserAttributes {
  const attributes: FormbricksUserAttributes = {
    email: user.email,
    signupDate: user.created_at,
    lastActive: user.last_sign_in_at || undefined,
  };

  // Add additional user metadata if available
  if (user.user_metadata) {
    const metadata = user.user_metadata;
    
    if (metadata.subscriptionTier) {
      attributes.subscriptionTier = metadata.subscriptionTier;
    }
    
    if (metadata.quotesCreated) {
      attributes.quotesCreated = metadata.quotesCreated;
    }
    
    if (metadata.revenue) {
      attributes.revenue = metadata.revenue;
    }
    
    if (metadata.industry) {
      attributes.industry = metadata.industry;
    }
    
    if (metadata.companySize) {
      attributes.companySize = metadata.companySize;
    }
  }

  return attributes;
}