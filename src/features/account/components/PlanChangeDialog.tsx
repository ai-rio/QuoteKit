'use client';

import { useState, useEffect } from 'react';
import { CreditCard, Loader2, TrendingDown,TrendingUp } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ProductWithPrices } from '@/features/pricing/types';

interface PlanChangeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: {
    id: string;
    name: string;
    price: number;
    interval: string;
  };
  availablePlans: ProductWithPrices[];
  onPlanChange: (priceId: string, isUpgrade: boolean) => Promise<void>;
  isLoading?: boolean;
}

export function PlanChangeDialog({
  isOpen,
  onClose,
  currentPlan,
  availablePlans,
  onPlanChange,
  isLoading = false,
}: PlanChangeDialogProps) {
  const [selectedPriceId, setSelectedPriceId] = useState<string>('');
  const [isChanging, setIsChanging] = useState(false);

  // Debug logging
  useEffect(() => {
    if (isOpen) {
      console.log('🔍 PlanChangeDialog opened with data:', {
        currentPlan,
        availablePlansCount: availablePlans?.length || 0,
        availablePlans: availablePlans?.map(p => ({
          name: p.name,
          pricesCount: p.prices?.length || 0,
          prices: p.prices?.map(price => ({
            id: price.stripe_price_id,
            amount: price.unit_amount,
            interval: price.interval
          }))
        }))
      });
    }
  }, [isOpen, currentPlan, availablePlans]);

  const handlePlanChange = async () => {
    if (!selectedPriceId) return;

    const selectedPrice = availablePlans
      .flatMap(p => p.prices || [])
      .find(price => price?.stripe_price_id === selectedPriceId);

    if (!selectedPrice) {
      console.error('Selected price not found:', selectedPriceId);
      return;
    }

    const isUpgrade = (selectedPrice.unit_amount || 0) > currentPlan.price * 100;

    console.log('💳 Plan change initiated:', {
      selectedPriceId,
      selectedPrice: {
        amount: selectedPrice.unit_amount,
        interval: selectedPrice.interval
      },
      currentPrice: currentPlan.price * 100,
      isUpgrade
    });

    setIsChanging(true);
    try {
      await onPlanChange(selectedPriceId, isUpgrade);
      onClose();
    } catch (error) {
      console.error('Plan change failed:', error);
    } finally {
      setIsChanging(false);
    }
  };

  const getChangeType = (priceAmount: number) => {
    const currentAmount = currentPlan.price * 100;
    if (priceAmount > currentAmount) {
      return { type: 'upgrade', icon: TrendingUp, color: 'text-forest-green' };
    } else if (priceAmount < currentAmount) {
      return { type: 'downgrade', icon: TrendingDown, color: 'text-equipment-yellow' };
    }
    return { type: 'same', icon: CreditCard, color: 'text-charcoal' };
  };

  const formatPrice = (amount: number) => {
    return `$${(amount / 100).toFixed(0)}`;
  };

  // Filter out current plan and ensure we have valid data
  const validPlans = availablePlans?.filter(product => 
    product && product.prices && product.prices.length > 0
  ) || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-paper-white border-stone-gray max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-charcoal text-section-title">Change Your Plan</DialogTitle>
          <DialogDescription className="text-charcoal/70">
            Select a new plan that better fits your needs. Changes take effect immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Plan Display */}
          <Card className="bg-light-concrete border-stone-gray">
            <CardHeader>
              <CardTitle className="text-lg text-charcoal">Current Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-charcoal">{currentPlan.name}</h3>
                  <p className="text-charcoal/70">
                    {formatPrice(currentPlan.price * 100)}/{currentPlan.interval}
                  </p>
                </div>
                <Badge className="bg-forest-green text-paper-white">Current</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Available Plans */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-charcoal">Available Plans</h3>
            
            {validPlans.length === 0 ? (
              <Card className="bg-light-concrete border-stone-gray">
                <CardContent className="p-4 text-center">
                  <p className="text-charcoal/70">No alternative plans available at this time.</p>
                  <p className="text-sm text-charcoal/60 mt-2">
                    Debug: {availablePlans?.length || 0} plans received, {validPlans.length} valid
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {validPlans.map((product) =>
                  product.prices?.map((price) => {
                    if (!price || !price.stripe_price_id) return null;
                    
                    const changeInfo = getChangeType(price.unit_amount || 0);
                    const isSelected = selectedPriceId === price.stripe_price_id;
                    const isCurrent = price.stripe_price_id === currentPlan.id;
                    const Icon = changeInfo.icon;

                    return (
                      <Card
                        key={price.stripe_price_id}
                        className={`cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-forest-green/10 border-forest-green'
                            : isCurrent
                            ? 'bg-light-concrete border-stone-gray opacity-50'
                            : 'bg-paper-white border-stone-gray hover:bg-light-concrete/50'
                        }`}
                        onClick={() => !isCurrent && setSelectedPriceId(price.stripe_price_id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="font-bold text-charcoal">{product.name}</h4>
                              <p className="text-sm text-charcoal/70">
                                {formatPrice(price.unit_amount || 0)}/{price.interval}
                              </p>
                              {price.interval === 'year' && (
                                <p className="text-xs text-green-600 font-medium">
                                  Save 20% vs monthly
                                </p>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              {isCurrent && (
                                <Badge className="bg-stone-gray text-charcoal">Current</Badge>
                              )}
                              {!isCurrent && (
                                <Icon className={`h-5 w-5 ${changeInfo.color}`} />
                              )}
                            </div>
                          </div>

                          {product.description && (
                            <p className="text-sm text-charcoal/60 mb-3">{product.description}</p>
                          )}

                          {!isCurrent && changeInfo.type !== 'same' && (
                            <div className="text-sm">
                              <span className={`font-medium ${changeInfo.color}`}>
                                {changeInfo.type === 'upgrade' ? 'Upgrade' : 'Downgrade'}
                              </span>
                              <span className="text-charcoal/70 ml-2">
                                {changeInfo.type === 'upgrade'
                                  ? 'Changes take effect immediately with prorated billing'
                                  : 'Changes take effect at the end of current billing period'}
                              </span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  }).filter(Boolean)
                )}
              </div>
            )}
          </div>

          {/* Proration Information */}
          {selectedPriceId && (
            <Card className="bg-light-concrete border-stone-gray">
              <CardContent className="p-4">
                <h4 className="font-medium text-charcoal mb-2">Billing Information</h4>
                <div className="text-sm text-charcoal/70 space-y-1">
                  {getChangeType(
                    validPlans
                      .flatMap(p => p.prices || [])
                      .find(p => p?.stripe_price_id === selectedPriceId)?.unit_amount || 0
                  ).type === 'upgrade' ? (
                    <>
                      <p>• Your plan will be upgraded immediately</p>
                      <p>• You&apos;ll be charged a prorated amount for the remaining billing period</p>
                      <p>• Your next billing date remains the same</p>
                    </>
                  ) : (
                    <>
                      <p>• Your plan will be downgraded at the end of the current billing period</p>
                      <p>• You&apos;ll retain access to current features until then</p>
                      <p>• No immediate charges will apply</p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            className="bg-paper-white text-charcoal border-stone-gray hover:bg-stone-gray/20"
            onClick={onClose}
            disabled={isChanging}
          >
            Cancel
          </Button>
          <Button
            className="bg-forest-green text-paper-white hover:opacity-90"
            onClick={handlePlanChange}
            disabled={!selectedPriceId || isChanging}
          >
            {isChanging ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Changing Plan...
              </>
            ) : (
              'Confirm Plan Change'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}