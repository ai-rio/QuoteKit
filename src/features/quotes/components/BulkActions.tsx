'use client';

import { useState } from 'react';
import { 
  Download,
  Edit,
  Mail,
  Trash2,
  X,
  Crown,
  Lock
} from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { UpgradePrompt, CompactUpgradePrompt } from '@/components/UpgradePrompt';

import { BulkQuoteActions,QuoteStatus } from '../types';

interface BulkActionsProps {
  selectedQuotes: string[];
  onClearSelection: () => void;
  bulkActions: BulkQuoteActions;
}

const statusOptions: Array<{ value: QuoteStatus; label: string }> = [
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'declined', label: 'Declined' },
  { value: 'expired', label: 'Expired' },
  { value: 'converted', label: 'Converted' },
];

export function BulkActions({ 
  selectedQuotes, 
  onClearSelection,
  bulkActions 
}: BulkActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<QuoteStatus | ''>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  // Feature access checks
  const { canAccess, isFreePlan } = useFeatureAccess();
  const bulkAccess = canAccess('bulk_operations');
  const pdfAccess = canAccess('pdf_export');
  const hasBulkAccess = bulkAccess.hasAccess;

  if (selectedQuotes.length === 0) {
    return null;
  }

  // Handle feature-gated actions
  const handleFeatureGatedAction = (action: () => Promise<void>) => {
    if (!hasBulkAccess) {
      setShowUpgradeModal(true);
      return;
    }
    return action();
  };

  const handleStatusUpdate = async () => {
    if (!selectedStatus) return;
    
    if (!hasBulkAccess) {
      setShowUpgradeModal(true);
      return;
    }
    
    setIsLoading(true);
    try {
      await bulkActions.updateStatus(selectedQuotes, selectedStatus);
      onClearSelection();
      setSelectedStatus('');
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!hasBulkAccess) {
      setShowUpgradeModal(true);
      return;
    }
    
    setIsLoading(true);
    try {
      await bulkActions.delete(selectedQuotes);
      onClearSelection();
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Failed to delete quotes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkExport = async () => {
    // PDF export requires both bulk operations AND pdf_export features
    if (!hasBulkAccess || !pdfAccess.hasAccess) {
      setShowUpgradeModal(true);
      return;
    }
    
    setIsLoading(true);
    try {
      await bulkActions.export(selectedQuotes);
    } catch (error) {
      console.error('Failed to export quotes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkEmail = async () => {
    if (!hasBulkAccess) {
      setShowUpgradeModal(true);
      return;
    }
    
    setIsLoading(true);
    try {
      await bulkActions.sendEmails(selectedQuotes);
      onClearSelection();
    } catch (error) {
      console.error('Failed to send emails:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Render premium feature button with tooltip
  const PremiumButton = ({ 
    onClick, 
    icon: Icon, 
    children, 
    requiresPDF = false 
  }: { 
    onClick: () => void
    icon: any
    children: React.ReactNode
    requiresPDF?: boolean
  }) => {
    const hasRequiredAccess = hasBulkAccess && (!requiresPDF || pdfAccess.hasAccess);
    
    if (hasRequiredAccess) {
      return (
        <Button
          size="sm"
          onClick={onClick}
          disabled={isLoading}
          className="bg-forest-green text-white hover:opacity-90 font-bold"
        >
          <Icon className="w-3 h-3 mr-1" />
          {children}
        </Button>
      );
    }

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              onClick={onClick}
              disabled={isLoading}
              variant="outline"
              className="bg-charcoal/10 text-charcoal/60 border-charcoal/20 hover:bg-charcoal/20 cursor-pointer"
            >
              <Lock className="w-3 h-3 mr-1" />
              {children}
              <Crown className="w-3 h-3 ml-1 text-equipment-yellow" />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <div className="space-y-2">
              <p className="font-medium flex items-center gap-2">
                <Crown className="w-4 h-4 text-equipment-yellow" />
                Premium Feature
              </p>
              <p className="text-xs">
                {requiresPDF 
                  ? 'Bulk PDF export requires Premium plan with PDF export enabled.'
                  : 'Bulk operations are available with Premium plans.'
                }
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <>
      <div className="bg-equipment-yellow/20 border border-equipment-yellow/30 rounded-lg p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-charcoal">
                {selectedQuotes.length} quote{selectedQuotes.length !== 1 ? 's' : ''} selected
              </span>
              <Button
                size="sm"
                onClick={onClearSelection}
                className="h-6 w-6 p-0 bg-transparent text-charcoal hover:bg-stone-gray/20 font-bold"
              >
                <X className="w-3 h-3 text-charcoal" />
              </Button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
            {/* Status Update */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
              <Select
                value={selectedStatus}
                onValueChange={(value) => setSelectedStatus(value as QuoteStatus | '')}
                disabled={!hasBulkAccess}
              >
                <SelectTrigger className={`w-full sm:w-[140px] h-10 sm:h-8 bg-light-concrete border-stone-gray text-charcoal focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60 ${!hasBulkAccess ? 'opacity-60' : ''}`}>
                  <SelectValue placeholder="Update status" className="text-charcoal" />
                </SelectTrigger>
                <SelectContent className="bg-paper-white border-stone-gray shadow-lg z-[100]">
                  {statusOptions.map((option) => (
                    <SelectItem 
                      key={option.value} 
                      value={option.value}
                      className="text-charcoal hover:bg-equipment-yellow/20 focus:bg-equipment-yellow/20 focus:text-charcoal"
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <PremiumButton
                onClick={handleStatusUpdate}
                icon={Edit}
              >
                Update
              </PremiumButton>
            </div>

            {/* Send Emails */}
            <PremiumButton
              onClick={handleBulkEmail}
              icon={Mail}
            >
              Send Emails
            </PremiumButton>

            {/* Export PDFs */}
            <PremiumButton
              onClick={handleBulkExport}
              icon={Download}
              requiresPDF={true}
            >
              Export PDFs
            </PremiumButton>

            {/* Delete */}
            <PremiumButton
              onClick={() => setShowDeleteDialog(true)}
              icon={Trash2}
            >
              Delete
            </PremiumButton>
          </div>
        </div>
        
        {/* Free Plan Upgrade Prompt */}
        {!hasBulkAccess && isFreePlan() && (
          <div className="mt-4 pt-4 border-t border-equipment-yellow/30">
            <CompactUpgradePrompt
              feature="Bulk Operations"
              onUpgrade={() => setShowUpgradeModal(true)}
            />
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-paper-white border-stone-gray">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-charcoal">Delete Quotes</AlertDialogTitle>
            <AlertDialogDescription className="text-charcoal/70">
              Are you sure you want to delete {selectedQuotes.length} quote{selectedQuotes.length !== 1 ? 's' : ''}? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              className="bg-equipment-yellow text-charcoal hover:bg-equipment-yellow/90 hover:text-charcoal active:bg-equipment-yellow/80 font-bold border border-stone-gray"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isLoading}
              className="bg-charcoal text-white hover:bg-charcoal/90 disabled:opacity-50"
            >
              {isLoading ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Upgrade Modal */}
      <UpgradePrompt
        feature="Bulk Operations"
        title="Upgrade for Bulk Operations"
        description="Manage multiple quotes at once with bulk operations. Update statuses, send emails, export PDFs, and delete quotes in batches."
        modal={true}
        open={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        benefits={[
          'Bulk status updates for multiple quotes',
          'Send emails to multiple clients at once',
          'Bulk PDF export and download',
          'Mass delete operations',
          'Advanced quote management tools',
          'Time-saving productivity features'
        ]}
      />
    </>
  );
}