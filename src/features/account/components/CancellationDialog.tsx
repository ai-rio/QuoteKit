'use client';

import { useState } from 'react';
import { AlertTriangle, Calendar, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface CancellationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: {
    name: string;
    price: number;
    interval: string;
    nextBillingDate: string;
  };
  onCancel: (cancelAtPeriodEnd: boolean, reason?: string) => Promise<void>;
  isLoading?: boolean;
}

export function CancellationDialog({
  isOpen,
  onClose,
  currentPlan,
  onCancel,
  isLoading = false,
}: CancellationDialogProps) {
  const [cancelOption, setCancelOption] = useState<'immediate' | 'end_of_period'>('end_of_period');
  const [cancellationReason, setCancellationReason] = useState('');
  const [isCanceling, setIsCanceling] = useState(false);

  const handleCancellation = async () => {
    setIsCanceling(true);
    try {
      await onCancel(cancelOption === 'end_of_period', cancellationReason);
      onClose();
    } catch (error) {
      console.error('Cancellation failed:', error);
    } finally {
      setIsCanceling(false);
    }
  };

  const formatPrice = (amount: number) => {
    return `$${amount.toFixed(0)}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-paper-white border-stone-gray max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-charcoal text-section-title flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5 text-equipment-yellow" />
            Cancel Subscription
          </DialogTitle>
          <DialogDescription className="text-charcoal/70">
            We&apos;re sorry to see you go. Please let us know how we can improve.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Plan Summary */}
          <Card className="bg-light-concrete border-stone-gray">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-charcoal">{currentPlan.name}</h3>
                  <p className="text-charcoal/70">
                    {formatPrice(currentPlan.price)}/{currentPlan.interval}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-charcoal/60">Next billing</p>
                  <p className="font-medium text-charcoal">{currentPlan.nextBillingDate}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cancellation Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-charcoal">Cancellation Options</h3>
            <div className="space-y-3">
              <Label htmlFor="cancelOption" className="text-sm font-medium text-charcoal">
                When would you like to cancel?
              </Label>
              <Select 
                value={cancelOption} 
                onValueChange={(value) => setCancelOption(value as 'immediate' | 'end_of_period')}
              >
                <SelectTrigger className="border-stone-gray focus:border-forest-green">
                  <SelectValue placeholder="Select cancellation timing" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="end_of_period">
                    Cancel at end of billing period (Recommended)
                  </SelectItem>
                  <SelectItem value="immediate">
                    Cancel immediately
                  </SelectItem>
                </SelectContent>
              </Select>
              
              {/* Information based on selection */}
              <Card className="bg-light-concrete border-stone-gray">
                <CardContent className="p-4">
                  <div className="text-sm text-charcoal/70 space-y-1">
                    {cancelOption === 'end_of_period' ? (
                      <>
                        <div className="flex items-center mb-2">
                          <Calendar className="mr-2 h-4 w-4" />
                          <span className="font-medium">Access continues until {currentPlan.nextBillingDate}</span>
                        </div>
                        <p>• No immediate charges</p>
                        <p>• Keep all features until the end of your billing cycle</p>
                        <p>• Option to reactivate before cancellation takes effect</p>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center mb-2">
                          <AlertTriangle className="mr-2 h-4 w-4 text-equipment-yellow" />
                          <span className="font-medium">Access ends immediately</span>
                        </div>
                        <p>• No refund for unused time</p>
                        <p>• Immediate loss of premium features</p>
                        <p>• Cannot be undone</p>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Cancellation Reason (Optional) */}
          <div className="space-y-3">
            <Label className="text-label text-charcoal font-medium">
              Help us improve (optional)
            </Label>
            <Textarea
              placeholder="Let us know why you're canceling. Your feedback helps us improve our service."
              className="bg-light-concrete text-charcoal border-stone-gray focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60"
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              rows={3}
            />
          </div>

          {/* Retention Offer */}
          <Card className="bg-forest-green/10 border-forest-green">
            <CardContent className="p-4">
              <h4 className="font-medium text-charcoal mb-2">Before you go...</h4>
              <div className="text-sm text-charcoal/70 space-y-1">
                <p>• Need help? Our support team is here to assist you</p>
                <p>• Looking for a different plan? We can help you find the right fit</p>
                <p>• Technical issues? We&apos;re committed to resolving them quickly</p>
              </div>
              <Button
                variant="outline"
                className="mt-3 border-forest-green text-forest-green hover:bg-forest-green hover:text-paper-white"
                onClick={() => {
                  // You can redirect to support or open a chat widget
                  window.open('mailto:support@quotekit.com', '_blank');
                }}
              >
                Contact Support Instead
              </Button>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            className="bg-paper-white text-charcoal border-stone-gray hover:bg-stone-gray/20"
            onClick={onClose}
            disabled={isCanceling}
          >
            Keep Subscription
          </Button>
          <Button
            variant="destructive"
            className="bg-error-red text-paper-white hover:bg-error-red/90"
            onClick={handleCancellation}
            disabled={isCanceling}
          >
            {isCanceling ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Canceling...
              </>
            ) : (
              'Confirm Cancellation'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}