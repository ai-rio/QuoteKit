/**
 * Quote Payment Success Page - S2.1 B2B2C Payment System
 * 
 * This page is shown to homeowners after they successfully pay an invoice
 * through the Stripe Customer Portal. It provides confirmation and next steps.
 */

import { CheckCircle, Home, Mail, Phone } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface QuotePaymentSuccessPageProps {
  searchParams: Promise<{
    quote?: string;
    session_id?: string;
  }>;
}

export default async function QuotePaymentSuccessPage({ 
  searchParams 
}: QuotePaymentSuccessPageProps) {
  // Await searchParams to handle the async nature
  const params = await searchParams;
  const quoteId = params.quote;

  return (
    <div className="min-h-screen bg-light-concrete flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full bg-paper-white rounded-2xl border border-stone-gray/20 shadow-lg">
        <CardHeader className="text-center p-8">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl md:text-3xl font-bold text-forest-green">
            Payment Successful!
          </CardTitle>
          <p className="text-lg text-charcoal mt-2">
            Thank you for your payment. Your lawn care service has been confirmed.
          </p>
        </CardHeader>
        
        <CardContent className="p-8 pt-0 space-y-6">
          {/* Payment Confirmation */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-green-800">Payment Confirmed</h3>
                <p className="text-sm text-green-700 mt-1">
                  Your payment has been processed successfully. You will receive an email receipt shortly.
                </p>
                {quoteId && (
                  <p className="text-xs text-green-600 mt-2">
                    Reference: Quote #{quoteId.slice(-8).toUpperCase()}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-charcoal">What happens next?</h3>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-equipment-yellow rounded-full flex items-center justify-center text-xs font-bold text-charcoal">
                  1
                </div>
                <div>
                  <p className="font-medium text-charcoal">Service Confirmation</p>
                  <p className="text-sm text-charcoal/70">
                    Your lawn care company will contact you within 24 hours to confirm service details and schedule.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-equipment-yellow rounded-full flex items-center justify-center text-xs font-bold text-charcoal">
                  2
                </div>
                <div>
                  <p className="font-medium text-charcoal">Service Delivery</p>
                  <p className="text-sm text-charcoal/70">
                    Professional lawn care services will be provided as outlined in your quote.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-equipment-yellow rounded-full flex items-center justify-center text-xs font-bold text-charcoal">
                  3
                </div>
                <div>
                  <p className="font-medium text-charcoal">Follow-up</p>
                  <p className="text-sm text-charcoal/70">
                    You&apos;ll receive updates on service completion and any follow-up care recommendations.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-charcoal mb-3">Need Help?</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Mail className="h-5 w-5 text-charcoal/70" />
                <div>
                  <p className="text-sm font-medium text-charcoal">Email Support</p>
                  <p className="text-xs text-charcoal/70">Contact your lawn care company directly</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Phone className="h-5 w-5 text-charcoal/70" />
                <div>
                  <p className="text-sm font-medium text-charcoal">Phone Support</p>
                  <p className="text-xs text-charcoal/70">Call the number provided in your quote</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              asChild 
              className="flex-1 bg-equipment-yellow border-equipment-yellow text-charcoal hover:bg-equipment-yellow/90 font-bold"
            >
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Return to Homepage
              </Link>
            </Button>
            
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => window.print()}
            >
              Print Confirmation
            </Button>
          </div>

          {/* Footer */}
          <div className="text-center pt-6 border-t">
            <p className="text-xs text-charcoal/60">
              This payment was processed securely by Stripe. 
              Your payment information is protected by industry-leading security measures.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export const metadata = {
  title: 'Payment Successful - QuoteKit',
  description: 'Your lawn care service payment has been processed successfully.',
};
