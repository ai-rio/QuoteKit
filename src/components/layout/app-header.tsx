import { HelpMenuWrapper } from "@/components/help/HelpMenuWrapper"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { createSupabaseServerClient } from "@/libs/supabase/supabase-server-client"

import { UserMenu } from "./user-menu"

export async function AppHeader() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-stone-gray px-4 bg-paper-white">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" data-tour="sidebar-trigger" />
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
