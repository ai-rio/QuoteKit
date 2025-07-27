import { NextResponse } from 'next/server';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();

    // Get all stripe_prices from database
    const { data: prices, error } = await supabase
      .from('stripe_prices')
      .select('*')
      .order('created_at');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform the data to show what the pricing logic will see
    const transformedPrices = prices?.map(price => ({
      id: price.id,
      stripe_price_id: price.stripe_price_id,
      unit_amount: price.unit_amount,
      currency: price.currency,
      recurring_interval: price.recurring_interval,
      active: price.active,
      // This is the transformation logic from get-products.ts
      interval: price.recurring_interval,
      type: price.recurring_interval ? 'recurring' : 'one_time'
    }));

    return NextResponse.json({
      raw_prices: prices,
      transformed_prices: transformedPrices,
      debug_info: {
        total_prices: prices?.length || 0,
        active_prices: prices?.filter(p => p.active)?.length || 0,
        recurring_prices: prices?.filter(p => p.recurring_interval)?.length || 0,
        one_time_prices: prices?.filter(p => !p.recurring_interval)?.length || 0
      }
    });

  } catch (error) {
    console.error('Debug prices error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}