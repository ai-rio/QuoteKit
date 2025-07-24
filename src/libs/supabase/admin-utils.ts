import { supabaseAdminClient } from "./supabase-admin"

// Admin role management utilities
export async function isAdmin(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdminClient.rpc('is_admin', { 
      user_id: userId 
    })
    
    if (error) {
      console.error('Error checking admin status:', error)
      return false
    }
    
    return data || false
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
}

// Server-side admin check using regular server client (for middleware/layout usage)
export async function isAdminServerSide(userId: string, supabaseClient: any): Promise<boolean> {
  try {
    const { data, error } = await supabaseClient.rpc('is_admin', { 
      user_id: userId 
    })
    
    if (error) {
      console.error('Error checking admin status:', error)
      return false
    }
    
    return data || false
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
}

// Get current user's admin status
export async function checkCurrentUserAdmin(): Promise<boolean> {
  try {
    const { data: { user } } = await supabaseAdminClient.auth.getUser()
    if (!user) return false
    
    return await isAdmin(user.id)
  } catch (error) {
    console.error('Error checking current user admin status:', error)
    return false
  }
}

// Grant admin role to a user
export async function grantAdminRole(targetUserId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabaseAdminClient.rpc('grant_admin_role', {
      target_user_id: targetUserId
    })
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Revoke admin role from a user
export async function revokeAdminRole(targetUserId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabaseAdminClient.rpc('revoke_admin_role', {
      target_user_id: targetUserId
    })
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Get all users with their roles (admin only)
export async function getUsersWithRoles() {
  try {
    console.log('Calling supabase RPC: get_users_with_roles')
    const { data, error } = await supabaseAdminClient.rpc('get_users_with_roles')
    
    if (error) {
      console.error('RPC get_users_with_roles error:', error)
      throw new Error(`Database function failed: ${error.message}`)
    }
    
    console.log('RPC get_users_with_roles success, data:', data)
    return data || []
  } catch (error) {
    console.error('getUsersWithRoles() failed:', error)
    throw error // Re-throw to trigger fallback
  }
}

// Get admin actions log
export async function getAdminActions(limit: number = 100) {
  try {
    const { data, error } = await supabaseAdminClient
      .from('admin_actions')
      .select(`
        id,
        action,
        metadata,
        created_at,
        admin:admin_id(email),
        target_user:target_user_id(email)
      `)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) {
      console.error('Error fetching admin actions:', error)
      return []
    }
    
    return data || []
  } catch (error) {
    console.error('Error fetching admin actions:', error)
    return []
  }
}

// Log admin action
export async function logAdminAction(
  adminId: string, 
  action: string, 
  targetUserId?: string, 
  metadata?: Record<string, any>
) {
  try {
    const { error } = await supabaseAdminClient
      .from('admin_actions')
      .insert({
        admin_id: adminId,
        action,
        target_user_id: targetUserId,
        metadata: metadata || {}
      })
    
    if (error) {
      console.error('Error logging admin action:', error)
    }
  } catch (error) {
    console.error('Error logging admin action:', error)
  }
}