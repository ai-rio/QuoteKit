'use client'

import { ArrowRight,Crown, Zap } from 'lucide-react'
import { useState } from 'react'

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
        <div className="w-16 h-16 bg-equipment-yellow rounded-full flex items-center justify-center">
          <Crown className="w-8 h-8 text-charcoal" />
        </div>
      </div>

      {/* Title and Description */}
      <div className="space-y-2">
        <h3 className="text-xl font-bold text-charcoal flex items-center justify-center gap-2">
          {defaultTitle}
          <Badge className="bg-equipment-yellow text-charcoal font-semibold">
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
        <h4 className="font-semibold text-charcoal flex items-center justify-center gap-2">
          <Zap className="w-4 h-4 text-equipment-yellow" />
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
        className="bg-forest-green text-paper-white hover:opacity-90 active:opacity-80 font-bold px-6 py-3 rounded-lg transition-all duration-200"
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
        <DialogContent className="bg-paper-white border-stone-gray sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sr-only">
            <DialogTitle className="text-charcoal">{defaultTitle}</DialogTitle>
            <DialogDescription className="text-charcoal/70">{defaultDescription}</DialogDescription>
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
