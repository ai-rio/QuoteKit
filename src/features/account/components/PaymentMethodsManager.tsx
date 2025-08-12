'use client';

import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { AlertCircle, CreditCard, Loader2, Plus, RefreshCw, RotateCcw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

import { AddPaymentMethodDialog } from './AddPaymentMethodDialog';
import { PaymentMethodCard } from './PaymentMethodCard';

interface PaymentMethod {
  id: string;
  type: string;
  card?: {
    brand: string;
    country: string;
    exp_month: number;
    exp_year: number;
    last4: string;
    funding: string;
  };
  created: number;
  customer: string;
  is_default?: boolean;
}

interface PaymentMethodsManagerProps {
  stripePublishableKey: string;
}

interface StripeLoadState {
  status: 'loading' | 'loaded' | 'error' | 'fallback';
  error?: string;
  retryCount: number;
}

// Create stripe promise with error handling
const stripePromiseCache = new Map<string, Promise<any>>();

const createStripePromise = async (publishableKey: string): Promise<any> => {
  try {
    console.debug('PaymentMethodsManager: Loading Stripe with key:', publishableKey.substring(0, 8) + '...');
    
    const stripe = await loadStripe(publishableKey);
    
    if (!stripe) {
      throw new Error('Stripe failed to initialize - invalid publishable key or network issues');
    }
    
    console.debug('PaymentMethodsManager: Stripe loaded successfully');
    return stripe;
  } catch (error) {
    console.error('PaymentMethodsManager: Failed to load Stripe:', error);
    throw error;
  }
};

const getStripePromise = (publishableKey: string) => {
  if (!stripePromiseCache.has(publishableKey)) {
    stripePromiseCache.set(publishableKey, createStripePromise(publishableKey));
  }
  return stripePromiseCache.get(publishableKey)!;
};

export function PaymentMethodsManager({ stripePublishableKey }: PaymentMethodsManagerProps) {
  const [stripeLoadState, setStripeLoadState] = useState<StripeLoadState>({
    status: 'loading',
    retryCount: 0
  });

  // Load Stripe when component mounts or when retrying
  useEffect(() => {
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
        console.error('PaymentMethodsManager: Stripe loading failed:', error);
        
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
        <CardHeader className="p-8">
          <CardTitle className="text-xl md:text-2xl font-bold text-forest-green flex items-center space-x-2">
            <CreditCard className="h-5 w-5 text-forest-green" />
            <span>Payment Methods</span>
          </CardTitle>
          <CardDescription className="text-lg text-charcoal mt-2">
            Loading payment system...
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 pt-0">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-forest-green mx-auto mb-4" />
              <p className="text-lg text-charcoal">Connecting to Stripe...</p>
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
        <CardHeader className="p-8">
          <CardTitle className="text-xl md:text-2xl font-bold text-forest-green flex items-center space-x-2">
            <CreditCard className="h-5 w-5 text-forest-green" />
            <span>Payment Methods</span>
          </CardTitle>
          <CardDescription className="text-lg text-charcoal">
            Payment system unavailable
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 pt-0">
          <Card className="bg-red-50 border-red-200 mb-6 rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                <div className="flex-1">
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
          
          <div className="flex flex-col gap-3 text-center">
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
              Continue in Limited Mode
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show fallback (limited functionality without Stripe)
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
                  Payment method management is disabled due to Stripe connectivity issues.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-paper-white rounded-2xl border border-stone-gray/20 shadow-lg">
          <CardHeader className="p-8">
            <CardTitle className="text-xl md:text-2xl font-bold text-forest-green flex items-center space-x-2">
              <CreditCard className="h-5 w-5 text-forest-green" />
              <span>Payment Methods</span>
            </CardTitle>
            <CardDescription className="text-lg text-charcoal">
              Manage your payment information
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-0">
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-stone-gray/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="h-8 w-8 text-charcoal" />
              </div>
              <h3 className="text-lg font-bold text-charcoal mb-2">Payment Management Unavailable</h3>
              <p className="text-charcoal text-base mb-6 max-w-sm mx-auto">
                You can manage your payment methods directly through Stripe&apos;s customer portal.
              </p>
              <Button 
                variant="outline" 
                className="bg-paper-white border-stone-gray text-charcoal hover:bg-light-concrete font-bold px-6 py-3 rounded-lg transition-all duration-200"
                asChild
              >
                <a href="/manage-subscription">Manage in Stripe</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </>
    );
  }

  // Stripe loaded successfully - render with Elements wrapper
  console.debug('PaymentMethodsManager: Rendering with Stripe Elements');
  
  const stripePromise = getStripePromise(stripePublishableKey);

  return (
    <Elements stripe={stripePromise}>
      <PaymentMethodsContent />
    </Elements>
  );
}

function PaymentMethodsContent() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const fetchPaymentMethods = useCallback(async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      console.log('🔄 Fetching payment methods...');
      
      const response = await fetch('/api/payment-methods', {
        cache: 'no-store', // Always fetch fresh data
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      const result = await response.json();
      
      console.log('📊 Payment methods API response:', result);

      if (result.success) {
        console.log(`✅ Found ${result.data?.length || 0} payment methods`);
        setPaymentMethods(result.data || []);
      } else {
        console.error('❌ API error:', result.error);
        setError(result.error || 'Failed to fetch payment methods');
      }
    } catch (error) {
      console.error('💥 Fetch error:', error);
      setError('Failed to fetch payment methods. Please check your connection and try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPaymentMethods();
  }, [fetchPaymentMethods]);

  const handleDeletePaymentMethod = async (paymentMethodId: string) => {
    // Find the payment method to check if it's default
    const paymentMethod = paymentMethods.find(pm => pm.id === paymentMethodId);
    
    if (paymentMethod?.is_default && paymentMethods.length > 1) {
      toast({
        title: 'Cannot Delete Default Payment Method',
        description: 'Please set another payment method as default before deleting this one.',
        variant: 'destructive',
      });
      return;
    }

    const confirmMessage = paymentMethod?.is_default 
      ? 'Are you sure you want to delete your only payment method? This will affect your active subscriptions.'
      : 'Are you sure you want to delete this payment method?';

    if (!confirm(confirmMessage)) {
      return;
    }

    setDeletingId(paymentMethodId);

    try {
      const response = await fetch(`/api/payment-methods/${paymentMethodId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Payment method deleted successfully',
        });
        await fetchPaymentMethods();
      } else {
        // Handle specific error cases
        if (response.status === 404) {
          toast({
            title: 'Payment Method Not Found',
            description: 'This payment method may have already been deleted. Refreshing list...',
            variant: 'destructive',
          });
          await fetchPaymentMethods(); // Refresh to sync state
        } else {
          toast({
            title: 'Error',
            description: result.error || 'Failed to delete payment method',
            variant: 'destructive',
          });
        }
      }
    } catch (error) {
      console.error('Error deleting payment method:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete payment method. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetDefaultPaymentMethod = async (paymentMethodId: string) => {
    setSettingDefaultId(paymentMethodId);

    try {
      const response = await fetch(`/api/payment-methods/${paymentMethodId}`, {
        method: 'PATCH',
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Default payment method updated successfully',
        });
        await fetchPaymentMethods();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update default payment method',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating default payment method:', error);
      toast({
        title: 'Error',
        description: 'Failed to update default payment method. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSettingDefaultId(null);
    }
  };

  const handleAddSuccess = () => {
    setShowAddDialog(false);
    
    // Add a small delay to allow Stripe webhook processing
    setTimeout(() => {
      fetchPaymentMethods();
    }, 1000);
    
    toast({
      title: 'Success',
      description: 'Payment method added successfully',
    });
  };

  const handleRefresh = () => {
    fetchPaymentMethods(true);
  };

  const handleForceSync = async () => {
    try {
      setRefreshing(true);
      console.log('🔄 Force syncing payment methods from Stripe...');
      
      // Call the sync endpoint to force refresh from Stripe
      const response = await fetch('/api/payment-methods/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      console.log('🔄 Sync result:', result);
      
      if (result.success) {
        toast({
          title: 'Sync Complete',
          description: `Synced ${result.synced || 0} payment methods from Stripe`,
        });
        // Fetch fresh data after sync
        await fetchPaymentMethods();
      } else {
        toast({
          title: 'Sync Failed',
          description: result.error || 'Failed to sync payment methods',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast({
        title: 'Sync Error',
        description: 'Failed to sync payment methods',
        variant: 'destructive',
      });
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-paper-white rounded-2xl border border-stone-gray/20 shadow-lg">
        <CardHeader className="p-8">
          <CardTitle className="text-xl md:text-2xl font-bold text-forest-green">
            Payment Methods
          </CardTitle>
          <CardDescription className="text-lg text-charcoal mt-2">
            Manage your payment information
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 pt-0">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-charcoal mx-auto mb-4" />
              <p className="text-base text-charcoal">Loading payment methods...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-paper-white rounded-2xl border border-stone-gray/20 shadow-lg">
      <CardHeader className="p-4 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-lg sm:text-xl md:text-2xl font-bold text-forest-green flex items-center space-x-2">
              <CreditCard className="h-5 w-5 text-forest-green" />
              <span>Payment Methods</span>
            </CardTitle>
            <CardDescription className="text-base sm:text-lg text-charcoal mt-2">
              Manage your payment information securely
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2 self-start sm:self-auto">
            <Button
              size="sm"
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
              className="bg-paper-white border-stone-gray text-charcoal hover:bg-light-concrete font-bold px-3 sm:px-4 py-2 rounded-lg transition-all duration-200"
              title="Refresh payment methods"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleForceSync}
              disabled={refreshing}
              className="bg-paper-white border-stone-gray text-charcoal hover:bg-light-concrete font-bold px-3 sm:px-4 py-2 rounded-lg transition-all duration-200"
              title="Force sync from Stripe"
            >
              <RotateCcw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-8 pt-0">
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50 rounded-2xl">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 text-base">
              {error}
              <Button
                size="sm"
                variant="outline"
                onClick={() => fetchPaymentMethods()}
                className="ml-2 h-8 text-sm bg-paper-white border-red-300 text-red-600 hover:bg-red-50 font-bold px-3 py-1 rounded transition-all duration-200"
              >
                Try Again
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {paymentMethods.length > 0 ? (
          <div className="space-y-4">
            {paymentMethods.map((method) => (
              <PaymentMethodCard
                key={method.id}
                paymentMethod={method}
                onDelete={handleDeletePaymentMethod}
                onSetDefault={handleSetDefaultPaymentMethod}
                isDeleting={deletingId === method.id}
                isSettingDefault={settingDefaultId === method.id}
              />
            ))}
            
            <div className="pt-4 border-t border-stone-gray/30">
              <Button
                variant="outline"
                onClick={() => setShowAddDialog(true)}
                className="w-full bg-paper-white border-stone-gray text-charcoal hover:bg-light-concrete font-bold px-4 sm:px-6 py-3 sm:py-4 rounded-lg transition-all duration-200 h-12"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Another Payment Method
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 sm:py-12">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-stone-gray/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 text-charcoal" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-charcoal mb-2">No payment methods</h3>
            <p className="text-charcoal text-sm sm:text-base mb-6 max-w-sm mx-auto px-4">
              Add a payment method to manage your subscriptions and make payments.
            </p>
            <Button 
              onClick={() => setShowAddDialog(true)}
              className="bg-forest-green text-paper-white hover:bg-forest-green/90 font-bold px-4 sm:px-6 py-3 rounded-lg transition-all duration-200 shadow-lg h-10 w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Payment Method
            </Button>
          </div>
        )}

        <AddPaymentMethodDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          onSuccess={handleAddSuccess}
        />
      </CardContent>
    </Card>
  );
}