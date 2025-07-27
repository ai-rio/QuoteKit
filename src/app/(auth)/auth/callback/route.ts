// ref: https://github.com/vercel/next.js/blob/canary/examples/with-supabase/app/auth/callback/route.ts

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { getURL } from '@/utils/get-url';

const siteUrl = getURL();

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  
  // Preserve plan selection parameters from the original request
  const planParam = requestUrl.searchParams.get('plan');
  const amountParam = requestUrl.searchParams.get('amount');
  const intervalParam = requestUrl.searchParams.get('interval');

  if (code) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.exchangeCodeForSession(code);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.redirect(`${siteUrl}/login`);
    }

    // Check if user is subscribed, if not redirect to pricing page
    const { data: userSubscription } = await supabase
      .from('subscriptions')
      .select('*, prices(*, products(*))')
      .eq('user_id', user.id)
      .in('status', ['trialing', 'active'])
      .maybeSingle();

    if (!userSubscription) {
      // If user has plan parameters, redirect to complete the plan selection
      if (planParam) {
        const redirectParams = new URLSearchParams();
        redirectParams.set('plan', planParam);
        if (amountParam) redirectParams.set('amount', amountParam);
        if (intervalParam) redirectParams.set('interval', intervalParam);
        return NextResponse.redirect(`${siteUrl}/pricing/complete?${redirectParams.toString()}`);
      }
      return NextResponse.redirect(`${siteUrl}/pricing`);
    } else {
      return NextResponse.redirect(`${siteUrl}`);
    }
  }

  return NextResponse.redirect(siteUrl);
}
