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
