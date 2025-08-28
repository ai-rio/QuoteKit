'use client';

import { Calculator, CheckCircle2, Clock, FileText, TrendingUp } from 'lucide-react';
import { useState, useTransition } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { toast } from '@/components/ui/use-toast';
import { Property, PropertyWithClient } from '@/features/clients/types';
import { ActionResponse } from '@/types/action-response';

import { generateQuoteFromAssessment } from '../actions/assessment-quote-integration';
import { PropertyAssessment } from '../types';

interface AssessmentCompletionBridgeProps {
  assessment: PropertyAssessment;
  property: PropertyWithClient;
  isOpen: boolean;
  onClose: () => void;
  onQuoteGenerated: (quoteId: string) => void;
}

interface PricingPreview {
  baseEstimate: number;
  conditionAdjustments: Array<{
    condition: string;
    multiplier: number;
    explanation: string;
    additionalCost: number;
  }>;
  totalEstimate: number;
  confidenceLevel: 'high' | 'medium' | 'low';
}

interface AssessmentSummary {
  complexityScore: number;
  keyFindings: string[];
  priorityIssues: Array<{
    issue: string;
    severity: 'high' | 'medium' | 'low';
  }>;
}

export function AssessmentCompletionBridge({
  assessment,
  property,
  isOpen,
  onClose,
  onQuoteGenerated
}: AssessmentCompletionBridgeProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPending, startTransition] = useTransition();
  
  // Calculate assessment summary
  const assessmentSummary: AssessmentSummary = {
    complexityScore: calculateComplexityScore(assessment, property),
    keyFindings: generateKeyFindings(assessment),
    priorityIssues: generatePriorityIssues(assessment)
  };

  // Generate pricing preview
  const pricingPreview: PricingPreview = generatePricingPreview(assessment, property);

  const steps = [
    'Analyzing Assessment Data',
    'Calculating Condition-Based Pricing', 
    'Generating Service Recommendations',
    'Preparing Quote Preview'
  ];

  const handleGenerateQuote = () => {
    startTransition(async () => {
      setIsGenerating(true);
      
      // Simulate progressive steps
      for (let i = 0; i < steps.length; i++) {
        setCurrentStep(i);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      try {
        // Generate suggested line items from assessment
        const suggestedItems = generateSuggestedLineItems(assessment);
        const conditionAdjustments = pricingPreview.conditionAdjustments.map(adj => ({
          condition: adj.condition,
          adjustment: adj.multiplier,
          reason: adj.explanation
        }));

        const result = await generateQuoteFromAssessment({
          assessmentId: assessment.id,
          propertyId: assessment.property_id,
          suggestedItems,
          conditionAdjustments,
          complexityMultiplier: pricingPreview.totalEstimate / pricingPreview.baseEstimate
        });

        if (result?.error) {
          toast({
            title: 'Quote Generation Failed',
            description: result.error.message || 'Unable to generate quote from assessment data',
            variant: 'destructive',
          });
          return;
        }

        if (result?.data) {
          toast({
            title: 'Quote Generated Successfully!',
            description: `Quote #${result.data.id} created from assessment data`,
          });
          onQuoteGenerated(result.data.id);
          onClose();
        }
      } catch (error) {
        console.error('Error generating quote:', error);
        toast({
          title: 'Error',
          description: 'An unexpected error occurred while generating the quote',
          variant: 'destructive',
        });
      } finally {
        setIsGenerating(false);
        setCurrentStep(0);
      }
    });
  };

  const handleCustomizeFirst = () => {
    // Navigate to assessment edit mode
    window.location.href = `/assessments/${assessment.id}/edit`;
  };

  const handleSaveForLater = () => {
    toast({
      title: 'Assessment Saved',
      description: 'You can generate a quote from this assessment later',
    });
    onClose();
  };

  return (
    <TooltipProvider>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent 
          className="max-w-4xl max-h-[90vh] overflow-y-auto"
        >
        <DialogHeader className="pb-6">
          <DialogTitle className="text-2xl font-black text-[hsl(var(--forest-green))] flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
            Assessment Completed Successfully
          </DialogTitle>
          <DialogDescription className="text-base text-[hsl(var(--charcoal))]">
            Your assessment is complete. Generate a professional quote instantly or customize the assessment first.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Assessment Summary Card */}
          <Card className="border-l-4 border-l-[hsl(var(--forest-green))]">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-[hsl(var(--forest-green))] flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Assessment Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-[hsl(var(--charcoal))]">Property</p>
                  <p className="text-sm text-gray-600">{property.service_address}</p>
                  <p className="text-sm text-gray-600">{property.client_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-[hsl(var(--charcoal))]">Assessment Date</p>
                  <p className="text-sm text-gray-600">
                    {new Date(assessment.assessment_date).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-[hsl(var(--charcoal))]">
                    Complexity Score
                  </span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="cursor-help">
                        {assessmentSummary.complexityScore}/10
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Based on property conditions, access, and required services</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Progress value={assessmentSummary.complexityScore * 10} className="h-2" />
              </div>

              <div>
                <p className="text-sm font-medium text-[hsl(var(--charcoal))] mb-2">Key Findings</p>
                <ul className="space-y-1">
                  {assessmentSummary.keyFindings.map((finding, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-[hsl(var(--forest-green))] rounded-full mt-1.5 flex-shrink-0" />
                      {finding}
                    </li>
                  ))}
                </ul>
              </div>

              {assessmentSummary.priorityIssues.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-[hsl(var(--charcoal))] mb-2">Priority Issues</p>
                  <div className="space-y-1">
                    {assessmentSummary.priorityIssues.map((issue, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Badge 
                          variant={issue.severity === 'high' ? 'destructive' : issue.severity === 'medium' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {issue.severity}
                        </Badge>
                        <span className="text-sm text-gray-600">{issue.issue}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pricing Preview Card */}
          <Card className="border-l-4 border-l-[hsl(var(--equipment-yellow))]">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-[hsl(var(--forest-green))] flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Pricing Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Base Estimate</span>
                  <span className="font-medium">${pricingPreview.baseEstimate.toLocaleString()}</span>
                </div>

                {pricingPreview.conditionAdjustments.map((adjustment, index) => (
                  <div key={index} className="border-l-2 border-gray-200 pl-3">
                    <div className="flex items-center justify-between">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-sm text-gray-600 cursor-help">
                            {adjustment.condition}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{adjustment.explanation}</p>
                        </TooltipContent>
                      </Tooltip>
                      <span className="text-sm font-medium">
                        +${adjustment.additionalCost.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}

                <div className="border-t pt-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-[hsl(var(--charcoal))]">Total Estimate</span>
                    <span className="text-xl font-bold text-[hsl(var(--forest-green))]">
                      ${pricingPreview.totalEstimate.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge 
                    variant={pricingPreview.confidenceLevel === 'high' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {pricingPreview.confidenceLevel} confidence
                  </Badge>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TrendingUp className="h-4 w-4 text-gray-500 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Confidence based on assessment completeness and data quality</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quote Generation Progress */}
        {isGenerating && (
          <Card className="mt-6">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-[hsl(var(--equipment-yellow))]" />
                  <div className="flex-1">
                    <p className="font-medium text-[hsl(var(--charcoal))]">
                      {steps[currentStep]}
                    </p>
                    <p className="text-sm text-gray-600">
                      Step {currentStep + 1} of {steps.length}
                    </p>
                  </div>
                </div>
                <Progress value={(currentStep + 1) / steps.length * 100} className="h-2" />
                <p className="text-xs text-gray-500">
                  Estimated time remaining: {(steps.length - currentStep - 1) * 1} seconds
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleGenerateQuote}
                  disabled={isGenerating || isPending}
                  className="flex-1 bg-[hsl(var(--forest-green))] hover:bg-[hsl(var(--forest-green))]/90 text-white min-h-[44px] text-base font-semibold"
                >
                  {isGenerating ? (
                    <>
                      <Clock className="mr-2 h-4 w-4 animate-spin" />
                      Generating Quote...
                    </>
                  ) : (
                    <>
                      <Calculator className="mr-2 h-4 w-4" />
                      Generate Quote Now
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Generate a professional quote instantly from assessment data</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  onClick={handleCustomizeFirst}
                  disabled={isGenerating}
                  className="flex-1 border-[hsl(var(--charcoal))] text-[hsl(var(--charcoal))] hover:bg-gray-50 min-h-[44px]"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Review & Customize
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Review and modify assessment details before quote generation</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="flex gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  onClick={handleSaveForLater}
                  disabled={isGenerating}
                  className="text-gray-600 hover:text-gray-800 min-h-[44px]"
                >
                  Save for Later
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Save assessment and create quote later</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}

// Helper functions
function calculateComplexityScore(assessment: PropertyAssessment, property: Property): number {
  let score = 5; // Base score
  
  // Adjust based on lawn condition
  if (assessment.lawn_condition === 'dead' || assessment.lawn_condition === 'poor') score += 2;
  else if (assessment.lawn_condition === 'fair') score += 1;
  
  // Adjust based on soil condition  
  if (assessment.soil_condition === 'poor' || assessment.soil_condition === 'compacted') score += 2;
  else if (assessment.soil_condition === 'contaminated') score += 3;
  
  // Adjust based on access difficulty
  if (property.property_access === 'difficult') score += 2;
  else if (property.property_access === 'moderate') score += 1;
  
  return Math.min(10, Math.max(1, score));
}

function generateKeyFindings(assessment: PropertyAssessment): string[] {
  const findings: string[] = [];
  
  if (assessment.lawn_condition && assessment.lawn_condition !== 'excellent') {
    findings.push(`Lawn condition: ${assessment.lawn_condition}`);
  }
  
  if (assessment.soil_condition && assessment.soil_condition !== 'excellent') {
    findings.push(`Soil requires attention: ${assessment.soil_condition}`);
  }
  
  if (assessment.weed_coverage_percent && assessment.weed_coverage_percent > 20) {
    findings.push(`Significant weed coverage: ${assessment.weed_coverage_percent}%`);
  }
  
  if (assessment.bare_spots_count && assessment.bare_spots_count > 0) {
    findings.push(`${assessment.bare_spots_count} bare spots identified`);
  }
  
  // if (assessment.irrigation_coverage && assessment.irrigation_coverage < 80) {
  //   findings.push(`Irrigation coverage needs improvement: ${assessment.irrigation_coverage}%`);
  // }
  
  return findings.slice(0, 5); // Limit to top 5 findings
}

function generatePriorityIssues(assessment: PropertyAssessment): Array<{issue: string; severity: 'high' | 'medium' | 'low'}> {
  const issues: Array<{issue: string; severity: 'high' | 'medium' | 'low'}> = [];
  
  if (assessment.lawn_condition === 'dead') {
    issues.push({ issue: 'Lawn requires complete renovation', severity: 'high' });
  }
  
  if (assessment.soil_condition === 'contaminated') {
    issues.push({ issue: 'Soil contamination needs remediation', severity: 'high' });
  }
  
  if (assessment.weed_coverage_percent && assessment.weed_coverage_percent > 50) {
    issues.push({ issue: 'Extensive weed control needed', severity: 'high' });
  }
  
  if (assessment.drainage_quality && assessment.drainage_quality < 3) { // Assuming 1-5 scale, 1,2 are poor
    issues.push({ issue: 'Drainage problems require attention', severity: 'medium' });
  }
  
  return issues;
}

function generatePricingPreview(assessment: PropertyAssessment, property: Property): PricingPreview {
  const baseArea = property.square_footage || 5000; // Default to 5000 sq ft
  const baseRate = 0.15; // $0.15 per sq ft base rate
  let baseEstimate = baseArea * baseRate;
  
  const adjustments: Array<{
    condition: string;
    multiplier: number;
    explanation: string;
    additionalCost: number;
  }> = [];
  
  let totalMultiplier = 1.0;
  
  // Lawn condition adjustments
  if (assessment.lawn_condition === 'dead' || assessment.lawn_condition === 'poor') {
    const multiplier = 1.3;
    totalMultiplier *= multiplier;
    adjustments.push({
      condition: 'Poor Lawn Condition',
      multiplier,
      explanation: 'Additional seeding, fertilization, and intensive care required',
      additionalCost: baseEstimate * (multiplier - 1)
    });
  }
  
  // Soil condition adjustments
  if (assessment.soil_condition === 'compacted') {
    const multiplier = 1.2;
    totalMultiplier *= multiplier;
    adjustments.push({
      condition: 'Compacted Soil',
      multiplier,
      explanation: 'Aeration and soil amendment required',
      additionalCost: baseEstimate * (multiplier - 1)
    });
  }
  
  // Access difficulty adjustments
  if (property.property_access === 'difficult') {
    const multiplier = 1.15;
    totalMultiplier *= multiplier;
    adjustments.push({
      condition: 'Limited Access',
      multiplier,
      explanation: 'Additional labor time for equipment access',
      additionalCost: baseEstimate * (multiplier - 1)
    });
  }
  
  const totalEstimate = baseEstimate * totalMultiplier;
  
  // Determine confidence level
  let confidenceLevel: 'high' | 'medium' | 'low' = 'high';
  if (!assessment.lawn_condition || !assessment.soil_condition) {
    confidenceLevel = 'medium';
  }
  if (calculateComplexityScore(assessment, property) > 8) {
    confidenceLevel = 'low';
  }
  
  return {
    baseEstimate,
    conditionAdjustments: adjustments,
    totalEstimate,
    confidenceLevel
  };
}

function generateSuggestedLineItems(assessment: PropertyAssessment) {
  const items = [];
  
  // Base lawn care service
  items.push({
    itemId: 'lawn-maintenance',
    quantity: 1,
    reason: 'Regular lawn maintenance based on assessment'
  });
  
  // Condition-specific services
  if (assessment.lawn_condition === 'poor' || assessment.lawn_condition === 'dead') {
    items.push({
      itemId: 'overseeding',
      quantity: 1,
      reason: 'Lawn overseeding required due to poor condition'
    });
  }
  
  if (assessment.soil_condition === 'compacted') {
    items.push({
      itemId: 'aeration',
      quantity: 1,
      reason: 'Soil aeration needed to address compaction'
    });
  }
  
  if (assessment.weed_coverage_percent && assessment.weed_coverage_percent > 20) {
    items.push({
      itemId: 'weed-control',
      quantity: 1,
      reason: `Weed control treatment for ${assessment.weed_coverage_percent}% coverage`
    });
  }
  
  return items;
}