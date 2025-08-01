'use client';

import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

import { EnhancedCurrentPlanCard } from './EnhancedCurrentPlanCard';
import { PriceWithProduct, ProductWithPrices, SubscriptionWithProduct } from '@/features/pricing/types';

interface StripeEnhancedCurrentPlanCardProps {
  subscription: SubscriptionWithProduct | null;
  freePlanInfo?: PriceWithProduct | null;
  availablePlans: ProductWithPrices[];
  stripePublishableKey: string;
}

// Create stripe promise outside component to avoid recreating
const getStripePromise = (publishableKey: string) => loadStripe(publishableKey);

export function StripeEnhancedCurrentPlanCard({ 
  subscription, 
  freePlanInfo, 
  availablePlans, 
  stripePublishableKey 
}: StripeEnhancedCurrentPlanCardProps) {
  // Only render with Stripe Elements if we have a publishable key
  if (!stripePublishableKey) {
    return (
      <EnhancedCurrentPlanCard 
        subscription={subscription}
        freePlanInfo={freePlanInfo}
        availablePlans={availablePlans}
      />
    );
  }

  return (
    <Elements stripe={getStripePromise(stripePublishableKey)}>
      <EnhancedCurrentPlanCard 
        subscription={subscription}
        freePlanInfo={freePlanInfo}
        availablePlans={availablePlans}
      />
    </Elements>
  );
}