import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import LawnQuotePricing from '@/components/pricing/LawnQuotePricing';
import { createFreeSubscription } from '@/features/pricing/actions/create-free-subscription';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

export const metadata: Metadata = {
  title: 'Pricing - LawnQuote',
  description: 'Simple, transparent pricing for LawnQuote. Start free and upgrade when you\'re ready to grow your landscaping business.',
};

// Server action to handle plan selection
async function handlePlanSelection(stripePriceId: string, planName: string) {
  'use server';
  
  console.log('🎩 PRICING PAGE: Plan selection initiated:', {
    plan_name: planName,
    stripe_price_id: stripePriceId,
    is_free: stripePriceId === 'price_free_monthly' || planName === 'Free Plan',
    timestamp: new Date().toISOString()
  });
  
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.log('🔐 User not authenticated, redirecting to signup');
    // Redirect to signup with pricing context
    redirect(`/signup?plan=${encodeURIComponent(planName)}&price_id=${stripePriceId}`);
  }

  // Import getSubscription to check for existing subscription
  const { getSubscription } = await import('@/features/account/controllers/get-subscription');
  const existingSubscription = await getSubscription();

  if (stripePriceId === 'price_free_monthly' || planName === 'Free Plan') {
    // Check if user already has an active subscription
    if (existingSubscription) {
      console.log('User already has active subscription, redirecting to dashboard:', {
        userId: user.id,
        subscriptionType: existingSubscription.stripe_price_id ? 'paid' : 'free',
        subscriptionStatus: existingSubscription.status
      });
      
      // If they have a free subscription, just redirect to dashboard
      // If they have a paid subscription, still redirect (they're already upgraded)
      redirect('/dashboard');
    }

    // Only create free subscription if user doesn't have one
    const result = await createFreeSubscription(user.id);
    
    if (!result.success) {
      console.error('Failed to create free subscription:', result.error);
      // Still redirect to dashboard, but log the error
    }
    
    redirect('/dashboard?welcome=free');
  } else {
    // For paid plans, redirect to checkout regardless of existing subscription
    // Stripe checkout will handle upgrading/changing plans
    console.log('💳 Redirecting to checkout for paid plan:', {
      plan_name: planName,
      stripe_price_id: stripePriceId,
      redirect_url: `/checkout?price_id=${stripePriceId}`
    });
    redirect(`/checkout?price_id=${stripePriceId}`);
  }
}

export default async function PricingPage() {
  return <LawnQuotePricing onSelectPlan={handlePlanSelection} />;
}