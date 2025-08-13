// =====================================================
// ONBOARDING MANAGER EDGE FUNCTION - M1.2
// =====================================================
// Edge Function for handling onboarding progress and completion

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

import { corsHeaders } from '../_shared/cors.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

interface OnboardingStep {
  completed: boolean;
  completedAt?: string;
  skipped?: boolean;
  data?: Record<string, any>;
}

interface OnboardingProgress {
  welcome?: OnboardingStep;
  companyProfile?: OnboardingStep;
  firstQuote?: OnboardingStep;
  itemsLibrary?: OnboardingStep;
  settingsReview?: OnboardingStep;
  startedAt?: string;
  currentStep?: string;
  totalSteps?: number;
  completedSteps?: number;
  features?: {
    [featureName: string]: OnboardingStep;
  };
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Set the auth header for the supabase client
    supabase.auth.setAuth(authHeader.replace('Bearer ', ''))

    // Get the user from the token
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const url = new URL(req.url)
    const action = url.pathname.split('/').pop()

    switch (req.method) {
      case 'GET':
        return await handleGetOnboardingStatus(user.id)
        
      case 'POST':
        if (action === 'update-step') {
          return await handleUpdateStep(req, user.id)
        } else if (action === 'complete') {
          return await handleCompleteOnboarding(req, user.id)
        }
        break
        
      case 'PATCH':
        return await handleUpdateProgress(req, user.id)
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Onboarding Manager Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function handleGetOnboardingStatus(userId: string) {
  const { data: user, error } = await supabase
    .from('users')
    .select('onboarding_progress, onboarding_completed_at')
    .eq('id', userId)
    .single()

  if (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to fetch onboarding status' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }

  const progress = user.onboarding_progress as OnboardingProgress || {}
  const completionPercentage = calculateCompletionPercentage(progress)

  return new Response(
    JSON.stringify({
      isComplete: !!user.onboarding_completed_at,
      progress,
      completedAt: user.onboarding_completed_at,
      currentStep: progress.currentStep || null,
      completionPercentage
    }),
    { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  )
}

async function handleUpdateStep(req: Request, userId: string) {
  const { stepName, completed, data, skipped } = await req.json()

  if (!stepName || typeof completed !== 'boolean') {
    return new Response(
      JSON.stringify({ error: 'stepName and completed are required' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }

  // Get current progress
  const { data: user, error: fetchError } = await supabase
    .from('users')
    .select('onboarding_progress')
    .eq('id', userId)
    .single()

  if (fetchError) {
    return new Response(
      JSON.stringify({ error: 'Failed to fetch current progress' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }

  const currentProgress = (user.onboarding_progress as OnboardingProgress) || {}
  
  // Update the specific step
  const stepUpdate: OnboardingStep = {
    completed,
    completedAt: completed ? new Date().toISOString() : undefined,
    skipped: skipped || false,
    data: data || undefined
  }

  const updatedProgress = {
    ...currentProgress,
    [stepName]: stepUpdate,
    completedSteps: Object.values({...currentProgress, [stepName]: stepUpdate})
      .filter(step => step && typeof step === 'object' && step.completed).length
  }

  // Update the progress
  const { error: updateError } = await supabase.rpc('update_onboarding_progress', {
    progress_data: updatedProgress,
    mark_completed: false
  })

  if (updateError) {
    return new Response(
      JSON.stringify({ error: 'Failed to update onboarding step' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      progress: updatedProgress,
      completionPercentage: calculateCompletionPercentage(updatedProgress)
    }),
    { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  )
}

async function handleCompleteOnboarding(req: Request, userId: string) {
  const { progress } = await req.json()

  const { error } = await supabase.rpc('update_onboarding_progress', {
    progress_data: progress,
    mark_completed: true
  })

  if (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to complete onboarding' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      message: 'Onboarding completed successfully',
      completedAt: new Date().toISOString()
    }),
    { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  )
}

async function handleUpdateProgress(req: Request, userId: string) {
  const { progress } = await req.json()

  if (!progress || typeof progress !== 'object') {
    return new Response(
      JSON.stringify({ error: 'Valid progress object is required' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }

  const { error } = await supabase.rpc('update_onboarding_progress', {
    progress_data: progress,
    mark_completed: false
  })

  if (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to update onboarding progress' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      progress,
      completionPercentage: calculateCompletionPercentage(progress)
    }),
    { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  )
}

function calculateCompletionPercentage(progress: OnboardingProgress): number {
  const coreSteps = ['welcome', 'companyProfile', 'firstQuote', 'itemsLibrary', 'settingsReview']
  const completedSteps = coreSteps.filter(step => {
    const stepData = progress[step as keyof OnboardingProgress]
    return stepData && typeof stepData === 'object' && stepData.completed
  }).length

  return Math.round((completedSteps / coreSteps.length) * 100)
}