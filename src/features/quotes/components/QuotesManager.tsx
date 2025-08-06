'use client';

import { Crown, Plus, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CompactUpgradePrompt,UpgradePrompt } from '@/components/UpgradePrompt';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';

import { createTemplate, deleteQuotes, deleteTemplate, getAllQuotes,updateTemplate } from '../actions';
import { sendBulkQuoteEmails } from '../email-actions';
import { useDuplicateQuote } from '../hooks/useDuplicateQuote';
import { BulkQuoteActions, Quote, QuoteFilters, QuoteSortOptions, QuoteStatus } from '../types';
import { BulkActions } from './BulkActions';
import { CreateQuoteButton } from './CreateQuoteButton';
import { DeleteConfirmationDialog } from './DeleteConfirmationDialog';
import { QuotesFilters } from './QuotesFilters';
import { QuotesTable } from './QuotesTable';
import { QuoteTemplates } from './QuoteTemplates';

interface QuotesManagerProps {
  initialQuotes: Quote[];
}

export function QuotesManager({ initialQuotes }: QuotesManagerProps) {
  const router = useRouter();
  const [quotes, setQuotes] = useState<Quote[]>(initialQuotes);
  const { duplicate, isDuplicating } = useDuplicateQuote();
  const { canAccess, getUsagePercentage, isFreePlan } = useFeatureAccess();
  
  const [selectedQuotes, setSelectedQuotes] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [quoteToDelete, setQuoteToDelete] = useState<Quote | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filters, setFilters] = useState<QuoteFilters>({
    status: 'all',
    client: '',
    searchTerm: '',
    dateRange: { from: null, to: null }
  });
  const [sortOptions, setSortOptions] = useState<QuoteSortOptions>({
    field: 'created_at',
    direction: 'desc'
  });

  // Refresh quotes from database using server action
  const refreshQuotes = async () => {
    setIsRefreshing(true);
    try {
      const response = await getAllQuotes();
      
      if (response?.error) {
        console.error('Error refreshing quotes:', response?.error?.message);
        // Silently fail - don't disrupt user experience for refresh failures
        // The user can still see their initial quotes and use the manual refresh button
      } else if (response?.data) {
        setQuotes(response?.data || []);
        console.log('✅ Refreshed quotes successfully:', response?.data?.length || 0);
      }
    } catch (err) {
      console.error('Error refreshing quotes:', (err as Error)?.message || 'Unknown error');
      // Silently fail - don't disrupt user experience for refresh failures
    } finally {
      setIsRefreshing(false);
    }
  };

  // Auto-refresh when component mounts, but only if we have no quotes or very few
  useEffect(() => {
    // Only refresh if we have no quotes (likely stale data)
    if (quotes.length === 0) {
      refreshQuotes();
    }
  }, []);

  // Separate templates from regular quotes
  const templates = useMemo(() => {
    return quotes.filter(quote => quote.is_template);
  }, [quotes]);

  const regularQuotes = useMemo(() => {
    return quotes.filter(quote => !quote.is_template);
  }, [quotes]);

  // Filter and sort quotes (exclude templates from main list)
  const filteredAndSortedQuotes = useMemo(() => {
    let filtered = regularQuotes;

    // Apply filters
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(quote => (quote.status || 'draft') === filters.status);
    }

    if (filters.client) {
      filtered = filtered.filter(quote => 
        quote.client_name.toLowerCase().includes(filters.client!.toLowerCase())
      );
    }

    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(quote => 
        quote.client_name.toLowerCase().includes(searchLower) ||
        quote.client_contact?.toLowerCase().includes(searchLower) ||
        (quote.quote_number && quote.quote_number.toLowerCase().includes(searchLower)) ||
        quote.id.toLowerCase().includes(searchLower)
      );
    }

    if (filters.dateRange?.from || filters.dateRange?.to) {
      filtered = filtered.filter(quote => {
        const quoteDate = new Date(quote.created_at);
        const fromDate = filters.dateRange?.from;
        const toDate = filters.dateRange?.to;

        if (fromDate && quoteDate < fromDate) return false;
        if (toDate && quoteDate > toDate) return false;
        return true;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortOptions.field) {
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case 'client_name':
          aValue = a.client_name.toLowerCase();
          bValue = b.client_name.toLowerCase();
          break;
        case 'total':
          aValue = a.total;
          bValue = b.total;
          break;
        case 'status':
          aValue = a.status || 'draft';
          bValue = b.status || 'draft';
          break;
        case 'quote_number':
          aValue = a.quote_number || a.id;
          bValue = b.quote_number || b.id;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOptions.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOptions.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [regularQuotes, filters, sortOptions]);

  // Get unique clients for filter dropdown
  const uniqueClients = useMemo(() => {
    const clients = regularQuotes.map(quote => quote.client_name);
    return [...new Set(clients)].sort();
  }, [regularQuotes]);

  // Bulk actions implementation
  const bulkActions: BulkQuoteActions = {
    updateStatus: async (quoteIds: string[], status) => {
      try {
        const response = await fetch('/api/quotes/bulk-status', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ quoteIds, status }),
        });

        const result = await response.json();

        if (!response.ok) {
          if (result.upgradeRequired) {
            setShowUpgradeModal(true);
            return;
          }
          throw new Error(result.message || result.error || 'Failed to update statuses');
        }

        // Update local state with server response
        if (result.updatedQuotes) {
          setQuotes(prev => 
            prev.map(quote => {
              const updated = result.updatedQuotes.find((u: any) => u.id === quote.id);
              return updated ? { ...quote, ...updated } : quote;
            })
          );
        }

        const successMsg = `Successfully updated ${result.updatedCount} quote${result.updatedCount === 1 ? '' : 's'} to ${status}`;
        alert(successMsg);
        
      } catch (error) {
        console.error('Error updating quote statuses:', error);
        alert(`Failed to update statuses: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
    delete: async (quoteIds: string[]) => {
      try {
        const result = await deleteQuotes(quoteIds);
        
        if (result?.error) {
          alert(`Failed to delete quotes: ${result.error.message || 'Unknown error'}`);
          return;
        }
        
        // Remove deleted quotes from local state
        setQuotes(prev => prev.filter(quote => !quoteIds.includes(quote.id)));
        
        // Clear selection after successful deletion
        setSelectedQuotes([]);
        
        const deletedCount = result?.data?.deleted || quoteIds.length;
        alert(`Successfully deleted ${deletedCount} quote${deletedCount === 1 ? '' : 's'}.`);
      } catch (error) {
        console.error('Error deleting quotes:', error);
        alert('An unexpected error occurred while deleting quotes.');
      }
    },
    export: async (quoteIds: string[]) => {
      try {
        const response = await fetch('/api/quotes/bulk-export', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ quoteIds }),
        });

        if (!response.ok) {
          const result = await response.json();
          if (result.upgradeRequired) {
            setShowUpgradeModal(true);
            return;
          }
          throw new Error(result.message || result.error || 'Failed to export quotes');
        }

        // Download the ZIP file
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `quotes-export-${Date.now()}.zip`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        alert(`Successfully exported ${quoteIds.length} quotes as ZIP file.`);
      } catch (error) {
        console.error('Error during bulk export:', error);
        alert(`Failed to export quotes: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
    sendEmails: async (quoteIds: string[]) => {
      try {
        console.log('Sending emails for quotes:', quoteIds);
        
        // Use the bulk email sending function
        const result = await sendBulkQuoteEmails(quoteIds);
        
        if (result.success) {
          const successCount = result.results.filter(r => r.success).length;
          const failCount = result.results.filter(r => !r.success).length;
          
          if (failCount === 0) {
            alert(`Successfully sent emails for all ${successCount} quotes.`);
          } else {
            alert(`Sent emails for ${successCount} quotes. ${failCount} failed to send.`);
            console.error('Failed emails:', result.results.filter(r => !r.success));
          }
          
          // Update the quotes status to 'sent' for successful emails
          const successfulQuoteIds = result.results
            .filter(r => r.success)
            .map(r => r.quoteId);
          
          if (successfulQuoteIds.length > 0) {
            setQuotes(prev => 
              prev.map(quote => 
                successfulQuoteIds.includes(quote.id) 
                  ? { ...quote, status: 'sent' as const, sent_at: new Date().toISOString() }
                  : quote
              )
            );
          }
        } else {
          alert('Failed to send emails. Please try again.');
          console.error('Bulk email error:', result);
        }
      } catch (error) {
        console.error('Error sending bulk emails:', error);
        alert('Error occurred while sending emails. Please try again.');
      }
    }
  };

  const handleQuoteSelect = (quoteId: string) => {
    setSelectedQuotes(prev => 
      prev.includes(quoteId) 
        ? prev.filter(id => id !== quoteId)
        : [...prev, quoteId]
    );
  };

  const handleSelectAll = () => {
    setSelectedQuotes(
      selectedQuotes.length === filteredAndSortedQuotes.length 
        ? [] 
        : filteredAndSortedQuotes.map(quote => quote.id)
    );
  };

  const handleSort = (field: QuoteSortOptions['field']) => {
    setSortOptions(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleView = (quote: Quote) => {
    router.push(`/quotes/${quote.id}`);
  };

  const handleEdit = (quote: Quote) => {
    router.push(`/quotes/${quote.id}/edit`);
  };

  const handleDuplicate = async (quote: Quote) => {
    try {
      const result = await duplicate(quote.id);
      
      if (result.success && result.quote) {
        // Optimistically add the duplicated quote to the list
        setQuotes(prev => [result.quote!, ...prev]);
        
        // Navigate to edit the new duplicate
        router.push(`/quotes/${result.quote.id}/edit`);
      } else {
        // Show error message - using alert for now, could be replaced with toast
        alert(`Failed to duplicate quote: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error duplicating quote:', error);
      alert('An unexpected error occurred while duplicating the quote.');
    }
  };

  const handleDownload = async (quote: Quote) => {
    try {
      // Call the PDF generation API
      const response = await fetch(`/api/quotes/${quote.id}/pdf`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate PDF');
      }

      // Get the PDF blob
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `quote-${quote.client_name.replace(/[^a-zA-Z0-9]/g, '-')}-${quote.id.slice(0, 8)}.pdf`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error downloading PDF:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to download PDF';
      alert(`Error: ${errorMessage}`);
    }
  };

  const handleStatusUpdate = (quoteId: string, newStatus: QuoteStatus) => {
    // Optimistically update the quote status in the local state
    setQuotes(prev => 
      prev.map(quote => 
        quote.id === quoteId 
          ? { 
              ...quote, 
              status: newStatus, 
              updated_at: new Date().toISOString(),
              // Set sent_at timestamp if status is sent
              ...(newStatus === 'sent' && { sent_at: new Date().toISOString() })
            } 
          : quote
      )
    );
  };

  const handleDelete = (quote: Quote) => {
    setQuoteToDelete(quote);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!quoteToDelete) return;

    setIsDeleting(true);
    try {
      const result = await deleteQuotes([quoteToDelete.id]);
      
      if (result?.error) {
        alert(`Failed to delete quote: ${result.error.message || 'Unknown error'}`);
      } else {
        // Remove the quote from the local state
        setQuotes(prev => prev.filter(quote => quote.id !== quoteToDelete.id));
        setDeleteDialogOpen(false);
        setQuoteToDelete(null);
      }
    } catch (error) {
      console.error('Error deleting quote:', error);
      alert('An unexpected error occurred while deleting the quote.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCloseDeleteDialog = () => {
    if (!isDeleting) {
      setDeleteDialogOpen(false);
      setQuoteToDelete(null);
    }
  };

  const clearSelection = () => {
    setSelectedQuotes([]);
  };

  // Template handlers
  const handleCreateTemplate = async (templateName: string, baseQuote: Quote) => {
    try {
      const result = await createTemplate(templateName, baseQuote.id);
      
      if (result?.error) {
        alert(`Failed to create template: ${result.error.message || 'Unknown error'}`);
        return;
      }
      
      if (result?.data) {
        // Add the new template to the local state
        setQuotes(prev => [result.data!, ...prev]);
        alert(`Template "${templateName}" created successfully!`);
      }
    } catch (error) {
      console.error('Error creating template:', error);
      alert('An unexpected error occurred while creating the template.');
    }
  };

  const handleUseTemplate = (template: Quote) => {
    // Navigate to new quote page with template data pre-filled
    router.push(`/quotes/new?template=${template.id}`);
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      const result = await deleteTemplate(templateId);
      
      if (result?.error) {
        alert(`Failed to delete template: ${result.error.message || 'Unknown error'}`);
        return;
      }
      
      if (result?.data?.deleted) {
        // Remove the template from the local state
        setQuotes(prev => prev.filter(quote => quote.id !== templateId));
        alert('Template deleted successfully!');
      } else {
        alert('Template not found or could not be deleted.');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('An unexpected error occurred while deleting the template.');
    }
  };

  const handleUpdateTemplate = async (templateId: string, templateName: string) => {
    try {
      const result = await updateTemplate(templateId, templateName);
      
      if (result?.error) {
        alert(`Failed to update template: ${result.error.message || 'Unknown error'}`);
        return;
      }
      
      if (result?.data) {
        // Update the template in the local state
        setQuotes(prev => 
          prev.map(quote => 
            quote.id === templateId 
              ? { ...quote, template_name: templateName }
              : quote
          )
        );
        alert(`Template renamed to "${templateName}" successfully!`);
      }
    } catch (error) {
      console.error('Error updating template:', error);
      alert('An unexpected error occurred while updating the template.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-charcoal">My Quotes</h1>
          <p className="text-charcoal/60 mt-1">
            Manage all your quotes and templates in one place
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={refreshQuotes}
            disabled={isRefreshing}
            className={`
              ${isRefreshing 
                ? 'bg-paper-white text-stone-gray border-2 border-stone-gray cursor-not-allowed' 
                : 'bg-paper-white text-forest-green border-2 border-forest-green hover:bg-forest-green hover:text-paper-white'
              } 
              font-bold px-6 py-3 rounded-lg transition-all duration-200
            `}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <CreateQuoteButton />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="quotes" className="space-y-6">
        <TabsList className="bg-light-concrete border border-stone-gray">
          <TabsTrigger 
            value="quotes" 
            className="data-[state=active]:bg-paper-white data-[state=active]:text-charcoal text-charcoal/60"
          >
            All Quotes ({regularQuotes.length})
          </TabsTrigger>
          <TabsTrigger 
            value="templates"
            className="data-[state=active]:bg-paper-white data-[state=active]:text-charcoal text-charcoal/60"
          >
            Templates ({templates.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="quotes" className="space-y-6">
          {/* Filters */}
          <QuotesFilters
            filters={filters}
            onFiltersChange={setFilters}
            uniqueClients={uniqueClients}
          />

          {/* Bulk Actions */}
          <BulkActions
            selectedQuotes={selectedQuotes}
            onClearSelection={clearSelection}
            bulkActions={bulkActions}
          />

          {/* Quotes Table */}
          <QuotesTable
            quotes={filteredAndSortedQuotes}
            selectedQuotes={selectedQuotes}
            onQuoteSelect={handleQuoteSelect}
            onSelectAll={handleSelectAll}
            sortOptions={sortOptions}
            onSort={handleSort}
            onView={handleView}
            onEdit={handleEdit}
            onDuplicate={handleDuplicate}
            onDownload={handleDownload}
            onStatusUpdate={handleStatusUpdate}
            onDelete={handleDelete}
          />

          {/* Results Summary */}
          <div className="text-sm text-charcoal/60 text-center">
            Showing {filteredAndSortedQuotes.length} of {regularQuotes.length} quotes
          </div>
        </TabsContent>

        <TabsContent value="templates">
          <QuoteTemplates
            templates={templates}
            regularQuotes={regularQuotes}
            onCreateTemplate={handleCreateTemplate}
            onUseTemplate={handleUseTemplate}
            onDeleteTemplate={handleDeleteTemplate}
            onUpdateTemplate={handleUpdateTemplate}
          />
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
        quotes={quoteToDelete ? [quoteToDelete] : []}
        isBulkDelete={false}
      />
    </div>
  );
}