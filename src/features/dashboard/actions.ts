'use server'

import { createSupabaseServerClient } from "@/libs/supabase/supabase-server-client"

import { DashboardData, DashboardStats, RecentQuote,UserProgress } from "./types"

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = await createSupabaseServerClient()
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('User not authenticated')
  }

  try {
    // Get stats in parallel
    const [quotesResult, itemsResult, settingsResult] = await Promise.all([
      supabase
        .from('quotes')
        .select('id, client_name, total, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('line_items')
        .select('id')
        .eq('user_id', user.id),
      supabase
        .from('company_settings')
        .select('id')
        .eq('user_id', user.id)
        .single()
    ])

    // Calculate stats
    const totalQuotes = quotesResult.data?.length || 0
    const totalItems = itemsResult.data?.length || 0
    const hasCompanySettings = !!settingsResult.data
    const hasItems = totalItems > 0
    const hasCreatedQuote = totalQuotes > 0

    // Calculate progress
    const completedSteps = [hasCompanySettings, hasItems, hasCreatedQuote].filter(Boolean).length
    const completionPercentage = Math.round((completedSteps / 3) * 100)

    const stats: DashboardStats = {
      totalQuotes,
      totalItems,
      recentActivity: Math.min(totalQuotes + totalItems, 10),
      setupProgress: completionPercentage
    }

    const progress: UserProgress = {
      hasCompanySettings,
      hasItems,
      hasCreatedQuote,
      completionPercentage
    }

    // Get recent quotes (last 5)
    const recentQuotes: RecentQuote[] = (quotesResult.data || [])
      .slice(0, 5)
      .map(quote => ({
        id: quote.id,
        clientName: quote.client_name || 'Unnamed Client',
        total: quote.total || 0,
        status: 'draft' as const, // For now, all quotes are draft
        createdAt: quote.created_at || new Date().toISOString()
      }))

    const quickActions = [
      {
        title: 'Create New Quote',
        description: 'Start a new quote for your client',
        href: '/quotes/new',
        icon: 'plus',
        color: 'forest-green' as const
      },
      {
        title: 'Manage Items',
        description: 'Add or edit services and materials',
        href: '/items',
        icon: 'package',
        color: 'equipment-yellow' as const
      },
      {
        title: 'Settings',
        description: 'Configure your company settings',
        href: '/settings',
        icon: 'settings',
        color: 'stone-gray' as const
      }
    ]

    return {
      stats,
      progress,
      recentQuotes,
      quickActions
    }
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    throw new Error('Failed to fetch dashboard data')
  }
}