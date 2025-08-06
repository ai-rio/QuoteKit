import { HelpCircle } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface QuoteTermsCardProps {
  preferredCurrency: string;
  quoteTerms: string;
  onFieldChange: (field: string, value: string) => void;
}

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'CAD', label: 'CAD - Canadian Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'AUD', label: 'AUD - Australian Dollar' },
];

const DEFAULT_TERMS = `Terms and Conditions:

1. Quote valid for 30 days from date of issue
2. 50% deposit required to begin work
3. Final payment due upon completion
4. Weather delays may affect completion timeline
5. Additional charges may apply for changes to original scope
6. Customer responsible for obtaining necessary permits
7. Cleanup and debris removal included in quoted price`;

export function QuoteTermsCard({
  preferredCurrency,
  quoteTerms,
  onFieldChange,
}: QuoteTermsCardProps) {
  const handleUseDefaultTerms = () => {
    onFieldChange('quote_terms', DEFAULT_TERMS);
  };

  return (
    <Card className="bg-paper-white border border-stone-gray shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <CardTitle className="text-section-title text-charcoal">Business Preferences</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="w-4 h-4 text-charcoal/40 hover:text-charcoal/60 cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-charcoal text-paper-white border-charcoal max-w-xs">
                <p className="text-xs">
                  Default business preferences for quotes. Currency affects number formatting and symbols. 
                  Terms provide legal protection and set client expectations.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preferred Currency */}
        <div className="grid gap-3">
          <div className="flex items-center gap-2">
            <Label htmlFor="preferred-currency" className="text-label text-charcoal font-medium">
              Preferred Currency
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="w-3 h-3 text-charcoal/40 hover:text-charcoal/60 cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-charcoal text-paper-white border-charcoal max-w-xs">
                  <p className="text-xs">
                    Default currency for all quotes. Affects number formatting, currency symbols, and decimal places. 
                    Choose the currency most commonly used in your business region and client transactions.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Select
            value={preferredCurrency}
            onValueChange={(value) => onFieldChange('preferred_currency', value)}
          >
            <SelectTrigger className="min-h-[44px] border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green focus:ring-2 focus:ring-offset-1">
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent className="bg-paper-white border-stone-gray shadow-lg max-h-[200px] overflow-y-auto">
              {CURRENCY_OPTIONS.map((option) => (
                <SelectItem 
                  key={option.value} 
                  value={option.value}
                  className="min-h-[44px] text-charcoal hover:bg-light-concrete focus:bg-light-concrete cursor-pointer"
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Quote Terms */}
        <div className="grid gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="quote-terms" className="text-label text-charcoal font-medium">
                Default Quote Terms & Conditions
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="w-3 h-3 text-charcoal/40 hover:text-charcoal/60 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="bg-charcoal text-paper-white border-charcoal max-w-xs">
                    <p className="text-xs">
                      Standard terms that appear on all quotes. Include payment terms, project scope, timeline expectations, 
                      and legal protections. Can be customized per quote but provides consistent baseline protection.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <button
              type="button"
              onClick={handleUseDefaultTerms}
              className="min-h-[44px] px-4 py-2 text-sm text-forest-green hover:text-forest-green/80 hover:bg-forest-green/5 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-forest-green focus:ring-offset-1"
            >
              Use Default Terms
            </button>
          </div>
          <Textarea
            id="quote-terms"
            name="quote_terms"
            className="border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60 resize-none min-h-[180px] sm:min-h-[200px]"
            placeholder="Enter your standard terms and conditions that will appear on quotes..."
            rows={8}
            value={quoteTerms}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onFieldChange('quote_terms', e.target.value)}
          />
          <p className="text-xs text-charcoal/60">
            These terms will automatically appear on all new quotes. You can edit them for individual quotes as needed.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}