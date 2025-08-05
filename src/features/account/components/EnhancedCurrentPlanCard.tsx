'use client';

import { AlertCircle, DollarSign, Loader2, RefreshCw, Settings, X } from 'lucide-react';
import { useEffect,useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PriceWithProduct, ProductWithPrices, SubscriptionWithProduct } from '@/features/pricing/types';
import { formatDate } from '@/utils/to-date-time';

import { cancelSubscription, changePlan, reactivateSubscription } from '../actions/subscription-actions';
import { AddPaymentMethodDialog } from './AddPaymentMethodDialog';
import { CancellationDialog } from './CancellationDialog';
import { PlanChangeDialog } from './PlanChangeDialog';

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
  brand?: string;
  last4?: string;
  exp_month?: number;
  exp_year?: number;
}

interface EnhancedCurrentPlanCardProps {
  subscription: SubscriptionWithProduct | null;
  freePlanInfo?: PriceWithProduct | null; // Proper type from getFreePlanInfo
  availablePlans: ProductWithPrices[];
}

export function EnhancedCurrentPlanCard({ subscription, freePlanInfo, availablePlans }: EnhancedCurrentPlanCardProps) {
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showAddPaymentDialog, setShowAddPaymentDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncSuccess, setSyncSuccess] = useState<string | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoadingPaymentMethods, setIsLoadingPaymentMethods] = useState(false);

  // Load payment methods when dialog opens
  const loadPaymentMethods = async () => {
    if (isLoadingPaymentMethods) return;
    
    setIsLoadingPaymentMethods(true);
    try {
      console.log('🔄 Loading payment methods...');
      const response = await fetch('/api/payment-methods', {
        cache: 'no-store', // Always fetch fresh data
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Payment methods API response:', data);
        
        // Handle both possible response formats
        const methods = data.success ? data.data : (data.paymentMethods || []);
        setPaymentMethods(methods);
        
        console.log('✅ Payment methods loaded:', {
          count: methods.length,
          methods: methods.map((pm: PaymentMethod) => ({
            id: pm.id,
            isDefault: pm.is_default,
            brand: pm.brand || pm.card?.brand,
            last4: pm.last4 || pm.card?.last4
          }))
        });
      } else {
        console.error('Failed to load payment methods:', response.statusText);
        setPaymentMethods([]);
      }
    } catch (error) {
      console.error('Error loading payment methods:', error);
      setPaymentMethods([]);
    } finally {
      setIsLoadingPaymentMethods(false);
    }
  };

  // Load payment methods when plan dialog opens - with proper timing
  useEffect(() => {
    if (showPlanDialog) {
      // Load payment methods immediately when dialog opens
      loadPaymentMethods();
    } else {
      // Clear payment methods when dialog closes to ensure fresh data next time
      setPaymentMethods([]);
    }
  }, [showPlanDialog]);

  const handlePaymentMethodRequired = () => {
    setShowPlanDialog(false);
    setShowAddPaymentDialog(true);
  };

  const handlePaymentMethodAdded = () => {
    setShowAddPaymentDialog(false);
    // Reload payment methods and reopen plan dialog
    loadPaymentMethods().then(() => {
      // Give a small delay to ensure payment methods are loaded
      setTimeout(() => {
        setShowPlanDialog(true);
      }, 500);
    });
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      active: 'bg-forest-green text-paper-white',
      trialing: 'bg-equipment-yellow text-charcoal',
      past_due: 'bg-error-red text-paper-white',
      canceled: 'bg-stone-gray text-charcoal',
      free: 'bg-equipment-yellow text-charcoal', // Add free status for fallback
    };

    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || 'bg-stone-gray text-charcoal'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };;

  const handlePlanChange = async (priceId: string, isUpgrade: boolean, paymentMethodId?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('💳 Plan change initiated from EnhancedCurrentPlanCard:', {
        priceId,
        isUpgrade,
        paymentMethodId,
        hasPaymentMethod: !!paymentMethodId
      });
      
      const result = await changePlan(priceId, isUpgrade, paymentMethodId);
      
      // Close dialog first
      setShowPlanDialog(false);
      
      console.log('✅ Plan change completed, dispatching events:', {
        result: result ? 'success' : 'unknown',
        needsBillingRefresh: result && typeof result === 'object' && 'needsBillingRefresh' in result ? result.needsBillingRefresh : false
      });
      
      // Dispatch events for UI updates
      window.dispatchEvent(new CustomEvent('plan-change-completed', {
        detail: { priceId, isUpgrade, result }
      }));
      
      // Immediate billing history refresh
      window.dispatchEvent(new CustomEvent('billing-history-updated'));
      window.dispatchEvent(new CustomEvent('invalidate-billing-history'));
      
      // Additional delayed refresh to catch server-side billing updates
      // Stripe/payment processing might take a moment to create billing records
      setTimeout(() => {
        console.log('🔄 Delayed billing history refresh after plan change');
        window.dispatchEvent(new CustomEvent('billing-history-updated'));
        window.dispatchEvent(new CustomEvent('invalidate-billing-history'));
      }, 2000); // 2 second delay
      
      // Another refresh after 5 seconds to ensure we catch any delayed billing records
      setTimeout(() => {
        console.log('🔄 Final billing history refresh after plan change');
        window.dispatchEvent(new CustomEvent('billing-history-updated'));
        window.dispatchEvent(new CustomEvent('invalidate-billing-history'));
      }, 5000); // 5 second delay
      
      console.log('✅ Billing history refresh events dispatched (immediate + delayed)');
      
      // Show success message with billing update info
      setSyncSuccess(`Plan ${isUpgrade ? 'upgraded' : 'changed'} successfully! Billing history will update shortly.`);
      setTimeout(() => setSyncSuccess(null), 5000); // Show longer for billing info
      
      // Reload payment methods in case they were updated during the process
      loadPaymentMethods();
      
    } catch (err) {
      // Don't log NEXT_REDIRECT as an error - it's expected behavior for free plan upgrades  
      if (err instanceof Error && err.message === 'NEXT_REDIRECT') {
        // Let Next.js handle the redirect, don't show error or reset loading state
        // The redirect will navigate away from this page anyway
        console.log('🔄 Redirecting for checkout flow...');
        return;
      }
      
      console.error('❌ Plan change error:', err);
      setError(err instanceof Error ? err.message : 'Failed to change plan');
    } finally {
      // Only reset loading state if we're not redirecting
      // This prevents UI flicker before redirect
      setIsLoading(false);
    }
  };

  const handleCancellation = async (cancelAtPeriodEnd: boolean, reason?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await cancelSubscription(cancelAtPeriodEnd);
      setShowCancelDialog(false);
    } catch (err) {
      console.error('Cancellation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to cancel subscription');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReactivation = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await reactivateSubscription();
    } catch (err) {
      console.error('Reactivation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to reactivate subscription');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncSubscription = async () => {
    try {
      setIsSyncing(true);
      setError(null);
      setSyncSuccess(null);
      
      // Try regular sync first
      let response = await fetch('/api/sync-my-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      let result = await response.json();
      
      // If regular sync fails, try debug sync for missing subscriptions
      if (!response.ok) {
        console.log('Regular sync failed, trying debug sync...');
        response = await fetch('/api/debug-subscription', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || 'Both sync methods failed');
        }
      }
      
      setSyncSuccess(result.message);
      
      // Refresh the page after successful sync
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      }, 2000);
      
    } catch (err) {
      console.error('Sync error:', err);
      setError(err instanceof Error ? err.message : 'Failed to sync subscription');
    } finally {
      setIsSyncing(false);
    }
  };

  const formatPrice = (amount: number) => {
    return `$${(amount / 100).toFixed(0)}`;
  };

  // Determine if we're showing subscription data or free plan fallback
  const hasSubscription = !!subscription;
  const hasFallbackPlan = !hasSubscription && !!freePlanInfo;
  
  // Extract plan data for display (either from subscription or fallback)
  const planData = hasSubscription ? {
    name: subscription.prices?.products?.name || (subscription.prices ? 'Premium Plan' : 'Unknown Plan'),
    price: subscription.prices?.unit_amount || 0,
    interval: subscription.prices?.interval || 'month',
    status: subscription.status || 'unknown'
  } : hasFallbackPlan ? {
    name: freePlanInfo.products?.name || 'Free Plan',
    price: freePlanInfo.unit_amount || 0,
    interval: freePlanInfo.interval || 'month',
    status: 'free'
  } : null;

  return (
    <>
      <Card className="bg-paper-white border-stone-gray">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl text-charcoal">Current Plan</CardTitle>
              <CardDescription className="text-charcoal/70">Your subscription details</CardDescription>
            </div>
            <DollarSign className="h-6 w-6 text-charcoal/60" />
          </div>
        </CardHeader>
        <CardContent>
          {/* Success Banner */}
          {syncSuccess && (
            <Card className="bg-green-50 border-green-200 mb-4">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <RefreshCw className="h-5 w-5 text-green-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-green-800">Sync Successful</p>
                    <p className="text-sm text-green-600 mt-1">{syncSuccess}</p>
                    <p className="text-xs text-green-600 mt-1">Page will refresh in 2 seconds...</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2 border-green-300 text-green-600 hover:bg-green-50"
                      onClick={() => setSyncSuccess(null)}
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error Banner */}
          {error && (
            <Card className="bg-red-50 border-red-200 mb-4">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-red-800">Error</p>
                    <p className="text-sm text-red-600 mt-1">{error}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2 border-red-300 text-red-600 hover:bg-red-50"
                      onClick={() => setError(null)}
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {planData ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-charcoal">
                    {planData.name}
                  </h3>
                  <p className="text-sm text-charcoal/70">
                    {formatPrice(planData.price)}/{planData.interval}
                  </p>
                </div>
                {getStatusBadge(planData.status)}
              </div>

              {/* Free Plan Information Banner */}
              {hasFallbackPlan && (
                <Card className="bg-blue-50 border-blue-200 mb-4">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-blue-800">Using Free Plan</p>
                        <p className="text-sm text-blue-600 mt-1">
                          You&apos;re currently on the free plan. Upgrade to unlock premium features.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Plan Details Debug Info (only in development) */}
              {process.env.NODE_ENV === 'development' && (
                <div className="p-2 bg-light-concrete text-xs text-charcoal/60 rounded border border-stone-gray">
                  <p><strong>Debug Info:</strong></p>
                  <p>Has Subscription: {hasSubscription ? 'Yes' : 'No'}</p>
                  <p>Has Fallback Plan: {hasFallbackPlan ? 'Yes' : 'No'}</p>
                  {hasSubscription ? (
                    <>
                      <p>Subscription ID: {subscription.id}</p>
                      <p>Price ID: {(subscription as any).stripe_price_id || 'None'}</p>
                      <p>Has Price Data: {subscription.prices ? 'Yes' : 'No'}</p>
                      <p>Has Product Data: {subscription.prices?.products ? 'Yes' : 'No'}</p>
                      <p>Product Name: {subscription.prices?.products?.name || 'None'}</p>
                    </>
                  ) : (
                    <>
                      <p>Free Plan Data: {freePlanInfo ? 'Available' : 'Not available'}</p>
                      <p>Free Plan Name: {freePlanInfo?.products?.name || 'None'}</p>
                    </>
                  )}
                </div>
              )}

              {/* Cancellation Notice - only for real subscriptions */}
              {hasSubscription && subscription.cancel_at_period_end && (
                <Card className="bg-equipment-yellow/10 border-equipment-yellow">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="h-5 w-5 text-equipment-yellow mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-charcoal">Subscription scheduled for cancellation</p>
                        <p className="text-sm text-charcoal/70 mt-1">
                          Your subscription will end on {subscription.current_period_end ? formatDate(subscription.current_period_end) : 'N/A'}.
                          You&apos;ll retain access to all features until then.
                        </p>
                        <Button
                          size="sm"
                          className="mt-3 bg-forest-green text-paper-white hover:bg-forest-green/90"
                          onClick={handleReactivation}
                          disabled={isLoading}
                        >
                          {isLoading ? 'Reactivating...' : 'Reactivate Subscription'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Billing details - only for real subscriptions */}
              {hasSubscription && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-stone-gray">
                  <div>
                    <p className="text-sm font-medium text-charcoal">Next billing date</p>
                    <p className="text-sm text-charcoal/70">
                      {subscription.current_period_end ? formatDate(subscription.current_period_end) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-charcoal">Billing period</p>
                    <p className="text-sm text-charcoal/70">
                      {subscription.current_period_start ? formatDate(subscription.current_period_start) : 'N/A'} - {' '}
                      {subscription.current_period_end ? formatDate(subscription.current_period_end) : 'N/A'}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button 
                  className="bg-forest-green text-paper-white hover:bg-forest-green/90"
                  onClick={() => setShowPlanDialog(true)}
                  disabled={isLoading}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  {isLoading ? 'Loading...' : 
                    (planData.price === 0 ? 'Upgrade Plan' : 'Change Plan')}
                </Button>
                
                {/* Only show Stripe management for real subscriptions */}
                {hasSubscription && (
                  <Button 
                    variant="outline" 
                    className="border-stone-gray text-charcoal hover:bg-light-concrete"
                    asChild
                  >
                    <a href="/manage-subscription">Manage in Stripe</a>
                  </Button>
                )}
                
                {/* Only show cancel for real subscriptions */}
                {hasSubscription && !subscription.cancel_at_period_end && (
                  <Button 
                    variant="outline" 
                    className="border-error-red text-error-red hover:bg-error-red hover:text-paper-white"
                    onClick={() => setShowCancelDialog(true)}
                    disabled={isLoading}
                  >
                    <X className="mr-2 h-4 w-4" />
                    {isLoading ? 'Loading...' : 'Cancel'}
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                  <div className="flex-1 text-left">
                    <p className="font-medium text-red-800">Plan Configuration Error</p>
                    <p className="text-sm text-red-600 mt-1">
                      Unable to load subscription or free plan information. Please try syncing or contact support.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  className="bg-forest-green text-paper-white hover:bg-forest-green/90"
                  asChild
                >
                  <a href="/pricing">View Plans</a>
                </Button>
                <Button 
                  variant="outline" 
                  className="border-equipment-yellow text-equipment-yellow hover:bg-equipment-yellow hover:text-charcoal"
                  onClick={handleSyncSubscription}
                  disabled={isSyncing || isLoading}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Syncing...' : 'Sync Subscription'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plan Change Dialog - works with both subscription and free plan fallback */}
      {planData && (
        <>
          {/* Debug logging for dialog state */}
          {showPlanDialog && console.log('🔍 Rendering PlanChangeDialog with:', {
            showPlanDialog,
            isLoadingPaymentMethods,
            paymentMethodsCount: paymentMethods.length,
            paymentMethods: paymentMethods.map(pm => ({
              id: pm.id,
              brand: pm.brand || pm.card?.brand,
              last4: pm.last4 || pm.card?.last4,
              is_default: pm.is_default
            }))
          })}
          
          {/* Loading dialog while payment methods are being loaded */}
          {showPlanDialog && isLoadingPaymentMethods && (
            <Dialog open={true} onOpenChange={() => setShowPlanDialog(false)}>
              <DialogContent className="bg-paper-white border-stone-gray">
                <DialogHeader>
                  <DialogTitle className="text-charcoal text-section-title">Loading Payment Methods</DialogTitle>
                  <DialogDescription className="text-charcoal/70">
                    Please wait while we load your payment methods...
                  </DialogDescription>
                </DialogHeader>
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-forest-green" />
                </div>
              </DialogContent>
            </Dialog>
          )}
          
          {/* Main Plan Change Dialog */}
          <PlanChangeDialog
            isOpen={showPlanDialog}
            onClose={() => setShowPlanDialog(false)}
            currentPlan={{
              id: hasSubscription ? (subscription.prices?.stripe_price_id || '') : (freePlanInfo?.stripe_price_id || ''),
              name: planData.name,
              price: planData.price / 100,
              interval: planData.interval,
            }}
            availablePlans={availablePlans}
            onPlanChange={handlePlanChange}
            isLoading={isLoading}
            paymentMethods={paymentMethods}
            isLoadingPaymentMethods={isLoadingPaymentMethods}
            onPaymentMethodRequired={handlePaymentMethodRequired}
            stripeCustomerId={hasSubscription ? (subscription as any).stripe_customer_id : undefined}
            stripeSubscriptionId={hasSubscription ? subscription.stripe_subscription_id || undefined : undefined}
          />
        </>
      )}

      {/* Cancellation Dialog - only for real subscriptions */}
      {hasSubscription && subscription && (
        <CancellationDialog
          isOpen={showCancelDialog}
          onClose={() => setShowCancelDialog(false)}
          currentPlan={{
            name: subscription.prices?.products?.name || '',
            price: (subscription.prices?.unit_amount || 0) / 100,
            interval: subscription.prices?.interval || 'month',
            nextBillingDate: subscription.current_period_end ? formatDate(subscription.current_period_end) : 'N/A',
          }}
          onCancel={handleCancellation}
          isLoading={isLoading}
        />
      )}

      {/* Add Payment Method Dialog */}
      <AddPaymentMethodDialog
        open={showAddPaymentDialog}
        onOpenChange={setShowAddPaymentDialog}
        onSuccess={handlePaymentMethodAdded}
      />
    </>
  );
}