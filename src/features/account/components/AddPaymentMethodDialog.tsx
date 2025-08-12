'use client';

import { 
  CardCvcElement, 
  CardExpiryElement, 
  CardNumberElement, 
  useElements, 
  useStripe 
} from '@stripe/react-stripe-js';
import { AlertCircle, CreditCard, HelpCircle, Loader2, Plus, Shield } from 'lucide-react';
import { useState, useEffect } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
  const [stripeLoading, setStripeLoading] = useState(true);
  const [errors, setErrors] = useState<CardErrors>({});
  const [cardComplete, setCardComplete] = useState<CardComplete>({
    cardNumber: false,
    cardExpiry: false,
    cardCvc: false,
  });
  const [setAsDefault, setSetAsDefault] = useState(true);
  const [billingName, setBillingName] = useState('');
  const { toast } = useToast();

  // Monitor Stripe loading state
  useEffect(() => {
    if (stripe && elements) {
      console.debug('Stripe and Elements are ready');
      setStripeLoading(false);
    } else {
      console.debug('Waiting for Stripe and Elements to load...', { 
        hasStripe: !!stripe, 
        hasElements: !!elements 
      });
    }
  }, [stripe, elements]);

  const elementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#1f2937',
        fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
        fontWeight: '400',
        lineHeight: '1.5',
        '::placeholder': {
          color: '#9CA3AF',
        },
        iconColor: '#6B7280',
        // Remove padding from Stripe options since we handle it with CSS
      },
      invalid: {
        color: '#EF4444',
        iconColor: '#EF4444',
      },
      complete: {
        color: '#10B981',
        iconColor: '#10B981',
      },
      focus: {
        color: '#1f2937',
      },
    },
    hideIcon: false,
  };

  const handleCardNumberChange = (event: any) => {
    console.debug('Card number change event:', event);
    setCardComplete(prev => ({ ...prev, cardNumber: event.complete }));
    
    if (event.error) {
      console.debug('Card number error:', event.error);
      setErrors(prev => ({ ...prev, cardNumber: event.error.message }));
    } else {
      setErrors(prev => ({ ...prev, cardNumber: undefined }));
    }
  };

  const handleCardExpiryChange = (event: any) => {
    console.debug('Card expiry change event:', event);
    setCardComplete(prev => ({ ...prev, cardExpiry: event.complete }));
    
    if (event.error) {
      console.debug('Card expiry error:', event.error);
      setErrors(prev => ({ ...prev, cardExpiry: event.error.message }));
    } else {
      setErrors(prev => ({ ...prev, cardExpiry: undefined }));
    }
  };

  const handleCardCvcChange = (event: any) => {
    console.debug('Card CVC change event:', event);
    setCardComplete(prev => ({ ...prev, cardCvc: event.complete }));
    
    if (event.error) {
      console.debug('Card CVC error:', event.error);
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
        className="sm:max-w-lg max-h-[90vh] bg-white border-gray-300 shadow-xl overflow-hidden flex flex-col"
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
          {stripeLoading || !stripe || !elements ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 text-forest-green mx-auto mb-4 animate-spin" />
              <p className="text-charcoal/70">Loading Stripe payment form...</p>
              {process.env.NODE_ENV === 'development' && (
                <p className="text-xs text-charcoal/50 mt-2">
                  Debug: Stripe={!!stripe ? 'loaded' : 'loading'}, Elements={!!elements ? 'loaded' : 'loading'}
                </p>
              )}
            </div>
          ) : (
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
              <legend className="text-sm font-medium text-charcoal flex items-center space-x-2">
                <span>Card Information *</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-charcoal/60 hover:text-charcoal cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-xs">
                      <p>Your payment information is securely processed by Stripe and never stored on our servers. All fields are required for card verification.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </legend>
              
              {/* Card Number */}
              <div className="space-y-1">
                <Label className="text-xs font-medium text-charcoal/70 flex items-center space-x-1">
                  <span>Card Number</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3 w-3 text-charcoal/50 hover:text-charcoal cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p>Enter your 16-digit card number. We accept Visa, MasterCard, American Express, and Discover.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <div className={`relative border-2 rounded-lg bg-white transition-all duration-200 ${
                  errors.cardNumber 
                    ? 'border-red-500 bg-red-50' 
                    : cardComplete.cardNumber 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-300 hover:border-forest-green focus-within:border-forest-green'
                }`}>
                  <div className="relative min-h-[48px] flex items-center px-3 py-3">
                    <div className="w-full">
                      <CardNumberElement 
                        options={{
                          ...elementOptions,
                          showIcon: true,
                          placeholder: '1234 1234 1234 1234'
                        }} 
                        onChange={handleCardNumberChange}
                      />
                    </div>
                  </div>
                  
                  {/* Visual feedback indicator */}
                  <div className="absolute top-2 right-2 pointer-events-none">
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
                  <Label className="text-xs font-medium text-charcoal/70 flex items-center space-x-1">
                    <span>Expiry Date</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3 w-3 text-charcoal/50 hover:text-charcoal cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p>Enter MM/YY format (e.g., 12/25 for December 2025)</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <div className={`relative border-2 rounded-lg bg-white transition-all duration-200 ${
                    errors.cardExpiry 
                      ? 'border-red-500 bg-red-50' 
                      : cardComplete.cardExpiry 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-300 hover:border-forest-green focus-within:border-forest-green'
                  }`}>
                    <div className="relative min-h-[48px] flex items-center px-3 py-3">
                      <div className="w-full">
                        <CardExpiryElement 
                          options={{
                            ...elementOptions,
                            placeholder: 'MM/YY'
                          }} 
                          onChange={handleCardExpiryChange}
                        />
                      </div>
                    </div>
                    
                    {/* Visual feedback indicator */}
                    <div className="absolute top-2 right-2 pointer-events-none">
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
                  <Label className="text-xs font-medium text-charcoal/70 flex items-center space-x-1">
                    <span>CVC</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3 w-3 text-charcoal/50 hover:text-charcoal cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p>3-digit security code on the back of your card (4 digits for American Express on the front)</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <div className={`relative border-2 rounded-lg bg-white transition-all duration-200 ${
                    errors.cardCvc 
                      ? 'border-red-500 bg-red-50' 
                      : cardComplete.cardCvc 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-300 hover:border-forest-green focus-within:border-forest-green'
                  }`}>
                    <div className="relative min-h-[48px] flex items-center px-3 py-3">
                      <div className="w-full">
                        <CardCvcElement 
                          options={{
                            ...elementOptions,
                            placeholder: '123'
                          }} 
                          onChange={handleCardCvcChange}
                        />
                      </div>
                    </div>
                    
                    {/* Visual feedback indicator */}
                    <div className="absolute top-2 right-2 pointer-events-none">
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
                <Label className="text-sm font-medium text-charcoal cursor-pointer flex items-center space-x-1">
                  <span>Set as default payment method</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3 w-3 text-charcoal/50 hover:text-charcoal cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs">
                        <p>This card will be used automatically for future billing cycles and plan upgrades.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
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
          )}
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
              disabled={stripeLoading || !stripe || !elements || loading || !isCardComplete || !billingName.trim()}
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
