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
                variant="ghost"
                size="sm"
                onClick={onClearSelection}
                className="h-6 w-6 p-0 hover:bg-stone-gray/20"
              >
                <X className="w-3 h-3 text-charcoal" />
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Status Update */}
            <div className="flex items-center space-x-2">
              <Select
                value={selectedStatus}
                onValueChange={(value) => setSelectedStatus(value as QuoteStatus | '')}
              >
                <SelectTrigger className="w-[130px] h-8 bg-light-concrete border-stone-gray text-charcoal focus:border-forest-green focus:ring-forest-green">
                  <SelectValue placeholder="Update status" />
                </SelectTrigger>
                <SelectContent className="bg-paper-white border-stone-gray">
                  {statusOptions.map((option) => (
                    <SelectItem 
                      key={option.value} 
                      value={option.value}
                      className="text-charcoal hover:bg-light-concrete/50"
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
                className="h-8 bg-forest-green text-white hover:opacity-90 disabled:opacity-50"
              >
                <Edit className="w-3 h-3 mr-1" />
                Update
              </Button>
            </div>

            {/* Export */}
            <Button
              size="sm"
              variant="outline"
              onClick={handleBulkExport}
              disabled={isLoading}
              className="h-8 bg-paper-white border-stone-gray text-charcoal hover:bg-stone-gray/20"
            >
              <Download className="w-3 h-3 mr-1" />
              Export
            </Button>

            {/* Delete */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowDeleteDialog(true)}
              disabled={isLoading}
              className="h-8 bg-paper-white border-red-200 text-red-600 hover:bg-red-50"
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
              className="bg-paper-white border-stone-gray text-charcoal hover:bg-stone-gray/20"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isLoading}
              className="bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
            >
              {isLoading ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}