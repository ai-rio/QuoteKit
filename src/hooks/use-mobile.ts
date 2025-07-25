"use client"

import { useCallback, useEffect, useState } from "react"

import { useSidebar } from "@/components/ui/sidebar"

/**
 * Custom hook to detect mobile devices based on screen width
 * Uses the same breakpoint as Tailwind's 'md' (768px)
 */
export function useMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    // Check on mount
    checkMobile()

    // Listen for resize events
    window.addEventListener('resize', checkMobile)

    // Cleanup
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return isMobile
}

export function useMobileSidebar() {
  const { isMobile, setOpenMobile } = useSidebar()
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())

  // Auto-close sidebar and collapse sections on navigation for mobile
  const handleNavigation = useCallback(() => {
    if (isMobile) {
      setExpandedSections(new Set())
      setTimeout(() => setOpenMobile(false), 100)
    }
  }, [isMobile, setOpenMobile])

  // Smart section toggle with mobile behavior
  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set<string>()
      if (!prev.has(sectionId)) {
        newSet.add(sectionId)
        
        // Auto-collapse on mobile after delay
        if (isMobile) {
          setTimeout(() => setExpandedSections(new Set()), 4000)
        }
      }
      return newSet
    })
  }, [isMobile])

  return {
    expandedSections,
    setExpandedSections,
    toggleSection,
    handleNavigation,
    isMobile
  }
}
