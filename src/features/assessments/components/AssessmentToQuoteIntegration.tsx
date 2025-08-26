'use client';

import { Calculator, FileText, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';
import { Property } from '@/features/clients/types';
import { LineItem } from '@/features/items/types';

import { generateQuoteFromAssessment } from '../actions/assessment-quote-integration';
import { PropertyAssessment } from '../types';

interface AssessmentToQuoteIntegrationProps {
  assessment: PropertyAssessment;
  property?: Property;
  availableItems: LineItem[];
  onQuoteCreated?: (quoteId: string) => void;
}

interface AssessmentQuotePreview {
  suggestedItems: Array<{
    item: LineItem;
    quantity: number;
    reason: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  estimatedTotal: number;
  complexityMultiplier: number;
  conditionAdjustments: Array<{
    condition: string;
    adjustment: number;
    reason: string;
  }>;
}

export function AssessmentToQuoteIntegration({
  assessment,
  property,
  availableItems,
  onQuoteCreated
}: AssessmentToQuoteIntegrationProps) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [preview, setPreview] = useState<AssessmentQuotePreview | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Generate quote preview based on assessment data
  const generatePreview = () => {
    const suggestedItems: AssessmentQuotePreview['suggestedItems'] = [];
    const conditionAdjustments: AssessmentQuotePreview['conditionAdjustments'] = [];
    
    // Lawn condition-based suggestions
    if (assessment.lawn_condition) {
      switch (assessment.lawn_condition) {
        case 'dead':
        case 'poor':
          // Suggest lawn renovation items
          const seedingItem = availableItems.find(item => 
            item.name.toLowerCase().includes('seed') || 
            item.name.toLowerCase().includes('sod')
          );
          if (seedingItem) {
            suggestedItems.push({
              item: seedingItem,
              quantity: Math.ceil((assessment.lawn_area_measured || assessment.lawn_area_estimated || 1000) / 1000),
              reason: `Lawn condition is ${assessment.lawn_condition} - requires renovation`,
              priority: 'high'
            });
          }
          conditionAdjustments.push({
            condition: 'Poor Lawn Condition',
            adjustment: 1.3,
            reason: 'Additional prep work and materials needed'
          });
          break;
        case 'patchy':
          // Suggest overseeding
          const overseedItem = availableItems.find(item => 
            item.name.toLowerCase().includes('overseed')
          );
          if (overseedItem) {
            suggestedItems.push({
              item: overseedItem,
              quantity: Math.ceil((assessment.lawn_area_measured || assessment.lawn_area_estimated || 1000) / 1000),
              reason: 'Patchy lawn requires overseeding',
              priority: 'medium'
            });
          }
          break;
      }
    }

    // Soil condition adjustments
    if (assessment.soil_condition) {
      switch (assessment.soil_condition) {
        case 'compacted':
          const aerationItem = availableItems.find(item => 
            item.name.toLowerCase().includes('aerat')
          );
          if (aerationItem) {
            suggestedItems.push({
              item: aerationItem,
              quantity: Math.ceil((assessment.lawn_area_measured || assessment.lawn_area_estimated || 1000) / 1000),
              reason: 'Compacted soil requires aeration',
              priority: 'high'
            });
          }
          conditionAdjustments.push({
            condition: 'Compacted Soil',
            adjustment: 1.2,
            reason: 'Additional equipment and time required'
          });
          break;
        case 'contaminated':
          conditionAdjustments.push({
            condition: 'Contaminated Soil',
            adjustment: 1.5,
            reason: 'Specialized handling and disposal required'
          });
          break;
      }
    }

    // Weed coverage adjustments
    if (assessment.weed_coverage_percent && assessment.weed_coverage_percent > 30) {
      const weedControlItem = availableItems.find(item => 
        item.name.toLowerCase().includes('weed') || 
        item.name.toLowerCase().includes('herbicide')
      );
      if (weedControlItem) {
        suggestedItems.push({
          item: weedControlItem,
          quantity: Math.ceil((assessment.lawn_area_measured || assessment.lawn_area_estimated || 1000) / 1000),
          reason: `High weed coverage (${assessment.weed_coverage_percent}%) requires treatment`,
          priority: 'high'
        });
      }
    }

    // Equipment access adjustments
    let complexityMultiplier = 1.0;
    if (assessment.vehicle_access_width_feet && assessment.vehicle_access_width_feet < 8) {
      complexityMultiplier += 0.2;
      conditionAdjustments.push({
        condition: 'Limited Access',
        adjustment: 1.2,
        reason: 'Narrow access requires smaller equipment and more labor'
      });
    }

    if (!assessment.dump_truck_access) {
      complexityMultiplier += 0.15;
      conditionAdjustments.push({
        condition: 'No Dump Truck Access',
        adjustment: 1.15,
        reason: 'Manual material transport required'
      });
    }

    // Calculate estimated total
    const baseTotal = suggestedItems.reduce((sum, item) => 
      sum + (item.item.cost * item.quantity), 0
    );
    
    const adjustmentMultiplier = conditionAdjustments.reduce((mult, adj) => 
      mult * adj.adjustment, 1
    );

    const estimatedTotal = baseTotal * adjustmentMultiplier * complexityMultiplier;

    setPreview({
      suggestedItems,
      estimatedTotal,
      complexityMultiplier,
      conditionAdjustments
    });
    setShowPreview(true);
  };

  const handleGenerateQuote = async () => {
    if (!preview) {
      generatePreview();
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateQuoteFromAssessment({
        assessmentId: assessment.id,
        propertyId: assessment.property_id,
        suggestedItems: preview.suggestedItems.map(item => ({
          itemId: item.item.id,
          quantity: item.quantity,
          reason: item.reason
        })),
        conditionAdjustments: preview.conditionAdjustments,
        complexityMultiplier: preview.complexityMultiplier
      });

      if (result?.error) {
        toast({
          title: 'Error',
          description: result.error.message || 'Failed to generate quote from assessment',
          variant: 'destructive',
        });
        return;
      }

      if (result?.data) {
        toast({
          title: 'Success',
          description: 'Quote generated successfully from assessment data',
        });
        
        if (onQuoteCreated) {
          onQuoteCreated(result.data.id);
        } else {
          router.push(`/quotes/${result.data.id}`);
        }
      }
    } catch (error) {
      console.error('Error generating quote:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-forest-green">
          <Calculator className="h-5 w-5" />
          Assessment-Based Quote Generation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Assessment Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-forest-green">
              {assessment.overall_condition || 'N/A'}
            </div>
            <div className="text-sm text-charcoal-600">Overall Condition</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-forest-green">
              {assessment.complexity_score || 'N/A'}/10
            </div>
            <div className="text-sm text-charcoal-600">Complexity</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-forest-green">
              {assessment.total_estimated_hours || 'N/A'}h
            </div>
            <div className="text-sm text-charcoal-600">Est. Hours</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-forest-green">
              {assessment.lawn_area_measured || assessment.lawn_area_estimated || 'N/A'} sq ft
            </div>
            <div className="text-sm text-charcoal-600">Lawn Area</div>
          </div>
        </div>

        <Separator />

        {/* Generate Preview Button */}
        {!showPreview && (
          <Button 
            onClick={generatePreview}
            className="w-full bg-equipment-yellow hover:bg-equipment-yellow/90 text-charcoal"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Generate Quote Preview
          </Button>
        )}

        {/* Quote Preview */}
        {showPreview && preview && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-forest-green">Quote Preview</h3>
            
            {/* Suggested Items */}
            {preview.suggestedItems.length > 0 && (
              <div>
                <h4 className="font-medium text-charcoal mb-2">Suggested Line Items</h4>
                <div className="space-y-2">
                  {preview.suggestedItems.map((suggestion, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{suggestion.item.name}</span>
                          <Badge className={getPriorityColor(suggestion.priority)}>
                            {suggestion.priority}
                          </Badge>
                        </div>
                        <div className="text-sm text-charcoal-600 mt-1">
                          {suggestion.reason}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {suggestion.quantity} {suggestion.item.unit}
                        </div>
                        <div className="text-sm text-charcoal-600">
                          ${(suggestion.item.cost * suggestion.quantity).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Condition Adjustments */}
            {preview.conditionAdjustments.length > 0 && (
              <div>
                <h4 className="font-medium text-charcoal mb-2">Pricing Adjustments</h4>
                <div className="space-y-2">
                  {preview.conditionAdjustments.map((adjustment, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div>
                        <div className="font-medium">{adjustment.condition}</div>
                        <div className="text-sm text-charcoal-600">{adjustment.reason}</div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">
                          +{((adjustment.adjustment - 1) * 100).toFixed(0)}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Estimated Total */}
            <div className="bg-forest-green/10 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-forest-green">
                  Estimated Total
                </span>
                <span className="text-2xl font-bold text-forest-green">
                  ${preview.estimatedTotal.toFixed(2)}
                </span>
              </div>
              {preview.complexityMultiplier > 1 && (
                <div className="text-sm text-charcoal-600 mt-2">
                  Includes {((preview.complexityMultiplier - 1) * 100).toFixed(0)}% complexity adjustment
                </div>
              )}
            </div>

            {/* Generate Quote Button */}
            <Button 
              onClick={handleGenerateQuote}
              disabled={isGenerating}
              className="w-full bg-equipment-yellow hover:bg-equipment-yellow/90 text-charcoal"
            >
              <FileText className="h-4 w-4 mr-2" />
              {isGenerating ? 'Generating Quote...' : 'Generate Quote'}
            </Button>
          </div>
        )}

        {/* No Items Warning */}
        {showPreview && preview && preview.suggestedItems.length === 0 && (
          <Alert>
            <AlertDescription>
              No specific line items could be automatically suggested based on the assessment data. 
              You can still generate a quote with manual item selection.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
