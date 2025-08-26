import { PropertyAssessment } from '@/features/assessments/types';
import { LineItem } from '@/features/items/types';

export interface PricingAdjustment {
  factor: string;
  multiplier: number;
  reason: string;
  category: 'condition' | 'complexity' | 'access' | 'equipment';
}

export interface AssessmentPricingResult {
  basePrice: number;
  adjustments: PricingAdjustment[];
  finalPrice: number;
  totalMultiplier: number;
  suggestedItems: Array<{
    item: LineItem;
    quantity: number;
    reason: string;
    priority: 'high' | 'medium' | 'low';
  }>;
}

/**
 * Calculate pricing adjustments based on property assessment data
 */
export function calculateAssessmentPricing(
  assessment: PropertyAssessment,
  baseItems: LineItem[],
  basePrice: number = 0
): AssessmentPricingResult {
  const adjustments: PricingAdjustment[] = [];
  const suggestedItems: AssessmentPricingResult['suggestedItems'] = [];

  // Lawn condition adjustments
  if (assessment.lawn_condition) {
    switch (assessment.lawn_condition) {
      case 'dead':
      case 'poor':
        adjustments.push({
          factor: 'Poor Lawn Condition',
          multiplier: 1.4,
          reason: 'Complete lawn renovation required with soil preparation',
          category: 'condition'
        });
        break;
      case 'patchy':
        adjustments.push({
          factor: 'Patchy Lawn',
          multiplier: 1.2,
          reason: 'Additional overseeding and spot treatment needed',
          category: 'condition'
        });
        break;
      case 'healthy':
        // No adjustment needed for healthy lawns
        break;
    }
  }

  // Soil condition adjustments
  if (assessment.soil_condition) {
    switch (assessment.soil_condition) {
      case 'compacted':
        adjustments.push({
          factor: 'Compacted Soil',
          multiplier: 1.25,
          reason: 'Aeration and soil amendment required',
          category: 'condition'
        });
        break;
      case 'contaminated':
        adjustments.push({
          factor: 'Contaminated Soil',
          multiplier: 1.6,
          reason: 'Specialized handling and disposal required',
          category: 'condition'
        });
        break;
      case 'clay':
        adjustments.push({
          factor: 'Clay Soil',
          multiplier: 1.2,
          reason: 'Clay soil requires additional amendments',
          category: 'condition'
        });
        break;
    }
  }

  // Weed coverage adjustments
  if (assessment.weed_coverage_percent) {
    if (assessment.weed_coverage_percent > 50) {
      adjustments.push({
        factor: 'Heavy Weed Infestation',
        multiplier: 1.3,
        reason: `${assessment.weed_coverage_percent}% weed coverage requires intensive treatment`,
        category: 'condition'
      });
    } else if (assessment.weed_coverage_percent > 25) {
      adjustments.push({
        factor: 'Moderate Weed Coverage',
        multiplier: 1.15,
        reason: `${assessment.weed_coverage_percent}% weed coverage needs treatment`,
        category: 'condition'
      });
    }
  }

  // Complexity score adjustments
  if (assessment.complexity_score) {
    if (assessment.complexity_score >= 8) {
      adjustments.push({
        factor: 'High Complexity',
        multiplier: 1.25,
        reason: 'Complex site conditions require specialized approach',
        category: 'complexity'
      });
    } else if (assessment.complexity_score >= 6) {
      adjustments.push({
        factor: 'Moderate Complexity',
        multiplier: 1.1,
        reason: 'Some site challenges increase labor requirements',
        category: 'complexity'
      });
    }
  }

  // Access and equipment adjustments
  if (assessment.vehicle_access_width_feet && assessment.vehicle_access_width_feet < 8) {
    adjustments.push({
      factor: 'Limited Vehicle Access',
      multiplier: 1.2,
      reason: `${assessment.vehicle_access_width_feet}ft access requires smaller equipment`,
      category: 'access'
    });
  }

  if (!assessment.dump_truck_access) {
    adjustments.push({
      factor: 'No Dump Truck Access',
      multiplier: 1.15,
      reason: 'Manual material transport increases labor costs',
      category: 'access'
    });
  }

  if (assessment.crane_access_needed) {
    adjustments.push({
      factor: 'Crane Access Required',
      multiplier: 1.3,
      reason: 'Specialized equipment rental and operation',
      category: 'equipment'
    });
  }

  // Slope adjustments
  if (assessment.slope_grade_percent && assessment.slope_grade_percent > 15) {
    adjustments.push({
      factor: 'Steep Slope',
      multiplier: 1.2,
      reason: `${assessment.slope_grade_percent}% grade increases difficulty and safety requirements`,
      category: 'complexity'
    });
  }

  // Obstacle density adjustments
  const lawnArea = assessment.lawn_area_measured || assessment.lawn_area_estimated || 1000;
  const treeCount = assessment.tree_count || 0;
  const shrubCount = assessment.shrub_count || 0;
  const totalObstacles = treeCount + shrubCount;
  const obstaclesDensity = totalObstacles / (lawnArea / 1000); // obstacles per 1000 sq ft

  if (obstaclesDensity > 10) {
    adjustments.push({
      factor: 'High Obstacle Density',
      multiplier: 1.25,
      reason: `${totalObstacles} obstacles in ${lawnArea} sq ft requires careful navigation`,
      category: 'complexity'
    });
  } else if (obstaclesDensity > 5) {
    adjustments.push({
      factor: 'Moderate Obstacles',
      multiplier: 1.1,
      reason: `${totalObstacles} obstacles require additional care`,
      category: 'complexity'
    });
  }

  // Calculate total multiplier
  const totalMultiplier = adjustments.reduce((total, adj) => total * adj.multiplier, 1);

  // Calculate final price
  const finalPrice = basePrice * totalMultiplier;

  return {
    basePrice,
    adjustments,
    finalPrice,
    totalMultiplier,
    suggestedItems
  };
}

/**
 * Generate line item suggestions based on assessment conditions
 */
export function generateAssessmentLineItems(
  assessment: PropertyAssessment,
  availableItems: LineItem[]
): Array<{
  item: LineItem;
  quantity: number;
  reason: string;
  priority: 'high' | 'medium' | 'low';
}> {
  const suggestions: Array<{
    item: LineItem;
    quantity: number;
    reason: string;
    priority: 'high' | 'medium' | 'low';
  }> = [];

  const lawnArea = assessment.lawn_area_measured || assessment.lawn_area_estimated || 1000;
  const areaInThousands = Math.ceil(lawnArea / 1000);

  // Lawn renovation items
  if (assessment.lawn_condition === 'dead' || assessment.lawn_condition === 'poor') {
    const sodItem = availableItems.find(item => 
      item.name.toLowerCase().includes('sod') || 
      item.name.toLowerCase().includes('turf')
    );
    if (sodItem) {
      suggestions.push({
        item: sodItem,
        quantity: areaInThousands,
        reason: `Lawn condition is ${assessment.lawn_condition} - complete renovation needed`,
        priority: 'high'
      });
    }

    const soilPrepItem = availableItems.find(item => 
      item.name.toLowerCase().includes('soil prep') || 
      item.name.toLowerCase().includes('tilling')
    );
    if (soilPrepItem) {
      suggestions.push({
        item: soilPrepItem,
        quantity: areaInThousands,
        reason: 'Soil preparation required for new lawn installation',
        priority: 'high'
      });
    }
  }

  // Overseeding for patchy lawns
  if (assessment.lawn_condition === 'patchy') {
    const overseedItem = availableItems.find(item => 
      item.name.toLowerCase().includes('overseed') || 
      item.name.toLowerCase().includes('seed')
    );
    if (overseedItem) {
      suggestions.push({
        item: overseedItem,
        quantity: areaInThousands,
        reason: 'Patchy lawn requires overseeding treatment',
        priority: 'medium'
      });
    }
  }

  // Aeration for compacted soil
  if (assessment.soil_condition === 'compacted') {
    const aerationItem = availableItems.find(item => 
      item.name.toLowerCase().includes('aerat')
    );
    if (aerationItem) {
      suggestions.push({
        item: aerationItem,
        quantity: areaInThousands,
        reason: 'Compacted soil requires core aeration',
        priority: 'high'
      });
    }
  }

  // Weed control
  if (assessment.weed_coverage_percent && assessment.weed_coverage_percent > 25) {
    const weedControlItem = availableItems.find(item => 
      item.name.toLowerCase().includes('weed') || 
      item.name.toLowerCase().includes('herbicide')
    );
    if (weedControlItem) {
      suggestions.push({
        item: weedControlItem,
        quantity: areaInThousands,
        reason: `${assessment.weed_coverage_percent}% weed coverage requires treatment`,
        priority: assessment.weed_coverage_percent > 50 ? 'high' : 'medium'
      });
    }
  }

  // Fertilization based on soil condition
  if (assessment.soil_condition === 'sandy' || assessment.soil_condition === 'clay') {
    const fertilizerItem = availableItems.find(item => 
      item.name.toLowerCase().includes('fertiliz') || 
      item.name.toLowerCase().includes('nutrient')
    );
    if (fertilizerItem) {
      suggestions.push({
        item: fertilizerItem,
        quantity: areaInThousands,
        reason: `${assessment.soil_condition} soil condition requires nutrient supplementation`,
        priority: 'medium'
      });
    }
  }

  // pH adjustment
  if (assessment.soil_ph) {
    if (assessment.soil_ph < 6.0) {
      const limeItem = availableItems.find(item => 
        item.name.toLowerCase().includes('lime')
      );
      if (limeItem) {
        suggestions.push({
          item: limeItem,
          quantity: areaInThousands,
          reason: `Soil pH of ${assessment.soil_ph} requires lime application`,
          priority: 'medium'
        });
      }
    } else if (assessment.soil_ph > 7.5) {
      const sulfurItem = availableItems.find(item => 
        item.name.toLowerCase().includes('sulfur')
      );
      if (sulfurItem) {
        suggestions.push({
          item: sulfurItem,
          quantity: areaInThousands,
          reason: `Soil pH of ${assessment.soil_ph} requires sulfur application`,
          priority: 'medium'
        });
      }
    }
  }

  // Drainage improvements
  if (assessment.drainage_quality && assessment.drainage_quality < 5) {
    const drainageItem = availableItems.find(item => 
      item.name.toLowerCase().includes('drain') || 
      item.name.toLowerCase().includes('french drain')
    );
    if (drainageItem) {
      suggestions.push({
        item: drainageItem,
        quantity: 1,
        reason: `Poor drainage quality (${assessment.drainage_quality}/10) needs improvement`,
        priority: 'medium'
      });
    }
  }

  return suggestions;
}

/**
 * Calculate labor hours based on assessment complexity
 */
export function calculateLaborHours(
  assessment: PropertyAssessment,
  baseHours: number = 0
): number {
  let totalHours = baseHours;

  // Use assessment's estimated hours if available
  if (assessment.total_estimated_hours) {
    totalHours = assessment.total_estimated_hours;
  } else {
    // Calculate based on area and complexity
    const lawnArea = assessment.lawn_area_measured || assessment.lawn_area_estimated || 1000;
    const baseHoursPerThousandSqFt = 4; // Base assumption
    
    totalHours = (lawnArea / 1000) * baseHoursPerThousandSqFt;

    // Adjust for complexity
    if (assessment.complexity_score) {
      const complexityMultiplier = 1 + (assessment.complexity_score - 5) * 0.1;
      totalHours *= complexityMultiplier;
    }

    // Adjust for conditions
    if (assessment.lawn_condition === 'dead' || assessment.lawn_condition === 'poor') {
      totalHours *= 1.5;
    } else if (assessment.lawn_condition === 'patchy') {
      totalHours *= 1.2;
    }

    if (assessment.soil_condition === 'compacted') {
      totalHours *= 1.3;
    }

    // Access adjustments
    if (assessment.vehicle_access_width_feet && assessment.vehicle_access_width_feet < 8) {
      totalHours *= 1.2;
    }

    if (!assessment.dump_truck_access) {
      totalHours *= 1.15;
    }
  }

  return Math.round(totalHours * 10) / 10; // Round to 1 decimal place
}

/**
 * Generate assessment-based quote summary
 */
export function generateAssessmentQuoteSummary(
  assessment: PropertyAssessment,
  pricingResult: AssessmentPricingResult
): string {
  const sections = [];

  // Property overview
  sections.push('PROPERTY ASSESSMENT SUMMARY');
  sections.push('=' .repeat(30));
  sections.push(`Property: ${(assessment as any).properties?.service_address || 'Address not available'}`);
  sections.push(`Assessment Date: ${assessment.scheduled_date ? new Date(assessment.scheduled_date).toLocaleDateString() : 'Not scheduled'}`);
  sections.push(`Overall Condition: ${assessment.overall_condition || 'Not assessed'}`);
  sections.push(`Lawn Area: ${assessment.lawn_area_measured || assessment.lawn_area_estimated || 'Not measured'} sq ft`);
  sections.push('');

  // Condition details
  if (assessment.lawn_condition || assessment.soil_condition) {
    sections.push('CONDITION ANALYSIS');
    sections.push('-'.repeat(20));
    if (assessment.lawn_condition) {
      sections.push(`Lawn Condition: ${assessment.lawn_condition}`);
    }
    if (assessment.soil_condition) {
      sections.push(`Soil Condition: ${assessment.soil_condition}`);
    }
    if (assessment.weed_coverage_percent) {
      sections.push(`Weed Coverage: ${assessment.weed_coverage_percent}%`);
    }
    if (assessment.complexity_score) {
      sections.push(`Complexity Score: ${assessment.complexity_score}/10`);
    }
    sections.push('');
  }

  // Pricing adjustments
  if (pricingResult.adjustments.length > 0) {
    sections.push('PRICING ADJUSTMENTS');
    sections.push('-'.repeat(20));
    pricingResult.adjustments.forEach(adj => {
      const percentage = ((adj.multiplier - 1) * 100).toFixed(0);
      sections.push(`${adj.factor}: +${percentage}% - ${adj.reason}`);
    });
    sections.push('');
    sections.push(`Total Adjustment Factor: ${pricingResult.totalMultiplier.toFixed(2)}x`);
    sections.push('');
  }

  // Recommendations
  if (pricingResult.suggestedItems.length > 0) {
    sections.push('RECOMMENDED SERVICES');
    sections.push('-'.repeat(20));
    pricingResult.suggestedItems.forEach(suggestion => {
      sections.push(`• ${suggestion.item.name} (${suggestion.quantity} ${suggestion.item.unit}) - ${suggestion.reason}`);
    });
  }

  return sections.join('\n');
}
