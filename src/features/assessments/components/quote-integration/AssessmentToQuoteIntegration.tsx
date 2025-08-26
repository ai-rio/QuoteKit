'use client';

import { Calculator } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo,useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';

import { generateQuoteFromAssessment } from '../../actions/assessment-quote-integration';
import { AssessmentSummary } from './AssessmentSummary';
import { QuotePreview } from './QuotePreview';
import { AssessmentQuotePreview,AssessmentToQuoteIntegrationProps } from './types';
import { calculateAssessmentMetrics,generateQuotePreview } from './utils';

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

  // Calculate assessment metrics
  const assessmentMetrics = useMemo(() => 
    calculateAssessmentMetrics(assessment), 
    [assessment]
  );

  const handleGeneratePreview = () => {
    try {
      const newPreview = generateQuotePreview(assessment, availableItems);
      setPreview(newPreview);
      setShowPreview(true);
    } catch (error) {
      console.error('Error generating preview:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate quote preview',
        variant: 'destructive',
      });
    }
  };

  const handleGenerateQuote = async () => {
    if (!preview) {
      handleGeneratePreview();
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
        conditionAdjustments: preview.pricingResult.adjustments.map(adj => ({
          condition: adj.factor,
          adjustment: adj.multiplier,
          reason: adj.reason
        })),
        complexityMultiplier: preview.pricingResult.totalMultiplier
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

  return (
    <div className="space-y-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-forest-green">
            <Calculator className="h-5 w-5" />
            Assessment-Based Quote Generation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Assessment Quality Metrics */}
          <AssessmentSummary 
            metrics={assessmentMetrics}
            laborHours={preview?.laborHours}
            estimatedTotal={preview?.estimatedTotal}
          />

          {/* Low confidence warning */}
          {assessmentMetrics.confidenceLevel === 'low' && (
            <Alert>
              <AlertDescription>
                This assessment has limited data quality. Consider adding more measurements, 
                photos, and detailed notes before generating a quote for better accuracy.
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleGeneratePreview}
              variant="outline"
              disabled={isGenerating}
            >
              Generate Preview
            </Button>
            <Button
              onClick={handleGenerateQuote}
              disabled={isGenerating}
              className="bg-forest-green hover:bg-forest-green/90"
            >
              {isGenerating ? 'Generating Quote...' : 'Create Quote'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quote Preview */}
      {showPreview && preview && (
        <QuotePreview preview={preview} />
      )}
    </div>
  );
}