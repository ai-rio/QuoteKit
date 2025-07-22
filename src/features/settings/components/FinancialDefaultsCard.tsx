'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface FinancialDefaultsCardProps {
  taxRate: string;
  markupRate: string;
  onFieldChange: (field: string, value: string) => void;
}

export function FinancialDefaultsCard({
  taxRate,
  markupRate,
  onFieldChange,
}: FinancialDefaultsCardProps) {
  const validateTaxRate = (value: string) => {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0 || num > 100) return false;
    return true;
  };

  const validateMarkupRate = (value: string) => {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0 || num > 1000) return false;
    return true;
  };

  const handleTaxRateChange = (value: string) => {
    // Allow empty string and valid numbers
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      onFieldChange('default_tax_rate', value);
    }
  };

  const handleMarkupRateChange = (value: string) => {
    // Allow empty string and valid numbers
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      onFieldChange('default_markup_rate', value);
    }
  };

  return (
    <Card className="bg-paper-white border border-stone-gray shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-section-title text-charcoal">Financial Defaults</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tax Rate */}
        <div className="grid gap-3">
          <Label htmlFor="tax-rate" className="text-label text-charcoal font-medium">
            Default Tax Rate (%)
          </Label>
          <Input
            id="tax-rate"
            name="default_tax_rate"
            type="text"
            className={`border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green font-mono placeholder:text-charcoal/60 ${
              taxRate && !validateTaxRate(taxRate) ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
            }`}
            placeholder="8.25"
            value={taxRate}
            onChange={(e) => handleTaxRateChange(e.target.value)}
          />
          {taxRate && !validateTaxRate(taxRate) && (
            <p className="text-sm text-red-600">Tax rate must be between 0 and 100</p>
          )}
          <p className="text-xs text-charcoal/60">
            Applied to all new quotes by default. Can be adjusted per quote.
          </p>
        </div>

        {/* Markup Rate */}
        <div className="grid gap-3">
          <Label htmlFor="markup-rate" className="text-label text-charcoal font-medium">
            Default Profit Markup (%)
          </Label>
          <Input
            id="markup-rate"
            name="default_markup_rate"
            type="text"
            className={`border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green font-mono placeholder:text-charcoal/60 ${
              markupRate && !validateMarkupRate(markupRate) ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
            }`}
            placeholder="20.00"
            value={markupRate}
            onChange={(e) => handleMarkupRateChange(e.target.value)}
          />
          {markupRate && !validateMarkupRate(markupRate) && (
            <p className="text-sm text-red-600">Markup rate must be between 0 and 1000</p>
          )}
          <p className="text-xs text-charcoal/60">
            Percentage added to base costs for profit calculation.
          </p>
        </div>

        {/* Info Section */}
        <div className="bg-light-concrete border border-stone-gray rounded-lg p-4">
          <h4 className="text-sm font-medium text-charcoal mb-2">Financial Settings Help</h4>
          <ul className="text-xs text-charcoal/70 space-y-1">
            <li>• <strong>Tax Rate:</strong> Local sales tax percentage for your area</li>
            <li>• <strong>Markup:</strong> Your profit margin on labor and materials</li>
            <li>• These are defaults - you can adjust them for each individual quote</li>
            <li>• Leave blank to set values manually on each quote</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}