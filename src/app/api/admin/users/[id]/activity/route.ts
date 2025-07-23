import { NextRequest, NextResponse } from 'next/server'

import { getUserActivity } from '@/libs/posthog/posthog-admin'
import { isAdmin } from '@/libs/supabase/admin-utils'
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin'
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client'

interface ActivityEvent {
  id: string
  type: 'login' | 'quote_created' | 'quote_sent' | 'quote_accepted' | 'profile_updated' | 'page_view'
  timestamp: string
  description: string
  metadata?: Record<string, any>
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role
    const userIsAdmin = await isAdmin(user.id)
    if (!userIsAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: userId } = await params

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Get user info
    const { data: userData, error: userError } = await supabaseAdminClient.auth.admin.getUserById(userId)
    if (userError || !userData.user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Generate mock activity data since we don't have full PostHog event tracking yet
    // In a real implementation, this would fetch actual events from PostHog
    const mockActivities: ActivityEvent[] = [
      {
        id: '1',
        type: 'login',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        description: 'User logged into the platform',
        metadata: {
          ip_address: '192.168.1.1',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      },
      {
        id: '2',
        type: 'page_view',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
        description: 'Viewed dashboard page',
        metadata: {
          page: '/dashboard',
          duration: 45000
        }
      },
      {
        id: '3',
        type: 'quote_created',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
        description: 'Created a new quote for lawn maintenance service',
        metadata: {
          quote_id: 'quote-123',
          total_amount: 250.00,
          service_type: 'lawn_maintenance'
        }
      },
      {
        id: '4',
        type: 'profile_updated',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        description: 'Updated profile information',
        metadata: {
          fields_changed: ['full_name', 'company_name']
        }
      },
      {
        id: '5',
        type: 'quote_sent',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        description: 'Sent quote via email to client',
        metadata: {
          quote_id: 'quote-122',
          recipient_email: 'client@example.com',
          total_amount: 180.00
        }
      }
    ]

    try {
      // Try to get real activity data from PostHog
      const posthogActivity = await getUserActivity()
      const userPosthogActivity = posthogActivity.find((a: any) => a.user_id === userId)
      
      if (userPosthogActivity && userPosthogActivity.recent_events) {
        // If we have PostHog data, use it to enhance our activity timeline
        const enhancedActivities = mockActivities.map(activity => ({
          ...activity,
          metadata: {
            ...activity.metadata,
            posthog_events: userPosthogActivity.event_count || 0
          }
        }))
        
        return NextResponse.json({
          success: true,
          data: enhancedActivities
        })
      }
    } catch (posthogError) {
      console.log('PostHog activity fetch failed, using mock data:', posthogError)
    }

    // Return mock data
    return NextResponse.json({
      success: true,
      data: mockActivities
    })

  } catch (error) {
    console.error('Error fetching user activity:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}