import { LineItem } from "@/features/items/types"
import { Quote, QuoteStatus } from "@/features/quotes/types"

export interface DashboardStats {
  totalQuotes: number
  draftQuotes: number
  sentQuotes: number
  acceptedQuotes: number
  totalRevenue: number
  totalItems: number
  totalTemplates: number
  recentActivity: number
  setupProgress: number
}

export interface UserProgress {
  hasCompanySettings: boolean
  hasItems: boolean
  hasCreatedQuote: boolean
  completionPercentage: number
}

export interface RecentQuote {
  id: string
  clientName: string
  total: number
  status: QuoteStatus
  createdAt: string
  quoteNumber?: string
}

export interface QuickAction {
  title: string
  description: string
  href: string
  icon: string
  color: 'forest-green' | 'equipment-yellow' | 'stone-gray'
}

export interface DashboardData {
  stats: DashboardStats
  progress: UserProgress
  recentQuotes: RecentQuote[]
  quickActions: QuickAction[]
}