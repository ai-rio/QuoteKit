'use client'

import type { User } from "@supabase/supabase-js"
import { useEffect, useState } from "react"

import { HelpMenuWrapper } from "@/components/help/HelpMenuWrapper"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { createSupabaseClientClient } from "@/libs/supabase/supabase-client-client"

import { UserMenu } from "./user-menu"

export function AppHeader() {
  const [user, setUser] = useState<User | null>(null)
  
  useEffect(() => {
    const getUser = async () => {
      const supabase = createSupabaseClientClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [])

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-stone-gray px-4 bg-paper-white">
      <div className="flex items-center gap-2">
        <SidebarTrigger 
          className="-ml-1" 
          data-tour="sidebar-trigger"
        />
        <Separator orientation="vertical" className="mr-2 h-4" />
      </div>
      
      {user && (
        <div className="flex items-center gap-4">
          <HelpMenuWrapper variant="button" size="sm" />
          <UserMenu user={user} />
        </div>
      )}
    </header>
  )
}
