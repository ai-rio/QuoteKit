'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CreditCard, Loader2, Plus, RefreshCw, RotateCcw } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

import { AddPaymentMethodDialog } from './AddPaymentMethodDialog';
import { PaymentMethodCard } from './PaymentMethodCard';

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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const fetchPaymentMethods = useCallback(async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      console.log('🔄 Fetching payment methods...');
      
      const response = await fetch('/api/payment-methods', {
        cache: 'no-store', // Always fetch fresh data
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      const result = await response.json();
      
      console.log('📊 Payment methods API response:', result);

      if (result.success) {
        console.log(`✅ Found ${result.data?.length || 0} payment methods`);
        setPaymentMethods(result.data || []);
      } else {
        console.error('❌ API error:', result.error);
        setError(result.error || 'Failed to fetch payment methods');
      }
    } catch (error) {
      console.error('💥 Fetch error:', error);
      setError('Failed to fetch payment methods. Please check your connection and try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPaymentMethods();
  }, [fetchPaymentMethods]);

  const handleDeletePaymentMethod = async (paymentMethodId: string) => {
    // Find the payment method to check if it's default
    const paymentMethod = paymentMethods.find(pm => pm.id === paymentMethodId);
    
    if (paymentMethod?.is_default && paymentMethods.length > 1) {
      toast({
        title: 'Cannot Delete Default Payment Method',
        description: 'Please set another payment method as default before deleting this one.',
        variant: 'destructive',
      });
      return;
    }

    const confirmMessage = paymentMethod?.is_default 
      ? 'Are you sure you want to delete your only payment method? This will affect your active subscriptions.'
      : 'Are you sure you want to delete this payment method?';

    if (!confirm(confirmMessage)) {
      return;
    }

    setDeletingId(paymentMethodId);

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
        description: 'Failed to delete payment method. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetDefaultPaymentMethod = async (paymentMethodId: string) => {
    setSettingDefaultId(paymentMethodId);

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
        description: 'Failed to update default payment method. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSettingDefaultId(null);
    }
  };

  const handleAddSuccess = () => {
    setShowAddDialog(false);
    
    // Add a small delay to allow Stripe webhook processing
    setTimeout(() => {
      fetchPaymentMethods();
    }, 1000);
    
    toast({
      title: 'Success',
      description: 'Payment method added successfully',
    });
  };

  const handleRefresh = () => {
    fetchPaymentMethods(true);
  };

  const handleForceSync = async () => {
    try {
      setRefreshing(true);
      console.log('🔄 Force syncing payment methods from Stripe...');
      
      // Call the sync endpoint to force refresh from Stripe
      const response = await fetch('/api/payment-methods/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      console.log('🔄 Sync result:', result);
      
      if (result.success) {
        toast({
          title: 'Sync Complete',
          description: `Synced ${result.synced || 0} payment methods from Stripe`,
        });
        // Fetch fresh data after sync
        await fetchPaymentMethods();
      } else {
        toast({
          title: 'Sync Failed',
          description: result.error || 'Failed to sync payment methods',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast({
        title: 'Sync Error',
        description: 'Failed to sync payment methods',
        variant: 'destructive',
      });
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-paper-white border-stone-gray">
        <CardHeader>
          <CardTitle className="text-xl text-charcoal">Payment Methods</CardTitle>
          <CardDescription className="text-charcoal/70">Manage your payment information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-charcoal/50 mx-auto mb-4" />
              <p className="text-sm text-charcoal/60">Loading payment methods...</p>
            </div>
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
            <CardTitle className="text-xl text-charcoal flex items-center space-x-2">
              <CreditCard className="h-5 w-5 text-forest-green" />
              <span>Payment Methods</span>
            </CardTitle>
            <CardDescription className="text-charcoal/70">
              Manage your payment information securely
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
              className="border-stone-gray text-charcoal hover:bg-stone-gray/10"
              title="Refresh payment methods"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleForceSync}
              disabled={refreshing}
              className="border-stone-gray text-charcoal hover:bg-stone-gray/10"
              title="Force sync from Stripe"
            >
              <RotateCcw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
              <Button
                size="sm"
                variant="outline"
                onClick={() => fetchPaymentMethods()}
                className="ml-2 h-6 text-xs"
              >
                Try Again
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {paymentMethods.length > 0 ? (
          <div className="space-y-4">
            {paymentMethods.map((method) => (
              <PaymentMethodCard
                key={method.id}
                paymentMethod={method}
                onDelete={handleDeletePaymentMethod}
                onSetDefault={handleSetDefaultPaymentMethod}
                isDeleting={deletingId === method.id}
                isSettingDefault={settingDefaultId === method.id}
              />
            ))}
            
            <div className="pt-4 border-t border-stone-gray/30">
              <Button
                variant="outline"
                onClick={() => setShowAddDialog(true)}
                className="w-full border-stone-gray text-charcoal hover:bg-stone-gray/10 h-12"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Another Payment Method
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-stone-gray/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="h-8 w-8 text-charcoal/40" />
            </div>
            <h3 className="text-lg font-medium text-charcoal mb-2">No payment methods</h3>
            <p className="text-charcoal/70 mb-6 max-w-sm mx-auto">
              Add a payment method to manage your subscriptions and make payments.
            </p>
            <Button 
              onClick={() => setShowAddDialog(true)}
              className="bg-forest-green text-paper-white hover:bg-forest-green/90 h-10"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Payment Method
            </Button>
          </div>
        )}

        <AddPaymentMethodDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          onSuccess={handleAddSuccess}
        />
      </CardContent>
    </Card>
  );
}