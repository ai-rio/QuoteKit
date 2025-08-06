'use client'

import { ArrowRight, Crown, Zap } from 'lucide-react'
import { useEffect,useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface UpgradePromptProps {
  /** Feature that requires upgrade */
  feature: string
  /** Custom title for the prompt */
  title?: string
  /** Custom description */
  description?: string
  /** Show as modal dialog */
  modal?: boolean
  /** Show as inline card */
  inline?: boolean
  /** Custom upgrade benefits */
  benefits?: string[]
  /** Custom CTA text */
  ctaText?: string
  /** Callback when upgrade is clicked */
  onUpgrade?: () => void
  /** Show close button in modal */
  showClose?: boolean
  /** Modal open state (controlled) */
  open?: boolean
  /** Modal close handler */
  onClose?: () => void
  /** Trigger context for analytics */
  trigger?: 'limit_reached' | 'feature_blocked' | 'usage_warning' | 'manual'
  /** Current usage count for context */
  currentUsage?: number
  /** Usage limit for context */
  limit?: number
  /** Force specific A/B test variant */
  variant?: 'urgent' | 'benefit' | 'social_proof'
}

const DEFAULT_BENEFITS = [
  'Unlimited quotes and templates',
  'Professional PDF exports',
  'Advanced analytics dashboard',
  'Custom branding and logos',
  'Priority email support',
  'API access for integrations'
]

/**
 * A/B test variant selection - evenly distributes users across variants
 */
function getABTestVariant(): 'urgent' | 'benefit' | 'social_proof' {
  const variants = ['urgent', 'benefit', 'social_proof'] as const
  const userId = typeof window !== 'undefined' ? localStorage.getItem('user_id') || 'anonymous' : 'anonymous'
  
  // Simple hash function to consistently assign variant based on user
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  
  return variants[Math.abs(hash) % variants.length]
}

/**
 * Track upgrade prompt display for analytics
 */
async function trackPromptShown(data: {
  feature: string
  trigger: string
  variant: string
  currentUsage?: number
  limit?: number
  timestamp: string
}) {
  try {
    await fetch('/api/analytics/upgrade-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        event: 'prompt_shown', 
        ...data,
        // Add browser/session context
        userAgent: navigator.userAgent,
        referrer: document.referrer,
        pathname: window.location.pathname
      })
    })
  } catch (error) {
    console.error('Failed to track prompt display:', error)
    // Fail silently - don't disrupt user experience
  }
}

/**
 * Track upgrade prompt interactions for analytics
 */
async function trackPromptClicked(data: {
  feature: string
  trigger: string
  variant: string
  action: 'upgrade' | 'dismiss'
  currentUsage?: number
  limit?: number
  timestamp: string
}) {
  try {
    await fetch('/api/analytics/upgrade-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        event: 'prompt_clicked', 
        ...data,
        // Add browser/session context
        userAgent: navigator.userAgent,
        referrer: document.referrer,
        pathname: window.location.pathname
      })
    })
  } catch (error) {
    console.error('Failed to track prompt interaction:', error)
    // Fail silently - don't disrupt user experience
  }
}

export function UpgradePrompt({
  feature,
  title,
  description,
  modal = false,
  inline = false,
  benefits = DEFAULT_BENEFITS,
  ctaText = 'Upgrade to Premium',
  onUpgrade,
  showClose = true,
  open,
  onClose,
  trigger = 'manual',
  currentUsage,
  limit,
  variant
}: UpgradePromptProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [testVariant, setTestVariant] = useState<'urgent' | 'benefit' | 'social_proof'>(
    variant || getABTestVariant()
  )

  const defaultTitle = title || `Upgrade to Access ${feature}`
  const defaultDescription = description || 
    `${feature} is a premium feature. Upgrade your plan to unlock this and many other powerful features.`

  // Track prompt display
  useEffect(() => {
    if (open || isModalOpen || (!modal && !open)) {
      trackPromptShown({
        feature,
        trigger,
        variant: testVariant,
        currentUsage,
        limit,
        timestamp: new Date().toISOString()
      })
    }
  }, [open, isModalOpen, feature, trigger, testVariant, currentUsage, limit])

  const handleUpgrade = () => {
    // Track conversion
    trackPromptClicked({
      feature,
      trigger,
      variant: testVariant,
      action: 'upgrade',
      currentUsage,
      limit,
      timestamp: new Date().toISOString()
    })

    if (onUpgrade) {
      onUpgrade()
    } else {
      // Default behavior: redirect to pricing page with source tracking
      window.location.href = `/pricing?source=upgrade_prompt&feature=${encodeURIComponent(feature)}&variant=${testVariant}`
    }
  }

  const handleClose = () => {
    // Track dismissal
    trackPromptClicked({
      feature,
      trigger,
      variant: testVariant,
      action: 'dismiss',
      currentUsage,
      limit,
      timestamp: new Date().toISOString()
    })

    if (onClose) {
      onClose()
    } else {
      setIsModalOpen(false)
    }
  }

  // Get variant-specific content
  const getVariantContent = () => {
    switch (testVariant) {
      case 'urgent':
        return {
          title: title || `${feature} Limit Reached!`,
          description: currentUsage && limit 
            ? `You've used ${currentUsage} of ${limit} ${feature.toLowerCase()}. Upgrade now to continue.`
            : `${feature} access blocked. Upgrade now to continue.`,
          ctaText: ctaText || 'Upgrade Now',
          buttonClass: 'bg-red-600 hover:bg-red-700 text-white',
          iconClass: 'text-red-600'
        }
      
      case 'benefit':
        return {
          title: title || 'Unlock Premium Features',
          description: description || `Get unlimited ${feature.toLowerCase()}, advanced analytics, and priority support.`,
          ctaText: ctaText || 'See Premium Benefits',
          buttonClass: 'bg-purple-600 hover:bg-purple-700 text-white',
          iconClass: 'text-purple-600'
        }
      
      case 'social_proof':
        return {
          title: title || 'Join 10,000+ Premium Users',
          description: description || `Trusted by thousands of professionals who upgraded for unlimited access.`,
          ctaText: ctaText || 'Join Premium',
          buttonClass: 'bg-blue-600 hover:bg-blue-700 text-white',
          iconClass: 'text-blue-600'
        }
      
      default:
        return {
          title: defaultTitle,
          description: defaultDescription,
          ctaText,
          buttonClass: 'bg-forest-green text-paper-white hover:opacity-90 active:opacity-80',
          iconClass: 'text-equipment-yellow'
        }
    }
  }

  const variantContent = getVariantContent()

  const PromptContent = () => (
    <div className="text-center space-y-6">
      {/* Icon */}
      <div className="flex justify-center">
        <div className="w-16 h-16 bg-equipment-yellow rounded-full flex items-center justify-center">
          <Crown className={`w-8 h-8 ${variantContent.iconClass}`} />
        </div>
      </div>

      {/* Title and Description */}
      <div className="space-y-2">
        <h3 className="text-xl font-bold text-charcoal flex items-center justify-center gap-2">
          {variantContent.title}
          <Badge className="bg-equipment-yellow text-charcoal font-semibold">
            <Crown className="w-3 h-3 mr-1" />
            Premium
          </Badge>
        </h3>
        <p className="text-charcoal/70 max-w-md mx-auto">
          {variantContent.description}
        </p>
        
        {/* Usage indicator for urgent variant */}
        {testVariant === 'urgent' && currentUsage !== undefined && limit && (
          <div className="mt-3">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 max-w-sm mx-auto">
              <div className="flex justify-between text-sm font-medium text-red-800">
                <span>Usage</span>
                <span>{currentUsage}/{limit === -1 ? '∞' : limit}</span>
              </div>
              <div className="mt-1 w-full bg-red-200 rounded-full h-2">
                <div 
                  className="bg-red-600 h-2 rounded-full" 
                  style={{ width: limit === -1 ? '0%' : `${Math.min((currentUsage / limit) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Benefits */}
      <div className="space-y-3">
        <h4 className="font-semibold text-charcoal flex items-center justify-center gap-2">
          <Zap className="w-4 h-4 text-equipment-yellow" />
          {testVariant === 'social_proof' ? 'Why Users Upgrade:' : 'Premium Features Include:'}
        </h4>
        <ul className="space-y-2 text-sm text-charcoal/70 max-w-sm mx-auto">
          {benefits.slice(0, 4).map((benefit, index) => (
            <li key={index} className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-forest-green rounded-full flex-shrink-0" />
              {benefit}
            </li>
          ))}
        </ul>
      </div>

      {/* CTA Button */}
      <Button 
        onClick={handleUpgrade}
        className={`${variantContent.buttonClass} font-bold px-6 py-3 rounded-lg transition-all duration-200`}
      >
        {variantContent.ctaText}
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>

      {/* Social proof for social_proof variant */}
      {testVariant === 'social_proof' && (
        <p className="text-xs text-charcoal/50 max-w-xs mx-auto">
          ⭐⭐⭐⭐⭐ Rated 4.8/5 by 2,500+ satisfied customers
        </p>
      )}
    </div>
  )

  // Modal version
  if (modal) {
    return (
      <Dialog open={open ?? isModalOpen} onOpenChange={handleClose}>
        <DialogContent className="bg-paper-white border-stone-gray sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sr-only">
            <DialogTitle className="text-charcoal">{variantContent.title}</DialogTitle>
            <DialogDescription className="text-charcoal/70">{variantContent.description}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <PromptContent />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Inline card version
  if (inline) {
    return (
      <Card className="bg-paper-white border-2 border-dashed border-equipment-yellow/30 shadow-sm">
        <CardContent className="p-6">
          <PromptContent />
        </CardContent>
      </Card>
    )
  }

  // Default inline version (no card wrapper)
  return (
    <div className="p-6 border-2 border-dashed border-equipment-yellow/30 bg-light-concrete rounded-lg">
      <PromptContent />
    </div>
  )
}

/**
 * Compact upgrade prompt for buttons and small spaces
 */
export function CompactUpgradePrompt({
  feature,
  onUpgrade
}: {
  feature: string
  onUpgrade?: () => void
}) {
  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade()
    } else {
      window.location.href = '/account?tab=plan'
    }
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-light-concrete border border-equipment-yellow/30 rounded-lg">
      <Crown className="w-5 h-5 text-equipment-yellow flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-charcoal">
          {feature} requires Premium
        </p>
        <p className="text-xs text-charcoal/60">
          Upgrade to unlock this feature
        </p>
      </div>
      <Button 
        size="sm" 
        onClick={handleUpgrade}
        className="bg-forest-green text-paper-white hover:opacity-90 font-semibold"
      >
        Upgrade
      </Button>
    </div>
  )
}

/**
 * Feature badge to show premium status
 */
export function FeatureBadge({ 
  isPremium = false, 
  className = "" 
}: { 
  isPremium?: boolean
  className?: string 
}) {
  if (!isPremium) return null

  return (
    <Badge 
      className={`bg-equipment-yellow text-charcoal font-semibold text-xs ${className}`}
    >
      <Crown className="w-3 h-3 mr-1" />
      Premium
    </Badge>
  )
}
