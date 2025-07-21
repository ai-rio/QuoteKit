'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { QuoteCalculation } from '../types';

interface QuoteSummaryProps {
  calculation: QuoteCalculation;
  taxRate: number;
  markupRate: number;
  onTaxRateChange: (value: number) => void;
  onMarkupRateChange: (value: number) => void;
  onSaveQuote: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function QuoteSummary({
  calculation,
  taxRate,
  markupRate,
  onTaxRateChange,
  onMarkupRateChange,
  onSaveQuote,
  isLoading = false,
  disabled = false,
}: QuoteSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quote Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between text-sm">
          <span>Subtotal:</span>
          <span>${calculation.subtotal.toFixed(2)}</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-3">
            <Label htmlFor="tax-override">Tax Rate (%) - Override</Label>
            <Input
              id="tax-override"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={taxRate}
              onChange={(e) => {
                const value = parseFloat(e.target.value) || 0;
                onTaxRateChange(value);
              }}
              placeholder="8.25"
            />
          </div>
          <div className="grid gap-3">
            <Label htmlFor="markup-override">Markup (%) - Override</Label>
            <Input
              id="markup-override"
              type="number"
              step="0.01"
              min="0"
              max="1000"
              value={markupRate}
              onChange={(e) => {
                const value = parseFloat(e.target.value) || 0;
                onMarkupRateChange(value);
              }}
              placeholder="20.00"
            />
          </div>
        </div>

        <div className="space-y-2 text-sm border-t pt-4">
          <div className="flex justify-between">
            <span>Markup ({markupRate}%):</span>
            <span>${calculation.markupAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax ({taxRate}%):</span>
            <span>${calculation.taxAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg border-t pt-2">
            <span>Final Total:</span>
            <span>${calculation.total.toFixed(2)}</span>
          </div>
        </div>

        <Button 
          className="w-full" 
          onClick={onSaveQuote}
          disabled={disabled || isLoading}
        >
          {isLoading ? 'Saving Quote...' : 'Save Quote'}
        </Button>
      </CardContent>
    </Card>
  );
}