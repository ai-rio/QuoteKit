'use client';

import { useState } from 'react';
import { AlertCircle, CreditCard, Loader2, Plus, Shield } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { 
  CardNumberElement, 
  CardExpiryElement, 
  CardCvcElement, 
  useElements, 
  useStripe 
} from '@stripe/react-stripe-js';

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
        color: '#1C1C1C',
        fontFamily: 'Inter, system-ui, sans-serif',
        '::placeholder': {
          color: '#6B7280',
        },
        iconColor: '#374151',
      },
      invalid: {
        color: '#DC2626',
        iconColor: '#DC2626',
      },
      complete: {
        color: '#059669',
        iconColor: '#059669',
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
      <DialogContent className="sm:max-w-lg max-h-[90vh] bg-paper-white border-stone-gray shadow-xl overflow-hidden flex flex-col">
        <DialogHeader className="pb-3 border-b border-stone-gray/30 flex-shrink-0">
          <DialogTitle className="flex items-center space-x-2 text-charcoal">
            <CreditCard className="h-5 w-5 text-forest-green" />
            <span className="text-lg font-semibold">Add Payment Method</span>
          </DialogTitle>
          <DialogDescription className="text-charcoal/70 text-sm">
            Add a new payment method securely via Stripe.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-2">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* General Error Alert */}
            {errors.general && (
              <Alert className="border-red-300 bg-red-50 shadow-sm">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800 font-medium">
                  {errors.general}
                </AlertDescription>
              </Alert>
            )}

            {/* Billing Name */}
            <div className="space-y-2">
              <Label htmlFor="billing-name" className="text-sm font-medium text-charcoal">
                Cardholder Name *
              </Label>
              <Input
                id="billing-name"
                type="text"
                placeholder="Enter the name on your card"
                value={billingName}
                onChange={(e) => setBillingName(e.target.value)}
                className="border-2 border-stone-gray focus:border-forest-green focus:ring-2 focus:ring-forest-green/20 bg-paper-white text-charcoal placeholder:text-charcoal/50"
                disabled={loading}
                required
              />
            </div>

            {/* Card Information */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-charcoal">
                Card Information *
              </Label>
              
              {/* Card Number */}
              <div className="space-y-1">
                <Label className="text-xs font-medium text-charcoal/70">Card Number</Label>
                <div className={`relative border-2 rounded-lg bg-paper-white transition-all duration-200 ${
                  errors.cardNumber 
                    ? 'border-red-500 bg-red-50 shadow-sm' 
                    : cardComplete.cardNumber 
                      ? 'border-green-500 bg-green-50 shadow-sm' 
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
                      <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                    {errors.cardNumber && (
                      <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
                {errors.cardNumber && (
                  <p className="text-xs text-red-600 flex items-center space-x-1">
                    <AlertCircle className="h-3 w-3" />
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
                      ? 'border-red-500 bg-red-50 shadow-sm' 
                      : cardComplete.cardExpiry 
                        ? 'border-green-500 bg-green-50 shadow-sm' 
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
                        <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                          <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                      {errors.cardExpiry && (
                        <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                          <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                  {errors.cardExpiry && (
                    <p className="text-xs text-red-600 flex items-center space-x-1">
                      <AlertCircle className="h-3 w-3" />
                      <span>{errors.cardExpiry}</span>
                    </p>
                  )}
                </div>

                {/* CVC */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-charcoal/70">CVC</Label>
                  <div className={`relative border-2 rounded-lg bg-paper-white transition-all duration-200 ${
                    errors.cardCvc 
                      ? 'border-red-500 bg-red-50 shadow-sm' 
                      : cardComplete.cardCvc 
                        ? 'border-green-500 bg-green-50 shadow-sm' 
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
                        <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                          <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                      {errors.cardCvc && (
                        <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                          <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                  {errors.cardCvc && (
                    <p className="text-xs text-red-600 flex items-center space-x-1">
                      <AlertCircle className="h-3 w-3" />
                      <span>{errors.cardCvc}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

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
              className="flex-1 border-2 border-stone-gray text-charcoal hover:bg-stone-gray/10 hover:border-stone-gray/70 font-medium h-10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!stripe || loading || !isCardComplete || !billingName.trim()}
              className="flex-1 bg-forest-green text-paper-white hover:bg-forest-green/90 disabled:bg-stone-gray disabled:text-charcoal/50 font-medium h-10 shadow-sm"
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
