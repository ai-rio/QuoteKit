'use server';

import { revalidatePath } from 'next/cache';

import { createQuote } from '@/features/quotes/actions';
import { CreateQuoteData, Quote, QuoteLineItem } from '@/features/quotes/types';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { ActionResponse } from '@/types/action-response';

import { PropertyAssessment } from '../types';

interface GenerateQuoteFromAssessmentData {
  assessmentId: string;
  propertyId: string;
  suggestedItems: Array<{
    itemId: string;
    quantity: number;
    reason: string;
  }>;
  conditionAdjustments: Array<{
    condition: string;
    adjustment: number;
    reason: string;
  }>;
  complexityMultiplier: number;
}

interface AssessmentQuoteData {
  assessment: PropertyAssessment;
  property: any;
  client: any;
  lineItems: QuoteLineItem[];
  adjustments: {
    subtotal: number;
    adjustmentMultiplier: number;
    complexityMultiplier: number;
    finalTotal: number;
  };
}

/**
 * Generate a quote from assessment data with intelligent line item suggestions
 * and condition-based pricing adjustments
 */
export async function generateQuoteFromAssessment(
  data: GenerateQuoteFromAssessmentData
): Promise<ActionResponse<Quote>> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    // Get assessment with property and client details
    const { data: assessment, error: assessmentError } = await supabase
      .from('property_assessments')
      .select(`
        *,
        properties!inner (
          *,
          clients!inner (*)
        )
      `)
      .eq('id', data.assessmentId)
      .eq('user_id', user.id)
      .single();

    if (assessmentError || !assessment) {
      return { 
        data: null, 
        error: { message: 'Assessment not found or access denied' } 
      };
    }

    // Get suggested items from database
    const itemIds = data.suggestedItems.map(item => item.itemId);
    const { data: items, error: itemsError } = await supabase
      .from('line_items')
      .select('*')
      .in('id', itemIds)
      .eq('user_id', user.id);

    if (itemsError) {
      return { 
        data: null, 
        error: { message: 'Failed to fetch line items' } 
      };
    }

    // Build quote line items with assessment-based adjustments
    const quoteLineItems: QuoteLineItem[] = [];
    let subtotal = 0;

    for (const suggestion of data.suggestedItems) {
      const item = items?.find(i => i.id === suggestion.itemId);
      if (!item) continue;

      // Apply condition-based pricing adjustments
      let adjustedCost = item.cost;
      for (const adjustment of data.conditionAdjustments) {
        adjustedCost *= adjustment.adjustment;
      }

      // Apply complexity multiplier
      adjustedCost *= data.complexityMultiplier;

      const lineItem: QuoteLineItem = {
        id: item.id,
        name: `${item.name} (Assessment-Based)`,
        unit: item.unit,
        cost: adjustedCost,
        quantity: suggestion.quantity
      };

      quoteLineItems.push(lineItem);
      subtotal += adjustedCost * suggestion.quantity;
    }

    // Create assessment-based quote title and description
    const quoteTitle = `${assessment.properties.service_address} - Assessment Quote`;
    const quoteDescription = generateAssessmentQuoteDescription(assessment, data);

    // Prepare quote data - match CreateQuoteData interface exactly
    const quoteData: CreateQuoteData = {
      client_id: assessment.properties.client_id,
      client_name: assessment.properties.clients.name,
      client_contact: assessment.properties.clients.email || assessment.properties.clients.phone || '',
      property_id: assessment.property_id,
      quote_data: quoteLineItems, // Just the array of line items
      tax_rate: 0.08, // Default 8% - should come from company settings
      markup_rate: assessment.profit_margin_percent ? assessment.profit_margin_percent / 100 : 0.20,
    };

    // Create the quote using existing quote creation logic
    const result = await createQuote(quoteData);

    if (result?.error) {
      return result;
    }

    // Link the assessment to the created quote
    if (result?.data) {
      const { error: linkError } = await supabase
        .from('property_assessments')
        .update({ quote_id: result.data.id })
        .eq('id', data.assessmentId);

      if (linkError) {
        console.warn('Failed to link assessment to quote:', linkError);
        // Don't fail the entire operation for this
      }
    }

    revalidatePath('/quotes');
    revalidatePath('/assessments');
    revalidatePath(`/assessments/${data.assessmentId}`);

    return result;

  } catch (error) {
    console.error('Error generating quote from assessment:', error);
    return { 
      data: null, 
      error: { message: 'Failed to generate quote from assessment' } 
    };
  }
}

/**
 * Generate a detailed description for assessment-based quotes
 */
function generateAssessmentQuoteDescription(
  assessment: PropertyAssessment, 
  data: GenerateQuoteFromAssessmentData
): string {
  const sections = [];

  // Property overview
  sections.push(`Property Assessment Summary:`);
  sections.push(`- Overall Condition: ${assessment.overall_condition || 'Not assessed'}`);
  sections.push(`- Lawn Area: ${assessment.lawn_area_measured || assessment.lawn_area_estimated || 'Not measured'} sq ft`);
  sections.push(`- Complexity Score: ${assessment.complexity_score || 'Not rated'}/10`);

  // Condition details
  if (assessment.lawn_condition || assessment.soil_condition) {
    sections.push(`\nCondition Details:`);
    if (assessment.lawn_condition) {
      sections.push(`- Lawn Condition: ${assessment.lawn_condition}`);
    }
    if (assessment.soil_condition) {
      sections.push(`- Soil Condition: ${assessment.soil_condition}`);
    }
    if (assessment.weed_coverage_percent) {
      sections.push(`- Weed Coverage: ${assessment.weed_coverage_percent}%`);
    }
  }

  // Access and logistics
  if (assessment.vehicle_access_width_feet || !assessment.dump_truck_access) {
    sections.push(`\nAccess Considerations:`);
    if (assessment.vehicle_access_width_feet) {
      sections.push(`- Vehicle Access Width: ${assessment.vehicle_access_width_feet} feet`);
    }
    if (!assessment.dump_truck_access) {
      sections.push(`- Limited dump truck access - manual transport required`);
    }
  }

  // Pricing adjustments explanation
  if (data.conditionAdjustments.length > 0) {
    sections.push(`\nPricing Adjustments Applied:`);
    data.conditionAdjustments.forEach(adj => {
      const percentage = ((adj.adjustment - 1) * 100).toFixed(0);
      sections.push(`- ${adj.condition}: +${percentage}% (${adj.reason})`);
    });
  }

  if (data.complexityMultiplier > 1) {
    const percentage = ((data.complexityMultiplier - 1) * 100).toFixed(0);
    sections.push(`- Complexity Adjustment: +${percentage}%`);
  }

  return sections.join('\n');
}

/**
 * Get assessment data for quote integration
 */
export async function getAssessmentQuoteData(
  assessmentId: string
): Promise<ActionResponse<AssessmentQuoteData>> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    const { data: assessment, error: assessmentError } = await supabase
      .from('property_assessments')
      .select(`
        *,
        properties!inner (
          *,
          clients!inner (*)
        )
      `)
      .eq('id', assessmentId)
      .eq('user_id', user.id)
      .single();

    if (assessmentError || !assessment) {
      return { 
        data: null, 
        error: { message: 'Assessment not found' } 
      };
    }

    // Generate suggested line items based on assessment
    const lineItems: QuoteLineItem[] = [];
    
    // This would be expanded with more sophisticated logic
    // For now, return basic structure
    const adjustments = {
      subtotal: 0,
      adjustmentMultiplier: 1,
      complexityMultiplier: assessment.complexity_score ? assessment.complexity_score / 10 : 1,
      finalTotal: 0
    };

    return {
      data: {
        assessment,
        property: assessment.properties,
        client: assessment.properties.clients,
        lineItems,
        adjustments
      },
      error: null
    };

  } catch (error) {
    console.error('Error getting assessment quote data:', error);
    return { 
      data: null, 
      error: { message: 'Failed to get assessment data' } 
    };
  }
}

/**
 * Update quote with assessment data changes
 */
export async function updateQuoteFromAssessment(
  quoteId: string,
  assessmentId: string
): Promise<ActionResponse<Quote>> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    // Get current quote and assessment
    const [quoteResult, assessmentResult] = await Promise.all([
      supabase
        .from('quotes')
        .select('*')
        .eq('id', quoteId)
        .eq('user_id', user.id)
        .single(),
      supabase
        .from('property_assessments')
        .select('*')
        .eq('id', assessmentId)
        .eq('user_id', user.id)
        .single()
    ]);

    if (quoteResult.error || !quoteResult.data) {
      return { data: null, error: { message: 'Quote not found' } };
    }

    if (assessmentResult.error || !assessmentResult.data) {
      return { data: null, error: { message: 'Assessment not found' } };
    }

    // Update quote with latest assessment data
    const updatedQuoteData = {
      ...quoteResult.data.quote_data,
      assessment_id: assessmentId,
      assessment_notes: assessmentResult.data.assessment_notes,
      recommendations: assessmentResult.data.recommendations,
      last_assessment_update: new Date().toISOString()
    };

    const { data: updatedQuote, error: updateError } = await supabase
      .from('quotes')
      .update({
        quote_data: updatedQuoteData,
        updated_at: new Date().toISOString()
      })
      .eq('id', quoteId)
      .select()
      .single();

    if (updateError) {
      return { data: null, error: { message: 'Failed to update quote' } };
    }

    revalidatePath('/quotes');
    revalidatePath(`/quotes/${quoteId}`);

    return { data: updatedQuote, error: null };

  } catch (error) {
    console.error('Error updating quote from assessment:', error);
    return { 
      data: null, 
      error: { message: 'Failed to update quote from assessment' } 
    };
  }
}
