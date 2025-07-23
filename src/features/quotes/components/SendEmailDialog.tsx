'use client';

import { useState } from 'react';
import { Mail, Send } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

import { sendQuoteEmail, type SendQuoteEmailData } from '../email-actions';

interface SendEmailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  quote: {
    id: string;
    quote_number?: string;
    client_name: string;
    client_contact: string | null;
    total: number;
  };
  companyName?: string;
}

export function SendEmailDialog({ isOpen, onClose, quote, companyName }: SendEmailDialogProps) {
  const [emailData, setEmailData] = useState<Partial<SendQuoteEmailData>>({
    to: quote.client_contact || '',
    subject: `Quote #${quote.quote_number || quote.id.slice(0, 8)} from ${companyName || 'Your Company'}`,
    message: '',
  });
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const handleSend = async () => {
    if (!emailData.to) {
      toast({
        title: 'Error',
        description: 'Please enter a recipient email address.',
        variant: 'destructive',
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailData.to)) {
      toast({
        title: 'Error',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      });
      return;
    }

    setIsSending(true);

    try {
      const result = await sendQuoteEmail({
        quoteId: quote.id,
        to: emailData.to,
        subject: emailData.subject,
        message: emailData.message,
      });

      if (result.success) {
        toast({
          title: 'Email Sent',
          description: `Quote successfully sent to ${emailData.to}`,
        });
        onClose();
      } else {
        toast({
          title: 'Failed to Send Email',
          description: result.error || 'An unexpected error occurred.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send email. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    if (!isSending) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-paper-white border-stone-gray">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-charcoal text-section-title">
            <Mail className="h-5 w-5" />
            Send Quote Email
          </DialogTitle>
          <DialogDescription className="text-charcoal/70">
            Send quote #{quote.quote_number || quote.id.slice(0, 8)} to {quote.client_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-3">
            <Label htmlFor="email-to" className="text-label text-charcoal font-medium">To</Label>
            <Input
              id="email-to"
              type="email"
              placeholder="client@example.com"
              value={emailData.to || ''}
              onChange={(e) =>
                setEmailData((prev) => ({ ...prev, to: e.target.value }))
              }
              disabled={isSending}
              className="border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60"
            />
          </div>

          <div className="grid gap-3">
            <Label htmlFor="email-subject" className="text-label text-charcoal font-medium">Subject</Label>
            <Input
              id="email-subject"
              value={emailData.subject || ''}
              onChange={(e) =>
                setEmailData((prev) => ({ ...prev, subject: e.target.value }))
              }
              disabled={isSending}
              className="border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60"
            />
          </div>

          <div className="grid gap-3">
            <Label htmlFor="email-message" className="text-label text-charcoal font-medium">
              Additional Message{' '}
              <span className="text-sm text-charcoal/60">(optional)</span>
            </Label>
            <Textarea
              id="email-message"
              placeholder="Add a personal message to accompany the quote..."
              rows={3}
              value={emailData.message || ''}
              onChange={(e) =>
                setEmailData((prev) => ({ ...prev, message: e.target.value }))
              }
              disabled={isSending}
              className="border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60"
            />
          </div>

          <div className="rounded-lg bg-light-concrete border border-stone-gray p-3 text-sm text-charcoal">
            <p className="mb-1 font-medium text-charcoal">What will be sent:</p>
            <ul className="space-y-1 text-xs text-charcoal/70">
              <li>• Professional email with quote details</li>
              <li>• PDF attachment with complete quote</li>
              <li>• Your company branding and contact information</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="gap-3">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSending}
            className="bg-paper-white text-charcoal hover:bg-stone-gray/20 border border-stone-gray"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={isSending || !emailData.to}
            className="bg-forest-green text-white hover:opacity-90 active:opacity-80 font-bold gap-2"
          >
            <Send className="h-4 w-4" />
            {isSending ? 'Sending...' : 'Send Email'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}