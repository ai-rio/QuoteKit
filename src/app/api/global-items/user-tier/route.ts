import { NextResponse } from 'next/server';

import { getUserTier } from '@/features/items/global-actions';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

export async function GET() {
  try {
    const result = await getUserTier();
    if (result?.error) {
      console.error('User tier error:', result.error);
      return NextResponse.json(
        { error: result?.error?.message || 'Unknown error' },
        { status: 400 }
      );
    }

    // Debug: Also get subscription count for development troubleshooting
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { count: subscriptionCount } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true });
      
      console.log('User tier debug - User ID:', user.id, 'Tier:', result?.data, 'Subscription count:', subscriptionCount);
      
      return NextResponse.json({ 
        data: { 
          tier: result?.data,
          debug: {
            userId: user.id,
            subscriptionCount: subscriptionCount || 0,
            isDevelopment: subscriptionCount === 0
          }
        } 
      });
    }

    return NextResponse.json({ data: { tier: result?.data } });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}