'use client';

import { 
  CardCvcElement, 
  CardExpiryElement, 
  CardNumberElement, 
  useElements, 
  useStripe 
} from '@stripe/react-stripe-js';
import { AlertCircle, CreditCard, Loader2, Plus, Shield } from 'lucide-react';
import { useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

interface AddPaymentMethodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface CardErrors {
  cardNumber?: string;
  cardExpiry?: string;
  cardCvc?: string;
  general?: string;
}

interface CardComplete {
  cardNumber: boolean;
  cardExpiry: boolean;
  cardCvc: boolean;
}

export function AddPaymentMethodDialog({
  open,
  onOpenChange,
  onSuccess,
}: AddPaymentMethodDialogProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<CardErrors>({});
  const [cardComplete, setCardComplete] = useState<CardComplete>({
    cardNumber: false,
    cardExpiry: false,
    cardCvc: false,
  });
  const [setAsDefault, setSetAsDefault] = useState(true);
  const [billingName, setBillingName] = useState('');
  const { toast } = useToast();

  const elementOptions = {
    style: {
      base: {
        fontSize: '15px',
        color: 'hsl(var(--charcoal))', // Design system consistency
        fontFamily: 'Inter, system-ui, sans-serif',
        '::placeholder': {
          color: 'hsl(var(--charcoal) / 0.5)', // WCAG AA compliant: ~7.65:1 ratio
        },
        iconColor: 'hsl(var(--charcoal) / 0.7)', // ~10.7:1 ratio
      },
      invalid: {
        color: 'hsl(var(--error-red))', // Design system error color
        iconColor: 'hsl(var(--error-red))',
      },
      complete: {
        color: 'hsl(var(--success-green))', // Design system success color
        iconColor: 'hsl(var(--success-green))',
      },
    },
  };

  const handleCardNumberChange = (event: any) => {
    setCardComplete(prev => ({ ...prev, cardNumber: event.complete }));
    
    if (event.error) {
      setErrors(prev => ({ ...prev, cardNumber: event.error.message }));
    } else {
      setErrors(prev => ({ ...prev, cardNumber: undefined }));
    }
  };

  const handleCardExpiryChange = (event: any) => {
    setCardComplete(prev => ({ ...prev, cardExpiry: event.complete }));
    
    if (event.error) {
      setErrors(prev => ({ ...prev, cardExpiry: event.error.message }));
    } else {
      setErrors(prev => ({ ...prev, cardExpiry: undefined }));
    }
  };

  const handleCardCvcChange = (event: any) => {
    setCardComplete(prev => ({ ...prev, cardCvc: event.complete }));
    
    if (event.error) {
      setErrors(prev => ({ ...prev, cardCvc: event.error.message }));
    } else {
      setErrors(prev => ({ ...prev, cardCvc: undefined }));
    }
  };

  const isCardComplete = cardComplete.cardNumber && cardComplete.cardExpiry && cardComplete.cardCvc;

  const validateForm = () => {
    const newErrors: CardErrors = {};

    if (!billingName.trim()) {
      newErrors.general = 'Billing name is required';
    }

    if (!isCardComplete) {
      if (!cardComplete.cardNumber) {
        newErrors.cardNumber = 'Please enter a valid card number';
      }
      if (!cardComplete.cardExpiry) {
        newErrors.cardExpiry = 'Please enter a valid expiry date';
      }
      if (!cardComplete.cardCvc) {
        newErrors.cardCvc = 'Please enter a valid CVC';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setErrors({ general: 'Stripe is not loaded. Please refresh and try again.' });
      return;
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // Create setup intent
      const response = await fetch('/api/payment-methods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          billing_name: billingName.trim(),
          set_as_default: setAsDefault,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create setup intent');
      }

      const cardNumberElement = elements.getElement(CardNumberElement);
      if (!cardNumberElement) {
        throw new Error('Card element not found');
      }

      // Confirm setup intent with billing details
      const { error: stripeError, setupIntent } = await stripe.confirmCardSetup(
        result.data.client_secret,
        {
          payment_method: {
            card: cardNumberElement,
            billing_details: {
              name: billingName.trim(),
            },
          },
        }
      );

      if (stripeError) {
        // Handle specific Stripe errors
        const errorMessage = getStripeErrorMessage(stripeError);
        setErrors({ general: errorMessage });
        return;
      }

      // If user wants to set as default, make an additional API call
      if (setAsDefault && setupIntent?.payment_method) {
        try {
          await fetch(`/api/payment-methods/${setupIntent.payment_method}`, {
            method: 'PATCH',
          });
        } catch (defaultError) {
          console.warn('Failed to set as default, but payment method was added:', defaultError);
          // Don't fail the whole operation
        }
      }

      toast({
        title: 'Success',
        description: 'Payment method added successfully. Refreshing list...',
      });

      // Reset form
      setBillingName('');
      setSetAsDefault(true);
      setErrors({});
      setCardComplete({
        cardNumber: false,
        cardExpiry: false,
        cardCvc: false,
      });
      
      onSuccess();
      onOpenChange(false);

    } catch (error) {
      console.error('Error adding payment method:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add payment method';
      setErrors({ general: errorMessage });
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStripeErrorMessage = (error: any) => {
    switch (error.code) {
      case 'card_declined':
        return 'Your card was declined. Please try a different payment method.';
      case 'expired_card':
        return 'Your card has expired. Please use a different card.';
      case 'incorrect_cvc':
        return 'Your card\'s security code is incorrect.';
      case 'processing_error':
        return 'An error occurred while processing your card. Please try again.';
      case 'rate_limit':
        return 'Too many requests. Please wait a moment and try again.';
      default:
        return error.message || 'An error occurred while processing your payment method.';
    }
  };

  const handleClose = () => {
    if (!loading) {
      setBillingName('');
      setSetAsDefault(true);
      setErrors({});
      setCardComplete({
        cardNumber: false,
        cardExpiry: false,
        cardCvc: false,
      });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent 
        className="sm:max-w-lg max-h-[90vh] bg-paper-white border-stone-gray shadow-xl overflow-hidden flex flex-col"
        aria-describedby="add-payment-description"
      >
        <DialogHeader className="pb-3 border-b border-stone-gray/30 flex-shrink-0">
          <DialogTitle className="flex items-center space-x-2 text-charcoal text-xl font-semibold">
            <CreditCard className="h-5 w-5 text-forest-green" />
            <span>Add Payment Method</span>
          </DialogTitle>
          <DialogDescription id="add-payment-description" className="text-charcoal/70 text-sm">
            Add a new payment method securely via Stripe. This card will be used for future billing.
          </DialogDescription>
        </DialogHeader>

        {/* Live region for screen reader announcements */}
        <div 
          role="status" 
          aria-live="polite" 
          className="sr-only"
          aria-atomic="true"
        >
          {errors.general ? `Error: ${errors.general}` : ''}
          {loading ? 'Processing payment method...' : ''}
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* General Error Alert */}
            {errors.general && (
              <Alert className="border-error-red/50 bg-error-red/5 shadow-sm">
                <AlertCircle className="h-4 w-4 text-error-red" />
                <AlertDescription className="text-error-red font-medium">
                  {errors.general}
                </AlertDescription>
              </Alert>
            )}

            {/* Billing Name */}
            <div className="space-y-2">
              <Label htmlFor="billing-name" className="text-sm font-medium text-charcoal">
                Billing Name *
              </Label>
              <Input
                id="billing-name"
                type="text"
                placeholder="Enter the name as it appears on your card"
                value={billingName}
                onChange={(e) => setBillingName(e.target.value)}
                className="border-2 border-stone-gray focus:border-forest-green focus:ring-2 focus:ring-forest-green focus:ring-offset-2 bg-light-concrete text-charcoal placeholder:text-charcoal/50"
                disabled={loading}
                required
                aria-describedby={errors.general ? "billing-name-error" : undefined}
              />
              {errors.general && errors.general.includes('Billing name') && (
                <p id="billing-name-error" className="text-xs text-error-red flex items-center space-x-1" role="alert">
                  <AlertCircle className="h-3 w-3" aria-hidden="true" />
                  <span>Billing name is required</span>
                </p>
              )}
            </div>

            {/* Card Information */}
            <fieldset className="space-y-3">
              <legend className="text-sm font-medium text-charcoal">
                Card Information *
              </legend>
              
              {/* Card Number */}
              <div className="space-y-1">
                <Label className="text-xs font-medium text-charcoal/70">Card Number</Label>
                <div className={`relative border-2 rounded-lg bg-paper-white transition-all duration-200 ${
                  errors.cardNumber 
                    ? 'border-error-red bg-error-red/5 shadow-sm' 
                    : cardComplete.cardNumber 
                      ? 'border-success-green bg-success-green/5 shadow-sm' 
                      : 'border-stone-gray hover:border-forest-green focus-within:border-forest-green focus-within:ring-2 focus-within:ring-forest-green/20'
                }`}>
                  <div className="p-3">
                    <CardNumberElement 
                      options={{
                        ...elementOptions,
                        placeholder: '1234 1234 1234 1234'
                      }} 
                      onChange={handleCardNumberChange}
                    />
                  </div>
                  
                  {/* Visual feedback indicator */}
                  <div className="absolute top-2 right-2">
                    {cardComplete.cardNumber && (
                      <div className="w-4 h-4 bg-success-green rounded-full flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                    {errors.cardNumber && (
                      <div className="w-4 h-4 bg-error-red rounded-full flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
                {errors.cardNumber && (
                  <p className="text-xs text-error-red flex items-center space-x-1" role="alert">
                    <AlertCircle className="h-3 w-3" aria-hidden="true" />
                    <span>{errors.cardNumber}</span>
                  </p>
                )}
              </div>

              {/* Expiry Date and CVC */}
              <div className="grid grid-cols-2 gap-3">
                {/* Expiry Date */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-charcoal/70">Expiry Date</Label>
                  <div className={`relative border-2 rounded-lg bg-paper-white transition-all duration-200 ${
                    errors.cardExpiry 
                      ? 'border-error-red bg-error-red/5 shadow-sm' 
                      : cardComplete.cardExpiry 
                        ? 'border-success-green bg-success-green/5 shadow-sm' 
                        : 'border-stone-gray hover:border-forest-green focus-within:border-forest-green focus-within:ring-2 focus-within:ring-forest-green/20'
                  }`}>
                    <div className="p-3">
                      <CardExpiryElement 
                        options={{
                          ...elementOptions,
                          placeholder: 'MM/YY'
                        }} 
                        onChange={handleCardExpiryChange}
                      />
                    </div>
                    
                    {/* Visual feedback indicator */}
                    <div className="absolute top-2 right-2">
                      {cardComplete.cardExpiry && (
                        <div className="w-4 h-4 bg-success-green rounded-full flex items-center justify-center">
                          <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                      {errors.cardExpiry && (
                        <div className="w-4 h-4 bg-error-red rounded-full flex items-center justify-center">
                          <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                  {errors.cardExpiry && (
                    <p className="text-xs text-error-red flex items-center space-x-1" role="alert">
                      <AlertCircle className="h-3 w-3" aria-hidden="true" />
                      <span>{errors.cardExpiry}</span>
                    </p>
                  )}
                </div>

                {/* CVC */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-charcoal/70">CVC</Label>
                  <div className={`relative border-2 rounded-lg bg-paper-white transition-all duration-200 ${
                    errors.cardCvc 
                      ? 'border-error-red bg-error-red/5 shadow-sm' 
                      : cardComplete.cardCvc 
                        ? 'border-success-green bg-success-green/5 shadow-sm' 
                        : 'border-stone-gray hover:border-forest-green focus-within:border-forest-green focus-within:ring-2 focus-within:ring-forest-green/20'
                  }`}>
                    <div className="p-3">
                      <CardCvcElement 
                        options={{
                          ...elementOptions,
                          placeholder: 'CVC'
                        }} 
                        onChange={handleCardCvcChange}
                      />
                    </div>
                    
                    {/* Visual feedback indicator */}
                    <div className="absolute top-2 right-2">
                      {cardComplete.cardCvc && (
                        <div className="w-4 h-4 bg-success-green rounded-full flex items-center justify-center">
                          <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                      {errors.cardCvc && (
                        <div className="w-4 h-4 bg-error-red rounded-full flex items-center justify-center">
                          <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                  {errors.cardCvc && (
                    <p className="text-xs text-error-red flex items-center space-x-1" role="alert">
                      <AlertCircle className="h-3 w-3" aria-hidden="true" />
                      <span>{errors.cardCvc}</span>
                    </p>
                  )}
                </div>
              </div>
            </fieldset>

            {/* Set as Default Checkbox */}
            <div className="flex items-start space-x-2 p-2 bg-stone-gray/5 rounded-lg border border-stone-gray/30">
              <Checkbox
                checked={setAsDefault}
                onCheckedChange={(checked) => setSetAsDefault(checked as boolean)}
                disabled={loading}
                className="mt-0.5 border-2 border-stone-gray data-[state=checked]:bg-forest-green data-[state=checked]:border-forest-green"
              />
              <div className="flex-1">
                <Label className="text-sm font-medium text-charcoal cursor-pointer">
                  Set as default payment method
                </Label>
              </div>
            </div>

            {/* Compact Security Notice */}
            <div className="flex items-start space-x-2 p-3 bg-forest-green/5 rounded-lg border border-forest-green/20">
              <Shield className="h-4 w-4 text-forest-green mt-0.5 flex-shrink-0" />
              <div className="text-xs text-charcoal/80">
                <p className="font-semibold text-charcoal mb-1">Secure Payment Processing</p>
                <p>Encrypted by Stripe (PCI DSS Level 1). Your card details are never stored on our servers.</p>
              </div>
            </div>
          </form>
        </div>

        {/* Action Buttons - Fixed at bottom */}
        <div className="flex-shrink-0 border-t border-stone-gray/30 pt-3 mt-2">
          <div className="flex space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 border-2 border-stone-gray bg-paper-white text-charcoal hover:bg-light-concrete hover:border-charcoal focus:ring-2 focus:ring-forest-green focus:ring-offset-2 disabled:opacity-50 font-medium h-10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!stripe || loading || !isCardComplete || !billingName.trim()}
              className="flex-1 bg-forest-green text-paper-white hover:bg-forest-green/95 focus:bg-forest-green/95 focus:ring-2 focus:ring-forest-green focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium h-10 shadow-sm"
              onClick={handleSubmit}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Card
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
