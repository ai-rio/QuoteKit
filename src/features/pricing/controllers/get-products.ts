import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

export async function getProducts() {
  try {
    const supabase = await createSupabaseServerClient();

    // Get products and prices separately, then join them manually
    const { data: products, error: productsError } = await supabase
      .from('stripe_products')
      .select('*')
      .eq('active', true)
      .order('created_at');

    if (productsError) {
      console.error('Products query error:', productsError);
      return [];
    }

    const { data: prices, error: pricesError } = await supabase
      .from('stripe_prices')
      .select('*')
      .eq('active', true)
      .order('unit_amount');

    if (pricesError) {
      console.error('Prices query error:', pricesError);
      return [];
    }

    // Manually join products with their prices
    // Transform stripe_prices to match expected Price type with interval and type fields
    const productsWithPrices = products.map(product => ({
      ...product,
      prices: prices
        .filter(price => price.stripe_product_id === product.stripe_product_id)
        .map(price => ({
          ...price,
          interval: price.recurring_interval, // Map recurring_interval to interval for compatibility
          type: price.recurring_interval ? 'recurring' : 'one_time' // Add type field based on recurring_interval
        })) || []
    }));

    return productsWithPrices;
  } catch (error) {
    console.error('getProducts function error:', error);
    return [];
  }
}
