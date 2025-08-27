import { Calculator, FileText } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { QuotePreview } from './types';

interface EnhancedQuotePreviewProps {
  preview: QuotePreview;
  isGenerating: boolean;
  onGenerateQuote: () => void;
  onViewDetails: () => void;
}

export function EnhancedQuotePreview({ 
  preview, 
  isGenerating, 
  onGenerateQuote, 
  onViewDetails 
}: EnhancedQuotePreviewProps) {
  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getConfidenceStyles = (level: 'high' | 'medium' | 'low') => {
    switch (level) {
      case 'high': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-red-600 bg-red-50 border-red-200';
    }
  };

  return (
    <Card className="w-full border-sage-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-forest-green">
            <Calculator className="h-5 w-5" />
            Intelligent Quote Preview
          </CardTitle>
          <div className="text-sm text-charcoal">
            Generated: {preview.generatedAt.toLocaleString()}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="mt-6">
            <div className="space-y-4">
              {/* Quote Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-sage-50 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-forest-green">
                    ${preview.estimatedTotal.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Estimated Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-forest-green">
                    {preview.laborHours}h
                  </div>
                  <div className="text-sm text-gray-600">Labor Hours</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-forest-green">
                    {Math.round(preview.confidenceScore)}%
                  </div>
                  <div className="text-sm text-gray-600">Confidence</div>
                </div>
              </div>

              {/* Services Count */}
              <div className="flex justify-between items-center p-3 bg-white border border-sage-200 rounded-lg">
                <span className="font-medium">Suggested Services</span>
                <Badge variant="outline" className="bg-sage-50 text-sage-700">
                  {preview.suggestedItems.length} items
                </Badge>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="services" className="mt-6">
            <div className="space-y-3">
              {preview.suggestedItems.map((item, index) => (
                <Card key={index} className="border-l-4 border-l-sage-400">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium text-gray-900">{item.item.name}</h4>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getPriorityColor(item.priority)}`}
                          >
                            {item.priority}
                          </Badge>
                          {item.assessmentBased && (
                            <Badge variant="secondary" className="text-xs">
                              Assessment-Based
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{item.reason}</p>
                        <div className="flex items-center gap-4 text-sm">
                          <span>Qty: <strong>{item.quantity}</strong></span>
                          <span>Unit: <strong>${item.item.cost}</strong></span>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getConfidenceStyles(item.confidenceLevel)}`}
                          >
                            {item.confidenceLevel} confidence
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-forest-green">
                          ${(item.item.cost * item.quantity).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="breakdown" className="mt-6">
            <div className="space-y-4">
              <div className="bg-white border border-sage-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Cost Analysis</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Base Cost:</span>
                    <span className="font-medium">${preview.pricingResult.basePrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Labor Cost:</span>
                    <span className="font-medium">${preview.pricingResult.laborBreakdown.reduce((sum, labor) => sum + labor.totalCost, 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Material Cost:</span>
                    <span className="font-medium">${preview.pricingResult.materialAdjustments.reduce((sum, material) => sum + material.totalCost, 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Equipment Cost:</span>
                    <span className="font-medium">${preview.pricingResult.equipmentCosts.reduce((sum, equipment) => sum + equipment.totalCost, 0).toLocaleString()}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between font-semibold">
                    <span>Total Estimated:</span>
                    <span className="text-forest-green">${preview.estimatedTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              {preview.pricingResult.adjustments && preview.pricingResult.adjustments.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Pricing Adjustments</h4>
                  <div className="space-y-2">
                    {preview.pricingResult.adjustments.map((adj, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-600">{adj.reason}:</span>
                        <span className={adj.multiplier > 1 ? 'text-red-600' : 'text-green-600'}>
                          {adj.multiplier > 1 ? '+' : ''}{((adj.multiplier - 1) * 100).toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6 pt-4 border-t border-sage-200">
          <Button 
            onClick={onGenerateQuote}
            disabled={isGenerating}
            className="flex-1 bg-forest-green hover:bg-forest-green/90"
          >
            {isGenerating ? 'Creating Quote...' : 'Create Final Quote'}
          </Button>
          <Button 
            variant="outline" 
            onClick={onViewDetails}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}