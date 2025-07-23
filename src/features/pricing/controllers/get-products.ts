import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

export async function getProducts() {
  try {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from('products')
      .select('*, prices(*)')
      .eq('active', true)
      .eq('prices.active', true)
      .order('metadata->index')
      .order('unit_amount', { referencedTable: 'prices' });

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
