'use client';

import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PriceWithProduct, ProductWithPrices, SubscriptionWithProduct } from '@/features/pricing/types';

import { EnhancedCurrentPlanCard } from './EnhancedCurrentPlanCard';

interface StripeEnhancedCurrentPlanCardProps {
  subscription: SubscriptionWithProduct | null;
  freePlanInfo?: PriceWithProduct | null;
  availablePlans: ProductWithPrices[];
  stripePublishableKey: string;
}

interface StripeLoadState {
  status: 'loading' | 'loaded' | 'error' | 'fallback';
  error?: string;
  retryCount: number;
}

// Create stripe promise with error handling
// Use a Map to cache stripe promises by publishable key
const stripePromiseCache = new Map<string, Promise<any>>();

const createStripePromise = async (publishableKey: string): Promise<any> => {
  try {
    console.debug('StripeEnhancedCurrentPlanCard: Loading Stripe with key:', publishableKey.substring(0, 8) + '...');
    
    const stripe = await loadStripe(publishableKey);
    
    if (!stripe) {
      throw new Error('Stripe failed to initialize - invalid publishable key or network issues');
    }
    
    console.debug('StripeEnhancedCurrentPlanCard: Stripe loaded successfully');
    return stripe;
  } catch (error) {
    console.error('StripeEnhancedCurrentPlanCard: Failed to load Stripe:', error);
    throw error;
  }
};

const getStripePromise = (publishableKey: string) => {
  if (!stripePromiseCache.has(publishableKey)) {
    stripePromiseCache.set(publishableKey, createStripePromise(publishableKey));
  }
  return stripePromiseCache.get(publishableKey)!;
};

export function StripeEnhancedCurrentPlanCard({ 
  subscription, 
  freePlanInfo, 
  availablePlans, 
  stripePublishableKey 
}: StripeEnhancedCurrentPlanCardProps) {
  const [stripeLoadState, setStripeLoadState] = useState<StripeLoadState>({
    status: 'loading',
    retryCount: 0
  });

  // Load Stripe when component mounts or when retrying
  useEffect(() => {
    // Only load Stripe if we have a publishable key
    if (!stripePublishableKey) {
      setStripeLoadState(prev => ({ ...prev, status: 'fallback' }));
      return;
    }

    let isMounted = true;

    const loadStripeInstance = async () => {
      try {
        setStripeLoadState(prev => ({ ...prev, status: 'loading' }));
        
        const stripePromise = getStripePromise(stripePublishableKey);
        await stripePromise; // Wait for the promise to resolve
        
        if (isMounted) {
          setStripeLoadState(prev => ({ ...prev, status: 'loaded' }));
        }
      } catch (error) {
        console.error('StripeEnhancedCurrentPlanCard: Stripe loading failed:', error);
        
        if (isMounted) {
          setStripeLoadState(prev => ({
            ...prev,
            status: 'error',
            error: error instanceof Error ? error.message : 'Failed to load Stripe.js'
          }));
        }
      }
    };

    loadStripeInstance();

    return () => {
      isMounted = false;
    };
  }, [stripePublishableKey, stripeLoadState.retryCount]);

  // Only render with Stripe Elements if we have a publishable key
  if (!stripePublishableKey) {
    console.debug('StripeEnhancedCurrentPlanCard: No publishable key provided, falling back to basic component');
    return (
      <EnhancedCurrentPlanCard 
        subscription={subscription}
        freePlanInfo={freePlanInfo}
        availablePlans={availablePlans}
      />
    );
  }

  const handleRetry = () => {
    // Clear the cached promise to force a fresh load
    stripePromiseCache.delete(stripePublishableKey);
    setStripeLoadState(prev => ({
      ...prev,
      retryCount: prev.retryCount + 1,
      error: undefined
    }));
  };

  const handleFallback = () => {
    setStripeLoadState(prev => ({ ...prev, status: 'fallback' }));
  };

  // Show loading state
  if (stripeLoadState.status === 'loading') {
    return (
      <Card className="bg-paper-white rounded-2xl border border-stone-gray/20 shadow-lg">
        <CardContent className="p-8">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-forest-green mx-auto mb-4" />
              <p className="text-lg text-charcoal">Loading payment system...</p>
              <p className="text-base text-charcoal/70 mt-2">Connecting to Stripe</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error state with retry option
  if (stripeLoadState.status === 'error') {
    return (
      <Card className="bg-paper-white rounded-2xl border border-stone-gray/20 shadow-lg">
        <CardContent className="p-8">
          <div className="text-center py-8">
            <Card className="bg-red-50 border-red-200 mb-6 rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                  <div className="flex-1 text-left">
                    <p className="font-bold text-red-800 text-base">Payment System Error</p>
                    <p className="text-base text-red-600 mt-1">
                      {stripeLoadState.error || 'Failed to load Stripe.js'}
                    </p>
                    <p className="text-sm text-red-600 mt-2">
                      This might be due to network issues, ad blockers, or browser security settings.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex flex-col gap-3 justify-center">
              <Button 
                className="bg-forest-green text-paper-white hover:bg-forest-green/90 font-bold px-6 py-3 rounded-lg transition-all duration-200 shadow-lg"
                onClick={handleRetry}
                disabled={stripeLoadState.retryCount >= 3}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                {stripeLoadState.retryCount >= 3 ? 'Max Retries Reached' : 'Retry Loading Stripe'}
              </Button>
              
              <Button 
                variant="outline"
                className="bg-equipment-yellow border-equipment-yellow text-charcoal hover:bg-equipment-yellow/90 font-bold px-6 py-3 rounded-lg transition-all duration-200"
                onClick={handleFallback}
              >
                Continue Without Payment Features
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show fallback (basic component without Stripe features)
  if (stripeLoadState.status === 'fallback') {
    return (
      <>
        <Card className="bg-blue-50 border-blue-200 mb-4 rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-blue-800 text-base">Limited Mode</p>
                <p className="text-base text-blue-600 mt-1">
                  Payment features are disabled. Some subscription management options may not be available.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <EnhancedCurrentPlanCard 
          subscription={subscription}
          freePlanInfo={freePlanInfo}
          availablePlans={availablePlans}
        />
      </>
    );
  }

  // Stripe loaded successfully - render with Elements wrapper
  console.debug('StripeEnhancedCurrentPlanCard: Rendering with Stripe Elements');
  
  const stripePromise = getStripePromise(stripePublishableKey);

  return (
    <Elements 
      stripe={stripePromise}
      options={{
        // Optional: Configure Elements globally
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#059669', // forest-green
            colorBackground: '#ffffff',
            colorText: '#1f2937', // charcoal
            colorDanger: '#ef4444',
            fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
            borderRadius: '8px',
          }
        }
      }}
    >
      <EnhancedCurrentPlanCard 
        subscription={subscription}
        freePlanInfo={freePlanInfo}
        availablePlans={availablePlans}
      />
    </Elements>
  );
}