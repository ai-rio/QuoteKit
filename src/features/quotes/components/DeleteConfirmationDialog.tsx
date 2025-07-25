'use client';

import { AlertTriangle, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { Quote } from '../types';

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting?: boolean;
  quotes: Quote[];
  isBulkDelete?: boolean;
}

export function DeleteConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  isDeleting = false,
  quotes,
  isBulkDelete = false,
}: DeleteConfirmationDialogProps) {
  const quoteCount = quotes.length;
  const isMultiple = quoteCount > 1;

  const getTitle = () => {
    if (isBulkDelete) {
      return `Delete ${quoteCount} Quote${isMultiple ? 's' : ''}`;
    }
    return 'Delete Quote';
  };

  const getDescription = () => {
    if (isBulkDelete) {
      return `Are you sure you want to delete ${quoteCount} quote${isMultiple ? 's' : ''}? This action cannot be undone.`;
    }
    
    const quote = quotes[0];
    const quoteName = quote?.quote_number || `Q-${quote?.id.slice(-6).toUpperCase()}`;
    return `Are you sure you want to delete quote ${quoteName} for ${quote?.client_name}? This action cannot be undone.`;
  };

  const getQuotesList = () => {
    if (!isBulkDelete || quoteCount <= 3) {
      return quotes.map((quote) => {
        const quoteName = quote.quote_number || `Q-${quote.id.slice(-6).toUpperCase()}`;
        return `${quoteName} (${quote.client_name})`;
      }).join(', ');
    }
    
    const firstThree = quotes.slice(0, 3).map((quote) => {
      const quoteName = quote.quote_number || `Q-${quote.id.slice(-6).toUpperCase()}`;
      return `${quoteName} (${quote.client_name})`;
    }).join(', ');
    
    return `${firstThree} and ${quoteCount - 3} more...`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-paper-white border-stone-gray max-w-md">
        <DialogHeader>
          <DialogTitle className="text-charcoal flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-error-red" />
            {getTitle()}
          </DialogTitle>
          <DialogDescription className="text-charcoal/70">
            {getDescription()}
          </DialogDescription>
          
          {isBulkDelete && quoteCount > 1 && (
            <div className="mt-3 p-3 bg-light-concrete rounded-lg">
              <p className="text-sm text-charcoal/80 font-medium mb-1">
                Quotes to be deleted:
              </p>
              <p className="text-sm text-charcoal/70">
                {getQuotesList()}
              </p>
            </div>
          )}
        </DialogHeader>
        
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
            className="bg-paper-white text-charcoal border-stone-gray hover:bg-stone-gray/20"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-error-red text-paper-white hover:opacity-90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              `Delete ${isBulkDelete && isMultiple ? `${quoteCount} Quotes` : 'Quote'}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}