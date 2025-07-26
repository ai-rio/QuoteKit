import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

export async function getProducts() {
  try {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from('stripe_products')
      .select('*, stripe_prices:stripe_prices!stripe_product_id(*)')
      .eq('active', true)
      .eq('stripe_prices.active', true)
      .order('created_at')
      .order('unit_amount', { referencedTable: 'stripe_prices' });

    if (error) {
      console.error('Products query error:', error);
      return [];
    }

    return data ?? [];
  } catch (error) {
    console.error('getProducts function error:', error);
    return [];
  }
}
