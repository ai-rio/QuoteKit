"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  BarChart3, 
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
        url: "/admin/admin-dashboard",
        icon: Home,
      },
    ]
  },
  {
    title: "User Management",
    items: [
      {
        title: "Users Overview",
        url: "/admin/users/overview",
        icon: Users,
      },
      {
        title: "Bulk Actions",
        url: "/admin/users/bulk-actions",
        icon: Database,
      },
    ]
  },
  {
    title: "Email System",
    items: [
      {
        title: "Campaigns",
        url: "/admin/email-system/campaigns",
        icon: Send,
      },
      {
        title: "Performance",
        url: "/admin/email-system/performance",
        icon: TrendingUp,
      },
      {
        title: "Templates",
        url: "/admin/email-system/templates",
        icon: Mail,
      },
    ]
  },
  {
    title: "Analytics",
    items: [
      {
        title: "Custom Queries",
        url: "/admin/analytics/custom-queries",
        icon: Search,
      },
      {
        title: "Funnels",
        url: "/admin/analytics/funnels",
        icon: TrendingUp,
      },
      {
        title: "Cohorts",
        url: "/admin/analytics/cohorts",
        icon: BarChart3,
      },
    ]
  },
]

interface AdminSidebarProps extends React.ComponentProps<typeof Sidebar> {}

export function AdminSidebar({ ...props }: AdminSidebarProps) {
  const pathname = usePathname()

  return (
    <Sidebar className="bg-forest-green text-white" {...props}>
      <SidebarHeader className="p-4">
        <div className="flex items-center space-x-3 px-2">
          <LawnQuoteLogo className="text-white flex-shrink-0" />
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-white font-mono">LawnQuote</span>
            <span className="text-xs text-white/70 font-medium">Admin Panel</span>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="flex-1 px-4">
        {navGroups.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-2">
              {group.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.url || pathname.startsWith(item.url + '/')
                  const Icon = item.icon
                  
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={isActive}
                        className={`
                          flex items-center p-3 rounded-lg font-medium min-h-[44px] touch-manipulation
                          ${isActive 
                            ? 'bg-white/20 text-white font-bold' 
                            : 'text-white/90 hover:bg-white/10 hover:text-white'
                          }
                        `}
                      >
                        <Link href={item.url} className="flex items-center w-full">
                          <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
                          <span className="text-sm">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      
      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              asChild 
              className="flex items-center p-3 rounded-lg text-white/90 hover:bg-white/10 hover:text-white min-h-[44px] touch-manipulation"
            >
              <Link href="/dashboard" className="flex items-center w-full">
                <Settings className="w-5 h-5 mr-3 flex-shrink-0" />
                <span className="text-sm">Back to App</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton 
              asChild 
              className="flex items-center p-3 rounded-lg text-white/90 hover:bg-white/10 hover:text-white min-h-[44px] touch-manipulation"
            >
              <Link href="/auth/logout" className="flex items-center w-full">
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