"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { FileText, Home, LogOut, MoreVertical, Package, Plus, Settings, Users } from "lucide-react"

import { LawnQuoteLogo } from "@/components/branding/lawn-quote-logo"
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

// Navigation items organized into groups
interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  highlight?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navGroups = [
  {
    title: "Core",
    items: [
      {
        title: "New Quote",
        url: "/quotes/new",
        icon: Plus,
        highlight: true, // Special styling for primary action
      }
    ]
  },
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
  }
]

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {}

export function AppSidebar({ ...props }: AppSidebarProps) {
  const pathname = usePathname()
  const { expandedSections, toggleSection, handleNavigation, isMobile } = useMobileSidebar()

  const isInSection = (sectionItems: NavItem[], currentPath: string) => {
    return sectionItems.some(item => 
      currentPath === item.url || currentPath.startsWith(item.url + '/')
    )
  }

  return (
    <Sidebar className="bg-forest-green text-white" {...props}>
      <SidebarHeader className="p-4">
        <div className="flex items-center space-x-3 px-2">
          <LawnQuoteLogo className="text-white flex-shrink-0" />
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
        
        {/* Other expandable sections */}
        {navGroups.map((group) => {
          const sectionId = group.title.toLowerCase().replace(/\s+/g, '-')
          const isExpanded = expandedSections.has(sectionId)
          const isActiveSection = isInSection(group.items, pathname)
          
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
                    {group.title === 'Core' && <Home className="w-4 h-4" />}
                    {group.title === 'Management' && <Package className="w-4 h-4" />}
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
                      const isHighlight = item.highlight
                      
                      return (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton asChild isActive={isActive}>
                            <Link 
                              href={item.url} 
                              onClick={handleNavigation}
                              className={`flex items-center p-3 rounded-md font-medium min-h-[44px] touch-manipulation transition-all duration-150 ease-out active:scale-95 ml-4 ${
                                isHighlight 
                                  ? 'bg-equipment-yellow text-charcoal font-bold hover:bg-equipment-yellow/90 hover:text-charcoal transform transition-all duration-200'
                                  : isActive 
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
                    <span>Settings</span>
                  </Link>
                  <Link 
                    href="/auth/logout" 
                    onClick={handleNavigation}
                    className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </Link>
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