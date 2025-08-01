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
import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';

interface AddPaymentMethodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface CardErrors {
  card?: string;
  general?: string;
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
  const [cardComplete, setCardComplete] = useState(false);
  const [setAsDefault, setSetAsDefault] = useState(true);
  const [billingName, setBillingName] = useState('');
  const { toast } = useToast();

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#1C1C1C',
        fontFamily: 'Inter, system-ui, sans-serif',
        '::placeholder': {
          color: '#9CA3AF',
        },
        iconColor: '#6B7280',
      },
      invalid: {
        color: '#EF4444',
        iconColor: '#EF4444',
      },
      complete: {
        color: '#10B981',
        iconColor: '#10B981',
      },
    },
    hidePostalCode: false,
  };

  const handleCardChange = (event: any) => {
    setCardComplete(event.complete);
    
    if (event.error) {
      setErrors(prev => ({ ...prev, card: event.error.message }));
    } else {
      setErrors(prev => ({ ...prev, card: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors: CardErrors = {};

    if (!billingName.trim()) {
      newErrors.general = 'Billing name is required';
    }

    if (!cardComplete) {
      newErrors.card = 'Please complete your card information';
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

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      // Confirm setup intent with billing details
      const { error: stripeError, setupIntent } = await stripe.confirmCardSetup(
        result.data.client_secret,
        {
          payment_method: {
            card: cardElement,
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
        description: 'Payment method added successfully',
      });

      // Reset form
      setBillingName('');
      setSetAsDefault(true);
      setErrors({});
      
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
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5 text-forest-green" />
            <span>Add Payment Method</span>
          </DialogTitle>
          <DialogDescription>
            Add a new payment method to your account securely. Your information is encrypted and processed by Stripe.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* General Error Alert */}
          {errors.general && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
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
              className="border-stone-gray focus:border-forest-green"
              disabled={loading}
              required
            />
          </div>

          {/* Card Information */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-charcoal">
              Card Information *
            </Label>
            <div className={`p-4 border rounded-md bg-paper-white transition-colors ${
              errors.card 
                ? 'border-red-300 bg-red-50' 
                : cardComplete 
                  ? 'border-green-300 bg-green-50' 
                  : 'border-stone-gray focus-within:border-forest-green'
            }`}>
              <CardElement 
                options={cardElementOptions} 
                onChange={handleCardChange}
                disabled={loading}
              />
            </div>
            {errors.card && (
              <p className="text-sm text-red-600 flex items-center space-x-1">
                <AlertCircle className="h-3 w-3" />
                <span>{errors.card}</span>
              </p>
            )}
          </div>

          {/* Set as Default Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="set-default"
              checked={setAsDefault}
              onCheckedChange={(checked) => setSetAsDefault(checked as boolean)}
              disabled={loading}
            />
            <Label 
              htmlFor="set-default" 
              className="text-sm text-charcoal cursor-pointer"
            >
              Set as default payment method
            </Label>
          </div>

          {/* Security Notice */}
          <div className="flex items-start space-x-2 p-3 bg-stone-gray/10 rounded-md">
            <Shield className="h-4 w-4 text-forest-green mt-0.5 flex-shrink-0" />
            <div className="text-xs text-charcoal/70">
              <p className="font-medium mb-1">Your payment information is secure</p>
              <p>
                We use Stripe to process payments securely. Your card details are encrypted 
                and never stored on our servers.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 border-stone-gray text-charcoal hover:bg-stone-gray/10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!stripe || loading || !cardComplete || !billingName.trim()}
              className="flex-1 bg-forest-green text-paper-white hover:bg-forest-green/90"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Payment Method
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
