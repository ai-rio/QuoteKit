import { Property } from '@/features/clients/types';
import { LineItem } from '@/features/items/types';
import { AssessmentPricingResult, PricingOverride } from '@/features/quotes/pricing-engine/PropertyConditionPricing';

import { PropertyAssessment } from '../../types';

export interface AssessmentToQuoteIntegrationProps {
  assessment: PropertyAssessment;
  property?: Property;
  availableItems: LineItem[];
  onQuoteCreated?: (quoteId: string) => void;
}

export interface AssessmentQuotePreview {
  suggestedItems: Array<{
    item: LineItem;
    quantity: number;
    reason: string;
    priority: 'high' | 'medium' | 'low';
    assessmentBased: boolean;
    confidenceLevel: 'high' | 'medium' | 'low';
  }>;
  estimatedTotal: number;
  pricingResult: AssessmentPricingResult;
  laborHours: number;
  validationResult: {
    isValid: boolean;
    warnings: string[];
    errors: string[];
  };
  overrides: PricingOverride[];
}

export interface SuggestedLineItem {
  item: LineItem;
  quantity: number;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  assessmentBased: boolean;
  confidenceLevel: 'high' | 'medium' | 'low';
}

export interface QuotePreview {
  suggestedItems: SuggestedLineItem[];
  pricingResult: AssessmentPricingResult;
  estimatedTotal: number;
  laborHours: number;
  confidenceScore: number;
  generatedAt: Date;
}

export interface AssessmentMetrics {
  completeness: number;
  dataQuality: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  estimatedAccuracy: number;
}

export interface AssessmentIntegrationProps {
  assessment: PropertyAssessment;
  property?: Property;
  availableItems: LineItem[];
  onQuoteCreated?: (quoteId: string) => void;
  className?: string;
}