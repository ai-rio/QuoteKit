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

    // Fetch ALL prices, but handle free vs paid differently
    const { data: allPrices, error: pricesError } = await supabase
      .from('stripe_prices')
      .select('*')
      .order('unit_amount');

    if (pricesError) {
      console.error('Prices query error:', pricesError);
      return [];
    }

    // Separate free and paid prices for different handling
    const freePrices = allPrices?.filter(price => price.unit_amount === 0) || [];
    const paidPrices = allPrices?.filter(price => price.unit_amount > 0 && price.active === true) || [];
    
    // For freemium model: Include free prices regardless of active status, paid prices only if active
    const availablePrices = [...freePrices, ...paidPrices];

    // DEBUG: Log price handling for monitoring
    console.log(`🔍 DEBUG: Price handling summary:`, {
      totalPrices: allPrices?.length || 0,
      freePrices: freePrices.length,
      activePaidPrices: paidPrices.length,
      availableForCheckout: availablePrices.length
    });
    
    // Log any inactive paid prices that might be causing issues
    const inactivePaidPrices = allPrices?.filter(p => p.unit_amount > 0 && p.active === false) || [];
    if (inactivePaidPrices.length > 0) {
      console.warn(`⚠️ Found ${inactivePaidPrices.length} inactive paid prices:`, 
        inactivePaidPrices.map(p => `${p.id} ($${(p.unit_amount || 0) / 100})`));
    }

    // Log free price status for debugging
    if (freePrices.length > 0) {
      console.log('🆓 Free prices found:', freePrices.map(p => ({
        id: p.id,
        active: p.active,
        amount: p.unit_amount
      })));
    }

    // DEBUG: Log raw price data from database
    console.log('🔍 DEBUG: Available prices for checkout:', availablePrices?.map(p => ({
      id: p.id,
      stripe_product_id: p.stripe_product_id,
      interval: p.interval,
      unit_amount: p.unit_amount,
      active: p.active,
      isFree: p.unit_amount === 0
    })));

    // Manually join products with their prices
    // Transform prices to match expected Price type
    const productsWithPrices = products.map(product => {
      const productPrices = availablePrices
        .filter(price => price.stripe_product_id === product.id) // Use product.id to match price.stripe_product_id
        .map(price => {
          // Transform price to match expected interface
          return {
            ...price,
            stripe_price_id: price.id, // Map id to stripe_price_id for compatibility
            type: price.type || (price.interval ? 'recurring' as const : 'one_time' as const)
          };
        }) || [];

      return {
        ...product,
        stripe_product_id: product.id, // Map id to stripe_product_id for compatibility
        prices: productPrices
      };
    });

    return productsWithPrices;
  } catch (error) {
    console.error('getProducts function error:', error);
    return [];
  }
}
