"use client"

import { ChevronRight, FileText, Home, List, Package, PieChart, Settings, TrendingUp, User,Users } from "lucide-react"
import Link from "next/link"
import { useParams, usePathname } from "next/navigation"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

interface BreadcrumbConfig {
  label: string
  href?: string
  icon?: React.ComponentType<{ className?: string }>
}

interface BreadcrumbSegment {
  path: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
  dynamic?: boolean
}

// Define breadcrumb configurations for different routes
const BREADCRUMB_SEGMENTS: Record<string, BreadcrumbSegment> = {
  dashboard: { path: "/dashboard", label: "Dashboard", icon: Home },
  quotes: { path: "/quotes", label: "Quotes", icon: FileText },
  "quotes/new": { path: "/quotes/new", label: "New Quote", icon: FileText },
  "quotes/[id]": { path: "", label: "Quote Details", icon: FileText, dynamic: true },
  "quotes/[id]/edit": { path: "", label: "Edit Quote", icon: FileText, dynamic: true },
  items: { path: "/items", label: "Items", icon: Package },
  clients: { path: "/clients", label: "Clients", icon: Users },
  account: { path: "/account", label: "Account", icon: User },
  settings: { path: "/settings", label: "Settings", icon: Settings },
  analytics: { path: "/analytics", label: "Analytics", icon: PieChart },
  usage: { path: "/usage", label: "Usage Analytics", icon: TrendingUp },
}

interface PageBreadcrumbsProps {
  customQuoteName?: string
}

export function PageBreadcrumbs({ customQuoteName }: PageBreadcrumbsProps = {}) {
  const pathname = usePathname()
  const params = useParams()

  // Generate breadcrumb trail based on current path
  const generateBreadcrumbs = (): BreadcrumbConfig[] => {
    const breadcrumbs: BreadcrumbConfig[] = []

    // Always start with Dashboard as root
    breadcrumbs.push({
      label: "Dashboard",
      href: "/dashboard",
      icon: Home,
    })

    // Parse pathname to build breadcrumb trail
    const pathSegments = pathname.split("/").filter(segment => segment && segment !== "(app)")
    
    let currentPath = ""
    
    for (let i = 0; i < pathSegments.length; i++) {
      const segment = pathSegments[i]
      currentPath += `/${segment}`
      
      // Handle dynamic routes
      let segmentKey = pathSegments.slice(0, i + 1).join("/")
      
      // Replace dynamic segments with [id] pattern for lookup
      if (segment && /^[a-f0-9-]{36}$/.test(segment)) {
        const parentSegments = pathSegments.slice(0, i)
        const dynamicKey = [...parentSegments, "[id]"].join("/")
        
        if (BREADCRUMB_SEGMENTS[dynamicKey]) {
          // For dynamic segments, we might want to show a custom name
          const config = BREADCRUMB_SEGMENTS[dynamicKey]
          
          // If this is the last segment, don't include href (current page)
          const isLast = i === pathSegments.length - 1
          
          // Use custom quote name if provided and this is a quote detail page
          let displayLabel = config.label
          if (customQuoteName && dynamicKey === "quotes/[id]") {
            displayLabel = customQuoteName
          }
          
          breadcrumbs.push({
            label: displayLabel,
            href: isLast ? undefined : currentPath,
            icon: config.icon,
          })
          continue
        }
      }
      
      // Handle edit routes - need to add quote detail link first
      if (segment === "edit" && i > 0) {
        // Add the quote detail page breadcrumb first
        const quoteId = pathSegments[i - 1]
        const quoteDetailPath = `/quotes/${quoteId}`
        
        breadcrumbs.push({
          label: customQuoteName ? customQuoteName.replace('Edit ', '') : 'Quote Details',
          href: quoteDetailPath,
          icon: FileText,
        })
        
        // Then add the edit breadcrumb
        const parentSegments = pathSegments.slice(0, i + 1)
        const editKey = parentSegments.join("/").replace(/[a-f0-9-]{36}/, "[id]")
        
        if (BREADCRUMB_SEGMENTS[editKey]) {
          const config = BREADCRUMB_SEGMENTS[editKey]
          breadcrumbs.push({
            label: "Edit",
            icon: config.icon,
          })
          continue
        }
      }
      
      // Look up segment in configurations
      if (BREADCRUMB_SEGMENTS[segmentKey]) {
        const config = BREADCRUMB_SEGMENTS[segmentKey]
        
        // If this is the last segment, don't include href (current page)
        const isLast = i === pathSegments.length - 1
        
        breadcrumbs.push({
          label: config.label,
          href: isLast ? undefined : config.path,
          icon: config.icon,
        })
      }
    }

    // Remove duplicate Dashboard entries (keep only the first one)
    const uniqueBreadcrumbs = breadcrumbs.filter((crumb, index) => {
      if (crumb.label === "Dashboard" && index > 0) {
        return false
      }
      return true
    })

    return uniqueBreadcrumbs
  }

  const breadcrumbs = generateBreadcrumbs()

  // Don't show breadcrumbs if we're on the dashboard page or only have Dashboard
  if (breadcrumbs.length <= 1 || pathname === '/dashboard') {
    return null
  }

  return (
    <div className="mb-6">
      <Breadcrumb>
        <BreadcrumbList className="flex-wrap">
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1
            const Icon = crumb.icon

            return (
              <div key={`${crumb.label}-${index}`} className="flex items-center">
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage className="flex items-center gap-2 max-w-[200px] truncate">
                      {Icon && <Icon className="h-4 w-4 flex-shrink-0" />}
                      <span className="truncate">{crumb.label}</span>
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link href={crumb.href || "#"} className="flex items-center gap-2 max-w-[200px] truncate hover:max-w-none">
                        {Icon && <Icon className="h-4 w-4 flex-shrink-0" />}
                        <span className="truncate">{crumb.label}</span>
                      </Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                
                {!isLast && <BreadcrumbSeparator />}
              </div>
            )
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  )
}