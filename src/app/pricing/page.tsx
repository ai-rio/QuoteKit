import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import FreemiumPricing from '@/components/pricing/FreemiumPricing';
import { createFreeSubscription } from '@/features/pricing/actions/create-free-subscription';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

export const metadata: Metadata = {
  title: 'Pricing - QuoteKit',
  description: 'Simple, transparent pricing for QuoteKit. Start free and upgrade when you\'re ready.',
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
    redirect(`/auth/sign-up?plan=${encodeURIComponent(planName)}&price_id=${stripePriceId}`);
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
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4">
          <FreemiumPricing onSelectPlan={handlePlanSelection} />
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-muted/30 py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-muted-foreground">Got questions? We&apos;ve got answers.</p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Can I change plans anytime?</h3>
                <p className="text-sm text-muted-foreground">
                  Yes! You can upgrade, downgrade, or cancel your subscription at any time. 
                  Changes take effect at your next billing cycle.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">What payment methods do you accept?</h3>
                <p className="text-sm text-muted-foreground">
                  We accept all major credit cards (Visa, MasterCard, American Express) 
                  and process payments securely through Stripe.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Is there a setup fee?</h3>
                <p className="text-sm text-muted-foreground">
                  No setup fees, ever. You only pay for your chosen plan, 
                  and you can start with our free tier immediately.
                </p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Do you offer refunds?</h3>
                <p className="text-sm text-muted-foreground">
                  We offer a 30-day money-back guarantee. If you&apos;re not satisfied, 
                  we&apos;ll refund your payment, no questions asked.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">What&apos;s included in the Free plan?</h3>
                <p className="text-sm text-muted-foreground">
                  The Free plan includes unlimited quotes, basic PDF generation, 
                  client management, and item catalog - perfect for getting started.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Is my data secure?</h3>
                <p className="text-sm text-muted-foreground">
                  Absolutely. We use enterprise-grade security, encrypted data storage, 
                  and never share your information with third parties.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of businesses that trust QuoteKit for their quoting needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <form action={handlePlanSelection.bind(null, 'price_free_monthly', 'Free Plan')}>
              <button 
                type="submit"
                className="bg-secondary text-secondary-foreground hover:bg-secondary/80 px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                Start Free
              </button>
            </form>
            <form action={handlePlanSelection.bind(null, 'price_1RVyAQGgBK1ooXYF0LokEHtQ', 'Pro Plan')}>
              <button 
                type="submit"
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                Try Pro Plan
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}