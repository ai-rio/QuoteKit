"use client"

import { Play } from 'lucide-react'
import dynamic from 'next/dynamic'

// Dynamic imports to prevent SSR hydration issues
const QuoteTourButton = dynamic(
  () => import('./TourReplayButton').then(mod => ({ default: mod.QuoteTourButton })), 
  {
    ssr: false,
    loading: () => (
      <div className="inline-flex items-center justify-center text-charcoal/70 hover:bg-stone-gray/20 h-8 px-3 text-sm rounded transition-colors">
        <Play className="h-4 w-4 mr-2" />
        <span>Replay Tour</span>
      </div>
    )
  }
)

const ItemLibraryTourButton = dynamic(
  () => import('./TourReplayButton').then(mod => ({ default: mod.ItemLibraryTourButton })), 
  {
    ssr: false,
    loading: () => (
      <div className="inline-flex items-center justify-center text-charcoal/70 hover:bg-stone-gray/20 h-8 px-3 text-sm rounded transition-colors">
        <Play className="h-4 w-4 mr-2" />
        <span>Replay Tour</span>
      </div>
    )
  }
)

export { ItemLibraryTourButton,QuoteTourButton }