"use client"

import { BookOpen, FileText, HelpCircle, Package, Play, Settings, Star, Users, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useOnboarding } from '@/contexts/onboarding-context'
import { useTourReplay } from '@/hooks/use-tour-replay'
import { useUserTier } from '@/hooks/use-user-tier'

interface TourOption {
  id: string
  name: string
  description: string
  icon: React.ComponentType<any>
  category: 'essential' | 'advanced' | 'features'
  estimatedTime: string
  userTiers: string[]
}

const TOUR_OPTIONS: TourOption[] = [
  {
    id: 'welcome',
    name: 'Welcome Tour',
    description: 'Get started with QuoteKit basics',
    icon: Play,
    category: 'essential',
    estimatedTime: '2 min',
    userTiers: ['free', 'pro', 'enterprise']
  },
  {
    id: 'settings',
    name: 'Company Setup',
    description: 'Configure your company information',
    icon: Settings,
    category: 'essential',
    estimatedTime: '3 min',
    userTiers: ['free', 'pro', 'enterprise']
  },
  {
    id: 'quote-creation',
    name: 'Quote Creation Guide',
    description: 'Complete walkthrough of creating professional quotes',
    icon: FileText,
    category: 'essential',
    estimatedTime: '8 min',
    userTiers: ['free', 'pro', 'enterprise']
  },
  {
    id: 'item-library',
    name: 'Item Library Management',
    description: 'Master your services and materials database',
    icon: Package,
    category: 'essential',
    estimatedTime: '7 min',
    userTiers: ['free', 'pro', 'enterprise']
  },
  {
    id: 'pro-features',
    name: 'Pro Features',
    description: 'Advanced features for professional users',
    icon: Star,
    category: 'features',
    estimatedTime: '5 min',
    userTiers: ['pro', 'enterprise']
  },
  {
    id: 'contextual-help',
    name: 'Contextual Help',
    description: 'Learn about help features and support',
    icon: HelpCircle,
    category: 'essential',
    estimatedTime: '2 min',
    userTiers: ['free', 'pro', 'enterprise']
  },
  {
    id: 'freemium-highlights',
    name: 'Free Plan Features',
    description: 'Discover what you can do on the free plan',
    icon: Zap,
    category: 'features',
    estimatedTime: '3 min',
    userTiers: ['free']
  },
  {
    id: 'interactive-tutorial',
    name: 'Interactive Tutorial',
    description: 'Hands-on practice with QuoteKit features',
    icon: BookOpen,
    category: 'advanced',
    estimatedTime: '15 min',
    userTiers: ['pro', 'enterprise']
  },
  {
    id: 'personalized-onboarding',
    name: 'Personalized Experience',
    description: 'Customized onboarding based on your needs',
    icon: Users,
    category: 'advanced',
    estimatedTime: '10 min',
    userTiers: ['pro', 'enterprise']
  }
]

interface HelpMenuProps {
  variant?: 'button' | 'icon'
  size?: 'sm' | 'default' | 'lg'
  showLabel?: boolean
}

export function HelpMenu({ 
  variant = 'button', 
  size = 'default', 
  showLabel = true 
}: HelpMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const { tier: userTier } = useUserTier()
  const { getTourProgress } = useOnboarding()
  const { replayTour, canReplayTour, isActive, currentTour } = useTourReplay()

  // Prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Filter tours based on user tier
  const availableTours = TOUR_OPTIONS.filter(tour => 
    tour.userTiers.includes(userTier || 'free') && 
    canReplayTour(tour.id)
  )

  // Group tours by category
  const groupedTours = {
    essential: availableTours.filter(t => t.category === 'essential'),
    features: availableTours.filter(t => t.category === 'features'),
    advanced: availableTours.filter(t => t.category === 'advanced')
  }

  const handleTourSelect = async (tourId: string) => {
    setIsOpen(false)
    try {
      console.log(`🎯 HelpMenu: Starting tour ${tourId}`)
      
      // CRITICAL FIX: Add small delay to ensure DOM is ready and dropdown is closed
      await new Promise(resolve => setTimeout(resolve, 200))
      
      await replayTour(tourId)
      
      console.log(`✅ HelpMenu: Tour ${tourId} started successfully`)
    } catch (error) {
      console.error('Failed to start tour:', error)
      // Show user-friendly error message
      alert(`Failed to start tour: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const getTourStatus = (tourId: string) => {
    const progress = getTourProgress(tourId)
    if (progress?.completed) return 'completed'
    if (progress?.skipped) return 'skipped'
    return 'available'
  }

  const getStatusIcon = (status: string, isCurrentTour: boolean) => {
    if (isCurrentTour) return '▶️'
    switch (status) {
      case 'completed': return '✅'
      case 'skipped': return '⏭️'
      default: return '⚪'
    }
  }

  // CRITICAL FIX: Ensure component is always visible and functional
  // This prevents hydration mismatches while ensuring the HelpMenu is always accessible
  const TriggerButton = () => {
    if (variant === 'icon') {
      return (
        <Button
          variant="ghost"
          size={size}
          className="w-8 h-8 rounded-full bg-forest-green/10 text-forest-green hover:bg-forest-green/20 transition-colors flex items-center justify-center"
          disabled={false}
        >
          <HelpCircle className="h-4 w-4" />
        </Button>
      )
    }

    return (
      <Button
        variant="outline"
        size={size}
        className="text-forest-green border-forest-green/60 bg-forest-green/5 hover:bg-forest-green hover:text-white hover:border-forest-green font-semibold transition-all duration-200"
        disabled={false}
      >
        <HelpCircle className="h-4 w-4 mr-2" />
        {showLabel && 'Help & Tours'}
      </Button>
    )
  }

  const renderTourGroup = (title: string, tours: TourOption[]) => {
    if (tours.length === 0) return null

    return (
      <div key={title}>
        <DropdownMenuLabel className="text-xs font-semibold text-charcoal/70 uppercase tracking-wide">
          {title}
        </DropdownMenuLabel>
        {tours.map((tour) => {
          const Icon = tour.icon
          const status = getTourStatus(tour.id)
          const isCurrentTour = currentTour === tour.id

          return (
            <DropdownMenuItem
              key={tour.id}
              onClick={() => handleTourSelect(tour.id)}
              className="cursor-pointer hover:bg-light-concrete focus:bg-light-concrete group"
              disabled={isActive && !isCurrentTour}
            >
              <div className="flex items-start gap-3 w-full">
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-sm">
                    {getStatusIcon(status, isCurrentTour)}
                  </span>
                  <Icon className="h-4 w-4 text-forest-green" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-charcoal group-hover:text-forest-green transition-colors">
                      {tour.name}
                    </p>
                    <span className="text-xs text-charcoal/50 flex-shrink-0">
                      {tour.estimatedTime}
                    </span>
                  </div>
                  <p className="text-sm text-charcoal/70 truncate">
                    {tour.description}
                  </p>
                  {isCurrentTour && (
                    <div className="flex items-center gap-1 mt-1">
                      <div className="h-1.5 w-1.5 bg-forest-green rounded-full animate-pulse"></div>
                      <span className="text-xs text-forest-green font-medium">Currently active</span>
                    </div>
                  )}
                </div>
              </div>
            </DropdownMenuItem>
          )
        })}
        <DropdownMenuSeparator />
      </div>
    )
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <TriggerButton />
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-80 bg-paper-white border-stone-gray shadow-lg"
        align="end"
        sideOffset={8}
      >
        <div className="px-3 py-2 border-b border-stone-gray/20">
          <h3 className="font-semibold text-charcoal flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-forest-green" />
            Help & Interactive Tours
          </h3>
          <p className="text-sm text-charcoal/70 mt-1">
            Re-watch any guide or learn something new
          </p>
        </div>

        <div className="max-h-96 overflow-y-auto py-2">
          {!isMounted ? (
            <div className="px-3 py-4 text-center text-sm text-charcoal/50">
              Loading tours...
            </div>
          ) : availableTours.length === 0 ? (
            <div className="px-3 py-4 text-center text-sm text-charcoal/50">
              No tours available
            </div>
          ) : (
            <>
              {renderTourGroup('Essential Guides', groupedTours.essential)}
              {renderTourGroup('Feature Tours', groupedTours.features)}
              {renderTourGroup('Advanced Training', groupedTours.advanced)}
            </>
          )}
        </div>

        {isActive && (
          <div className="px-3 py-2 bg-light-concrete border-t border-stone-gray/20">
            <div className="flex items-center gap-2 text-sm">
              <div className="h-2 w-2 bg-forest-green rounded-full animate-pulse"></div>
              <span className="text-charcoal/70">
                Tour in progress: <strong className="text-forest-green">{currentTour}</strong>
              </span>
            </div>
          </div>
        )}

        <div className="px-3 py-2 bg-stone-gray/10 border-t border-stone-gray/20">
          <p className="text-xs text-charcoal/60 text-center">
            💡 All tours can be replayed anytime • {isMounted ? availableTours.length : '...'} guides available
          </p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
