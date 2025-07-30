'use client';

import { useEffect,useState } from 'react';
import { AlertCircle, Check, CreditCard, Loader2,Plus, Trash2 } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { CardElement,Elements, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

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

const stripePromise = (publishableKey: string) => loadStripe(publishableKey);

export function PaymentMethodsManager({ stripePublishableKey }: PaymentMethodsManagerProps) {
  return (
    <Elements stripe={stripePromise(stripePublishableKey)}>
      <PaymentMethodsContent />
    </Elements>
  );
}

function PaymentMethodsContent() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const { toast } = useToast();

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/payment-methods');
      const result = await response.json();

      if (result.success) {
        setPaymentMethods(result.data);
      } else {
        setError(result.error || 'Failed to fetch payment methods');
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      setError('Failed to fetch payment methods');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const handleDeletePaymentMethod = async (paymentMethodId: string) => {
    if (!confirm('Are you sure you want to delete this payment method?')) {
      return;
    }

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
        toast({
          title: 'Error',
          description: result.error || 'Failed to delete payment method',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting payment method:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete payment method',
        variant: 'destructive',
      });
    }
  };

  const handleSetDefaultPaymentMethod = async (paymentMethodId: string) => {
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
        description: 'Failed to update default payment method',
        variant: 'destructive',
      });
    }
  };

  const getBrandIcon = (brand: string) => {
    // You could replace this with actual brand icons
    return <CreditCard className="h-4 w-4 text-charcoal/60" />;
  };

  const formatExpiryDate = (month: number, year: number) => {
    return `${month.toString().padStart(2, '0')}/${year.toString().slice(-2)}`;
  };

  if (loading) {
    return (
      <Card className="bg-paper-white border-stone-gray">
        <CardHeader>
          <CardTitle className="text-xl text-charcoal">Payment Methods</CardTitle>
          <CardDescription className="text-charcoal/70">Manage your payment information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-charcoal/50" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-paper-white border-stone-gray">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl text-charcoal">Payment Methods</CardTitle>
            <CardDescription className="text-charcoal/70">
              Manage your payment information securely
            </CardDescription>
          </div>
          <CreditCard className="h-6 w-6 text-charcoal/60" />
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert className="mb-4 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {paymentMethods.length > 0 ? (
          <div className="space-y-4">
            {paymentMethods.map((method) => (
              <Card key={method.id} className="bg-light-concrete border-stone-gray">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-8 bg-stone-gray/20 rounded flex items-center justify-center">
                        {getBrandIcon(method.card?.brand || 'unknown')}
                      </div>
                      <div>
                        <p className="font-medium text-charcoal capitalize">
                          {method.card?.brand || 'Unknown'} •••• {method.card?.last4 || '****'}
                        </p>
                        <p className="text-sm text-charcoal/70">
                          Expires {method.card ? formatExpiryDate(method.card.exp_month, method.card.exp_year) : 'Unknown'}
                        </p>
                        {method.card?.funding && (
                          <p className="text-xs text-charcoal/60 capitalize">
                            {method.card.funding} card
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {/* Show default badge based on is_default property */}
                      {method.is_default && (
                        <Badge className="bg-forest-green text-paper-white">Default</Badge>
                      )}
                      
                      {/* Mobile-friendly button layout */}
                      <div className="flex space-x-1">
                        {!method.is_default && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-stone-gray text-charcoal hover:bg-paper-white h-8 px-2 text-xs"
                            onClick={() => handleSetDefaultPaymentMethod(method.id)}
                          >
                            <Check className="h-3 w-3 mr-1" />
                            <span className="hidden sm:inline">Set Default</span>
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-200 text-red-600 hover:bg-red-50 h-8 px-2"
                          onClick={() => handleDeletePaymentMethod(method.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full border-stone-gray text-charcoal hover:bg-light-concrete h-12"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Payment Method
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Payment Method</DialogTitle>
                  <DialogDescription>
                    Add a new payment method to your account securely.
                  </DialogDescription>
                </DialogHeader>
                <AddPaymentMethodForm
                  onSuccess={() => {
                    setShowAddDialog(false);
                    fetchPaymentMethods();
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-charcoal/70 mb-4">No payment methods on file</p>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button className="bg-forest-green text-paper-white hover:bg-forest-green/90 h-10">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Payment Method
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Payment Method</DialogTitle>
                  <DialogDescription>
                    Add your first payment method to get started.
                  </DialogDescription>
                </DialogHeader>
                <AddPaymentMethodForm
                  onSuccess={() => {
                    setShowAddDialog(false);
                    fetchPaymentMethods();
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AddPaymentMethodForm({ onSuccess }: { onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create setup intent
      const response = await fetch('/api/payment-methods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create setup intent');
      }

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      // Confirm setup intent
      const { error: stripeError } = await stripe.confirmCardSetup(
        result.data.client_secret,
        {
          payment_method: {
            card: cardElement,
          },
        }
      );

      if (stripeError) {
        throw new Error(stripeError.message || 'Payment method setup failed');
      }

      toast({
        title: 'Success',
        description: 'Payment method added successfully',
      });

      onSuccess();
    } catch (error) {
      console.error('Error adding payment method:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add payment method';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424242',
        '::placeholder': {
          color: '#9ca3af',
        },
      },
    },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium text-charcoal">Card Information</label>
        <div className="p-3 border border-stone-gray rounded-md bg-paper-white">
          <CardElement options={cardElementOptions} />
        </div>
      </div>

      <div className="flex space-x-2">
        <Button
          type="submit"
          disabled={!stripe || loading}
          className="flex-1 bg-forest-green text-paper-white hover:bg-forest-green/90"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          {loading ? 'Adding...' : 'Add Payment Method'}
        </Button>
      </div>

      <p className="text-xs text-charcoal/60">
        Your payment information is securely processed by Stripe and encrypted.
      </p>
    </form>
  );
}