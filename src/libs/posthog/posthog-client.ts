"use client"

import posthog from 'posthog-js'

// Client-side PostHog initialization
export function initPostHog() {
  if (typeof window !== 'undefined') {
    const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.posthog.com'
    
    if (apiKey) {
      posthog.init(apiKey, {
        api_host: host,
        capture_pageview: true,
        capture_pageleave: true,
        loaded: (posthog) => {
          if (process.env.NODE_ENV === 'development') {
            console.log('PostHog loaded')
          }
        }
      })
    } else {
      console.warn('PostHog client key not found. Set NEXT_PUBLIC_POSTHOG_KEY environment variable.')
    }
  }
}

// Export PostHog instance
export { posthog }

// Admin-specific tracking functions
export const adminTracking = {
  // Track admin login
  trackAdminLogin: (adminId: string, email: string) => {
    posthog.capture('admin_login', {
      admin_id: adminId,
      email,
      timestamp: new Date().toISOString()
    })
  },

  // Track admin actions
  trackAdminAction: (adminId: string, action: string, metadata?: Record<string, any>) => {
    posthog.capture('admin_action', {
      admin_id: adminId,
      action,
      timestamp: new Date().toISOString(),
      ...metadata
    })
  },

  // Track user management actions
  trackUserAction: (adminId: string, action: string, targetUserId: string, metadata?: Record<string, any>) => {
    posthog.capture('admin_user_management', {
      admin_id: adminId,
      action,
      target_user_id: targetUserId,
      timestamp: new Date().toISOString(),
      ...metadata
    })
  },

  // Track email campaign actions
  trackEmailCampaign: (adminId: string, action: string, campaignData?: Record<string, any>) => {
    posthog.capture('admin_email_campaign', {
      admin_id: adminId,
      action,
      timestamp: new Date().toISOString(),
      ...campaignData
    })
  },

  // Track custom query usage
  trackCustomQuery: (adminId: string, queryType: string, query: string) => {
    posthog.capture('admin_custom_query', {
      admin_id: adminId,
      query_type: queryType,
      query_length: query.length,
      timestamp: new Date().toISOString()
    })
  }
}

// Regular user tracking functions
export const userTracking = {
  // Track quote actions
  trackQuoteAction: (userId: string, action: string, quoteData?: Record<string, any>) => {
    posthog.capture('quote_action', {
      user_id: userId,
      action,
      ...quoteData
    })
  },

  // Track email actions
  trackEmailAction: (userId: string, action: string, emailData?: Record<string, any>) => {
    posthog.capture('email_action', {
      user_id: userId,
      action,
      ...emailData
    })
  },

  // Track page views with context
  trackPageView: (userId: string, page: string, metadata?: Record<string, any>) => {
    posthog.capture('$pageview', {
      user_id: userId,
      page,
      ...metadata
    })
  }
}

// Initialize PostHog when module loads
if (typeof window !== 'undefined') {
  initPostHog()
}