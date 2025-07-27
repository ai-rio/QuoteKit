import { NextResponse } from 'next/server';

import { syncStripeProductsAndPrices } from '@/features/pricing/controllers/upsert-price';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

export async function POST() {
  try {
    // Check if user is admin (basic security check)
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For local development, we'll allow any authenticated user
    // In production, you should add proper admin role checking
    console.log('Starting Stripe sync...');
    
    const result = await syncStripeProductsAndPrices();
    
    return NextResponse.json({
      message: 'Stripe sync completed successfully',
      ...result
    });
    
  } catch (error) {
    console.error('Sync failed:', error);
    return NextResponse.json(
      { error: 'Sync failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}