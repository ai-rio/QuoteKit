import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

export async function getStripePublishableKey() {
  try {
    const supabase = await createSupabaseServerClient();
    
    // First try to get from database (admin settings)
    const { data: stripeConfigRecord, error } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'stripe_config')
      .single();

    if (!error && stripeConfigRecord?.value) {
      const stripeConfig = stripeConfigRecord.value as any;
      const publishableKey = stripeConfig?.publishable_key;
      
      if (publishableKey) {
        console.log('Using Stripe publishable key from database');
        return publishableKey;
      }
    }

    // Fall back to environment variable
    const envKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (envKey) {
      console.log('Using Stripe publishable key from environment variables');
      return envKey;
    }

    // No configuration found anywhere
    console.warn('No Stripe publishable key found in database or environment variables');
    console.warn('Please configure Stripe in admin settings or set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY environment variable');
    return null;
  } catch (error) {
    console.error('Error getting Stripe publishable key:', error);
    
    // Last resort: try environment variable
    const envKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (envKey) {
      console.log('Using Stripe publishable key from environment variables as fallback');
      return envKey;
    }
    
    return null;
  }
}