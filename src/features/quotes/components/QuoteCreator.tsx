'use client';

import { HelpCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback,useEffect, useState } from 'react';

// Import survey trigger for post-quote creation feedback
import { QuoteContext } from '@/components/feedback';
import { QuoteSurveyManager } from '@/components/feedback/quote-survey-manager';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from '@/components/ui/use-toast';
import { ClientSelector } from '@/features/clients/components/ClientSelector';
import { ClientOption } from '@/features/clients/types';
import { LineItem } from '@/features/items/types';
import { CompanySettings } from '@/features/settings/types';

import { createQuote, saveDraft } from '../actions';
import { CreateQuoteData, Quote, QuoteLineItem, QuoteStatus,SaveDraftData } from '../types';
import { calculateQuote } from '../utils';
import { EnhancedLineItemsTable } from './EnhancedLineItemsTable';
import { QuoteWorkflowTracker, useWorkflowStepTracking } from './quote-workflow-tracker';
import { QuoteNumbering } from './QuoteNumbering';
import { SaveDraftButton } from './SaveDraftButton';

interface QuoteCreatorProps {
  availableItems: LineItem[];
  defaultSettings: CompanySettings | null;
  initialDraft?: any; // For loading existing drafts
  templateData?: Quote | null; // For loading from templates
}

// Internal component without tracking wrapper
function QuoteCreatorInternal({ 
  availableItems, 
  defaultSettings, 
  initialDraft,
  templateData 
}: QuoteCreatorProps) {
  const router = useRouter();
  
  // Workflow tracking hooks
  const workflowTracking = useWorkflowStepTracking();
  
  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [savedQuoteId, setSavedQuoteId] = useState<string | null>(null);
  const [draftId, setDraftId] = useState<string | null>(initialDraft?.id || null);
  const [status, setStatus] = useState<QuoteStatus>('draft');
  const [quoteNumber, setQuoteNumber] = useState<string>('');
  
  // Client info state - support both new client_id approach and legacy client_name
  const [selectedClient, setSelectedClient] = useState<ClientOption | null>(() => {
    // If we have a client_id, we'll need to load the client data
    // For now, fall back to legacy data if available
    if (initialDraft?.client_name || templateData?.client_name) {
      return {
        id: '', // We don't have the ID for legacy data
        name: initialDraft?.client_name || templateData?.client_name || '',
        email: initialDraft?.client_contact || templateData?.client_contact || null,
        phone: null,
      };
    }
    return null;
  });
  
  // Legacy client info for backward compatibility
  const [clientName, setClientName] = useState(
    initialDraft?.client_name || templateData?.client_name || ''
  );
  const [clientContact, setClientContact] = useState(
    initialDraft?.client_contact || templateData?.client_contact || ''
  );
  
  // Quote line items state - prioritize initialDraft, then templateData, then empty
  const [quoteLineItems, setQuoteLineItems] = useState<QuoteLineItem[]>(() => {
    // Defensive programming: ensure we always get a proper array
    const draftData = initialDraft?.quote_data;
    const templateQuoteData = templateData?.quote_data;
    
    // Check if we have valid array data from draft first
    if (Array.isArray(draftData)) {
      return draftData;
    }
    
    // Then check template data
    if (Array.isArray(templateQuoteData)) {
      return templateQuoteData;
    }
    
    // Fallback to empty array
    return [];
  });
  
  // Tax and markup state - prioritize initialDraft, then templateData, then settings defaults
  const [taxRate, setTaxRate] = useState(
    initialDraft?.tax_rate ?? 
    templateData?.tax_rate ?? 
    defaultSettings?.default_tax_rate ?? 0
  );
  const [markupRate, setMarkupRate] = useState(
    initialDraft?.markup_rate ?? 
    templateData?.markup_rate ?? 
    defaultSettings?.default_markup_rate ?? 0
  );

  // Calculate totals in real-time
  const calculation = calculateQuote(quoteLineItems, taxRate, markupRate);

  // Auto-save functionality
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);

  // Survey trigger state for post-quote creation feedback
  const [quoteCreationStartTime, setQuoteCreationStartTime] = useState<Date | null>(null);
  const [quoteContext, setQuoteContext] = useState<QuoteContext | null>(null);

  // Handle client selection
  const handleClientSelect = (client: ClientOption) => {
    setSelectedClient(client);
    if (client) {
      setClientName(client.name);
      setClientContact(client.email || client.phone || '');
      
      // Track client selection workflow step
      workflowTracking.trackClientSelected({
        clientId: client.id,
        clientName: client.name,
        isNewClient: !client.id, // If no ID, it's a new client
        selectionMethod: 'search', // Could be enhanced to detect actual method
      });
    } else {
      setClientName('');
      setClientContact('');
    }
  };

  // Mark as having unsaved changes when data changes
  useEffect(() => {
    if (!initialDraft && !templateData) return;
    setHasUnsavedChanges(true);
  }, [selectedClient, clientName, clientContact, quoteLineItems, taxRate, markupRate, initialDraft, templateData]);

  // Track quote creation start time when user starts working on the quote
  useEffect(() => {
    if (clientName.trim() && quoteLineItems.length > 0 && !quoteCreationStartTime) {
      setQuoteCreationStartTime(new Date());
      console.log('📊 Quote creation session started');
    }
  }, [clientName, quoteLineItems.length, quoteCreationStartTime]);

  // Show notification when template is loaded
  useEffect(() => {
    if (templateData) {
      toast({
        title: 'Template loaded',
        description: `Using template: ${templateData.template_name || 'Unnamed Template'}`,
      });
    }
  }, [templateData]);

  // Auto-save every 30 seconds if there are unsaved changes
  const autoSave = useCallback(async () => {
    // Only auto-save if we have a client name and some content
    if (!clientName.trim()) return;
    
    // For auto-save, only proceed if there are unsaved changes
    // For manual save, this condition is bypassed
    if (!hasUnsavedChanges) return;
    
    try {
      const draftData: SaveDraftData = {
        id: draftId || undefined,
        client_id: selectedClient?.id || null,
        client_name: clientName,
        client_contact: clientContact || null,
        quote_data: quoteLineItems,
        tax_rate: taxRate,
        markup_rate: markupRate,
      };

      const response = await saveDraft(draftData);
      if (response?.data) {
        setDraftId(response.data.id);
        setHasUnsavedChanges(false);
        setLastSaveTime(new Date());
        console.log('Auto-saved draft:', response.data.id);
        
        // Track successful autosave
        workflowTracking.trackAutosave({
          triggerReason: 'timer',
          dataChanged: ['quote_data', 'pricing'],
          saveSuccess: true,
        });
      } else {
        console.error('Auto-save failed:', response?.error);
        workflowTracking.trackError({
          errorType: 'autosave_failed',
          errorMessage: response?.error?.message || 'Unknown autosave error',
          errorContext: { draftId, clientName, itemCount: quoteLineItems.length },
        });
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
      workflowTracking.trackError({
        errorType: 'autosave_failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown autosave error',
        errorContext: { draftId, clientName, itemCount: quoteLineItems.length },
      });
    }
  }, [hasUnsavedChanges, selectedClient?.id, clientName, clientContact, quoteLineItems, taxRate, markupRate, draftId, workflowTracking]);

  useEffect(() => {
    const interval = setInterval(autoSave, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, [autoSave]);

  // Track pricing configuration changes
  useEffect(() => {
    if (taxRate !== undefined && markupRate !== undefined && quoteLineItems.length > 0) {
      const calculation = calculateQuote(quoteLineItems, taxRate, markupRate);
      const profitMargin = markupRate > 0 ? (markupRate / 100) * calculation.subtotal : 0;
      
      workflowTracking.trackPricingSet({
        taxRate,
        markupRate,
        hasTax: taxRate > 0,
        hasMarkup: markupRate > 0,
        finalTotal: calculation.total,
        profitMargin,
      });
    }
  }, [taxRate, markupRate, quoteLineItems, workflowTracking]);

  // Line item management functions
  function handleAddItem(itemId: string) {
    const item = availableItems.find(i => i.id === itemId);
    if (!item) return;

    // Check if item is already added
    const existingItem = quoteLineItems.find(qi => qi.id === itemId);
    if (existingItem) {
      toast({
        variant: 'destructive',
        description: 'This item is already added to the quote',
      });
      return;
    }

    const newQuoteItem: QuoteLineItem = {
      id: item.id,
      name: item.name,
      unit: item.unit,
      cost: item.cost,
      quantity: 1,
    };

    const isFirstItem = quoteLineItems.length === 0;
    setQuoteLineItems(prev => [...prev, newQuoteItem]);
    setHasUnsavedChanges(true);

    // Track item addition workflow step
    workflowTracking.trackItemAdded({
      itemId: item.id,
      itemName: item.name,
      isFirstItem,
      additionMethod: 'search', // Could be enhanced to detect actual method
      quantity: 1,
      cost: item.cost,
    });
  }

  function handleUpdateItem(itemId: string, field: keyof QuoteLineItem, value: any) {
    // Track quantity changes specifically
    if (field === 'quantity') {
      const currentItem = quoteLineItems.find(item => item.id === itemId);
      if (currentItem) {
        workflowTracking.trackQuantityChanged({
          itemId,
          oldQuantity: currentItem.quantity,
          newQuantity: value,
          changeType: value > currentItem.quantity ? 'increase' : 'decrease',
        });
      }
    }

    setQuoteLineItems(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, [field]: value } : item
      )
    );
    setHasUnsavedChanges(true);
  }

  function handleRemoveItem(itemId: string) {
    setQuoteLineItems(prev => prev.filter(item => item.id !== itemId));
  }

  // Save draft manually
  async function handleSaveDraft() {
    if (!clientName.trim()) {
      toast({
        variant: 'destructive',
        description: 'Client name is required to save draft',
      });
      return;
    }

    try {
      const draftData: SaveDraftData = {
        id: draftId || undefined,
        client_id: selectedClient?.id || null,
        client_name: clientName,
        client_contact: clientContact || null,
        quote_data: quoteLineItems,
        tax_rate: taxRate,
        markup_rate: markupRate,
      };

      const response = await saveDraft(draftData);
      if (response?.data) {
        setDraftId(response.data.id);
        setHasUnsavedChanges(false);
        setLastSaveTime(new Date());
        
        toast({
          description: 'Draft saved successfully',
        });
        
        // Navigate to quotes page to show the saved draft
        setTimeout(() => {
          router.push('/quotes');
        }, 1000);
      } else {
        toast({
          variant: 'destructive',
          description: response?.error?.message || 'Failed to save draft',
        });
      }
    } catch (error) {
      console.error('Manual save failed:', error);
      toast({
        variant: 'destructive',
        description: 'Failed to save draft',
      });
    }
  }

  // Create final quote
  async function handleCreateFinalQuote() {
    // Validation
    if (!clientName.trim()) {
      toast({
        variant: 'destructive',
        description: 'Client name is required',
      });
      return;
    }

    if (quoteLineItems.length === 0) {
      toast({
        variant: 'destructive',
        description: 'At least one line item is required',
      });
      return;
    }

    setIsLoading(true);

    const quoteData: CreateQuoteData = {
      client_id: selectedClient?.id || null,
      client_name: clientName,
      client_contact: clientContact || null,
      quote_data: quoteLineItems,
      tax_rate: taxRate,
      markup_rate: markupRate,
      status: 'sent',
    };

    try {
      const response = await createQuote(quoteData);
      if (response?.error) {
        toast({
          variant: 'destructive',
          description: response.error.message || 'Failed to create quote',
        });
      } else if (response?.data) {
        toast({
          description: 'Quote created successfully',
        });
        setSavedQuoteId(response.data.id);
        setQuoteNumber(response.data.quote_number || '');
        setStatus('sent');
        setHasUnsavedChanges(false);

        // Generate quote context for survey trigger
        const creationDuration = quoteCreationStartTime 
          ? Math.round((new Date().getTime() - quoteCreationStartTime.getTime()) / 1000)
          : undefined;

        // Determine quote complexity based on item count and value
        const complexity: 'simple' | 'complex' = 
          quoteLineItems.length >= 5 || calculation.total >= 5000 ? 'complex' : 'simple';

        // Determine quote type based on items (simplified logic)
        const quoteType: 'service' | 'product' | 'mixed' = 
          quoteLineItems.length === 1 ? 'service' : 
          quoteLineItems.length <= 3 ? 'product' : 'mixed';

        // Determine if client is new (simplified - assumes no client_id means new)
        const clientType: 'new' | 'existing' = selectedClient?.id ? 'existing' : 'new';

        const newQuoteContext: QuoteContext = {
          quoteId: response.data.id,
          quoteValue: calculation.total,
          itemCount: quoteLineItems.length,
          complexity,
          quoteType,
          creationDuration,
          clientType,
          isFromTemplate: !!templateData,
          templateName: templateData?.template_name || undefined,
        };

        setQuoteContext(newQuoteContext);
        console.log('📊 Quote context generated for survey trigger:', newQuoteContext);
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        description: 'Failed to create quote',
      });
    }

    setIsLoading(false);
  }

  const canSave = clientName.trim() && quoteLineItems.length > 0;

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
      {/* Quote Header */}
      <Card className="bg-paper-white border-stone-gray shadow-sm" data-testid="quote-header" data-tour="quote-details">
        <CardHeader className="pb-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CardTitle className="text-xl sm:text-2xl font-bold text-charcoal">
                {status === 'draft' ? 'New Quote' : 'Quote Details'}
                {templateData && (
                  <span className="text-sm font-normal text-charcoal/60 block">
                    From template: {templateData.template_name || 'Unnamed Template'}
                  </span>
                )}
              </CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="w-4 h-4 text-charcoal/40 hover:text-charcoal/60 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-charcoal text-paper-white border-charcoal max-w-xs">
                    <p className="text-xs">
                      Create professional quotes step by step: 1) Select client, 2) Add items, 3) Set tax/markup, 4) Generate PDF. 
                      Quotes are automatically numbered when finalized.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <QuoteNumbering 
                  quoteNumber={quoteNumber}
                  status={status}
                />
                {status !== 'draft' && (
                  <Badge 
                    variant="default"
                    className="bg-forest-green text-white w-fit"
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Badge>
                )}
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2" data-testid="save-send-actions" data-tour="save-send-actions">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <SaveDraftButton 
                          onSave={handleSaveDraft}
                          hasUnsavedChanges={hasUnsavedChanges}
                          lastSaveTime={lastSaveTime}
                          disabled={!clientName.trim()}
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-charcoal text-paper-white border-charcoal max-w-xs">
                      <p className="text-xs">
                        Save your work as a draft to continue later. Auto-saves every 30 seconds when client is selected. 
                        Drafts can be found in your quotes list.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={handleCreateFinalQuote}
                        disabled={!canSave || isLoading}
                        className="bg-forest-green text-white hover:opacity-90 active:opacity-80 font-bold min-h-[44px] touch-manipulation"
                      >
                        {isLoading ? 'Creating...' : 'Generate PDF'}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-charcoal text-paper-white border-charcoal max-w-xs">
                      <p className="text-xs">
                        Create final quote PDF for client. Requires client selection and at least one item. 
                        Quote will be marked as &quot;sent&quot; and assigned a number.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Client Details */}
      <Card className="bg-paper-white border-stone-gray shadow-sm">
        <CardHeader className="pb-3 sm:pb-4">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base sm:text-lg font-bold text-charcoal">Client Details</CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="w-4 h-4 text-charcoal/40 hover:text-charcoal/60 cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-charcoal text-paper-white border-charcoal max-w-xs">
                  <p className="text-xs">
                    Select a client to start your quote. Client information appears on the final PDF and is required for saving drafts. 
                    You can search existing clients or add new ones from the client management page.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6" data-testid="client-selector" data-tour="client-selector">
          <ClientSelector
            selectedClient={selectedClient}
            onClientSelect={handleClientSelect}
            placeholder="Select or search for a client..."
            className="min-h-[44px] touch-manipulation"
          />
        </CardContent>
      </Card>

      {/* Line Items Section */}
      <Card className="bg-paper-white border-stone-gray shadow-sm" data-testid="line-items-card" data-tour="add-items">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-base sm:text-lg font-bold text-charcoal">Line Items</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6" data-testid="line-items-table" data-tour="line-items-table">
          <EnhancedLineItemsTable
            availableItems={availableItems}
            quoteLineItems={quoteLineItems}
            onAddItem={handleAddItem}
            onUpdateItem={handleUpdateItem}
            onRemoveItem={handleRemoveItem}
          />
        </CardContent>
      </Card>

      {/* Quote Summary */}
      <Card className="bg-paper-white border-stone-gray shadow-sm">
        <CardHeader className="pb-3 sm:pb-4">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base sm:text-lg font-bold text-charcoal">Quote Summary</CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="w-4 h-4 text-charcoal/40 hover:text-charcoal/60 cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-charcoal text-paper-white border-charcoal max-w-xs">
                  <p className="text-xs">
                    Set your tax and markup rates to calculate the final quote total. All calculations update automatically as you make changes.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-4">
            {/* Tax and Markup Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4" data-testid="financial-settings" data-tour="financial-settings">
              <div className="space-y-1.5 sm:space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="tax-rate" className="text-sm font-medium text-charcoal">Tax Rate (%)</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="w-3 h-3 text-charcoal/40 hover:text-charcoal/60 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="bg-charcoal text-paper-white border-charcoal max-w-xs">
                        <p className="text-xs">
                          Enter tax percentage (e.g., 8.25 for 8.25%). This will be added to your subtotal. 
                          Check local tax requirements for your area.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="tax-rate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={taxRate}
                  onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                  className="border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green font-mono placeholder:text-charcoal/60 min-h-[44px] touch-manipulation"
                  data-testid="tax-rate-input"
                  data-tour="tax-rate-input"
                />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="markup-rate" className="text-sm font-medium text-charcoal">Markup Rate (%)</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="w-3 h-3 text-charcoal/40 hover:text-charcoal/60 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="bg-charcoal text-paper-white border-charcoal max-w-xs">
                        <p className="text-xs">
                          Your profit margin percentage (e.g., 20 for 20% markup). This covers overhead, profit, and business expenses. 
                          Typical ranges: 15-30% for services, 20-50% for products.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="markup-rate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1000"
                  value={markupRate}
                  onChange={(e) => setMarkupRate(parseFloat(e.target.value) || 0)}
                  className="border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green font-mono placeholder:text-charcoal/60 min-h-[44px] touch-manipulation"
                  data-testid="markup-rate-input"
                  data-tour="markup-rate-input"
                />
              </div>
            </div>

            {/* Calculation Display */}
            <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t-2 border-stone-gray" data-testid="quote-totals" data-tour="quote-totals">
              <div className="flex justify-end">
                <div className="w-full sm:w-2/3 md:w-1/3 space-y-2 sm:space-y-3">
                  <div className="flex justify-between text-base sm:text-lg">
                    <span className="font-bold">Subtotal</span>
                    <span className="font-mono text-charcoal">${calculation.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base sm:text-lg">
                    <span className="font-bold">Tax ({taxRate}%)</span>
                    <span className="font-mono text-charcoal">${calculation.taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base sm:text-lg">
                    <span className="font-bold">Markup ({markupRate}%)</span>
                    <span className="font-mono text-charcoal">${calculation.markupAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xl sm:text-2xl font-bold text-forest-green pt-2 border-t border-stone-gray">
                    <div className="flex items-center gap-2">
                      <span>Total</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="w-4 h-4 text-forest-green/60 hover:text-forest-green cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="left" className="bg-charcoal text-paper-white border-charcoal max-w-xs">
                            <p className="text-xs">
                              Final quote total: Subtotal + Tax + Markup. Updates automatically as you change items, quantities, tax, or markup rates.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <span className="font-mono text-forest-green">${calculation.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Auto-save status */}
      {lastSaveTime && (
        <Alert className="text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <AlertDescription>
              Last saved: {lastSaveTime.toLocaleTimeString()}
              {hasUnsavedChanges && ' (unsaved changes)'}
            </AlertDescription>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="w-3 h-3 text-charcoal/40 hover:text-charcoal/60 cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-charcoal text-paper-white border-charcoal max-w-xs">
                  <p className="text-xs">
                    Your quote automatically saves every 30 seconds when you have a client selected. 
                    You can also manually save using the Save Draft button.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </Alert>
      )}

      {/* PDF Generation (shown after quote is saved) */}
      {savedQuoteId && (
        <Card>
          <CardContent className="p-4 sm:p-6">
            <Button
              onClick={() => window.open(`/api/quotes/${savedQuoteId}/pdf`, '_blank')}
              className="w-full bg-forest-green text-white hover:opacity-90 active:opacity-80 font-bold min-h-[44px] touch-manipulation"
            >
              Download PDF
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Survey Manager for Post-Quote Creation Feedback */}
      {quoteContext && (
        <QuoteSurveyManager
          quoteContext={quoteContext}
          onSurveyTriggered={(surveyType, context) => {
            console.log(`📋 ${surveyType} survey triggered for quote:`, context.quoteId);
          }}
        />
      )}
    </div>
  );
}

// Main export with workflow tracking wrapper
export function QuoteCreator(props: QuoteCreatorProps) {
  return (
    <QuoteWorkflowTracker
      mode="create"
      templateId={props.templateData?.id}
      draftId={props.initialDraft?.id}
      onWorkflowComplete={(sessionData) => {
        console.log('Quote workflow completed:', sessionData);
      }}
      onWorkflowAbandoned={(reason, sessionData) => {
        console.log('Quote workflow abandoned:', reason, sessionData);
      }}
    >
      <QuoteCreatorInternal {...props} />
    </QuoteWorkflowTracker>
  );
}