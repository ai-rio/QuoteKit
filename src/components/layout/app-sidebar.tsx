"use client"

import { BarChart3, Crown,FileText, Home, LogOut, MoreVertical, Package, Plus, Settings, Users } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import * as React from "react"

import { signOut } from "@/app/(auth)/auth-actions"
import { LawnQuoteLogoIcon } from "@/components/branding/lawn-quote-logo"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useMobileSidebar } from "@/hooks/use-mobile"
import { useFeatureAccess } from "@/hooks/useFeatureAccess"

// Navigation items organized into groups
interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  highlight?: boolean;
  featureKey?: string; // Feature key for gating
  premiumOnly?: boolean; // Show premium badge
  freeOnly?: boolean; // Only show to free users
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navGroups = [
  {
    title: "Management", 
    items: [
      {
        title: "My Quotes",
        url: "/quotes",
        icon: FileText,
      },
      {
        title: "Item Library",
        url: "/items",
        icon: Package,
      },
      {
        title: "Clients",
        url: "/clients",
        icon: Users,
      }
    ]
  },
  {
    title: "Analytics",
    items: [
      {
        title: "Analytics",
        url: "/analytics",
        icon: BarChart3,
        featureKey: "analytics_access",
        premiumOnly: true,
      },
      {
        title: "Usage",
        url: "/usage",
        icon: BarChart3,
        freeOnly: true, // Only show to free users who need usage tracking
      }
    ]
  }
]

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {}

export function AppSidebar({ ...props }: AppSidebarProps) {
  const pathname = usePathname()
  const { expandedSections, toggleSection, handleNavigation, isMobile } = useMobileSidebar()
  const { canAccess, isFreePlan, loading } = useFeatureAccess()
  

  const isInSection = (sectionItems: NavItem[], currentPath: string) => {
    return sectionItems.some(item => 
      currentPath === item.url || currentPath.startsWith(item.url + '/')
    )
  }

  // Check if user has access to a feature
  const hasFeatureAccess = (featureKey?: string) => {
    if (!featureKey) return true
    return canAccess(featureKey as any).hasAccess
  }

  return (
    <Sidebar 
      className="bg-forest-green text-white transition-all duration-300 ease-in-out" 
      data-tour="sidebar" 
      collapsible="offcanvas"
      {...props}
    >
      <SidebarHeader className="p-4">
        <div className="flex items-center space-x-3 px-2">
          <LawnQuoteLogoIcon className="text-white flex-shrink-0" />
          <span className="text-2xl font-bold text-white font-mono">LawnQuote</span>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="flex-1 px-2">
        {/* Dashboard - Single item without expandable behavior */}
        <SidebarGroup>
          <SidebarMenu className="space-y-1">
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link 
                  href="/dashboard" 
                  onClick={handleNavigation}
                  className={`flex items-center p-3 rounded-md font-medium min-h-[44px] touch-manipulation transition-all duration-150 ease-out active:scale-95 ${
                    pathname === '/dashboard' || pathname.startsWith('/dashboard/')
                      ? 'bg-white/20 text-white font-bold border-l-2 border-white' 
                      : 'text-white/90 hover:bg-white/10 hover:text-white border-l-2 border-transparent hover:border-white/30'
                  }`}
                >
                  <Home className="w-5 h-5 mr-3 flex-shrink-0" />
                  <span className="text-sm">Dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>        
        {/* New Quote - Standalone primary action button */}
        <SidebarGroup>
          <SidebarMenu className="space-y-1">
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link 
                  href="/quotes/new" 
                  onClick={handleNavigation}
                  className={`flex items-center p-3 rounded-md font-medium min-h-[44px] touch-manipulation transition-all duration-150 ease-out active:scale-95 ${
                    pathname === '/quotes/new' || pathname.startsWith('/quotes/new/')
                      ? 'bg-equipment-yellow text-charcoal font-bold hover:bg-equipment-yellow/90 hover:text-charcoal transform transition-all duration-200' 
                      : 'bg-equipment-yellow text-charcoal font-bold hover:bg-equipment-yellow/90 hover:text-charcoal transform transition-all duration-200'
                  }`}
                >
                  <Plus className="w-5 h-5 mr-3 flex-shrink-0" />
                  <span className="text-sm">New Quote</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        
        {/* Other expandable sections */}
        {navGroups.map((group) => {
          const sectionId = group.title.toLowerCase().replace(/\s+/g, '-')
          const isExpanded = expandedSections.has(sectionId)
          
          // Filter items based on user's plan
          const filteredItems = group.items.filter(item => {
            // During loading, don't show plan-specific items to avoid flashing
            if (loading) {
              return !(item as any).freeOnly && !(item as any).premiumOnly
            }
            
            // If item is freeOnly, only show to free users
            if ((item as any).freeOnly && !isFreePlan()) {
              return false
            }
            // If item is premiumOnly (Analytics with Pro badge), only show to free users
            if ((item as any).premiumOnly && !isFreePlan()) {
              return false
            }
            return true
          })
          
          const isActiveSection = isInSection(filteredItems, pathname)
          
          // Don't render the group if no items are visible
          if (filteredItems.length === 0) {
            return null
          }
          
          return (
            <SidebarGroup key={group.title}>
              <SidebarGroupLabel className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-1">
                <SidebarMenuButton
                  onClick={() => toggleSection(sectionId)}
                  className={`w-full justify-between p-2 rounded-md transition-colors active:bg-white/20 active:scale-95 transition-all duration-150 ease-out ${
                    isActiveSection || isExpanded
                      ? 'bg-white/10 text-white font-bold' 
                      : 'text-white/70 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    
                    {group.title === 'Management' && <Package className="w-4 h-4" />}
                    {group.title === 'Analytics' && <BarChart3 className="w-4 h-4" />}
                    {group.title}
                  </span>
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${
                      isExpanded ? 'rotate-90' : 'rotate-0'
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </SidebarMenuButton>
              </SidebarGroupLabel>
              
              {isExpanded && (
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-1">
                    {filteredItems.map((item) => {
                      const isActive = pathname === item.url || pathname.startsWith(item.url + '/')
                      const Icon = item.icon
                      const isHighlight = 'highlight' in item ? item.highlight : false
                      const hasAccess = hasFeatureAccess((item as any).featureKey)
                      const showPremiumBadge = (item as any).premiumOnly && isFreePlan() && !hasAccess
                      
                      return (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton asChild isActive={isActive}>
                            <Link 
                              href={item.url} 
                              onClick={handleNavigation}
                              className={`flex items-center p-3 rounded-md font-medium min-h-[44px] touch-manipulation transition-all duration-150 ease-out active:scale-95 ml-4 ${
                                !hasAccess && (item as any).featureKey
                                  ? 'text-white/50 hover:bg-white/5 hover:text-white/70 border-l-2 border-transparent cursor-pointer'
                                  : isHighlight 
                                    ? 'bg-equipment-yellow text-charcoal font-bold hover:bg-equipment-yellow/90 hover:text-charcoal transform transition-all duration-200'
                                    : isActive 
                                      ? 'bg-white/20 text-white font-bold border-l-2 border-white' 
                                      : 'text-white/90 hover:bg-white/10 hover:text-white border-l-2 border-transparent hover:border-white/30'
                              }`}
                            >
                              <Icon className="w-4 h-4 mr-3 flex-shrink-0" />
                              <span className="text-sm flex-1">{item.title}</span>
                              {showPremiumBadge && (
                                <Badge 
                                  variant="outline" 
                                  className="ml-2 text-xs bg-equipment-yellow/20 text-equipment-yellow border-equipment-yellow/50 px-1 py-0"
                                >
                                  <Crown className="w-2 h-2 mr-1" />
                                  Pro
                                </Badge>
                              )}
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      )
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              )}
            </SidebarGroup>
          )
        })}
      </SidebarContent>
      
      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <Popover>
              <PopoverTrigger asChild>
                <SidebarMenuButton className="flex items-center p-3 rounded-lg text-white/90 hover:bg-white/10 hover:text-white min-h-[44px] touch-manipulation active:bg-white/20 active:scale-95 transition-all duration-150 ease-out">
                  <MoreVertical className="w-5 h-5 mr-3 flex-shrink-0" />
                  <span className="text-sm">Menu</span>
                </SidebarMenuButton>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2" align="start">
                <div className="space-y-1">
                  <Link 
                    href="/settings" 
                    onClick={handleNavigation}
                    className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                    <span>Company Settings</span>
                  </Link>
                  <Link 
                    href="/account" 
                    onClick={handleNavigation}
                    className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <Crown className="h-4 w-4" />
                    <span>Account & Billing</span>
                  </Link>
                  <button 
                    onClick={async () => {
                      const result = await signOut()
                      if (!(result as any).error) {
                        window.location.href = '/'
                      }
                    }}
                    className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors w-full text-left"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      
      <SidebarRail />
    </Sidebar>
  )
}