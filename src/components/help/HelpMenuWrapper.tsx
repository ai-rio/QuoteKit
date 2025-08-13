"use client"

import { HelpCircle } from 'lucide-react'
import dynamic from 'next/dynamic'

// Dynamic import to prevent SSR hydration issues
const HelpMenu = dynamic(
  () => import('./HelpMenu').then(mod => ({ default: mod.HelpMenu })), 
  {
    ssr: false,
    loading: () => (
      <div className="inline-flex items-center justify-center whitespace-nowrap text-sm rounded-md font-alt font-medium transition-colors text-forest-green border-forest-green/60 bg-forest-green/5 border h-8 px-3">
        <HelpCircle className="h-4 w-4 mr-2" />
        <span>Help & Tours</span>
      </div>
    )
  }
)

interface HelpMenuWrapperProps {
  variant?: 'button' | 'icon'
  size?: 'sm' | 'default' | 'lg'
  showLabel?: boolean
}

export function HelpMenuWrapper(props: HelpMenuWrapperProps) {
  return <HelpMenu {...props} />
}