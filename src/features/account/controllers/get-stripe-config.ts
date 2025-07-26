import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

export async function getStripePublishableKey() {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: stripeConfigRecord, error } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'stripe_config')
      .single();

    if (error) {
      console.warn('Database query failed for Stripe config, falling back to environment variables:', error);
      // Fall back to environment variable
      return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || null;
    }

    const stripeConfig = stripeConfigRecord?.value as any;
    const publishableKey = stripeConfig?.publishable_key;
    
    if (publishableKey) {
      return publishableKey;
    }
    
    // If no config in database, fall back to environment variable
    console.warn('No stripe_config found in database, falling back to environment variables');
    return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || null;
  } catch (error) {
    console.error('Error getting Stripe publishable key, falling back to environment variables:', error);
    // Fall back to environment variable as last resort
    return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || null;
  }
}