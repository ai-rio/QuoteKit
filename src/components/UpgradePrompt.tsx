'use client'

import { useState } from 'react'
import { Crown, Zap, ArrowRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'

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
}

const DEFAULT_BENEFITS = [
  'Unlimited quotes and templates',
  'Professional PDF exports',
  'Advanced analytics dashboard',
  'Custom branding and logos',
  'Priority email support',
  'API access for integrations'
]

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
  onClose
}: UpgradePromptProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const defaultTitle = title || `Upgrade to Access ${feature}`
  const defaultDescription = description || 
    `${feature} is a premium feature. Upgrade your plan to unlock this and many other powerful features.`

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade()
    } else {
      // Default behavior: redirect to account page
      window.location.href = '/account?tab=plan'
    }
  }

  const handleClose = () => {
    if (onClose) {
      onClose()
    } else {
      setIsModalOpen(false)
    }
  }

  const PromptContent = () => (
    <div className="text-center space-y-6">
      {/* Icon */}
      <div className="flex justify-center">
        <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
          <Crown className="w-8 h-8 text-white" />
        </div>
      </div>

      {/* Title and Description */}
      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-charcoal flex items-center justify-center gap-2">
          {defaultTitle}
          <Badge variant="secondary" className="bg-gradient-to-r from-amber-400 to-orange-500 text-white">
            <Crown className="w-3 h-3 mr-1" />
            Premium
          </Badge>
        </h3>
        <p className="text-charcoal/70 max-w-md mx-auto">
          {defaultDescription}
        </p>
      </div>

      {/* Benefits */}
      <div className="space-y-3">
        <h4 className="font-medium text-charcoal flex items-center justify-center gap-2">
          <Zap className="w-4 h-4 text-amber-500" />
          Premium Features Include:
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
        className="bg-gradient-to-r from-forest-green to-emerald-600 hover:from-forest-green/90 hover:to-emerald-600/90 text-white font-semibold px-6 py-2 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
      >
        {ctaText}
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  )

  // Modal version
  if (modal) {
    return (
      <Dialog open={open ?? isModalOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="sr-only">
            <DialogTitle>{defaultTitle}</DialogTitle>
            <DialogDescription>{defaultDescription}</DialogDescription>
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
      <Card className="border-2 border-dashed border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
        <CardContent className="p-6">
          <PromptContent />
        </CardContent>
      </Card>
    )
  }

  // Default inline version (no card wrapper)
  return (
    <div className="p-6 border-2 border-dashed border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg">
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
    <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg">
      <Crown className="w-5 h-5 text-amber-600 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-charcoal">
          {feature} requires Premium
        </p>
        <p className="text-xs text-charcoal/60">
          Upgrade to unlock this feature
        </p>
      </div>
      <Button 
        size="sm" 
        onClick={handleUpgrade}
        className="bg-gradient-to-r from-forest-green to-emerald-600 hover:from-forest-green/90 hover:to-emerald-600/90 text-white font-medium"
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
      variant="secondary" 
      className={`bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs ${className}`}
    >
      <Crown className="w-3 h-3 mr-1" />
      Premium
    </Badge>
  )
}
