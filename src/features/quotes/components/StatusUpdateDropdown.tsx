'use client';

import { useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  FileText, 
  Loader2,
  Mail, 
  TrendingUp,
  XCircle 
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { useUpdateQuoteStatus } from '../hooks/useUpdateQuoteStatus';
import { Quote, QuoteStatus } from '../types';

interface StatusUpdateDropdownProps {
  quote: Quote;
  onStatusUpdate: (quoteId: string, newStatus: QuoteStatus) => void;
  children: React.ReactNode;
}

const statusConfig = {
  draft: {
    label: 'Draft',
    icon: FileText,
    description: 'Quote is being prepared',
    className: 'text-charcoal/60',
    destructive: false,
  },
  sent: {
    label: 'Sent',
    icon: Mail,
    description: 'Quote has been sent to client',
    className: 'text-equipment-yellow',
    destructive: false,
  },
  accepted: {
    label: 'Accepted',
    icon: CheckCircle,
    description: 'Client has accepted the quote',
    className: 'text-success-green',
    destructive: false,
  },
  declined: {
    label: 'Declined',
    icon: XCircle,
    description: 'Client has declined the quote',
    className: 'text-error-red',
    destructive: true,
  },
  expired: {
    label: 'Expired',
    icon: AlertTriangle,
    description: 'Quote validity period has ended',
    className: 'text-charcoal/60',
    destructive: true,
  },
  converted: {
    label: 'Converted',
    icon: TrendingUp,
    description: 'Quote has been converted to a project',
    className: 'text-forest-green',
    destructive: false,
  },
} as const;

export function StatusUpdateDropdown({ quote, onStatusUpdate, children }: StatusUpdateDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<QuoteStatus | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const { updateQuoteStatus, isUpdating, error } = useUpdateQuoteStatus();

  const handleStatusSelect = (newStatus: QuoteStatus) => {
    if (newStatus === quote.status) {
      setIsOpen(false);
      return;
    }

    const config = statusConfig[newStatus];
    if (config.destructive) {
      setSelectedStatus(newStatus);
      setShowConfirmDialog(true);
      setIsOpen(false);
    } else {
      handleStatusUpdate(newStatus);
    }
  };

  const handleStatusUpdate = async (newStatus: QuoteStatus) => {
    const result = await updateQuoteStatus(quote.id, newStatus);
    
    if (result.success) {
      onStatusUpdate(quote.id, newStatus);
      setIsOpen(false);
      setShowConfirmDialog(false);
      setSelectedStatus(null);
    }
    // Error handling is managed by the hook and can be displayed in UI if needed
  };

  const handleConfirmStatusUpdate = () => {
    if (selectedStatus) {
      handleStatusUpdate(selectedStatus);
    }
  };

  const currentStatus = quote.status || 'draft';
  const availableStatuses = Object.keys(statusConfig).filter(
    status => status !== currentStatus
  ) as QuoteStatus[];

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          {children}
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="bg-paper-white border-stone-gray shadow-lg min-w-[200px]"
        >
          {availableStatuses.map((status) => {
            const config = statusConfig[status];
            const Icon = config.icon;
            
            return (
              <DropdownMenuItem
                key={status}
                onClick={() => handleStatusSelect(status)}
                className="text-charcoal hover:bg-stone-gray/20 cursor-pointer"
                disabled={isUpdating}
              >
                <Icon className={`w-4 h-4 mr-2 ${config.className}`} />
                <div className="flex flex-col">
                  <span className="font-medium">{config.label}</span>
                  <span className="text-xs text-charcoal/60">{config.description}</span>
                </div>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Confirmation Dialog for Destructive Actions */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="bg-paper-white border-stone-gray max-w-md">
          <DialogHeader>
            <DialogTitle className="text-charcoal">
              Confirm Status Change
            </DialogTitle>
            <DialogDescription className="text-charcoal/70">
              {selectedStatus && (
                <>
                  Are you sure you want to change this quote&apos;s status to{' '}
                  <span className="font-semibold text-charcoal">
                    {statusConfig[selectedStatus].label}
                  </span>
                  ? This action cannot be undone.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {error && (
            <div className="p-3 bg-error-red/10 border border-error-red/20 rounded-lg">
              <p className="text-error-red text-sm">{error}</p>
            </div>
          )}
          
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowConfirmDialog(false);
                setSelectedStatus(null);
              }}
              disabled={isUpdating}
              className="bg-paper-white text-charcoal border-stone-gray hover:bg-stone-gray/20"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmStatusUpdate}
              disabled={isUpdating}
              className="bg-forest-green text-paper-white hover:opacity-90"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Confirm'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}