'use client';

import { useCallback,useEffect, useState } from 'react';
import { AlertCircle, Calculator, CheckCircle, CreditCard, DollarSign, Info, Loader2, TrendingDown, TrendingUp } from 'lucide-react';

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

interface ProrationPreview {
  immediateTotal: number;
  prorationAmount: number;
  nextInvoiceTotal: number;
  currency: string;
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
  isLoadingPaymentMethods?: boolean;
  onPaymentMethodRequired?: () => void;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

export function PlanChangeDialog({
  isOpen,
  onClose,
  currentPlan,
  availablePlans,
  onPlanChange,
  isLoading = false,
  paymentMethods = [],
  isLoadingPaymentMethods = false,
  onPaymentMethodRequired,
  stripeCustomerId,
  stripeSubscriptionId,
}: PlanChangeDialogProps) {
  const [selectedPriceId, setSelectedPriceId] = useState<string>('');
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string>('');
  const [isChanging, setIsChanging] = useState(false);
  const [prorationPreview, setProrationPreview] = useState<ProrationPreview | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [paymentMethodErrors, setPaymentMethodErrors] = useState<{ [key: string]: string }>({});

  // Debug logging
  useEffect(() => {
    if (isOpen) {
      console.log('🔍 PlanChangeDialog opened with data:', {
        currentPlan,
        availablePlansCount: availablePlans?.length || 0,
        paymentMethodsCount: paymentMethods?.length || 0,
        stripeCustomerId,
        stripeSubscriptionId,
        availablePlans: availablePlans?.map(p => ({
          name: p.name,
          pricesCount: p.prices?.length || 0,
          prices: p.prices?.map((price: any) => ({
            id: price.stripe_price_id,
            amount: price.unit_amount,
            interval: price.interval
          }))
        }))
      });

      // Enhanced Stripe Integration Check
      console.log('🔍 Stripe Integration Check:', {
        hasStripeCustomerId: !!stripeCustomerId,
        hasStripeSubscriptionId: !!stripeSubscriptionId,
        stripeCustomerId: stripeCustomerId ? stripeCustomerId.substring(0, 12) + '...' : 'MISSING',
        stripeSubscriptionId: stripeSubscriptionId ? stripeSubscriptionId.substring(0, 12) + '...' : 'MISSING',
        paymentMethodsCount: paymentMethods?.length || 0,
        hasValidPaymentMethods: paymentMethods && paymentMethods.length > 0,
        integrationStatus: {
          canShowDialog: true,
          canProcessPayments: !!(stripeCustomerId && stripeSubscriptionId),
          canHandleUpgrades: !!(stripeCustomerId && stripeSubscriptionId && paymentMethods?.length > 0)
        }
      });
    }
  }, [isOpen, currentPlan, availablePlans, paymentMethods, stripeCustomerId, stripeSubscriptionId]);

  // Fetch proration preview for selected plan
  const fetchProrationPreview = useCallback(async (priceId: string) => {
    if (!stripeCustomerId || !stripeSubscriptionId) {
      console.warn('Missing Stripe IDs for proration preview:', { stripeCustomerId, stripeSubscriptionId });
      return;
    }

    setIsLoadingPreview(true);
    setPreviewError(null);

    try {
      const response = await fetch('/api/preview-plan-change', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stripeCustomerId,
          stripeSubscriptionId,
          newPriceId: priceId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to preview plan change');
      }

      const data = await response.json();
      setProrationPreview(data.preview);
    } catch (error) {
      console.error('Failed to fetch proration preview:', error);
      setPreviewError(error instanceof Error ? error.message : 'Failed to load preview');
    } finally {
      setIsLoadingPreview(false);
    }
  }, [stripeCustomerId, stripeSubscriptionId]);

  // Validate payment methods
  const validatePaymentMethods = useCallback(async () => {
    if (!stripeCustomerId || paymentMethods.length === 0) return;

    const errors: { [key: string]: string } = {};
    const now = new Date();

    for (const pm of paymentMethods) {
      // Check if card is expired - handle both card object and direct properties
      let expYear: number | undefined;
      let expMonth: number | undefined;
      
      if (pm.card) {
        expYear = pm.card.exp_year;
        expMonth = pm.card.exp_month;
      } else {
        expYear = pm.exp_year;
        expMonth = pm.exp_month;
      }
      
      if (expYear && expMonth) {
        const expirationDate = new Date(expYear, expMonth - 1);
        if (expirationDate < now) {
          errors[pm.id] = 'This card has expired';
        }
      }
    }

    setPaymentMethodErrors(errors);
    console.log('🔍 Payment method validation completed:', {
      totalMethods: paymentMethods.length,
      errorsFound: Object.keys(errors).length,
      errors,
      validMethods: paymentMethods.filter(pm => !errors[pm.id]).length
    });
  }, [stripeCustomerId, paymentMethods]);

  // Set default payment method when dialog opens AND payment methods are loaded
  useEffect(() => {
    console.log('🔍 Payment method selection useEffect triggered:', {
      isOpen,
      paymentMethodsLength: paymentMethods.length,
      selectedPaymentMethodId,
      paymentMethodsData: paymentMethods
    });

    if (isOpen && paymentMethods.length > 0 && !selectedPaymentMethodId) {
      console.log('🔍 Setting up payment method selection - conditions met');
      
      // Validate payment methods inline to avoid circular dependency
      const errors: { [key: string]: string } = {};
      const now = new Date();

      for (const pm of paymentMethods) {
        let expYear: number | undefined;
        let expMonth: number | undefined;
        
        if (pm.card) {
          expYear = pm.card.exp_year;
          expMonth = pm.card.exp_month;
        } else {
          expYear = pm.exp_year;
          expMonth = pm.exp_month;
        }
        
        if (expYear && expMonth) {
          const expirationDate = new Date(expYear, expMonth - 1);
          if (expirationDate < now) {
            errors[pm.id] = 'This card has expired';
          }
        }
      }

      console.log('🔍 Payment method validation results:', {
        totalMethods: paymentMethods.length,
        errors,
        validMethodsCount: paymentMethods.filter(pm => !errors[pm.id]).length
      });

      // Update errors state
      setPaymentMethodErrors(errors);
      
      // Find the best payment method to select
      const validPaymentMethods = paymentMethods.filter(pm => !errors[pm.id]);
      const defaultMethod = validPaymentMethods.find(pm => pm.is_default) || validPaymentMethods[0];
      
      if (defaultMethod) {
        setSelectedPaymentMethodId(defaultMethod.id);
        console.log('🔧 Default payment method set:', {
          id: defaultMethod.id,
          isDefault: defaultMethod.is_default,
          brand: defaultMethod.brand || defaultMethod.card?.brand,
          last4: defaultMethod.last4 || defaultMethod.card?.last4,
          validMethodsCount: validPaymentMethods.length,
          totalMethodsCount: paymentMethods.length
        });
      } else {
        console.warn('⚠️ No valid payment methods available:', {
          totalMethods: paymentMethods.length,
          errorsFound: Object.keys(errors).length,
          errors
        });
      }
    } else {
      console.log('🔍 Payment method selection conditions not met:', {
        isOpen,
        paymentMethodsLength: paymentMethods.length,
        selectedPaymentMethodId,
        reason: !isOpen ? 'Dialog not open' : 
                paymentMethods.length === 0 ? 'No payment methods' :
                selectedPaymentMethodId ? 'Payment method already selected' : 'Unknown'
      });
    }
  }, [isOpen, paymentMethods, selectedPaymentMethodId]);

  // Clear selection when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedPaymentMethodId('');
      setSelectedPriceId('');
      setProrationPreview(null);
      setPreviewError(null);
      console.log('🔄 Dialog closed, cleared selections');
    }
  }, [isOpen]);

  // Fetch proration preview when price is selected
  useEffect(() => {
    if (selectedPriceId && isOpen) {
      const selectedPrice = availablePlans
        .flatMap(p => p.prices || [])
        .find(price => price?.stripe_price_id === selectedPriceId);

      const isUpgrade = selectedPrice && (selectedPrice.unit_amount || 0) > currentPlan.price * 100;
      
      // Only fetch preview for upgrades and if we have Stripe IDs
      if (isUpgrade && stripeCustomerId && stripeSubscriptionId) {
        fetchProrationPreview(selectedPriceId);
      } else {
        setProrationPreview(null);
      }
    }
  }, [selectedPriceId, isOpen, fetchProrationPreview, availablePlans, currentPlan.price, stripeCustomerId, stripeSubscriptionId]);

  const handlePlanChange = async () => {
    console.log('🔥 FIXED VERSION: handlePlanChange called - if you see this, the fix is loaded');
    
    if (!selectedPriceId) {
      setPreviewError('Please select a plan to continue');
      return;
    }

    const selectedPrice = availablePlans
      .flatMap(p => p.prices || [])
      .find(price => price?.stripe_price_id === selectedPriceId);

    if (!selectedPrice) {
      console.error('Selected price not found:', selectedPriceId);
      setPreviewError('Selected plan is no longer available');
      return;
    }

    const isUpgrade = (selectedPrice.unit_amount || 0) > currentPlan.price * 100;

    // Enhanced validation for upgrades
    if (isUpgrade) {
      // Check if user has any payment methods at all
      if (!hasValidPaymentMethods) {
        console.error('No payment methods available for upgrade');
        setPreviewError('A payment method is required for plan upgrades. Please add a payment method first.');
        if (onPaymentMethodRequired) {
          onPaymentMethodRequired();
        }
        return;
      }

      // Check if a payment method is selected
      if (!selectedPaymentMethodId) {
        console.error('Payment method required for upgrades but none selected');
        setPreviewError('Please select a payment method for the upgrade');
        return;
      }

      // Check if selected payment method has errors
      if (paymentMethodErrors[selectedPaymentMethodId]) {
        setPreviewError(`Cannot use selected payment method: ${paymentMethodErrors[selectedPaymentMethodId]}`);
        return;
      }

      // Check if payment method exists in the list
      const selectedPaymentMethod = paymentMethods.find(pm => pm.id === selectedPaymentMethodId);
      if (!selectedPaymentMethod) {
        setPreviewError('Selected payment method is no longer available');
        return;
      }

      console.log('💳 Upgrade validation passed:', {
        selectedPaymentMethodId,
        paymentMethod: {
          brand: selectedPaymentMethod.brand,
          last4: selectedPaymentMethod.last4,
          isDefault: selectedPaymentMethod.is_default
        }
      });
    }

    console.log('💳 Plan change initiated:', {
      selectedPriceId,
      selectedPaymentMethodId,
      selectedPrice: {
        amount: selectedPrice.unit_amount,
        interval: selectedPrice.interval
      },
      currentPrice: currentPlan.price * 100,
      isUpgrade,
      hasPaymentMethods: hasValidPaymentMethods,
      prorationPreview: prorationPreview ? {
        immediateTotal: prorationPreview.immediateTotal,
        prorationAmount: prorationPreview.prorationAmount
      } : null
    });

    setIsChanging(true);
    setPreviewError(null);
    
    try {
      await onPlanChange(selectedPriceId, isUpgrade, isUpgrade ? selectedPaymentMethodId : undefined);
      
      // Clear preview data on successful change
      setProrationPreview(null);
      setSelectedPriceId('');
      setSelectedPaymentMethodId('');
      
      console.log('✅ Plan change completed successfully');
      
      onClose();
    } catch (error) {
      console.error('❌ Plan change failed:', error);
      setPreviewError(error instanceof Error ? error.message : 'Plan change failed. Please try again.');
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
                {isLoadingPaymentMethods ? (
                  <div className="text-center py-4">
                    <Loader2 className="h-8 w-8 text-forest-green mx-auto mb-4 animate-spin" />
                    <h3 className="text-lg font-semibold text-charcoal mb-2">Loading Payment Methods</h3>
                    <p className="text-charcoal/70">
                      Please wait while we fetch your payment methods...
                    </p>
                  </div>
                ) : !hasValidPaymentMethods ? (
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
                                •••• •••• •••• {paymentMethod.last4 || paymentMethod.card?.last4}
                              </p>
                              <p className="text-sm text-charcoal/70">
                                {(paymentMethod.brand || paymentMethod.card?.brand)?.toUpperCase()} • Expires {paymentMethod.exp_month || paymentMethod.card?.exp_month}/{paymentMethod.exp_year || paymentMethod.card?.exp_year}
                              </p>
                              {paymentMethodErrors[paymentMethod.id] && (
                                <p className="text-sm text-error-red font-medium">
                                  {paymentMethodErrors[paymentMethod.id]}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {paymentMethod.is_default && (
                              <Badge className="bg-equipment-yellow text-charcoal">Default</Badge>
                            )}
                            {paymentMethodErrors[paymentMethod.id] && (
                              <AlertCircle className="h-5 w-5 text-error-red" />
                            )}
                            {selectedPaymentMethodId === paymentMethod.id && !paymentMethodErrors[paymentMethod.id] && (
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

          {/* Proration Preview */}
          {prorationPreview && (
            <Card className="bg-forest-green/5 border-forest-green">
              <CardHeader>
                <CardTitle className="text-lg text-charcoal flex items-center space-x-2">
                  <Calculator className="h-5 w-5" />
                  <span>Billing Preview</span>
                </CardTitle>
                <CardDescription className="text-charcoal/70">
                  Cost breakdown for your plan upgrade
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-charcoal">Immediate charge:</span>
                    <span className="font-bold text-charcoal">
                      {formatPrice(prorationPreview.immediateTotal)}
                    </span>
                  </div>
                  {prorationPreview.prorationAmount > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-charcoal/70">Proration credit:</span>
                      <span className="text-forest-green">
                        -{formatPrice(prorationPreview.prorationAmount)}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Available Plans */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-charcoal">Available Plans</h3>
            
            {validPlans.length > 0 ? (
              <div className="grid gap-4">
                {validPlans.map((product) => 
                  product.prices?.map((price: any) => {
                    if (!price?.stripe_price_id || price.stripe_price_id === currentPlan.id) {
                      return null;
                    }

                    const changeInfo = getChangeType(price.unit_amount || 0);
                    const IconComponent = changeInfo.icon;

                    return (
                      <Card
                        key={price.stripe_price_id}
                        className={`cursor-pointer transition-all border-2 ${
                          selectedPriceId === price.stripe_price_id
                            ? 'border-forest-green bg-forest-green/5'
                            : 'border-stone-gray hover:border-forest-green/50 hover:bg-light-concrete/50'
                        }`}
                        onClick={() => setSelectedPriceId(price.stripe_price_id)}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className={`p-2 rounded-lg bg-light-concrete`}>
                                <IconComponent className={`h-6 w-6 ${changeInfo.color}`} />
                              </div>
                              <div>
                                <h4 className="font-bold text-charcoal text-lg">
                                  {product.name}
                                </h4>
                                <p className="text-charcoal/70">
                                  {formatPrice(price.unit_amount || 0)}/{price.interval}
                                </p>
                                <p className="text-sm text-charcoal/60 capitalize">
                                  {changeInfo.type} from current plan
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {selectedPriceId === price.stripe_price_id && (
                                <CheckCircle className="h-6 w-6 text-forest-green" />
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            ) : (
              <Card className="bg-light-concrete border-stone-gray">
                <CardContent className="p-8 text-center">
                  <AlertCircle className="h-12 w-12 text-equipment-yellow mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-charcoal mb-2">No Plans Available</h3>
                  <p className="text-charcoal/70">
                    There are no other plans available at this time.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Error Display */}
          {previewError && (
            <Card className="bg-error-red/10 border-error-red">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-error-red mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-error-red">Error</p>
                    <p className="text-sm text-error-red/80 mt-1">{previewError}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-6">
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
            disabled={
              !selectedPriceId || 
              isChanging || 
              isLoadingPreview ||
              isLoadingPaymentMethods ||
              (requiresPaymentMethod && (!hasValidPaymentMethods || !selectedPaymentMethodId))
            }
            className="bg-forest-green text-paper-white hover:bg-forest-green/90"
          >
            {isChanging ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : isLoadingPreview ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading Preview...
              </>
            ) : isLoadingPaymentMethods ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading Payment Methods...
              </>
            ) : requiresPaymentMethod && !hasValidPaymentMethods ? (
              'Add Payment Method Required'
            ) : requiresPaymentMethod && !selectedPaymentMethodId ? (
              'Select Payment Method'
            ) : (
              'Change Plan'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}