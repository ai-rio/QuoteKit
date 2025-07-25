'use client';

import { useCallback,useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { ClientSelector } from '@/features/clients/components/ClientSelector';
import { ClientOption } from '@/features/clients/types';
import { LineItem } from '@/features/items/types';
import { CompanySettings } from '@/features/settings/types';

import { createQuote, saveDraft } from '../actions';
import { CreateQuoteData, Quote, QuoteLineItem, QuoteStatus,SaveDraftData } from '../types';
import { calculateQuote } from '../utils';

import { EnhancedLineItemsTable } from './EnhancedLineItemsTable';
import { QuoteNumbering } from './QuoteNumbering';
import { SaveDraftButton } from './SaveDraftButton';

interface QuoteCreatorProps {
  availableItems: LineItem[];
  defaultSettings: CompanySettings | null;
  initialDraft?: any; // For loading existing drafts
  templateData?: Quote | null; // For loading from templates
}

export function QuoteCreator({ 
  availableItems, 
  defaultSettings, 
  initialDraft,
  templateData 
}: QuoteCreatorProps) {
  const router = useRouter();
  
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
  const [quoteLineItems, setQuoteLineItems] = useState<QuoteLineItem[]>(
    initialDraft?.quote_data || templateData?.quote_data || []
  );
  
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

  // Handle client selection
  const handleClientSelect = (client: ClientOption) => {
    setSelectedClient(client);
    if (client) {
      setClientName(client.name);
      setClientContact(client.email || client.phone || '');
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
    if (!hasUnsavedChanges || !clientName.trim()) return;
    
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
      } else {
        console.error('Auto-save failed:', response?.error);
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }, [hasUnsavedChanges, selectedClient?.id, clientName, clientContact, quoteLineItems, taxRate, markupRate, draftId]);

  useEffect(() => {
    const interval = setInterval(autoSave, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, [autoSave]);

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

    setQuoteLineItems(prev => [...prev, newQuoteItem]);
  }

  function handleUpdateItem(itemId: string, field: keyof QuoteLineItem, value: any) {
    setQuoteLineItems(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, [field]: value } : item
      )
    );
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

    await autoSave();
    toast({
      description: 'Draft saved successfully',
    });
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
      <Card className="bg-paper-white border-stone-gray shadow-sm">
        <CardHeader className="pb-4">
          <div className="space-y-3">
            <CardTitle className="text-xl sm:text-2xl font-bold text-charcoal">
              {status === 'draft' ? 'New Quote' : 'Quote Details'}
              {templateData && (
                <span className="text-sm font-normal text-charcoal/60 block">
                  From template: {templateData.template_name || 'Unnamed Template'}
                </span>
              )}
            </CardTitle>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <QuoteNumbering 
                  quoteNumber={quoteNumber}
                  status={status}
                />
                <Badge 
                  variant={status === 'draft' ? 'secondary' : 'default'}
                  className={status === 'draft' ? 'bg-equipment-yellow/20 text-charcoal w-fit' : 'bg-forest-green text-white w-fit'}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Badge>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2">
                <SaveDraftButton 
                  onSave={handleSaveDraft}
                  hasUnsavedChanges={hasUnsavedChanges}
                  lastSaveTime={lastSaveTime}
                  disabled={!clientName.trim()}
                />
                <Button
                  onClick={handleCreateFinalQuote}
                  disabled={!canSave || isLoading}
                  className="bg-forest-green text-white hover:opacity-90 active:opacity-80 font-bold min-h-[44px] touch-manipulation"
                >
                  {isLoading ? 'Creating...' : 'Generate PDF'}
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Client Details */}
      <Card className="bg-paper-white border-stone-gray shadow-sm">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-base sm:text-lg font-bold text-charcoal">Client Details</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <ClientSelector
            selectedClient={selectedClient}
            onClientSelect={handleClientSelect}
            placeholder="Select or search for a client..."
            className="min-h-[44px] touch-manipulation"
          />
        </CardContent>
      </Card>

      {/* Line Items Section */}
      <Card className="bg-paper-white border-stone-gray shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 pb-3 sm:pb-4">
          <CardTitle className="text-base sm:text-lg font-bold text-charcoal">Line Items</CardTitle>
          <Button
            variant="default"
            className="bg-equipment-yellow text-charcoal hover:bg-equipment-yellow/90 hover:text-charcoal active:bg-equipment-yellow/80 font-bold min-h-[44px] touch-manipulation w-full sm:w-auto"
            onClick={() => {
              // TODO: Open item selector dialog
              console.log('Opening item selector');
            }}
          >
            Add Item
          </Button>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
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
          <CardTitle className="text-base sm:text-lg font-bold text-charcoal">Quote Summary</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-4">
            {/* Tax and Markup Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="tax-rate" className="text-sm font-medium text-charcoal">Tax Rate (%)</Label>
                <Input
                  id="tax-rate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={taxRate}
                  onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                  className="border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green font-mono placeholder:text-charcoal/60 min-h-[44px] touch-manipulation"
                />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="markup-rate" className="text-sm font-medium text-charcoal">Markup Rate (%)</Label>
                <Input
                  id="markup-rate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1000"
                  value={markupRate}
                  onChange={(e) => setMarkupRate(parseFloat(e.target.value) || 0)}
                  className="border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green font-mono placeholder:text-charcoal/60 min-h-[44px] touch-manipulation"
                />
              </div>
            </div>

            {/* Calculation Display */}
            <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t-2 border-stone-gray">
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
                    <span>Total</span>
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
          <AlertDescription>
            Last saved: {lastSaveTime.toLocaleTimeString()}
            {hasUnsavedChanges && ' (unsaved changes)'}
          </AlertDescription>
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
    </div>
  );
}