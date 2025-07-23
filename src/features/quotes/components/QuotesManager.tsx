'use client';

import { useEffect, useMemo,useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';

import { BulkQuoteActions,Quote, QuoteFilters, QuoteSortOptions } from '../types';
import { updateQuoteStatus, deleteQuotes, createTemplate, updateTemplate, deleteTemplate } from '../actions';

import { BulkActions } from './BulkActions';
import { QuotesFilters } from './QuotesFilters';
import { QuotesTable } from './QuotesTable';
import { QuoteTemplates } from './QuoteTemplates';

interface QuotesManagerProps {
  initialQuotes: Quote[];
}

export function QuotesManager({ initialQuotes }: QuotesManagerProps) {
  const router = useRouter();
  const [quotes, setQuotes] = useState<Quote[]>(initialQuotes);
  const [selectedQuotes, setSelectedQuotes] = useState<string[]>([]);
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
        const response = await updateQuoteStatus(quoteIds, status);
        
        if (response.error) {
          console.error('Failed to update status:', response.error.message);
          toast({
            title: 'Failed to update status',
            description: response.error.message,
            variant: 'destructive',
          });
          return;
        }

        // Update local state
        setQuotes(prev => 
          prev.map(quote => 
            quoteIds.includes(quote.id) ? { ...quote, status } : quote
          )
        );

        toast({
          title: 'Status updated successfully',
          description: `Updated ${response.data?.updated || 0} quotes to ${status}`,
        });
      } catch (error) {
        console.error('Error updating status:', error);
        toast({
          title: 'Failed to update status',
          description: 'Please try again.',
          variant: 'destructive',
        });
      }
    },
    delete: async (quoteIds: string[]) => {
      try {
        const response = await deleteQuotes(quoteIds);
        
        if (response.error) {
          console.error('Failed to delete quotes:', response.error.message);
          toast({
            title: 'Failed to delete quotes',
            description: response.error.message,
            variant: 'destructive',
          });
          return;
        }

        // Update local state
        setQuotes(prev => prev.filter(quote => !quoteIds.includes(quote.id)));

        toast({
          title: 'Quotes deleted successfully',
          description: `Deleted ${response.data?.deleted || 0} quotes`,
          variant: 'destructive',
        });
      } catch (error) {
        console.error('Error deleting quotes:', error);
        toast({
          title: 'Failed to delete quotes',
          description: 'Please try again.',
          variant: 'destructive',
        });
      }
    },
    export: async (quoteIds: string[]) => {
      try {
        // Get the selected quotes
        const quotesToExport = quotes.filter(quote => quoteIds.includes(quote.id));
        
        if (quotesToExport.length === 0) {
          alert('No quotes selected for export.');
          return;
        }

        // Download each quote PDF individually
        for (const quote of quotesToExport) {
          try {
            const response = await fetch(`/api/quotes/${quote.id}/pdf`, {
              method: 'GET',
              headers: {
                'Cache-Control': 'no-cache',
              },
            });

            if (!response.ok) {
              console.error(`Failed to generate PDF for quote ${quote.id}`);
              continue;
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `quote-${quote.client_name.replace(/[^a-zA-Z0-9]/g, '-')}-${quote.id.slice(0, 8)}.pdf`;
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            // Small delay between downloads to avoid overwhelming the browser
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (error) {
            console.error(`Error downloading PDF for quote ${quote.id}:`, error);
          }
        }
        
        alert(`Successfully exported ${quotesToExport.length} quote PDFs.`);
      } catch (error) {
        console.error('Error during bulk export:', error);
        alert('Error occurred during bulk export. Please try again.');
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

  const handleDuplicate = (quote: Quote) => {
    // TODO: Implement quote duplication
    console.log('Duplicate quote:', quote.id);
    alert('Quote duplication functionality will be implemented.');
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

  const clearSelection = () => {
    setSelectedQuotes([]);
  };

  // Template handlers
  const handleCreateTemplate = async (templateName: string, baseQuote: Quote) => {
    try {
      const response = await createTemplate(templateName, baseQuote.id);
      
      if (response.error) {
        console.error('Failed to create template:', response.error.message);
        toast({
          title: 'Failed to create template',
          description: response.error.message,
          variant: 'destructive',
        });
        return;
      }

      // Add the new template to local state
      if (response.data) {
        setQuotes(prev => [...prev, response.data]);
        
        toast({
          title: 'Template created successfully',
          description: `Created template "${templateName}"`,
        });
      }
    } catch (error) {
      console.error('Error creating template:', error);
      toast({
        title: 'Failed to create template',
        description: 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleUseTemplate = (template: Quote) => {
    // Navigate to new quote page with template data pre-filled
    router.push(`/quotes/new?template=${template.id}`);
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      const response = await deleteTemplate(templateId);
      
      if (response.error) {
        console.error('Failed to delete template:', response.error.message);
        toast({
          title: 'Failed to delete template',
          description: response.error.message,
          variant: 'destructive',
        });
        return;
      }

      // Remove the template from local state
      if (response.data?.deleted) {
        setQuotes(prev => prev.filter(quote => quote.id !== templateId));
        
        toast({
          title: 'Template deleted successfully',
          description: 'Template has been removed',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: 'Failed to delete template',
        description: 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateTemplate = async (templateId: string, templateName: string) => {
    try {
      const response = await updateTemplate(templateId, templateName);
      
      if (response.error) {
        console.error('Failed to update template:', response.error.message);
        toast({
          title: 'Failed to update template',
          description: response.error.message,
          variant: 'destructive',
        });
        return;
      }

      // Update the template in local state
      if (response.data) {
        setQuotes(prev => 
          prev.map(quote => 
            quote.id === templateId ? response.data : quote
          )
        );
        
        toast({
          title: 'Template updated successfully',
          description: `Template renamed to "${templateName}"`,
        });
      }
    } catch (error) {
      console.error('Error updating template:', error);
      toast({
        title: 'Failed to update template',
        description: 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-charcoal">My Quotes</h1>
          <p className="text-charcoal/60 mt-1">
            Manage all your quotes and templates in one place
          </p>
        </div>
        <Button 
          onClick={() => router.push('/quotes/new')}
          className="bg-forest-green text-white hover:opacity-90 font-bold"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New Quote
        </Button>
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
    </div>
  );
}