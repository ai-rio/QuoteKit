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

    // DEBUG: Log raw price data from database
    console.log('🔍 DEBUG: Raw prices from database:', prices?.map(p => ({
      id: p.id,
      stripe_price_id: p.stripe_price_id,
      recurring_interval: p.recurring_interval,
      unit_amount: p.unit_amount
    })));

    // Manually join products with their prices
    // Transform stripe_prices to match expected Price type with interval and type fields
    const productsWithPrices = products.map(product => {
      const productPrices = prices
        .filter(price => price.stripe_product_id === product.stripe_product_id)
        .map(price => {
          const transformedPrice = {
            ...price,
            interval: price.recurring_interval, // Map recurring_interval to interval for compatibility
            type: price.recurring_interval ? 'recurring' as const : 'one_time' as const // Add type field based on recurring_interval
          };
          
          // DEBUG: Log each price transformation
          console.log('🔍 DEBUG: Price transformation:', {
            original_recurring_interval: price.recurring_interval,
            transformed_interval: transformedPrice.interval,
            transformed_type: transformedPrice.type,
            stripe_price_id: price.stripe_price_id
          });
          
          return transformedPrice;
        }) || [];

      return {
        ...product,
        prices: productPrices
      };
    });

    return productsWithPrices;
  } catch (error) {
    console.error('getProducts function error:', error);
    return [];
  }
}
