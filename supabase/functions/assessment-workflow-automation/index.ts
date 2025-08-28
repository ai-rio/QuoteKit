import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface AssessmentWorkflowRequest {
  action: 'generate_quote' | 'calculate_pricing' | 'get_workflow_status' | 'bulk_generate'
  assessment_id?: string
  assessment_ids?: string[]
  template_id?: string
  user_id?: string
}

interface WorkflowResponse {
  success: boolean
  data?: any
  error?: string
  details?: any
}

interface PricingExplanation {
  base_calculation: {
    area_sqft: number
    base_rate_per_sqft: number
    base_cost: number
  }
  condition_adjustments: {
    lawn_condition: {
      condition: string
      multiplier: number
      reason: string
    }
    soil_condition: {
      condition: string
      multiplier: number
      reason: string
    }
    complexity_factors: {
      score: number
      multiplier: number
      reason: string
    }
  }
  additional_services: Record<string, number>
  profit_margin_percent: number
  tax_rate_percent: number
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Parse request
    const requestData: AssessmentWorkflowRequest = await req.json()
    const { action, assessment_id, assessment_ids, template_id, user_id } = requestData

    // Get user ID from auth header if not provided
    const authHeader = req.headers.get('Authorization')
    let currentUserId = user_id

    if (!currentUserId && authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user } } = await supabase.auth.getUser(token)
      currentUserId = user?.id
    }

    if (!currentUserId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Authentication required' 
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    let response: WorkflowResponse

    switch (action) {
      case 'generate_quote':
        response = await generateQuoteFromAssessment(supabase, assessment_id!, template_id, currentUserId)
        break
        
      case 'calculate_pricing':
        response = await calculatePricingOnly(supabase, assessment_id!, currentUserId)
        break
        
      case 'get_workflow_status':
        response = await getWorkflowStatus(supabase, assessment_id!, currentUserId)
        break
        
      case 'bulk_generate':
        response = await bulkGenerateQuotes(supabase, assessment_ids!, template_id, currentUserId)
        break
        
      default:
        response = {
          success: false,
          error: 'Invalid action specified'
        }
    }

    return new Response(
      JSON.stringify(response),
      {
        status: response.success ? 200 : 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Assessment workflow error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
        details: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function generateQuoteFromAssessment(
  supabase: any,
  assessmentId: string,
  templateId?: string,
  userId?: string
): Promise<WorkflowResponse> {
  try {
    // Call the database function
    const { data, error } = await supabase.rpc(
      'trigger_quote_workflow_from_assessment',
      {
        p_assessment_id: assessmentId,
        p_template_id: templateId
      }
    )

    if (error) {
      console.error('Database function error:', error)
      return {
        success: false,
        error: 'Failed to generate quote from assessment',
        details: error
      }
    }

    if (!data.success) {
      return {
        success: false,
        error: data.error || 'Quote generation failed',
        details: data
      }
    }

    // Fetch the complete quote data for response
    const { data: quoteData, error: quoteError } = await supabase
      .from('quotes')
      .select(`
        *,
        quote_line_items (
          *,
          line_items (name, category, unit)
        ),
        properties (
          service_address,
          clients (name, email)
        ),
        property_assessments (
          assessment_number,
          assessment_status,
          complexity_score
        )
      `)
      .eq('id', data.quote_id)
      .single()

    if (quoteError) {
      console.error('Error fetching quote data:', quoteError)
      return {
        success: true, // Quote was created, just couldn't fetch details
        data: {
          quote_id: data.quote_id,
          assessment_id: assessmentId,
          quote_total: data.quote_total,
          message: 'Quote generated successfully'
        }
      }
    }

    return {
      success: true,
      data: {
        quote: quoteData,
        pricing_explanation: data.pricing_explanation,
        workflow_summary: {
          assessment_id: assessmentId,
          quote_id: data.quote_id,
          total_amount: data.quote_total,
          line_items_count: data.line_items_count,
          generated_at: data.generated_at,
          auto_generated: true
        }
      }
    }

  } catch (error) {
    console.error('Quote generation error:', error)
    return {
      success: false,
      error: 'Unexpected error during quote generation',
      details: error.message
    }
  }
}

async function calculatePricingOnly(
  supabase: any,
  assessmentId: string,
  userId: string
): Promise<WorkflowResponse> {
  try {
    // Verify user has access to assessment
    const { data: assessment, error: accessError } = await supabase
      .from('property_assessments')
      .select('id, user_id, assessment_status, estimated_total_cost')
      .eq('id', assessmentId)
      .eq('user_id', userId)
      .single()

    if (accessError || !assessment) {
      return {
        success: false,
        error: 'Assessment not found or access denied'
      }
    }

    // Calculate pricing
    const { data, error } = await supabase.rpc(
      'calculate_assessment_pricing_adjustments',
      {
        p_assessment_id: assessmentId
      }
    )

    if (error) {
      return {
        success: false,
        error: 'Failed to calculate pricing',
        details: error
      }
    }

    if (data.error) {
      return {
        success: false,
        error: data.message || 'Pricing calculation failed',
        details: data
      }
    }

    // Validate pricing accuracy if manual estimate exists
    let validation = null
    if (assessment.estimated_total_cost) {
      const { data: validationData } = await supabase.rpc(
        'validate_pricing_calculation',
        { p_assessment_id: assessmentId }
      )
      validation = validationData
    }

    return {
      success: true,
      data: {
        assessment_id: assessmentId,
        pricing: {
          subtotal: data.subtotal,
          tax: data.tax,
          total: data.total,
          explanation: data.explanation as PricingExplanation,
          calculated_at: data.calculated_at
        },
        validation,
        comparison: assessment.estimated_total_cost ? {
          manual_estimate: assessment.estimated_total_cost,
          calculated_total: data.total,
          variance_amount: data.total - assessment.estimated_total_cost,
          variance_percent: Math.round(
            Math.abs(data.total - assessment.estimated_total_cost) / 
            assessment.estimated_total_cost * 100
          )
        } : null
      }
    }

  } catch (error) {
    console.error('Pricing calculation error:', error)
    return {
      success: false,
      error: 'Unexpected error during pricing calculation',
      details: error.message
    }
  }
}

async function getWorkflowStatus(
  supabase: any,
  assessmentId: string,
  userId: string
): Promise<WorkflowResponse> {
  try {
    // Get assessment with workflow status
    const { data: assessment, error: assessmentError } = await supabase
      .from('property_assessments')
      .select(`
        id,
        assessment_status,
        workflow_status,
        workflow_error_message,
        quote_id,
        quote_generated_at,
        completed_date,
        auto_quote_enabled,
        quotes (
          id,
          status,
          total,
          created_at
        )
      `)
      .eq('id', assessmentId)
      .eq('user_id', userId)
      .single()

    if (assessmentError || !assessment) {
      return {
        success: false,
        error: 'Assessment not found or access denied'
      }
    }

    // Get recent workflow events
    const { data: events, error: eventsError } = await supabase
      .from('assessment_workflow_events')
      .select('*')
      .eq('assessment_id', assessmentId)
      .order('created_at', { ascending: false })
      .limit(10)

    const workflowEvents = eventsError ? [] : events

    // Determine next recommended action
    let nextAction = 'none'
    let actionDescription = 'No action needed'
    
    if (assessment.assessment_status !== 'completed') {
      nextAction = 'complete_assessment'
      actionDescription = 'Complete the assessment to generate quotes'
    } else if (assessment.workflow_status === 'error') {
      nextAction = 'retry_quote_generation'
      actionDescription = 'Retry quote generation due to previous error'
    } else if (!assessment.quote_id && assessment.auto_quote_enabled) {
      nextAction = 'generate_quote'
      actionDescription = 'Generate quote from completed assessment'
    } else if (assessment.quotes?.status === 'draft') {
      nextAction = 'finalize_quote'
      actionDescription = 'Review and finalize the generated quote'
    } else if (assessment.quotes?.status === 'sent') {
      nextAction = 'follow_up'
      actionDescription = 'Follow up with client on sent quote'
    }

    return {
      success: true,
      data: {
        assessment: {
          id: assessment.id,
          status: assessment.assessment_status,
          workflow_status: assessment.workflow_status,
          error_message: assessment.workflow_error_message,
          completed_date: assessment.completed_date,
          auto_quote_enabled: assessment.auto_quote_enabled
        },
        quote: assessment.quotes ? {
          id: assessment.quotes.id,
          status: assessment.quotes.status,
          total: assessment.quotes.total,
          generated_at: assessment.quote_generated_at,
          created_at: assessment.quotes.created_at
        } : null,
        workflow: {
          next_action: nextAction,
          action_description: actionDescription,
          can_generate_quote: assessment.assessment_status === 'completed' && !assessment.quote_id,
          has_errors: assessment.workflow_status === 'error'
        },
        events: workflowEvents.map(event => ({
          type: event.event_type,
          data: event.event_data,
          created_at: event.created_at
        }))
      }
    }

  } catch (error) {
    console.error('Workflow status error:', error)
    return {
      success: false,
      error: 'Failed to get workflow status',
      details: error.message
    }
  }
}

async function bulkGenerateQuotes(
  supabase: any,
  assessmentIds: string[],
  templateId?: string,
  userId?: string
): Promise<WorkflowResponse> {
  try {
    // Verify user has access to all assessments
    const { data: assessments, error: accessError } = await supabase
      .from('property_assessments')
      .select('id, assessment_status, quote_id')
      .in('id', assessmentIds)
      .eq('user_id', userId)

    if (accessError) {
      return {
        success: false,
        error: 'Failed to verify assessment access',
        details: accessError
      }
    }

    if (assessments.length !== assessmentIds.length) {
      return {
        success: false,
        error: 'Some assessments not found or access denied'
      }
    }

    // Filter eligible assessments (completed and no existing quote)
    const eligibleAssessments = assessments.filter(
      a => a.assessment_status === 'completed' && !a.quote_id
    )

    if (eligibleAssessments.length === 0) {
      return {
        success: false,
        error: 'No eligible assessments for quote generation',
        data: {
          total_requested: assessmentIds.length,
          eligible: 0,
          reasons: assessments.map(a => ({
            assessment_id: a.id,
            reason: a.assessment_status !== 'completed' 
              ? 'Assessment not completed' 
              : 'Quote already exists'
          }))
        }
      }
    }

    // Process each eligible assessment
    const results = []
    let successCount = 0
    let errorCount = 0

    for (const assessment of eligibleAssessments) {
      try {
        const result = await generateQuoteFromAssessment(
          supabase,
          assessment.id,
          templateId,
          userId
        )
        
        results.push({
          assessment_id: assessment.id,
          success: result.success,
          quote_id: result.success ? result.data?.workflow_summary?.quote_id : null,
          error: result.success ? null : result.error
        })

        if (result.success) {
          successCount++
        } else {
          errorCount++
        }

        // Small delay to prevent overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100))

      } catch (error) {
        results.push({
          assessment_id: assessment.id,
          success: false,
          quote_id: null,
          error: error.message
        })
        errorCount++
      }
    }

    return {
      success: successCount > 0,
      data: {
        summary: {
          total_requested: assessmentIds.length,
          eligible: eligibleAssessments.length,
          successful: successCount,
          failed: errorCount,
          completion_rate: Math.round(successCount / eligibleAssessments.length * 100)
        },
        results: results,
        processed_at: new Date().toISOString()
      }
    }

  } catch (error) {
    console.error('Bulk generation error:', error)
    return {
      success: false,
      error: 'Bulk quote generation failed',
      details: error.message
    }
  }
}

// Health check endpoint
serve(async (req) => {
  if (req.method === 'GET' && new URL(req.url).pathname === '/health') {
    return new Response(
      JSON.stringify({
        status: 'healthy',
        service: 'assessment-workflow-automation',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
  
  // Main request handler (as defined above)
  return serve(req)
})