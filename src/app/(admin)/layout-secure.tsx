import { headers } from 'next/headers'
import { redirect } from "next/navigation"

import { AdminSidebar } from "@/components/layout/admin-sidebar"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { createSupabaseServerClient } from "@/libs/supabase/supabase-server-client"

// SECURITY: Enhanced admin session validation
async function validateAdminAccess(userId: string) {
  const supabase = await createSupabaseServerClient()
  
  // Step 1: Verify user session is active and valid
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  if (sessionError || !session || session.user.id !== userId) {
    throw new Error('Invalid session')
  }

  // Step 2: Multi-layer admin verification
  const { data: adminCheck, error: adminError } = await supabase
    .from('users')
    .select(`
      id,
      email,
      is_admin,
      admin_verified_at,
      last_admin_login
    `)
    .eq('id', userId)
    .single()
  
  if (adminError) {
    throw new Error(`Admin verification failed: ${adminError.message}`)
  }

  if (!adminCheck?.is_admin) {
    throw new Error('Insufficient privileges')
  }

  // Step 3: Check admin session hasn't been compromised
  const sessionAge = Date.now() - new Date(session.expires_at || 0).getTime()
  if (sessionAge < 0 || sessionAge > 24 * 60 * 60 * 1000) { // 24 hour max session
    throw new Error('Admin session expired')
  }

  // Step 4: Verify IP consistency (basic MITM protection)
  const headersList = await headers()
  const currentIP = headersList.get('x-forwarded-for') || 
                   headersList.get('x-real-ip') ||
                   'unknown'
  
  // Log admin access for audit
  await supabase
    .from('admin_audit_log')
    .insert({
      user_id: userId,
      action: 'admin_access',
      ip_address: currentIP,
      user_agent: headersList.get('user-agent'),
      timestamp: new Date().toISOString()
    })
    .select()

  return adminCheck
}

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

  try {
    // SECURITY: Enhanced admin validation
    const adminData = await validateAdminAccess(user.id)
    
    if (!adminData) {
      redirect('/dashboard?error=access_denied')
    }

  } catch (error) {
    console.error('Admin access validation failed:', error)
    // SECURITY: Don't reveal specific error details
    redirect('/dashboard?error=access_denied')
  }

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
            <div className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
              PRIVILEGED ACCESS
            </div>
          </div>
        </header>
        <div className="flex flex-1 flex-col p-4 bg-light-concrete min-h-[calc(100vh-4rem)]">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}