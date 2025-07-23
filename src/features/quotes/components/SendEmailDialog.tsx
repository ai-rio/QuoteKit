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
    client_contact?: string;
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Quote Email
          </DialogTitle>
          <DialogDescription>
            Send quote #{quote.quote_number || quote.id.slice(0, 8)} to {quote.client_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email-to">To</Label>
            <Input
              id="email-to"
              type="email"
              placeholder="client@example.com"
              value={emailData.to || ''}
              onChange={(e) =>
                setEmailData((prev) => ({ ...prev, to: e.target.value }))
              }
              disabled={isSending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email-subject">Subject</Label>
            <Input
              id="email-subject"
              value={emailData.subject || ''}
              onChange={(e) =>
                setEmailData((prev) => ({ ...prev, subject: e.target.value }))
              }
              disabled={isSending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email-message">
              Additional Message{' '}
              <span className="text-sm text-gray-500">(optional)</span>
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
            />
          </div>

          <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
            <p className="mb-1 font-medium">What will be sent:</p>
            <ul className="space-y-1 text-xs">
              <li>• Professional email with quote details</li>
              <li>• PDF attachment with complete quote</li>
              <li>• Your company branding and contact information</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={isSending || !emailData.to}
            className="gap-2"
          >
            <Send className="h-4 w-4" />
            {isSending ? 'Sending...' : 'Send Email'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}