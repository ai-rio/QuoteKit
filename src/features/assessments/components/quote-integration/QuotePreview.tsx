import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

import { AssessmentQuotePreview } from './types';
import { getConfidenceStyles,getPriorityColor } from './utils';

interface QuotePreviewProps {
  preview: AssessmentQuotePreview;
}

export function QuotePreview({ preview }: QuotePreviewProps) {
  if (!preview) return null;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-forest-green">Quote Preview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Suggested Items */}
        <div>
          <h4 className="font-medium mb-3 text-gray-900">Suggested Services</h4>
          <div className="space-y-3">
            {preview.suggestedItems.map((suggestion, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900">
                      {suggestion.item.name}
                    </span>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getPriorityColor(suggestion.priority)}`}
                    >
                      {suggestion.priority}
                    </Badge>
                    <Badge 
                      variant="outline"
                      className={`text-xs ${getConfidenceStyles(suggestion.confidenceLevel)}`}
                    >
                      {suggestion.confidenceLevel} confidence
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{suggestion.reason}</p>
                  <div className="text-sm">
                    <span className="text-charcoal">Qty: </span>
                    <span className="font-medium">{suggestion.quantity}</span>
                    <span className="text-charcoal ml-4">Unit Cost: </span>
                    <span className="font-medium">${suggestion.item.cost}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-forest-green">
                    ${(suggestion.item.cost * suggestion.quantity).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Pricing Breakdown */}
        <div>
          <h4 className="font-medium mb-3 text-gray-900">Pricing Analysis</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Base Cost:</span>
              <span>${preview.pricingResult.basePrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Labor ({preview.laborHours}h):</span>
              <span>${preview.pricingResult.laborBreakdown.reduce((sum, labor) => sum + labor.totalCost, 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Materials:</span>
              <span>${preview.pricingResult.materialAdjustments.reduce((sum, material) => sum + material.totalCost, 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Equipment:</span>
              <span>${preview.pricingResult.equipmentCosts.reduce((sum, equipment) => sum + equipment.totalCost, 0).toLocaleString()}</span>
            </div>
            {preview.pricingResult.adjustments.map((adj, index) => (
              <div key={index} className="flex justify-between text-xs text-charcoal">
                <span>{adj.reason}:</span>
                <span>{adj.multiplier > 1 ? '+' : ''}{((adj.multiplier - 1) * 100).toFixed(1)}%</span>
              </div>
            ))}
            <Separator />
            <div className="flex justify-between font-semibold text-lg">
              <span>Total Estimated Cost:</span>
              <span className="text-forest-green">${preview.estimatedTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Validation Results */}
        {(preview.validationResult.warnings.length > 0 || preview.validationResult.errors.length > 0) && (
          <>
            <Separator />
            <div>
              <h4 className="font-medium mb-3 text-gray-900">Validation Results</h4>
              {preview.validationResult.warnings.map((warning, index) => (
                <div key={index} className="text-sm text-yellow-700 bg-yellow-50 p-2 rounded mb-1">
                  ⚠️ {warning}
                </div>
              ))}
              {preview.validationResult.errors.map((error, index) => (
                <div key={index} className="text-sm text-red-700 bg-red-50 p-2 rounded mb-1">
                  ❌ {error}
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}