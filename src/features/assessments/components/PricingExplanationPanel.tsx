'use client';

import { 
  ArrowUp, 
  ArrowDown, 
  Info, 
  TrendingUp, 
  Droplets, 
  TreePine, 
  Wrench,
  MapPin,
  Calculator,
  ChevronRight
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Property } from '@/features/clients/types';

import { PropertyAssessment } from '../types';

interface PricingExplanationPanelProps {
  assessment: PropertyAssessment;
  property: Property;
  showComparison?: boolean;
}

interface ConditionIndicator {
  value: string;
  score: number; // 1-10 scale
  color: 'red' | 'yellow' | 'green';
  priceImpact: {
    multiplier: number;
    explanation: string;
    additionalCost: number;
    additionalServices?: string[];
  };
}

interface PricingBreakdown {
  baseCalculation: {
    area: number;
    baseRate: number;
    subtotal: number;
  };
  adjustments: Array<{
    factor: string;
    multiplier: number;
    cost: number;
    explanation: string;
  }>;
  finalPricing: {
    subtotal: number;
    total: number;
    profitMargin: number;
  };
}

interface MarketComparison {
  typicalRange: [number, number];
  thisProperty: number;
  explanation: string;
}

export function PricingExplanationPanel({ 
  assessment, 
  property, 
  showComparison = true 
}: PricingExplanationPanelProps) {
  const conditionBreakdown = generateConditionBreakdown(assessment, property);
  const pricingBreakdown = calculatePricingBreakdown(assessment, property);
  const marketComparison = generateMarketComparison(assessment, property, pricingBreakdown.finalPricing.total);

  return (
    <TooltipProvider>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Calculator className="h-5 w-5 text-[hsl(var(--forest-green))]" />
        <h3 className="text-lg font-semibold text-[hsl(var(--forest-green))]">
          Pricing Explanation
        </h3>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="h-4 w-4 text-gray-500 cursor-help" />
          </TooltipTrigger>
          <TooltipContent>
            <p>Transparent breakdown of how property conditions affect pricing</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Condition Assessment Panel */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-medium text-[hsl(var(--charcoal))] flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Property Conditions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Lawn Condition */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TreePine className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-sm text-[hsl(var(--charcoal))]">
                    Lawn Condition
                  </span>
                </div>
                <Badge variant={conditionBreakdown.lawnCondition.color === 'red' ? 'destructive' : 
                              conditionBreakdown.lawnCondition.color === 'yellow' ? 'default' : 'secondary'}>
                  {conditionBreakdown.lawnCondition.value}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Health Score</span>
                  <span className="text-xs font-medium">{conditionBreakdown.lawnCondition.score}/10</span>
                </div>
                <Progress 
                  value={conditionBreakdown.lawnCondition.score * 10} 
                  className="h-2"
                />
              </div>

              <PriceImpactDisplay impact={conditionBreakdown.lawnCondition.priceImpact} />
            </div>

            {/* Soil Condition */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-brown-600" />
                  <span className="font-medium text-sm text-[hsl(var(--charcoal))]">
                    Soil Condition
                  </span>
                </div>
                <Badge variant={conditionBreakdown.soilCondition.color === 'red' ? 'destructive' : 
                              conditionBreakdown.soilCondition.color === 'yellow' ? 'default' : 'secondary'}>
                  {conditionBreakdown.soilCondition.value}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Health Score</span>
                  <span className="text-xs font-medium">{conditionBreakdown.soilCondition.score}/10</span>
                </div>
                <Progress 
                  value={conditionBreakdown.soilCondition.score * 10} 
                  className="h-2"
                />
              </div>

              <PriceImpactDisplay impact={conditionBreakdown.soilCondition.priceImpact} />
            </div>

            {/* Complexity Score */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-orange-600" />
                  <span className="font-medium text-sm text-[hsl(var(--charcoal))]">
                    Work Complexity
                  </span>
                </div>
                <Badge variant={conditionBreakdown.complexityScore.color === 'red' ? 'destructive' : 
                              conditionBreakdown.complexityScore.color === 'yellow' ? 'default' : 'secondary'}>
                  Level {conditionBreakdown.complexityScore.score}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Complexity Factors</span>
                  <span className="text-xs font-medium">{conditionBreakdown.complexityScore.score}/10</span>
                </div>
                <Progress 
                  value={conditionBreakdown.complexityScore.score * 10} 
                  className="h-2"
                />
                {conditionBreakdown.complexityScore.priceImpact.additionalServices && (
                  <div className="text-xs text-gray-600 space-y-1">
                    {conditionBreakdown.complexityScore.priceImpact.additionalServices.map((service, index) => (
                      <div key={index} className="flex items-center gap-1">
                        <ChevronRight className="h-3 w-3" />
                        {service}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <PriceImpactDisplay impact={conditionBreakdown.complexityScore.priceImpact} />
            </div>

            {/* Access Difficulty */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-sm text-[hsl(var(--charcoal))]">
                    Access Difficulty
                  </span>
                </div>
                <Badge variant={conditionBreakdown.accessDifficulty.color === 'red' ? 'destructive' : 
                              conditionBreakdown.accessDifficulty.color === 'yellow' ? 'default' : 'secondary'}>
                  {conditionBreakdown.accessDifficulty.value}
                </Badge>
              </div>

              <PriceImpactDisplay impact={conditionBreakdown.accessDifficulty.priceImpact} />
            </div>
          </CardContent>
        </Card>

        {/* Pricing Calculation Panel */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-medium text-[hsl(var(--charcoal))] flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Pricing Calculation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Base Calculation */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-[hsl(var(--charcoal))]">Base Service Cost</h4>
              <div className="bg-gray-50 p-3 rounded-md space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Property Area</span>
                  <span>{pricingBreakdown.baseCalculation.area.toLocaleString()} sq ft</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Base Rate</span>
                  <span>${pricingBreakdown.baseCalculation.baseRate.toFixed(2)}/sq ft</span>
                </div>
                <div className="flex justify-between items-center text-sm font-medium border-t pt-2">
                  <span>Subtotal</span>
                  <span>${pricingBreakdown.baseCalculation.subtotal.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Adjustments */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-[hsl(var(--charcoal))]">Condition Adjustments</h4>
              <div className="space-y-2">
                {pricingBreakdown.adjustments.map((adjustment, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-amber-50 rounded-md">
                    <div className="flex items-center gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-sm text-gray-700 cursor-help">
                            {adjustment.factor}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">{adjustment.explanation}</p>
                        </TooltipContent>
                      </Tooltip>
                      <Badge variant="outline" className="text-xs">
                        +{((adjustment.multiplier - 1) * 100).toFixed(0)}%
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <ArrowUp className="h-3 w-3 text-red-500" />
                      <span className="text-sm font-medium">
                        +${adjustment.cost.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Final Pricing */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-[hsl(var(--charcoal))]">Final Pricing</h4>
              <div className="bg-[hsl(var(--forest-green))]/5 p-3 rounded-md space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Service Subtotal</span>
                  <span>${pricingBreakdown.finalPricing.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Profit Margin ({pricingBreakdown.finalPricing.profitMargin}%)</span>
                  <span>${(pricingBreakdown.finalPricing.total - pricingBreakdown.finalPricing.subtotal).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-lg font-bold border-t pt-2 text-[hsl(var(--forest-green))]">
                  <span>Total Quote</span>
                  <span>${pricingBreakdown.finalPricing.total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Market Comparison */}
      {showComparison && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-medium text-[hsl(var(--charcoal))] flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Market Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Typical Range for Similar Properties</span>
                <span className="text-sm font-medium">
                  ${marketComparison.typicalRange[0].toLocaleString()} - ${marketComparison.typicalRange[1].toLocaleString()}
                </span>
              </div>
              
              <div className="relative">
                <div className="flex justify-between mb-2">
                  <span className="text-xs text-gray-500">${marketComparison.typicalRange[0].toLocaleString()}</span>
                  <span className="text-xs text-gray-500">${marketComparison.typicalRange[1].toLocaleString()}</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full relative">
                  <div className="absolute inset-0 bg-green-200 rounded-full" />
                  <div 
                    className="absolute h-2 w-1 bg-[hsl(var(--forest-green))] rounded-full"
                    style={{
                      left: `${((marketComparison.thisProperty - marketComparison.typicalRange[0]) / 
                                (marketComparison.typicalRange[1] - marketComparison.typicalRange[0])) * 100}%`
                    }}
                  />
                </div>
                <div className="flex justify-center mt-2">
                  <Badge variant="outline" className="text-xs">
                    This Property: ${marketComparison.thisProperty.toLocaleString()}
                  </Badge>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
                {marketComparison.explanation}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      </div>
    </TooltipProvider>
  );
}

// Helper component for price impact display
function PriceImpactDisplay({ impact }: { impact: ConditionIndicator['priceImpact'] }) {
  return (
    <div className="bg-gray-50 p-2 rounded-md">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-600">Price Impact</span>
        <div className="flex items-center gap-1">
          {impact.multiplier > 1 ? (
            <ArrowUp className="h-3 w-3 text-red-500" />
          ) : impact.multiplier < 1 ? (
            <ArrowDown className="h-3 w-3 text-green-500" />
          ) : null}
          <span className="text-xs font-medium">
            {impact.multiplier > 1 ? '+' : ''}${impact.additionalCost.toLocaleString()}
          </span>
        </div>
      </div>
      <p className="text-xs text-gray-600">{impact.explanation}</p>
      {impact.additionalServices && (
        <div className="mt-2 space-y-1">
          {impact.additionalServices.map((service, index) => (
            <div key={index} className="flex items-center gap-1">
              <ChevronRight className="h-3 w-3 text-gray-400" />
              <span className="text-xs text-gray-600">{service}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Helper functions
function generateConditionBreakdown(assessment: PropertyAssessment, property: Property) {
  const baseArea = property.square_footage || 5000;
  const baseRate = 0.15;
  const baseEstimate = baseArea * baseRate;

  return {
    lawnCondition: generateLawnConditionIndicator(assessment, baseEstimate),
    soilCondition: generateSoilConditionIndicator(assessment, baseEstimate), 
    complexityScore: generateComplexityIndicator(assessment, baseEstimate),
    accessDifficulty: generateAccessDifficultyIndicator(property, baseEstimate)
  };
}

function generateLawnConditionIndicator(assessment: PropertyAssessment, baseEstimate: number): ConditionIndicator {
  const condition = assessment.lawn_condition || 'good';
  let score = 7;
  let color: 'red' | 'yellow' | 'green' = 'green';
  let multiplier = 1.0;
  let explanation = 'Lawn is in good condition with minimal additional work required';
  
  switch (condition) {
    case 'dead':
      score = 2;
      color = 'red';
      multiplier = 1.4;
      explanation = 'Complete lawn renovation required including seeding, fertilization, and intensive care';
      break;
    case 'poor':
      score = 3;
      color = 'red';
      multiplier = 1.3;
      explanation = 'Significant lawn restoration needed with overseeding and enhanced treatment';
      break;
    case 'fair':
      score = 5;
      color = 'yellow';
      multiplier = 1.15;
      explanation = 'Moderate lawn improvement needed with targeted treatments';
      break;
    case 'good':
      score = 7;
      color = 'green';
      multiplier = 1.0;
      break;
    case 'excellent':
      score = 9;
      color = 'green';
      multiplier = 0.95;
      explanation = 'Excellent lawn condition allows for maintenance-focused approach';
      break;
  }
  
  return {
    value: condition,
    score,
    color,
    priceImpact: {
      multiplier,
      explanation,
      additionalCost: baseEstimate * (multiplier - 1),
      additionalServices: multiplier > 1.2 ? ['Overseeding', 'Soil preparation', 'Enhanced fertilization'] : undefined
    }
  };
}

function generateSoilConditionIndicator(assessment: PropertyAssessment, baseEstimate: number): ConditionIndicator {
  const condition = assessment.soil_condition || 'good';
  let score = 7;
  let color: 'red' | 'yellow' | 'green' = 'green';
  let multiplier = 1.0;
  let explanation = 'Soil condition supports standard maintenance approach';
  
  switch (condition) {
    case 'contaminated':
      score = 2;
      color = 'red';
      multiplier = 1.5;
      explanation = 'Soil contamination requires remediation and specialized treatment';
      break;
    case 'poor':
      score = 3;
      color = 'red';
      multiplier = 1.3;
      explanation = 'Poor soil quality requires amendment and intensive treatment';
      break;
    case 'compacted':
      score = 4;
      color = 'yellow';
      multiplier = 1.2;
      explanation = 'Compacted soil needs aeration and amendment for optimal results';
      break;
    case 'good':
      score = 7;
      color = 'green';
      multiplier = 1.0;
      break;
    case 'excellent':
      score = 9;
      color = 'green';
      multiplier = 0.95;
      explanation = 'Excellent soil condition supports efficient treatment';
      break;
  }
  
  return {
    value: condition,
    score,
    color,
    priceImpact: {
      multiplier,
      explanation,
      additionalCost: baseEstimate * (multiplier - 1),
      additionalServices: multiplier > 1.15 ? ['Soil aeration', 'Soil amendment', 'pH adjustment'] : undefined
    }
  };
}

function generateComplexityIndicator(assessment: PropertyAssessment, baseEstimate: number): ConditionIndicator {
  let score = 5; // Base complexity
  let factors: string[] = [];
  
  // Assess complexity factors
  // if (assessment.terrain === 'steep') {
  //   score += 2;
  //   factors.push('Steep terrain');
  // }
  if (assessment.tree_count && assessment.tree_count > 10) {
    score += 1;
    factors.push('Many trees/obstacles');
  }
  if (assessment.bare_spots_count && assessment.bare_spots_count > 5) {
    score += 1;
    factors.push('Multiple bare spots');
  }
  if (assessment.weed_coverage_percent && assessment.weed_coverage_percent > 40) {
    score += 1;
    factors.push('Extensive weed coverage');
  }
  
  score = Math.min(10, Math.max(1, score));
  
  let color: 'red' | 'yellow' | 'green' = 'green';
  let multiplier = 1.0;
  let explanation = 'Standard complexity work requirements';
  
  if (score >= 8) {
    color = 'red';
    multiplier = 1.25;
    explanation = 'High complexity requires specialized equipment and additional labor time';
  } else if (score >= 6) {
    color = 'yellow';
    multiplier = 1.1;
    explanation = 'Moderate complexity with some additional work requirements';
  }
  
  return {
    value: `${score}/10`,
    score,
    color,
    priceImpact: {
      multiplier,
      explanation,
      additionalCost: baseEstimate * (multiplier - 1),
      additionalServices: factors.length > 0 ? factors : undefined
    }
  };
}

function generateAccessDifficultyIndicator(property: Property, baseEstimate: number): ConditionIndicator {
  const difficulty = property.property_access || 'easy';
  let score = 8;
  let color: 'red' | 'yellow' | 'green' = 'green';
  let multiplier = 1.0;
  let explanation = 'Easy equipment access with standard setup time';
  
  switch (difficulty) {
    case 'difficult':
      score = 3;
      color = 'red';
      multiplier = 1.2;
      explanation = 'Difficult access requires additional labor time and equipment positioning';
      break;
    case 'moderate':
      score = 6;
      color = 'yellow';
      multiplier = 1.1;
      explanation = 'Moderate access limitations may require some additional setup time';
      break;
    case 'easy':
      score = 8;
      color = 'green';
      multiplier = 1.0;
      break;
  }
  
  return {
    value: difficulty,
    score,
    color,
    priceImpact: {
      multiplier,
      explanation,
      additionalCost: baseEstimate * (multiplier - 1)
    }
  };
}

function calculatePricingBreakdown(assessment: PropertyAssessment, property: Property): PricingBreakdown {
  const baseArea = property.square_footage || 5000;
  const baseRate = 0.15;
  const baseSubtotal = baseArea * baseRate;
  
  const adjustments = [];
  let totalMultiplier = 1.0;
  
  // Apply condition-based adjustments
  if (assessment.lawn_condition === 'poor' || assessment.lawn_condition === 'dead') {
    const multiplier = assessment.lawn_condition === 'dead' ? 1.4 : 1.3;
    totalMultiplier *= multiplier;
    adjustments.push({
      factor: 'Poor Lawn Condition',
      multiplier,
      cost: baseSubtotal * (multiplier - 1),
      explanation: 'Additional work required for lawn restoration'
    });
  }
  
  if (assessment.soil_condition === 'compacted' || assessment.soil_condition === 'contaminated') {
    const multiplier = assessment.soil_condition === 'contaminated' ? 1.5 : 1.2;
    totalMultiplier *= multiplier;
    adjustments.push({
      factor: 'Soil Treatment',
      multiplier,
      cost: baseSubtotal * (multiplier - 1),
      explanation: 'Soil amendment and treatment required'
    });
  }
  
  if (property.property_access === 'difficult') {
    const multiplier = 1.2;
    totalMultiplier *= multiplier;
    adjustments.push({
      factor: 'Access Difficulty',
      multiplier,
      cost: baseSubtotal * (multiplier - 1),
      explanation: 'Additional time required for equipment access'
    });
  }
  
  const adjustedSubtotal = baseSubtotal * totalMultiplier;
  const profitMargin = 25; // 25% profit margin
  const total = adjustedSubtotal * (1 + profitMargin / 100);
  
  return {
    baseCalculation: {
      area: baseArea,
      baseRate,
      subtotal: baseSubtotal
    },
    adjustments,
    finalPricing: {
      subtotal: adjustedSubtotal,
      total,
      profitMargin
    }
  };
}

function generateMarketComparison(assessment: PropertyAssessment, property: Property, totalPrice: number): MarketComparison {
  const baseArea = property.square_footage || 5000;
  
  // Generate typical range based on property size and location
  const lowEnd = Math.round(baseArea * 0.12);
  const highEnd = Math.round(baseArea * 0.20);
  
  let explanation = '';
  const position = (totalPrice - lowEnd) / (highEnd - lowEnd);
  
  if (position < 0.3) {
    explanation = 'This quote is below typical market rates due to good property conditions requiring minimal additional work.';
  } else if (position > 0.7) {
    explanation = 'This quote is above typical market rates due to challenging property conditions requiring specialized treatment and additional services.';
  } else {
    explanation = 'This quote falls within the typical market range for properties of similar size and condition in your area.';
  }
  
  return {
    typicalRange: [lowEnd, highEnd],
    thisProperty: totalPrice,
    explanation
  };
}