import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from '@/components/ui/breadcrumb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAvailablePlans } from '@/features/account/actions/subscription-actions';
import { BillingHistoryTable } from '@/features/account/components/BillingHistoryTable';
import { EnhancedCurrentPlanCard } from '@/features/account/components/EnhancedCurrentPlanCard';
import { PaymentMethodsManager } from '@/features/account/components/PaymentMethodsManager';
import { StripeEnhancedCurrentPlanCard } from '@/features/account/components/StripeEnhancedCurrentPlanCard';
import { SuccessHandler } from '@/features/account/components/SuccessHandler';
import { getSession } from '@/features/account/controllers/get-session';
import { getStripePublishableKey } from '@/features/account/controllers/get-stripe-config';
import { getPaymentMethods, getSubscription } from '@/features/account/controllers/get-subscription';
import { getEnhancedBillingHistory } from '@/features/billing/api/enhanced-billing-history';

import { AccountPageWrapper } from './AccountPageWrapper';

export default async function AccountPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  const [subscription, billingHistoryResponse, paymentMethods, availablePlans, stripePublishableKey] = await Promise.all([
    getSubscription(),
    getEnhancedBillingHistory(session.user.id, {
      limit: 20,
      productionMode: process.env.NODE_ENV === 'production',
      includeSubscriptionHistory: process.env.NODE_ENV === 'development'
    }),
    getPaymentMethods(),
    getAvailablePlans(),
    getStripePublishableKey(),
  ]);

  // Extract billing history data from the enhanced API response
  const billingHistory = billingHistoryResponse.data;
  const billingMetadata = billingHistoryResponse.metadata;

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
    <AccountPageWrapper>
      <div className="min-h-screen bg-light-concrete">
        {/* Handle success/error states from URL parameters */}
        <SuccessHandler />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-6 sm:space-y-8">
          {/* Breadcrumb Navigation */}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/dashboard" className="text-charcoal/70 hover:text-charcoal text-sm sm:text-base">
                    Dashboard
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-charcoal font-bold text-sm sm:text-base">
                  Account
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Page Header - Following Style Guide Typography */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-forest-green mb-2">
              Account Dashboard
            </h1>
            <p className="text-base sm:text-lg text-charcoal">
              Manage your subscription and billing information
            </p>
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
            <BillingHistoryTable 
              initialData={billingHistory} 
              metadata={billingMetadata}
            />
          </Suspense>

          {/* Payment Methods Section */}
          <Suspense fallback={<CardSkeleton />}>
            {stripePublishableKey ? (
              <PaymentMethodsManager stripePublishableKey={stripePublishableKey} />
            ) : (
              <Card className="bg-paper-white rounded-2xl border border-stone-gray/20 shadow-lg">
                <CardHeader className="p-8">
                  <CardTitle className="text-xl md:text-2xl font-bold text-forest-green">
                    Payment Methods
                  </CardTitle>
                  <CardDescription className="text-lg text-charcoal">
                    Stripe is not configured
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-0">
                  <p className="text-lg text-charcoal">
                    Payment method management is not available.
                  </p>
                </CardContent>
              </Card>
            )}
          </Suspense>
        </div>
      </div>
    </AccountPageWrapper>
  );
}

function CardSkeleton() {
  return (
    <Card className="bg-paper-white rounded-2xl border border-stone-gray/20 shadow-lg">
      <CardHeader className="p-8">
        <div className="h-6 w-48 bg-light-concrete animate-pulse rounded"></div>
        <div className="h-4 w-32 bg-light-concrete animate-pulse rounded mt-2"></div>
      </CardHeader>
      <CardContent className="p-8 pt-0">
        <div className="space-y-4">
          <div className="h-4 w-full bg-light-concrete animate-pulse rounded"></div>
          <div className="h-4 w-3/4 bg-light-concrete animate-pulse rounded"></div>
          <div className="h-4 w-1/2 bg-light-concrete animate-pulse rounded"></div>
        </div>
      </CardContent>
    </Card>
  );
}
