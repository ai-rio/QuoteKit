'use client';

import { useState } from 'react';
import { 
  Download,
  Edit,
  Trash2,
  X
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

  if (selectedQuotes.length === 0) {
    return null;
  }

  const handleStatusUpdate = async () => {
    if (!selectedStatus) return;
    
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
    setIsLoading(true);
    try {
      await bulkActions.export(selectedQuotes);
    } catch (error) {
      console.error('Failed to export quotes:', error);
    } finally {
      setIsLoading(false);
    }
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
              >
                <SelectTrigger className="w-full sm:w-[140px] h-10 sm:h-8 bg-light-concrete border-stone-gray text-charcoal focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60">
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
              
              <Button
                size="sm"
                onClick={handleStatusUpdate}
                disabled={!selectedStatus || isLoading}
                className="h-10 sm:h-8 w-full sm:w-auto bg-forest-green text-white hover:opacity-90 disabled:opacity-50"
              >
                <Edit className="w-3 h-3 mr-1" />
                Update
              </Button>
            </div>

            {/* Export */}
            <Button
              size="sm"
              onClick={handleBulkExport}
              disabled={isLoading}
              className="h-10 sm:h-8 w-full sm:w-auto bg-equipment-yellow text-charcoal hover:bg-equipment-yellow/90 hover:text-charcoal active:bg-equipment-yellow/80 font-bold disabled:opacity-50"
            >
              <Download className="w-3 h-3 mr-1" />
              Export
            </Button>

            {/* Delete */}
            <Button
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              disabled={isLoading}
              className="h-10 sm:h-8 w-full sm:w-auto bg-stone-gray text-charcoal hover:bg-stone-gray/80 active:bg-stone-gray/70 font-bold border border-stone-gray disabled:opacity-50"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Delete
            </Button>
          </div>
        </div>
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
    </>
  );
}