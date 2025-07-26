import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

export async function getSubscription() {
  try {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*, prices(*, products(*))')
      .in('status', ['trialing', 'active'])
      .maybeSingle();

    if (error) {
      console.error('Subscription query error:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('getSubscription function error:', error);
    return null;
  }
}

export async function getBillingHistory() {
  try {
    const supabase = await createSupabaseServerClient();
    
    // This would typically fetch from a billing_history table or Stripe API
    // For now, we'll return a mock structure that should be implemented
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .single();

    if (!subscription) return [];

    // Mock billing history - in production this should fetch from Stripe API
    return [
      {
        id: 'inv_1',
        date: new Date().toISOString(),
        amount: 2900,
        status: 'paid',
        invoice_url: '#',
        description: 'Monthly subscription'
      }
    ];
  } catch (error) {
    console.error('getBillingHistory error:', error);
    return [];
  }
}

export async function getPaymentMethods() {
  try {
    // This should fetch payment methods from Stripe API
    // For now, returning mock data structure
    return [
      {
        id: 'pm_1',
        type: 'card',
        card: {
          brand: 'visa',
          last4: '4242',
          exp_month: 12,
          exp_year: 2025
        },
        is_default: true
      }
    ];
  } catch (error) {
    console.error('getPaymentMethods error:', error);
    return [];
  }
}