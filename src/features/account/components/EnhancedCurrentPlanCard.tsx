'use client';

import { useState } from 'react';
import { AlertCircle, DollarSign, Settings, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PriceWithProduct, ProductWithPrices, SubscriptionWithProduct } from '@/features/pricing/types';

import { cancelSubscription, changePlan, reactivateSubscription } from '../actions/subscription-actions';

import { CancellationDialog } from './CancellationDialog';
import { PlanChangeDialog } from './PlanChangeDialog';

interface EnhancedCurrentPlanCardProps {
  subscription: SubscriptionWithProduct | null;
  availablePlans: ProductWithPrices[];
  freePlanInfo: PriceWithProduct | null;
}

export function EnhancedCurrentPlanCard({ subscription, availablePlans, freePlanInfo }: EnhancedCurrentPlanCardProps) {
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getStatusBadge = (status: string) => {
    const statusColors = {
      active: 'bg-forest-green text-paper-white',
      trialing: 'bg-equipment-yellow text-charcoal',
      past_due: 'bg-error-red text-paper-white',
      canceled: 'bg-stone-gray text-charcoal',
    };

    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || 'bg-stone-gray text-charcoal'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const handlePlanChange = async (priceId: string, isUpgrade: boolean) => {
    try {
      setIsLoading(true);
      setError(null);
      await changePlan(priceId, isUpgrade);
      setShowPlanDialog(false);
    } catch (err) {
      console.error('Plan change error:', err);
      setError(err instanceof Error ? err.message : 'Failed to change plan');
    } finally {
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

  const formatPrice = (amount: number) => {
    return `$${(amount / 100).toFixed(0)}`;
  };

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

          {subscription ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-charcoal">
                    {subscription.prices?.products?.name || 'Unknown Plan'}
                  </h3>
                  <p className="text-sm text-charcoal/70">
                    {formatPrice(subscription.prices?.unit_amount || 0)}/
                    {subscription.prices?.interval || 'month'}
                  </p>
                </div>
                {getStatusBadge(subscription.status || 'unknown')}
              </div>

              {/* Cancellation Notice */}
              {subscription.cancel_at_period_end && (
                <Card className="bg-equipment-yellow/10 border-equipment-yellow">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="h-5 w-5 text-equipment-yellow mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-charcoal">Subscription scheduled for cancellation</p>
                        <p className="text-sm text-charcoal/70 mt-1">
                          Your subscription will end on {new Date(subscription.current_period_end).toLocaleDateString()}.
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-stone-gray">
                <div>
                  <p className="text-sm font-medium text-charcoal">Next billing date</p>
                  <p className="text-sm text-charcoal/70">
                    {new Date(subscription.current_period_end).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-charcoal">Billing period</p>
                  <p className="text-sm text-charcoal/70">
                    {new Date(subscription.current_period_start).toLocaleDateString()} - {' '}
                    {new Date(subscription.current_period_end).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button 
                  className="bg-forest-green text-paper-white hover:bg-forest-green/90"
                  onClick={() => setShowPlanDialog(true)}
                  disabled={isLoading}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  {isLoading ? 'Loading...' : 'Change Plan'}
                </Button>
                <Button 
                  variant="outline" 
                  className="border-stone-gray text-charcoal hover:bg-light-concrete"
                  asChild
                >
                  <a href="/manage-subscription">Manage in Stripe</a>
                </Button>
                {!subscription.cancel_at_period_end && (
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
            <div className="space-y-4">
              {freePlanInfo ? (
                // Display free plan information
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-charcoal">
                        {freePlanInfo.products?.name || 'Free Plan'}
                      </h3>
                      <p className="text-sm text-charcoal/70">
                        {formatPrice(freePlanInfo.unit_amount || 0)}
                        {freePlanInfo.interval ? `/${freePlanInfo.interval}` : ''}
                      </p>
                    </div>
                    <Badge className="bg-forest-green text-paper-white">
                      Active
                    </Badge>
                  </div>
                  
                  <div className="p-4 bg-light-concrete rounded-lg border border-stone-gray">
                    <div className="flex items-start space-x-3">
                      <DollarSign className="h-5 w-5 text-forest-green mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-charcoal">Free Plan Benefits</p>
                        <p className="text-sm text-charcoal/70 mt-1">
                          You&apos;re currently on our free plan. Upgrade to unlock additional features and remove limitations.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button 
                      className="bg-forest-green text-paper-white hover:bg-forest-green/90"
                      asChild
                    >
                      <a href="/pricing">Upgrade Plan</a>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="border-stone-gray text-charcoal hover:bg-light-concrete"
                      onClick={() => setShowPlanDialog(true)}
                      disabled={isLoading}
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      {isLoading ? 'Loading...' : 'View Plans'}
                    </Button>
                  </div>
                </>
              ) : (
                // Fallback if no free plan info is available
                <div className="text-center py-8">
                  <p className="text-charcoal/70 mb-4">You don&apos;t have an active subscription</p>
                  <Button 
                    className="bg-forest-green text-paper-white hover:bg-forest-green/90"
                    asChild
                  >
                    <a href="/pricing">Start Subscription</a>
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plan Change Dialog */}
      {(subscription || freePlanInfo) && (
        <PlanChangeDialog
          isOpen={showPlanDialog}
          onClose={() => setShowPlanDialog(false)}
          currentPlan={{
            id: subscription?.prices?.id || freePlanInfo?.id || '',
            name: subscription?.prices?.products?.name || freePlanInfo?.products?.name || 'Free Plan',
            price: (subscription?.prices?.unit_amount || freePlanInfo?.unit_amount || 0) / 100,
            interval: subscription?.prices?.interval || freePlanInfo?.interval || 'month',
          }}
          availablePlans={availablePlans}
          onPlanChange={handlePlanChange}
          isLoading={isLoading}
        />
      )}

      {/* Cancellation Dialog */}
      {subscription && (
        <CancellationDialog
          isOpen={showCancelDialog}
          onClose={() => setShowCancelDialog(false)}
          currentPlan={{
            name: subscription.prices?.products?.name || '',
            price: (subscription.prices?.unit_amount || 0) / 100,
            interval: subscription.prices?.interval || 'month',
            nextBillingDate: new Date(subscription.current_period_end).toLocaleDateString(),
          }}
          onCancel={handleCancellation}
          isLoading={isLoading}
        />
      )}
    </>
  );
}