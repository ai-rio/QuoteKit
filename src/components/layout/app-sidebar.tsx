"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, LogOut, Package, Plus, Settings } from "lucide-react"

import { LawnQuoteLogo } from "@/components/branding/lawn-quote-logo"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

// Navigation items matching the HTML mockup
interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  highlight?: boolean;
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "New Quote",
    url: "/quotes/new",
    icon: Plus,
    highlight: true, // Special styling for primary action
  },
  {
    title: "Item Library",
    url: "/items",
    icon: Package,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
]

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {}

export function AppSidebar({ ...props }: AppSidebarProps) {
  const pathname = usePathname()

  return (
    <Sidebar className="bg-forest-green text-white" {...props}>
      <SidebarHeader className="p-4">
        <div className="flex items-center space-x-3 px-2">
          <LawnQuoteLogo className="text-white flex-shrink-0" />
          <span className="text-2xl font-bold text-white font-mono">LawnQuote</span>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="flex-1 px-4">
        <SidebarMenu className="space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.url || pathname.startsWith(item.url + '/')
            const Icon = item.icon
            const isHighlight = item.highlight
            
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton 
                  asChild 
                  isActive={isActive}
                  className={`
                    flex items-center p-3 sm:p-4 rounded-lg font-medium min-h-[48px] touch-manipulation
                    ${isHighlight 
                      ? 'bg-equipment-yellow text-charcoal font-bold hover:bg-equipment-yellow/90 hover:text-charcoal transform transition-all duration-200' 
                      : isActive 
                        ? 'bg-white/20 text-white font-bold' 
                        : 'text-white hover:bg-white/10'
                    }
                  `}
                >
                  <Link href={item.url} className="flex items-center w-full">
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 mr-3 flex-shrink-0" />
                    <span className="text-sm sm:text-base">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent>
      
      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              asChild 
              className="flex items-center p-3 sm:p-4 rounded-lg text-white hover:bg-white/10 min-h-[48px] touch-manipulation"
            >
              <Link href="/auth/logout" className="flex items-center w-full">
                <LogOut className="w-5 h-5 sm:w-6 sm:h-6 mr-3 flex-shrink-0" />
                <span className="text-sm sm:text-base">Logout</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      
      <SidebarRail />
    </Sidebar>
  )
}