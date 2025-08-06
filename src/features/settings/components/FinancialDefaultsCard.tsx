'use client';

import { HelpCircle } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
        <div className="flex items-center gap-2">
          <CardTitle className="text-section-title text-charcoal">Financial Defaults</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="w-4 h-4 text-charcoal/40 hover:text-charcoal/60 cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-charcoal text-paper-white border-charcoal max-w-xs">
                <p className="text-xs">
                  Default financial settings for new quotes. These pre-populate quote calculations but can be 
                  adjusted per quote as needed. Essential for consistent pricing and profitability.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tax Rate */}
        <div className="grid gap-3">
          <div className="flex items-center gap-2">
            <Label htmlFor="tax-rate" className="text-label text-charcoal font-medium">
              Default Tax Rate (%)
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="w-3 h-3 text-charcoal/40 hover:text-charcoal/60 cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-charcoal text-paper-white border-charcoal max-w-xs">
                  <p className="text-xs">
                    Your local sales tax percentage (e.g., 8.25 for 8.25%). Check your state and local tax 
                    requirements. This pre-fills new quotes but can be adjusted per quote for different tax zones.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Input
            id="tax-rate"
            name="default_tax_rate"
            type="text"
            inputMode="decimal"
            autoComplete="off"
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
          <div className="flex items-center gap-2">
            <Label htmlFor="markup-rate" className="text-label text-charcoal font-medium">
              Default Profit Markup (%)
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="w-3 h-3 text-charcoal/40 hover:text-charcoal/60 cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-charcoal text-paper-white border-charcoal max-w-xs">
                  <p className="text-xs">
                    Your profit margin percentage added to base costs. Covers overhead, labor, profit, and business 
                    expenses. Industry standards: 15-30% for services, 20-50% for products. Higher for specialized work.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Input
            id="markup-rate"
            name="default_markup_rate"
            type="text"
            inputMode="decimal"
            autoComplete="off"
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