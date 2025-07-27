import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { Calendar, CreditCard, DollarSign,Download } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getAvailablePlans } from '@/features/account/actions/subscription-actions';
import { EnhancedCurrentPlanCard } from '@/features/account/components/EnhancedCurrentPlanCard';
import { PaymentMethodsManager } from '@/features/account/components/PaymentMethodsManager';
import { getSession } from '@/features/account/controllers/get-session';
import { getStripePublishableKey } from '@/features/account/controllers/get-stripe-config';
import { getBillingHistory, getPaymentMethods,getSubscription } from '@/features/account/controllers/get-subscription';
import { SubscriptionWithProduct } from '@/features/pricing/types';

interface BillingHistoryItem {
  id: string;
  date: string;
  amount: number;
  status: string;
  invoice_url: string;
  description: string;
}

interface PaymentMethod {
  id: string;
  type: string;
  card: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
  is_default: boolean;
}

export default async function AccountPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  console.log('🔍 ACCOUNT PAGE DEBUG: Session info:', {
    userId: session.user.id,
    email: session.user.email
  });

  const [subscription, billingHistory, paymentMethods, availablePlans, stripePublishableKey] = await Promise.all([
    getSubscription(),
    getBillingHistory(),
    getPaymentMethods(),
    getAvailablePlans(),
    getStripePublishableKey(),
  ]);

  console.log('🔍 ACCOUNT PAGE DEBUG: Data results:', {
    hasSubscription: !!subscription,
    subscriptionId: subscription?.id,
    subscriptionStatus: subscription?.status,
    billingHistoryCount: billingHistory?.length || 0,
    paymentMethodsCount: paymentMethods?.length || 0,
    hasStripeKey: !!stripePublishableKey
  });

  return (
    <div className="min-h-screen bg-light-concrete">
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-charcoal">Account Dashboard</h1>
          <p className="text-charcoal/70 mt-2">Manage your subscription and billing information</p>
          {/* Temporary debug info */}
          <div className="mt-4 p-4 bg-yellow-100 border border-yellow-400 rounded text-sm">
            <strong>DEBUG INFO:</strong><br/>
            User: {session.user.email} ({session.user.id})<br/>
            Subscription: {subscription ? `${subscription.id} (${subscription.status})` : 'None found'}<br/>
            Billing History: {billingHistory?.length || 0} records<br/>
            Payment Methods: {paymentMethods?.length || 0} methods<br/>
            Stripe Key: {stripePublishableKey ? 'Available' : 'Not configured'}
          </div>
        </div>

        {/* Current Plan Section */}
        <Suspense fallback={<CardSkeleton />}>
          <EnhancedCurrentPlanCard subscription={subscription} availablePlans={availablePlans} />
        </Suspense>

        {/* Billing History Section */}
        <Suspense fallback={<CardSkeleton />}>
          <BillingHistoryCard billingHistory={billingHistory} />
        </Suspense>

        {/* Payment Methods Section */}
        <Suspense fallback={<CardSkeleton />}>
          {stripePublishableKey ? (
            <PaymentMethodsManager stripePublishableKey={stripePublishableKey} />
          ) : (
            <Card className="bg-paper-white border-stone-gray">
              <CardHeader>
                <CardTitle className="text-xl text-charcoal">Payment Methods</CardTitle>
                <CardDescription className="text-charcoal/70">Stripe is not configured</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-charcoal/60">Payment method management is not available.</p>
              </CardContent>
            </Card>
          )}
        </Suspense>
      </div>
    </div>
  );
}

function BillingHistoryCard({ billingHistory }: { billingHistory: BillingHistoryItem[] }) {
  return (
    <Card className="bg-paper-white border-stone-gray">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl text-charcoal">Billing History</CardTitle>
            <CardDescription className="text-charcoal/70">Download your invoices and receipts</CardDescription>
          </div>
          <Calendar className="h-6 w-6 text-charcoal/60" />
        </div>
      </CardHeader>
      <CardContent>
        {billingHistory.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block">
              <Table>
                <TableHeader>
                  <TableRow className="border-stone-gray">
                    <TableHead className="text-charcoal">Date</TableHead>
                    <TableHead className="text-charcoal">Description</TableHead>
                    <TableHead className="text-charcoal">Amount</TableHead>
                    <TableHead className="text-charcoal">Status</TableHead>
                    <TableHead className="text-charcoal">Invoice</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {billingHistory.map((item) => (
                    <TableRow key={item.id} className="border-stone-gray">
                      <TableCell className="text-charcoal">
                        {new Date(item.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-charcoal">{item.description}</TableCell>
                      <TableCell className="text-charcoal">
                        ${(item.amount / 100).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          item.status === 'paid' 
                            ? 'bg-forest-green text-paper-white' 
                            : 'bg-equipment-yellow text-charcoal'
                        }>
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="border-stone-gray text-charcoal hover:bg-light-concrete w-10 h-10"
                          asChild
                        >
                          <a href={item.invoice_url} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4">
              {billingHistory.map((item) => (
                <Card key={item.id} className="bg-light-concrete border-stone-gray">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-charcoal">{item.description}</p>
                        <p className="text-sm text-charcoal/70">
                          {new Date(item.date).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge className={
                        item.status === 'paid' 
                          ? 'bg-forest-green text-paper-white' 
                          : 'bg-equipment-yellow text-charcoal'
                      }>
                        {item.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-charcoal">
                        ${(item.amount / 100).toFixed(2)}
                      </span>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="border-stone-gray text-charcoal hover:bg-paper-white w-10 h-10"
                        asChild
                      >
                        <a href={item.invoice_url} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-charcoal/70">No billing history available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}



function CardSkeleton() {
  return (
    <Card className="bg-paper-white border-stone-gray">
      <CardHeader>
        <div className="h-6 w-48 bg-light-concrete animate-pulse rounded"></div>
        <div className="h-4 w-32 bg-light-concrete animate-pulse rounded"></div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="h-4 w-full bg-light-concrete animate-pulse rounded"></div>
          <div className="h-4 w-3/4 bg-light-concrete animate-pulse rounded"></div>
          <div className="h-4 w-1/2 bg-light-concrete animate-pulse rounded"></div>
        </div>
      </CardContent>
    </Card>
  );
}