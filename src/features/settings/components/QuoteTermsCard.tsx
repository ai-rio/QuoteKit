import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

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
        <CardTitle className="text-section-title text-charcoal">Business Preferences</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preferred Currency */}
        <div className="grid gap-3">
          <Label htmlFor="preferred-currency" className="text-label text-charcoal font-medium">
            Preferred Currency
          </Label>
          <Select
            value={preferredCurrency}
            onValueChange={(value) => onFieldChange('preferred_currency', value)}
          >
            <SelectTrigger className="border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green">
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              {CURRENCY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Quote Terms */}
        <div className="grid gap-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="quote-terms" className="text-label text-charcoal font-medium">
              Default Quote Terms & Conditions
            </Label>
            <button
              type="button"
              onClick={handleUseDefaultTerms}
              className="text-sm text-forest-green hover:text-forest-green/80 font-medium"
            >
              Use Default Terms
            </button>
          </div>
          <Textarea
            id="quote-terms"
            name="quote_terms"
            className="border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60 resize-none min-h-[200px]"
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