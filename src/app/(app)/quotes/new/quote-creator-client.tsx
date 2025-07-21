'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';
import { LineItem } from '@/features/items/types';
import { calculateQuote, createQuote } from '@/features/quotes/actions';
import { ClientInfoForm } from '@/features/quotes/components/client-info-form';
import { LineItemsTable } from '@/features/quotes/components/line-items-table';
import { PDFGenerator } from '@/features/quotes/components/pdf-generator';
import { QuoteSummary } from '@/features/quotes/components/quote-summary';
import { CreateQuoteData, QuoteLineItem } from '@/features/quotes/types';
import { CompanySettings } from '@/features/settings/types';

interface QuoteCreatorClientProps {
  availableItems: LineItem[];
  defaultSettings: CompanySettings | null;
}

export function QuoteCreatorClient({ availableItems, defaultSettings }: QuoteCreatorClientProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [savedQuoteId, setSavedQuoteId] = useState<string | null>(null);
  
  // Client info state
  const [clientName, setClientName] = useState('');
  const [clientContact, setClientContact] = useState('');
  
  // Quote line items state
  const [quoteLineItems, setQuoteLineItems] = useState<QuoteLineItem[]>([]);
  
  // Tax and markup state (start with defaults from settings)
  const [taxRate, setTaxRate] = useState(defaultSettings?.default_tax_rate || 0);
  const [markupRate, setMarkupRate] = useState(defaultSettings?.default_markup_rate || 0);

  // Calculate totals in real-time
  const calculation = calculateQuote(quoteLineItems, taxRate, markupRate);

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

  function handleUpdateQuantity(itemId: string, quantity: number) {
    if (quantity <= 0) return;
    
    setQuoteLineItems(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  }

  function handleRemoveItem(itemId: string) {
    setQuoteLineItems(prev => prev.filter(item => item.id !== itemId));
  }

  async function handleSaveQuote() {
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
      client_name: clientName,
      client_contact: clientContact || null,
      quote_data: quoteLineItems,
      tax_rate: taxRate,
      markup_rate: markupRate,
    };

    const response = await createQuote(quoteData);

    if (response.error) {
      toast({
        variant: 'destructive',
        description: response.error.message || 'Failed to create quote',
      });
    } else {
      toast({
        description: 'Quote created successfully',
      });
      setSavedQuoteId(response.data.id);
    }

    setIsLoading(false);
  }

  const canSave = clientName.trim() && quoteLineItems.length > 0;

  return (
    <div className="space-y-6">
      <ClientInfoForm
        clientName={clientName}
        clientContact={clientContact}
        onClientNameChange={setClientName}
        onClientContactChange={setClientContact}
      />

      <Separator />

      <LineItemsTable
        availableItems={availableItems}
        quoteLineItems={quoteLineItems}
        onAddItem={handleAddItem}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
      />

      <Separator />

      <QuoteSummary
        calculation={calculation}
        taxRate={taxRate}
        markupRate={markupRate}
        onTaxRateChange={setTaxRate}
        onMarkupRateChange={setMarkupRate}
        onSaveQuote={handleSaveQuote}
        isLoading={isLoading}
        disabled={!canSave}
      />

      {savedQuoteId && (
        <>
          <Separator />
          <PDFGenerator
            quoteId={savedQuoteId}
            clientName={clientName}
          />
        </>
      )}
    </div>
  );
}