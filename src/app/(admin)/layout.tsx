import { redirect } from "next/navigation"

import { AdminSidebar } from "@/components/layout/admin-sidebar"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { createSupabaseServerClient } from "@/libs/supabase/supabase-server-client"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createSupabaseServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // TODO: Check admin role here once implemented
  // For now, we'll allow any authenticated user for development
  // const isAdmin = await checkAdminRole(user.id)
  // if (!isAdmin) {
  //   redirect('/dashboard')
  // }

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-stone-gray px-4 bg-paper-white">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 h-4"
          />
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-charcoal/70">Admin Panel</span>
            <span className="text-sm text-charcoal">{user.email}</span>
          </div>
        </header>
        <div className="flex flex-1 flex-col p-4 bg-light-concrete min-h-[calc(100vh-4rem)]">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}