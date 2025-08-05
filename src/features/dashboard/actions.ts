'use server'

import { convertDatabaseQuoteToQuote } from "@/features/quotes/types"
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
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('line_items')
        .select('id')
        .eq('user_id', user.id),
      supabase
        .from('company_settings')
        .select('company_name, default_tax_rate, default_markup_rate')
        .eq('id', user.id)
        .single()
    ])

    // Convert quotes to application format
    const quotes = (quotesResult.data || []).map(convertDatabaseQuoteToQuote)
    
    // Calculate enhanced stats
    const totalQuotes = quotes.filter(q => !q.is_template).length
    const totalTemplates = quotes.filter(q => q.is_template).length
    const draftQuotes = quotes.filter(q => !q.is_template && (q.status || 'draft') === 'draft').length
    const sentQuotes = quotes.filter(q => !q.is_template && (q.status || 'draft') === 'sent').length
    const acceptedQuotes = quotes.filter(q => !q.is_template && (q.status || 'draft') === 'accepted').length
    const totalRevenue = quotes
      .filter(q => !q.is_template && (q.status === 'accepted' || q.status === 'converted'))
      .reduce((sum, q) => sum + q.total, 0)
    const totalItems = itemsResult.data?.length || 0
    
    // Enhanced company settings validation
    const hasValidCompanySettings = (() => {
      if (!settingsResult.data) return false
      
      const settings = settingsResult.data
      
      // Check required fields
      if (!settings.company_name?.trim()) return false
      
      // Validate tax rate if provided
      if (settings.default_tax_rate !== null && 
          (settings.default_tax_rate < 0 || settings.default_tax_rate > 100)) {
        return false
      }
      
      // Validate markup rate if provided
      if (settings.default_markup_rate !== null && 
          (settings.default_markup_rate < 0 || settings.default_markup_rate > 1000)) {
        return false
      }
      
      return true
    })()
    
    const hasCompanySettings = hasValidCompanySettings
    const hasItems = totalItems > 0
    const hasCreatedQuote = totalQuotes > 0

    // Calculate progress
    const completedSteps = [hasCompanySettings, hasItems, hasCreatedQuote].filter(Boolean).length
    const completionPercentage = Math.round((completedSteps / 3) * 100)

    const stats: DashboardStats = {
      totalQuotes,
      draftQuotes,
      sentQuotes,
      acceptedQuotes,
      totalRevenue,
      totalItems,
      totalTemplates,
      recentActivity: Math.min(totalQuotes + totalItems, 10),
      setupProgress: completionPercentage
    }

    const progress: UserProgress = {
      hasCompanySettings,
      hasItems,
      hasCreatedQuote,
      completionPercentage
    }

    // Get recent quotes (last 5, excluding templates)
    const recentQuotes: RecentQuote[] = quotes
      .filter(quote => !quote.is_template)
      .slice(0, 5)
      .map(quote => ({
        id: quote.id,
        clientName: quote.client_name || 'Unnamed Client',
        total: quote.total || 0,
        status: quote.status || 'draft',
        createdAt: quote.created_at || new Date().toISOString(),
        quoteNumber: quote.quote_number
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
        title: 'Manage Quotes',
        description: 'View and manage all your quotes',
        href: '/quotes',
        icon: 'file-text',
        color: 'equipment-yellow' as const
      },
      {
        title: 'Item Library',
        description: 'Add or edit services and materials',
        href: '/items',
        icon: 'package',
        color: 'stone-gray' as const
      },
      {
        title: 'Account & Billing',
        description: 'Manage subscription and billing',
        href: '/account',
        icon: 'crown',
        color: 'forest-green' as const
      },
      {
        title: 'Company Settings',
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