import { toast } from '@/components/ui/use-toast';
import { LineItem } from '@/features/items/types';
import { 
  calculateOptimizedAssessmentPricing,
  generateAssessmentLineItems,
  validatePricingResult,
} from '@/features/quotes/pricing-engine/PropertyConditionPricing';

import { PropertyAssessment } from '../../types';
import { AssessmentMetrics,AssessmentQuotePreview } from './types';

/**
 * Generate quote preview based on assessment data using enhanced pricing engine
 */
export const generateQuotePreview = (
  assessment: PropertyAssessment,
  availableItems: LineItem[]
): AssessmentQuotePreview => {
  const startTime = performance.now();
  
  // Use the optimized pricing engine for faster calculation
  const basePrice = availableItems.reduce((sum, item) => sum + item.cost, 0);
  const pricingResult = calculateOptimizedAssessmentPricing(assessment, availableItems, basePrice, {
    useCache: true, // Enable caching for performance
    skipEquipmentCalculation: false,
    skipMaterialCalculation: false,
    skipLaborBreakdown: false
  });
  
  // Generate intelligent line item suggestions with assessment-based confidence
  const suggestedItems = generateAssessmentLineItems(assessment, availableItems);
  
  // Validate the pricing calculation for accuracy
  const validationResult = validatePricingResult(pricingResult);
  
  // Calculate total labor hours from the detailed breakdown
  const laborHours = pricingResult.totalLaborHours;
  
  // The final price already includes all components in the enhanced engine
  const estimatedTotal = pricingResult.finalPrice;

  const endTime = performance.now();
  console.log(`Quote preview generated in ${(endTime - startTime).toFixed(2)}ms`);
  
  // Show validation warnings if any
  if (validationResult.warnings.length > 0) {
    toast({
      title: 'Pricing Validation Warnings',
      description: validationResult.warnings.join('; '),
      variant: 'default',
    });
  }
  
  if (validationResult.errors.length > 0) {
    toast({
      title: 'Pricing Validation Errors',
      description: validationResult.errors.join('; '),
      variant: 'destructive',
    });
  }

  return {
    suggestedItems,
    estimatedTotal,
    pricingResult,
    laborHours,
    validationResult,
    overrides: [] // Initialize with no overrides
  };
};

/**
 * Calculate assessment metrics for quality scoring
 */
export const calculateAssessmentMetrics = (assessment: PropertyAssessment): AssessmentMetrics => {
  let completeness = 0;
  let dataQuality = 0;
  
  // Completeness score (based on available data fields)
  const fields = [
    assessment.overall_condition,
    assessment.lawn_condition,
    assessment.soil_condition,
    assessment.complexity_score,
    assessment.lawn_area_measured || assessment.lawn_area_estimated,
    assessment.total_estimated_hours
  ];
  completeness = (fields.filter(Boolean).length / fields.length) * 100;

  // Data quality score (based on measured vs estimated values)
  const hasAccurateMeasurements = !!(
    assessment.lawn_area_measured && 
    assessment.measurements_verified
  );
  const hasDetailedNotes = !!(
    assessment.assessment_notes && assessment.assessment_notes.length > 20
  );
  const hasPhotos = !!(
    assessment.photos_taken_count && assessment.photos_taken_count > 0
  );

  dataQuality = (
    (hasAccurateMeasurements ? 40 : 20) +
    (hasDetailedNotes ? 30 : 10) +
    (hasPhotos ? 30 : 15)
  );

  // Overall confidence level based on completeness and data quality
  const confidenceScore = (completeness + dataQuality) / 2;
  let confidenceLevel: 'high' | 'medium' | 'low';
  
  if (confidenceScore >= 80) confidenceLevel = 'high';
  else if (confidenceScore >= 60) confidenceLevel = 'medium';
  else confidenceLevel = 'low';

  return {
    completeness: Math.round(completeness),
    dataQuality: Math.round(dataQuality),
    confidenceLevel,
    estimatedAccuracy: Math.round(confidenceScore)
  };
};

/**
 * Get styling for priority badges
 */
export const getPriorityColor = (priority: 'high' | 'medium' | 'low'): string => {
  switch (priority) {
    case 'high': return 'bg-red-100 text-red-800 border-red-200';
    case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'low': return 'bg-green-100 text-green-800 border-green-200';
  }
};

/**
 * Get styling for confidence level indicators
 */
export const getConfidenceStyles = (level: 'high' | 'medium' | 'low'): string => {
  switch (level) {
    case 'high': return 'text-green-600 bg-green-50';
    case 'medium': return 'text-yellow-600 bg-yellow-50';
    case 'low': return 'text-red-600 bg-red-50';
  }
};