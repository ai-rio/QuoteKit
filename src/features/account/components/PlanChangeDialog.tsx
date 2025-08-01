'use client';

import { AlertCircle, CheckCircle, CreditCard, Loader2, TrendingDown, TrendingUp } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ProductWithPrices } from '@/features/pricing/types';
import { useState, useEffect } from 'react';

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
  onPlanChange: (priceId: string, isUpgrade: boolean, paymentMethodId?: string) => Promise<void>;
  isLoading?: boolean;
  paymentMethods?: PaymentMethod[];
  onPaymentMethodRequired?: () => void;
}

export function PlanChangeDialog({
  isOpen,
  onClose,
  currentPlan,
  availablePlans,
  onPlanChange,
  isLoading = false,
  paymentMethods = [],
  onPaymentMethodRequired,
}: PlanChangeDialogProps) {
  const [selectedPriceId, setSelectedPriceId] = useState<string>('');
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string>('');
  const [isChanging, setIsChanging] = useState(false);

  // Debug logging
  useEffect(() => {
    if (isOpen) {
      console.log('🔍 PlanChangeDialog opened with data:', {
        currentPlan,
        availablePlansCount: availablePlans?.length || 0,
        paymentMethodsCount: paymentMethods?.length || 0,
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
  }, [isOpen, currentPlan, availablePlans, paymentMethods]);

  // Set default payment method when dialog opens
  useEffect(() => {
    if (isOpen && paymentMethods.length > 0) {
      const defaultMethod = paymentMethods.find(pm => pm.is_default) || paymentMethods[0];
      if (defaultMethod) {
        setSelectedPaymentMethodId(defaultMethod.id);
      }
    }
  }, [isOpen, paymentMethods]);

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

    // For upgrades, validate payment method is selected
    if (isUpgrade && !selectedPaymentMethodId) {
      console.error('Payment method required for upgrades');
      return;
    }

    console.log('💳 Plan change initiated:', {
      selectedPriceId,
      selectedPaymentMethodId,
      selectedPrice: {
        amount: selectedPrice.unit_amount,
        interval: selectedPrice.interval
      },
      currentPrice: currentPlan.price * 100,
      isUpgrade
    });

    setIsChanging(true);
    try {
      await onPlanChange(selectedPriceId, isUpgrade, selectedPaymentMethodId);
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

  // Check if user has valid payment methods for upgrades
  const hasValidPaymentMethods = paymentMethods.length > 0;
  const requiresPaymentMethod = selectedPriceId && availablePlans
    .flatMap(p => p.prices || [])
    .find(price => price?.stripe_price_id === selectedPriceId)
    ?.unit_amount > currentPlan.price * 100;

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

          {/* Payment Method Selection for Upgrades */}
          {requiresPaymentMethod && (
            <Card className="bg-light-concrete border-stone-gray">
              <CardHeader>
                <CardTitle className="text-lg text-charcoal flex items-center space-x-2">
                  <CreditCard className="h-5 w-5" />
                  <span>Payment Method</span>
                </CardTitle>
                <CardDescription className="text-charcoal/70">
                  Select a payment method for your plan upgrade
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!hasValidPaymentMethods ? (
                  <div className="text-center py-4">
                    <AlertCircle className="h-12 w-12 text-equipment-yellow mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-charcoal mb-2">Payment Method Required</h3>
                    <p className="text-charcoal/70 mb-4">
                      You need to add a payment method before upgrading your plan.
                    </p>
                    <Button
                      onClick={onPaymentMethodRequired}
                      className="bg-forest-green hover:bg-forest-green/90 text-paper-white"
                    >
                      Add Payment Method
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {paymentMethods.map((paymentMethod) => (
                      <div
                        key={paymentMethod.id}
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${
                          selectedPaymentMethodId === paymentMethod.id
                            ? 'border-forest-green bg-forest-green/5'
                            : 'border-stone-gray hover:bg-light-concrete/50'
                        }`}
                        onClick={() => setSelectedPaymentMethodId(paymentMethod.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <CreditCard className="h-5 w-5 text-charcoal" />
                            <div>
                              <p className="font-medium text-charcoal">
                                •••• •••• •••• {paymentMethod.last4}
                              </p>
                              <p className="text-sm text-charcoal/70">
                                {paymentMethod.brand?.toUpperCase()} • Expires {paymentMethod.exp_month}/{paymentMethod.exp_year}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {paymentMethod.is_default && (
                              <Badge className="bg-equipment-yellow text-charcoal">Default</Badge>
                            )}
                            {selectedPaymentMethodId === paymentMethod.id && (
                              <CheckCircle className="h-5 w-5 text-forest-green" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

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
                    const isUpgrade = changeInfo.type === 'upgrade';

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

                          {/* Payment method requirement indicator */}
                          {isUpgrade && isSelected && !hasValidPaymentMethods && (
                            <div className="mt-3 p-2 bg-equipment-yellow/10 border border-equipment-yellow rounded">
                              <div className="flex items-center space-x-2 text-sm">
                                <AlertCircle className="h-4 w-4 text-equipment-yellow" />
                                <span className="text-charcoal">Payment method required for upgrade</span>
                              </div>
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
        </div>

        <DialogFooter className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isChanging}
            className="border-stone-gray text-charcoal hover:bg-light-concrete"
          >
            Cancel
          </Button>
          <Button
            onClick={handlePlanChange}
            disabled={!selectedPriceId || isChanging || (requiresPaymentMethod && !hasValidPaymentMethods)}
            className="bg-forest-green hover:bg-forest-green/90 text-paper-white"
          >
            {isChanging ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Confirm Change'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}