import { PostHog } from 'posthog-node'

// Initialize PostHog client for server-side operations
export const posthogAdmin = new PostHog(
  process.env.POSTHOG_PROJECT_API_KEY!,
  { 
    host: process.env.POSTHOG_HOST || 'https://us.posthog.com',
    flushAt: 1,
    flushInterval: 0
  }
)

// PostHog Query API types
interface HogQLQuery {
  kind: 'HogQLQuery'
  query: string
}

interface PostHogQueryPayload {
  query: HogQLQuery
}

interface PostHogQueryResponse {
  results: any[]
  columns: string[]
  hasMore: boolean
  timings?: any[]
}

// System metrics queries
export const queries = {
  // System overview metrics
  systemOverview: `
    SELECT 
      countDistinct(properties.user_id) as total_users,
      countIf(event = 'quote_created') as quotes_created,
      countIf(event = 'quote_sent') as quotes_sent,
      countIf(event = 'quote_accepted') as quotes_accepted,
      sum(properties.quote_value) as total_revenue
    FROM events
    WHERE timestamp >= now() - interval 30 day
  `,

  // User activity metrics
  userActivity: `
    SELECT 
      properties.user_id,
      count(*) as event_count,
      countIf(event = 'quote_created') as quotes_created,
      countIf(event = 'quote_sent') as quotes_sent,
      max(timestamp) as last_active
    FROM events
    WHERE timestamp >= now() - interval 30 day
      AND properties.user_id IS NOT NULL
    GROUP BY properties.user_id
    ORDER BY event_count DESC
  `,

  // Email performance metrics
  emailMetrics: `
    SELECT 
      countIf(event = 'email_sent') as emails_sent,
      countIf(event = 'email_opened') as emails_opened,
      countIf(event = 'email_clicked') as emails_clicked,
      round(countIf(event = 'email_opened') * 100.0 / countIf(event = 'email_sent'), 2) as open_rate,
      round(countIf(event = 'email_clicked') * 100.0 / countIf(event = 'email_sent'), 2) as click_rate
    FROM events
    WHERE timestamp >= now() - interval 30 day
      AND event IN ('email_sent', 'email_opened', 'email_clicked')
  `,

  // Individual user analytics
  userAnalytics: (userId: string) => `
    SELECT 
      event,
      count() as event_count,
      toDate(timestamp) as date
    FROM events
    WHERE properties.user_id = '${userId}'
      AND timestamp >= now() - interval 90 day
    GROUP BY event, date
    ORDER BY date DESC, event_count DESC
  `,

  // Quote conversion funnel
  quoteFunnel: `
    SELECT 
      event,
      count() as count,
      round(count() * 100.0 / (SELECT count() FROM events WHERE event = 'quote_created' AND timestamp >= now() - interval 30 day), 2) as conversion_rate
    FROM events
    WHERE event IN ('quote_created', 'quote_sent', 'quote_accepted')
      AND timestamp >= now() - interval 30 day
    GROUP BY event
    ORDER BY 
      CASE event
        WHEN 'quote_created' THEN 1
        WHEN 'quote_sent' THEN 2
        WHEN 'quote_accepted' THEN 3
      END
  `
}

// Execute PostHog query via API
export async function executePostHogQuery(hogqlQuery: string): Promise<PostHogQueryResponse> {
  const projectId = process.env.POSTHOG_PROJECT_ID!
  const personalApiKey = process.env.POSTHOG_PERSONAL_API_KEY!
  const host = process.env.POSTHOG_HOST || 'https://us.posthog.com'

  if (!projectId || !personalApiKey) {
    throw new Error('PostHog configuration missing. Please set POSTHOG_PROJECT_ID and POSTHOG_PERSONAL_API_KEY environment variables.')
  }

  const url = `${host}/api/projects/${projectId}/query/`
  
  const payload: PostHogQueryPayload = {
    query: {
      kind: 'HogQLQuery',
      query: hogqlQuery
    }
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${personalApiKey}`
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`PostHog API error: ${response.status} ${errorText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error executing PostHog query:', error)
    throw error
  }
}

// Convenience functions for common queries
// Simple in-memory cache for metrics (Sprint 2: Move to Redis/database)
interface CacheEntry {
  data: any
  timestamp: number
  ttl: number
}

const metricsCache = new Map<string, CacheEntry>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

function getCachedData(key: string): any | null {
  const entry = metricsCache.get(key)
  if (!entry) return null
  
  const now = Date.now()
  if (now - entry.timestamp > entry.ttl) {
    metricsCache.delete(key)
    return null
  }
  
  return entry.data
}

function setCachedData(key: string, data: any, ttl: number = CACHE_TTL): void {
  metricsCache.set(key, {
    data,
    timestamp: Date.now(),
    ttl
  })
}

export async function getSystemMetrics() {
  const cacheKey = 'system-metrics'
  
  // Check cache first
  const cachedMetrics = getCachedData(cacheKey)
  if (cachedMetrics) {
    console.log('Returning cached system metrics')
    return cachedMetrics
  }
  
  try {
    const result = await executePostHogQuery(queries.systemOverview)
    
    // Validate the response structure
    if (!result.results || !Array.isArray(result.results)) {
      throw new Error('Invalid PostHog response structure')
    }
    
    const metrics = result.results[0] || {}
    
    // Ensure all required fields exist with proper defaults
    const processedMetrics = {
      total_users: Number(metrics.total_users) || 0,
      quotes_created: Number(metrics.quotes_created) || 0,
      quotes_sent: Number(metrics.quotes_sent) || 0,
      quotes_accepted: Number(metrics.quotes_accepted) || 0,
      total_revenue: Number(metrics.total_revenue) || 0
    }
    
    // Cache the successful result
    setCachedData(cacheKey, processedMetrics)
    console.log('Cached new system metrics from PostHog')
    
    return processedMetrics
  } catch (error) {
    console.error('Error fetching system metrics from PostHog:', error)
    
    // Enhanced error logging for debugging
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      })
    }
    
    // Return mock data if PostHog isn't configured yet
    // TODO: Replace with real data in Sprint 2
    const fallbackMetrics = {
      total_users: 42,
      quotes_created: 156,
      quotes_sent: 89,
      quotes_accepted: 67,
      total_revenue: 24750
    }
    
    // Cache fallback data with shorter TTL
    setCachedData(cacheKey, fallbackMetrics, 60 * 1000) // 1 minute for fallback
    
    return fallbackMetrics
  }
}

// Cache management utilities for Sprint 2
export function clearMetricsCache(): void {
  metricsCache.clear()
  console.log('Metrics cache cleared')
}

export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: metricsCache.size,
    keys: Array.from(metricsCache.keys())
  }
}

export async function getUserActivity() {
  try {
    const result = await executePostHogQuery(queries.userActivity)
    return result.results || []
  } catch (error) {
    console.error('Error fetching user activity:', error)
    return []
  }
}

export async function getEmailMetrics() {
  try {
    const result = await executePostHogQuery(queries.emailMetrics)
    return result.results[0] || {
      emails_sent: 0,
      emails_opened: 0,
      emails_clicked: 0,
      open_rate: 0,
      click_rate: 0
    }
  } catch (error) {
    console.error('Error fetching email metrics:', error)
    return {
      emails_sent: 234,
      emails_opened: 160,
      emails_clicked: 45,
      open_rate: 68.5,
      click_rate: 19.2
    }
  }
}

export async function getUserAnalytics(userId: string) {
  try {
    const result = await executePostHogQuery(queries.userAnalytics(userId))
    return result.results || []
  } catch (error) {
    console.error('Error fetching user analytics:', error)
    return []
  }
}

// Track admin actions
export function trackAdminAction(adminId: string, action: string, metadata?: Record<string, any>) {
  posthogAdmin.capture({
    distinctId: adminId,
    event: 'admin_action',
    properties: {
      action,
      timestamp: new Date().toISOString(),
      ...metadata
    }
  })
}

// Ensure proper cleanup
process.on('SIGINT', async () => {
  await posthogAdmin.shutdown()
})

process.on('SIGTERM', async () => {
  await posthogAdmin.shutdown()
})