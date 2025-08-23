'use client'

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
import { useUserTier } from '@/hooks/use-user-tier'
import { getTourConfig } from '@/libs/onboarding/tour-configs'


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
  const { getTourProgress, startTour, completeTour, availableTours, activeTour } = useOnboarding()

  // Prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Simple page-to-tour mapping based on pathname
  const getPageRelevantTours = () => {
    if (typeof window === 'undefined') return availableTours

    const pathname = window.location.pathname
    
    // Define page-to-tour mappings
    const pageToTours: Record<string, string[]> = {
      '/dashboard': ['welcome'],
      '/quotes': ['quote-creation'],
      '/quotes/new': ['quote-creation'], 
      '/items': ['item-library'],
      '/settings': ['settings'],
      '/analytics': ['pro-features']
    }

    // Get tours for current page
    const relevantTourIds = pageToTours[pathname] || []
    
    // Filter available tours to only include relevant ones
    const filteredTours = availableTours.filter(tour => 
      relevantTourIds.includes(tour.id)
    )
    
    console.log('🎯 HelpMenu Page-Based Filtering:', {
      currentPath: pathname,
      availableTours: availableTours.length,
      relevantTourIds,
      filteredTours: filteredTours.length,
      filteredTourIds: filteredTours.map(t => t.id)
    })
    
    return filteredTours
  }

  // Get page-filtered tours
  const pageFilteredTours = getPageRelevantTours()

  const handleTourSelect = async (tourId: string) => {
    console.log(`🎯 HelpMenu Dropdown: Starting tour ${tourId}`)
    setIsOpen(false)
    
    try {
      // Add small delay to ensure DOM is ready and dropdown is closed
      await new Promise(resolve => setTimeout(resolve, 200))
      
      console.log(`🚀 HelpMenu: Starting tour ${tourId} using simplified Debug Panel pattern...`)
      
      // Use the exact same simplified logic as OnboardingDebugPanel
      const { tourManager } = await import('@/libs/onboarding/tour-manager')
      
      // Get tour config directly
      const tourConfig = getTourConfig(tourId)
      if (tourConfig) {
        console.log(`🎪 Starting regular tour system for ${tourId}`)
        await tourManager.initializeTour(tourId, tourConfig)
        await startTour(tourId)
        await tourManager.startTour()
        console.log(`✅ HelpMenu: Tour ${tourId} started successfully`)
      } else {
        throw new Error(`Tour configuration not found: ${tourId}`)
      }
      
    } catch (error) {
      console.error('Failed to start tour:', error)
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

  const getIconForTour = (tourId: string) => {
    // Map tour IDs to icons (same as TOUR_OPTIONS)
    const iconMap: Record<string, React.ComponentType<any>> = {
      'welcome': Play,
      'settings': Settings,
      'quote-creation': FileText,
      'item-library': Package,
      'pro-features': Star,
      'contextual-help': HelpCircle,
      'freemium-highlights': Zap,
      'interactive-tutorial': BookOpen,
      'personalized-onboarding': Users
    }
    return iconMap[tourId] || HelpCircle
  }

  const renderTourGroup = (title: string, tours: any[]) => {
    if (tours.length === 0) return null

    return (
      <div key={title}>
        <DropdownMenuLabel className="text-xs font-semibold text-charcoal/70 uppercase tracking-wide">
          {title}
        </DropdownMenuLabel>
        {tours.map((tour) => {
          const Icon = getIconForTour(tour.id)
          const status = getTourStatus(tour.id)
          const isCurrentTour = activeTour?.tourId === tour.id

          return (
            <DropdownMenuItem
              key={tour.id}
              onClick={() => handleTourSelect(tour.id)}
              className="cursor-pointer hover:bg-light-concrete focus:bg-light-concrete group"
              disabled={!!activeTour && !isCurrentTour}
            >
              <div className="flex items-start gap-3 w-full">
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-sm">
                    {getStatusIcon(status, isCurrentTour)}
                  </span>
                  <Icon className="h-4 w-4 text-forest-green group-hover:text-forest-green" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-charcoal group-hover:text-charcoal">
                    {tour.title || tour.name}
                  </div>
                  {tour.description && (
                    <div className="text-xs text-charcoal/60 group-hover:text-charcoal/70 mt-0.5 line-clamp-2">
                      {tour.description}
                    </div>
                  )}
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
        <Button
          variant="outline"
          size={size}
          className="text-forest-green border-forest-green/60 bg-forest-green/5 hover:bg-forest-green hover:text-white hover:border-forest-green font-semibold transition-all duration-200"
          disabled={false}
        >
          <HelpCircle className="h-4 w-4 mr-2" />
          {showLabel && 'Help & Tours'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-80 bg-paper-white border-stone-gray shadow-lg"
        align="end"
        sideOffset={8}
      >
        {pageFilteredTours.length === 0 ? (
          <div className="p-4 text-center text-charcoal/60">
            <p className="text-sm font-medium">No tours available</p>
            <p className="text-xs mt-1">No tours available for this page</p>
          </div>
        ) : (
          <>
            <DropdownMenuLabel className="text-sm font-semibold text-charcoal pb-1">
              🎯 Interactive Tours & Help
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {renderTourGroup('Available Tours', pageFilteredTours)}
            
            {pageFilteredTours.length > 0 && (
              <div className="px-2 py-2 border-t border-stone-gray/30">
                <p className="text-xs text-charcoal/50 text-center">
                  Found {pageFilteredTours.length} available tour{pageFilteredTours.length !== 1 ? 's' : ''} for this page
                </p>
              </div>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}