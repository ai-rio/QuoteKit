import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import FreemiumPricing from '@/components/pricing/FreemiumPricing';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

export const metadata: Metadata = {
  title: 'Pricing - QuoteKit',
  description: 'Simple, transparent pricing for QuoteKit. Start free and upgrade when you\'re ready.',
};

// Server action to handle plan selection
async function handlePlanSelection(stripePriceId: string, planName: string) {
  'use server';
  
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // Redirect to signup with pricing context
    redirect(`/auth/sign-up?plan=${encodeURIComponent(planName)}&price_id=${stripePriceId}`);
  }

  if (stripePriceId === 'price_free') {
    // Create free subscription and redirect to dashboard
    redirect('/dashboard?welcome=free');
  } else {
    // Redirect to checkout for paid plans
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
                <h3 className="font-semibold mb-2">Can I use QuoteKit for multiple businesses?</h3>
                <p className="text-sm text-muted-foreground">
                  Yes! Our Pro plan supports multiple business profiles and 
                  custom branding for each of your ventures.
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
            <form action={handlePlanSelection.bind(null, 'price_free', 'Free')}>
              <button 
                type="submit"
                className="bg-secondary text-secondary-foreground hover:bg-secondary/80 px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                Start Free
              </button>
            </form>
            <form action={handlePlanSelection.bind(null, 'price_monthly_1200', 'Pro')}>
              <button 
                type="submit"
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                Try Pro Free
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function PricingPageSkeleton() {
  return (
    <div className="rounded-lg bg-paper-white py-8">
      <div className="relative z-10 m-auto flex max-w-[1200px] flex-col items-center gap-8 px-4 pt-8 lg:pt-16">
        <div className="h-12 w-96 bg-light-concrete animate-pulse rounded"></div>
        <div className="h-6 w-80 bg-light-concrete animate-pulse rounded"></div>
        <div className="grid w-full gap-4 grid-cols-2 md:grid-cols-4 lg:gap-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-96 bg-light-concrete animate-pulse rounded-lg"></div>
          ))}
        </div>
      </div>
    </div>
  );
}