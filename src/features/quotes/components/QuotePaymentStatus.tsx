/**
 * Quote Payment Status Component - S2.1 B2B2C Payment System
 * 
 * This component provides the interface for lawn care companies to:
 * - Send invoices to homeowners
 * - Track payment status
 * - Open homeowner payment portals
 * - Manage B2B2C payment workflow
 */

'use client';

import { 
  AlertCircle,
  Calendar, 
  CheckCircle,
  Clock,
  CreditCard, 
  DollarSign, 
  ExternalLink,
  Mail, 
  X
} from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

import { 
  cancelHomeownerInvoice,
  createHomeownerInvoice, 
  createHomeownerPortalSession} from '../actions/homeowner-invoice-actions';

// =====================================================
// TYPES AND INTERFACES
// =====================================================

interface QuotePaymentStatusProps {
  quote: {
    id: string;
    quote_number: string;
    title?: string;
    total: number;
    stripe_invoice_id?: string;
    stripe_customer_id?: string;
    invoice_status?: string;
    homeowner_email?: string;
    homeowner_name?: string;
    invoice_sent_at?: string;
    payment_received_at?: string;
    payment_due_date?: string;
    payment_terms?: number;
    properties?: {
      service_address: string;
      property_name?: string;
    } | null;
  };
  onStatusUpdate?: () => void;
}

// =====================================================
// MAIN COMPONENT
// =====================================================

export function QuotePaymentStatus({ quote, onStatusUpdate }: QuotePaymentStatusProps) {
  const [homeownerEmail, setHomeownerEmail] = useState(quote.homeowner_email || '');
  const [homeownerName, setHomeownerName] = useState(quote.homeowner_name || '');
  const [paymentTerms, setPaymentTerms] = useState(quote.payment_terms?.toString() || '30');
  const [isPending, startTransition] = useTransition();

  // =====================================================
  // EVENT HANDLERS
  // =====================================================

  const handleSendInvoice = () => {
    if (!homeownerEmail) {
      toast.error('Please enter a homeowner email address');
      return;
    }

    if (!isValidEmail(homeownerEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    startTransition(async () => {
      try {
        const result = await createHomeownerInvoice({
          quoteId: quote.id,
          homeownerEmail: homeownerEmail.trim(),
          homeownerName: homeownerName.trim() || undefined,
          paymentTerms: parseInt(paymentTerms) || 30
        });
        
        if (result.success && result.data) {
          toast.success('Invoice sent successfully!', {
            description: `Homeowner will receive payment instructions at ${homeownerEmail}`
          });
          onStatusUpdate?.();
        } else {
          toast.error('Failed to send invoice', {
            description: result.error || 'Please try again or contact support'
          });
        }
      } catch (error) {
        console.error('Error sending invoice:', error);
        toast.error('Failed to send invoice', {
          description: 'An unexpected error occurred. Please try again.'
        });
      }
    });
  };

  const handleOpenPortal = () => {
    if (!quote.stripe_customer_id) {
      toast.error('No payment portal available');
      return;
    }
    
    startTransition(async () => {
      try {
        const result = await createHomeownerPortalSession(
          quote.stripe_customer_id!,
          quote.id
        );
        
        if (result.success && result.data) {
          window.open(result.data.url, '_blank', 'noopener,noreferrer');
          toast.success('Payment portal opened in new tab');
        } else {
          toast.error('Failed to open payment portal', {
            description: result.error || 'Please try again'
          });
        }
      } catch (error) {
        console.error('Error opening portal:', error);
        toast.error('Failed to open payment portal');
      }
    });
  };

  const handleCancelInvoice = () => {
    startTransition(async () => {
      try {
        const result = await cancelHomeownerInvoice(quote.id);
        
        if (result.success) {
          toast.success('Invoice cancelled successfully');
          onStatusUpdate?.();
        } else {
          toast.error('Failed to cancel invoice', {
            description: result.error || 'Please try again'
          });
        }
      } catch (error) {
        console.error('Error cancelling invoice:', error);
        toast.error('Failed to cancel invoice');
      }
    });
  };

  // =====================================================
  // UTILITY FUNCTIONS
  // =====================================================

  const getStatusBadge = () => {
    const status = quote.invoice_status;
    const isOverdue = quote.payment_due_date && 
                     new Date(quote.payment_due_date) < new Date() && 
                     status !== 'paid';

    if (isOverdue) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Overdue
        </Badge>
      );
    }

    switch (status) {
      case 'sent':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1">
            <Mail className="h-3 w-3" />
            Invoice Sent
          </Badge>
        );
      case 'paid':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Paid
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 flex items-center gap-1">
            <X className="h-3 w-3" />
            Cancelled
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Draft
          </Badge>
        );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysUntilDue = () => {
    if (!quote.payment_due_date) return null;
    
    const dueDate = new Date(quote.payment_due_date);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // =====================================================
  // RENDER COMPONENT
  // =====================================================

  return (
    <Card className="bg-paper-white rounded-2xl border border-stone-gray/20 shadow-lg">
      <CardHeader className="p-6">
        <CardTitle className="text-xl font-bold text-forest-green flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Status
          </span>
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6 pt-0 space-y-6">
        {/* Quote Information */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-charcoal/70">Quote #:</span>
            <span className="font-medium text-charcoal">{quote.quote_number}</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-charcoal/70" />
            <span className="text-charcoal/70">Amount:</span>
            <span className="font-medium text-charcoal">${quote.total.toFixed(2)}</span>
          </div>
          {quote.properties?.service_address && (
            <div className="col-span-full">
              <span className="text-charcoal/70">Service Address:</span>
              <span className="ml-2 font-medium text-charcoal">
                {quote.properties.service_address}
              </span>
            </div>
          )}
        </div>

        {/* Payment Timeline */}
        {(quote.invoice_sent_at || quote.payment_due_date || quote.payment_received_at) && (
          <div className="border-t pt-4">
            <h4 className="font-medium text-charcoal mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Payment Timeline
            </h4>
            <div className="space-y-2 text-sm">
              {quote.invoice_sent_at && (
                <div className="flex justify-between">
                  <span className="text-charcoal/70">Invoice Sent:</span>
                  <span className="text-charcoal">{formatDate(quote.invoice_sent_at)}</span>
                </div>
              )}
              {quote.payment_due_date && (
                <div className="flex justify-between">
                  <span className="text-charcoal/70">Due Date:</span>
                  <span className={`${getDaysUntilDue() && getDaysUntilDue()! < 0 ? 'text-red-600 font-medium' : 'text-charcoal'}`}>
                    {formatDate(quote.payment_due_date)}
                    {getDaysUntilDue() !== null && (
                      <span className="ml-1 text-xs text-charcoal/70">
                        ({getDaysUntilDue()! > 0 ? `${getDaysUntilDue()} days left` : `${Math.abs(getDaysUntilDue()!)} days overdue`})
                      </span>
                    )}
                  </span>
                </div>
              )}
              {quote.payment_received_at && (
                <div className="flex justify-between">
                  <span className="text-charcoal/70">Paid On:</span>
                  <span className="text-green-600 font-medium">{formatDate(quote.payment_received_at)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Section */}
        {!quote.stripe_invoice_id ? (
          /* Send Invoice Form */
          <div className="border-t pt-4 space-y-4">
            <h4 className="font-medium text-charcoal">Send Invoice to Homeowner</h4>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="homeowner-email" className="text-sm font-medium text-charcoal">
                  Homeowner Email Address *
                </Label>
                <Input
                  id="homeowner-email"
                  type="email"
                  value={homeownerEmail}
                  onChange={(e) => setHomeownerEmail(e.target.value)}
                  placeholder="homeowner@example.com"
                  className="mt-1"
                  disabled={isPending}
                />
              </div>

              <div>
                <Label htmlFor="homeowner-name" className="text-sm font-medium text-charcoal">
                  Homeowner Name (Optional)
                </Label>
                <Input
                  id="homeowner-name"
                  type="text"
                  value={homeownerName}
                  onChange={(e) => setHomeownerName(e.target.value)}
                  placeholder="John Smith"
                  className="mt-1"
                  disabled={isPending}
                />
              </div>

              <div>
                <Label htmlFor="payment-terms" className="text-sm font-medium text-charcoal">
                  Payment Terms (Days)
                </Label>
                <Select value={paymentTerms} onValueChange={setPaymentTerms} disabled={isPending}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">Net 15 (Due in 15 days)</SelectItem>
                    <SelectItem value="30">Net 30 (Due in 30 days)</SelectItem>
                    <SelectItem value="45">Net 45 (Due in 45 days)</SelectItem>
                    <SelectItem value="60">Net 60 (Due in 60 days)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button
              onClick={handleSendInvoice}
              disabled={!homeownerEmail || isPending}
              className="w-full bg-equipment-yellow border-equipment-yellow text-charcoal hover:bg-equipment-yellow/90 font-bold"
            >
              {isPending ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Sending Invoice...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Invoice to Homeowner
                </>
              )}
            </Button>
          </div>
        ) : (
          /* Invoice Management */
          <div className="border-t pt-4 space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-800">
                    Invoice sent to {quote.homeowner_email}
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    The homeowner can pay online using the link in their email or through the payment portal below.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleOpenPortal}
                disabled={isPending}
                variant="outline"
                className="flex-1"
              >
                {isPending ? (
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ExternalLink className="mr-2 h-4 w-4" />
                )}
                Open Payment Portal
              </Button>

              {quote.invoice_status !== 'paid' && quote.invoice_status !== 'cancelled' && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      disabled={isPending}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Cancel Invoice
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel Invoice</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to cancel this invoice? This action cannot be undone.
                        The homeowner will no longer be able to pay this invoice.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep Invoice</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleCancelInvoice}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Cancel Invoice
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="text-xs text-charcoal/60 bg-gray-50 p-3 rounded-lg">
          <p className="font-medium mb-1">How it works:</p>
          <ul className="space-y-1">
            <li>• Homeowner receives a professional invoice via email</li>
            <li>• They can pay securely online with credit card or bank transfer</li>
            <li>• You&apos;ll be notified when payment is received</li>
            <li>• All payments are processed securely by Stripe</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
