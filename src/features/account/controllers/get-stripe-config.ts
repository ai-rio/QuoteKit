import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

export async function getStripePublishableKey() {
  try {
    const supabase = await createSupabaseServerClient();
    
    console.debug('getStripePublishableKey: Starting configuration lookup');
    
    // First try to get from database (admin settings)
    const { data: stripeConfigRecord, error } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'stripe_config')
      .single();

    console.debug('getStripePublishableKey: Database query result', {
      hasData: !!stripeConfigRecord,
      hasError: !!error,
      errorCode: error?.code,
      errorMessage: error?.message
    });

    if (!error && stripeConfigRecord?.value) {
      const stripeConfig = stripeConfigRecord.value as any;
      const publishableKey = stripeConfig?.publishable_key;
      
      console.debug('getStripePublishableKey: Found database config', {
        hasConfig: !!stripeConfig,
        hasPublishableKey: !!publishableKey,
        configKeys: stripeConfig ? Object.keys(stripeConfig) : []
      });
      
      if (publishableKey) {
        console.log('Using Stripe publishable key from database');
        console.debug('getStripePublishableKey: Successfully retrieved from database');
        return publishableKey;
      }
    }

    // Fall back to environment variable
    const envKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    console.debug('getStripePublishableKey: Checking environment variable', {
      hasEnvKey: !!envKey,
      envKeyPrefix: envKey ? envKey.substring(0, 8) + '...' : 'none'
    });
    
    if (envKey) {
      console.log('Using Stripe publishable key from environment variables');
      console.debug('getStripePublishableKey: Successfully retrieved from environment');
      return envKey;
    }

    // No configuration found anywhere
    console.warn('No Stripe publishable key found in database or environment variables');
    console.warn('Please configure Stripe in admin settings or set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY environment variable');
    console.debug('getStripePublishableKey: No configuration found', {
      databaseConfigExists: !!stripeConfigRecord,
      databaseHasValue: !!stripeConfigRecord?.value,
      environmentKeyExists: !!envKey
    });
    return null;
  } catch (error) {
    console.error('Error getting Stripe publishable key:', error);
    console.debug('getStripePublishableKey: Unexpected error during lookup', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Last resort: try environment variable
    const envKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    console.debug('getStripePublishableKey: Fallback environment check', {
      hasEnvKey: !!envKey
    });
    
    if (envKey) {
      console.log('Using Stripe publishable key from environment variables as fallback');
      console.debug('getStripePublishableKey: Successfully retrieved from environment fallback');
      return envKey;
    }
    
    console.debug('getStripePublishableKey: Complete failure - no configuration available');
    return null;
  }
}