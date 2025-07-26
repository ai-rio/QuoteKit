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
      console.error('Error fetching Stripe config:', error);
      return null;
    }

    const stripeConfig = stripeConfigRecord?.value as any;
    return stripeConfig?.publishable_key || null;
  } catch (error) {
    console.error('Error getting Stripe publishable key:', error);
    return null;
  }
}