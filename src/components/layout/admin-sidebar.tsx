"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  BarChart3, 
  CreditCard,
  Database,
  Home, 
  LogOut, 
  Mail, 
  Search,
  Send,
  Settings,
  TrendingUp,
  Users} from "lucide-react"

import { LawnQuoteLogo } from "@/components/branding/lawn-quote-logo"
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

// Admin navigation items following the planned structure
interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: "Overview",
    items: [
      {
        title: "Dashboard",
        url: "/admin-dashboard",
        icon: Home,
      },
      {
        title: "Settings",
        url: "/admin-settings",
        icon: Settings,
      },
    ]
  },
  {
    title: "User Management",
    items: [
      {
        title: "Users Overview",
        url: "/users/overview",
        icon: Users,
      },
      {
        title: "Bulk Actions",
        url: "/users/bulk-actions",
        icon: Database,
      },
    ]
  },
  {
    title: "Billing & Payments",
    items: [
      {
        title: "Pricing Management",
        url: "/pricing-management",
        icon: CreditCard,
      },
    ]
  },
  {
    title: "Email System",
    items: [
      {
        title: "Campaigns",
        url: "/email-system/campaigns",
        icon: Send,
      },
      {
        title: "Performance",
        url: "/email-system/performance",
        icon: TrendingUp,
      },
      {
        title: "Templates",
        url: "/email-system/templates",
        icon: Mail,
      },
    ]
  },
  {
    title: "Analytics",
    items: [
      {
        title: "Custom Queries",
        url: "/analytics/custom-queries",
        icon: Search,
      },
      {
        title: "Funnels",
        url: "/analytics/funnels",
        icon: TrendingUp,
      },
      {
        title: "Cohorts",
        url: "/analytics/cohorts",
        icon: BarChart3,
      },
    ]
  },
]

interface AdminSidebarProps extends React.ComponentProps<typeof Sidebar> {}

export function AdminSidebar({ ...props }: AdminSidebarProps) {
  const pathname = usePathname()
  const [expandedSections, setExpandedSections] = React.useState<Set<string>>(
    new Set(['overview']) // Default expanded section (only one at a time)
  )

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set<string>()
      // If the section is currently expanded, collapse it (empty set)
      // If it's not expanded, expand only this section
      if (!prev.has(sectionId)) {
        newSet.add(sectionId)
      }
      return newSet
    })
  }

  const isInSection = (sectionItems: NavItem[], currentPath: string) => {
    return sectionItems.some(item => 
      currentPath === item.url || currentPath.startsWith(item.url + '/')
    )
  }

  return (
    <Sidebar className="bg-forest-green text-white" variant="sidebar" {...props}>
      <SidebarHeader className="p-4">
        <div className="flex items-center space-x-3 px-2">
          <LawnQuoteLogo className="text-white flex-shrink-0" />
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-white font-mono">LawnQuote</span>
            <span className="text-xs text-white/70 font-medium">Admin Panel</span>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="flex-1 px-2">
        {navGroups.map((group) => {
          const sectionId = group.title.toLowerCase().replace(/\s+/g, '-')
          const isExpanded = expandedSections.has(sectionId)
          const isActiveSection = isInSection(group.items, pathname)
          
          return (
            <SidebarGroup key={group.title}>
              <SidebarGroupLabel className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-1">
                <SidebarMenuButton
                  onClick={() => toggleSection(sectionId)}
                  className={`w-full justify-between p-2 rounded-md transition-colors ${
                    isActiveSection || isExpanded
                      ? 'bg-white/10 text-white font-bold' 
                      : 'text-white/70 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {group.title === 'Overview' && <Home className="w-4 h-4" />}
                    {group.title === 'User Management' && <Users className="w-4 h-4" />}
                    {group.title === 'Email System' && <Mail className="w-4 h-4" />}
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
                    {group.items.map((item) => {
                      const isActive = pathname === item.url || pathname.startsWith(item.url + '/')
                      const Icon = item.icon
                      
                      return (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton asChild isActive={isActive}>
                            <Link 
                              href={item.url} 
                              className={`flex items-center p-3 rounded-md font-medium min-h-[44px] touch-manipulation transition-colors ml-4 ${
                                isActive 
                                  ? 'bg-white/20 text-white font-bold border-l-2 border-white' 
                                  : 'text-white/90 hover:bg-white/10 hover:text-white border-l-2 border-transparent hover:border-white/30'
                              }`}
                            >
                              <Icon className="w-4 h-4 mr-3 flex-shrink-0" />
                              <span className="text-sm">{item.title}</span>
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
            <SidebarMenuButton asChild>
              <Link 
                href="/dashboard" 
                className="flex items-center p-3 rounded-lg text-white/90 hover:bg-white/10 hover:text-white min-h-[44px] touch-manipulation"
              >
                <Settings className="w-5 h-5 mr-3 flex-shrink-0" />
                <span className="text-sm">Back to App</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link 
                href="/auth/logout" 
                className="flex items-center p-3 rounded-lg text-white/90 hover:bg-white/10 hover:text-white min-h-[44px] touch-manipulation"
              >
                <LogOut className="w-5 h-5 mr-3 flex-shrink-0" />
                <span className="text-sm">Logout</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      
      <SidebarRail />
    </Sidebar>
  )
}