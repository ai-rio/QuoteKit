import { Suspense } from 'react';
import { redirect } from 'next/navigation';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAvailablePlans } from '@/features/account/actions/subscription-actions';
import { EnhancedCurrentPlanCard } from '@/features/account/components/EnhancedCurrentPlanCard';
import { PaymentMethodsManager } from '@/features/account/components/PaymentMethodsManager';
import { BillingHistoryTable } from '@/features/account/components/BillingHistoryTable';
import { SuccessHandler } from '@/features/account/components/SuccessHandler';
import { StripeEnhancedCurrentPlanCard } from '@/features/account/components/StripeEnhancedCurrentPlanCard';
import { getSession } from '@/features/account/controllers/get-session';
import { getStripePublishableKey } from '@/features/account/controllers/get-stripe-config';
import { getBillingHistory, getPaymentMethods, getSubscription } from '@/features/account/controllers/get-subscription';
import { SubscriptionWithProduct } from '@/features/pricing/types';

export default async function AccountPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  const [subscription, billingHistory, paymentMethods, availablePlans, stripePublishableKey] = await Promise.all([
    getSubscription(),
    getBillingHistory(),
    getPaymentMethods(),
    getAvailablePlans(),
    getStripePublishableKey(),
  ]);

  // Bridge solution: If user has no subscription record, get free plan info as fallback
  // This handles the edge case where authenticated users don't have subscription records yet
  let freePlanInfo = null;
  if (!subscription) {
    try {
      const { getFreePlanInfo } = await import('@/features/account/controllers/get-subscription');
      freePlanInfo = await getFreePlanInfo();
    } catch (error) {
      console.error('Failed to get free plan info:', error);
    }
  }

  return (
    <div className="min-h-screen bg-light-concrete">
      {/* Handle success/error states from URL parameters */}
      <SuccessHandler />
      
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-charcoal">Account Dashboard</h1>
          <p className="text-charcoal/70 mt-2">Manage your subscription and billing information</p>
          
        </div>

        {/* Current Plan Section */}
        <Suspense fallback={<CardSkeleton />}>
          {stripePublishableKey ? (
            <StripeEnhancedCurrentPlanCard 
              subscription={subscription} 
              freePlanInfo={freePlanInfo}
              availablePlans={availablePlans} 
              stripePublishableKey={stripePublishableKey}
            />
          ) : (
            <EnhancedCurrentPlanCard 
              subscription={subscription} 
              freePlanInfo={freePlanInfo}
              availablePlans={availablePlans} 
            />
          )}
        </Suspense>

        {/* Billing History Section */}
        <Suspense fallback={<CardSkeleton />}>
          <BillingHistoryTable initialData={billingHistory} />
        </Suspense>

        {/* Payment Methods Section */}
        <Suspense fallback={<CardSkeleton />}>
          {stripePublishableKey ? (
            <PaymentMethodsManager stripePublishableKey={stripePublishableKey} />
          ) : (
            <Card className="bg-paper-white border-stone-gray">
              <CardHeader>
                <CardTitle className="text-xl text-charcoal">Payment Methods</CardTitle>
                <CardDescription className="text-charcoal/70">Stripe is not configured</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-charcoal/60">Payment method management is not available.</p>
              </CardContent>
            </Card>
          )}
        </Suspense>
      </div>
    </div>
  );
}

function CardSkeleton() {
  return (
    <Card className="bg-paper-white border-stone-gray">
      <CardHeader>
        <div className="h-6 w-48 bg-light-concrete animate-pulse rounded"></div>
        <div className="h-4 w-32 bg-light-concrete animate-pulse rounded"></div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="h-4 w-full bg-light-concrete animate-pulse rounded"></div>
          <div className="h-4 w-3/4 bg-light-concrete animate-pulse rounded"></div>
          <div className="h-4 w-1/2 bg-light-concrete animate-pulse rounded"></div>
        </div>
      </CardContent>
    </Card>
  );
}