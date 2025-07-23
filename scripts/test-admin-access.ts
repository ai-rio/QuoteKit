#!/usr/bin/env tsx

/**
 * Test script to verify admin role functionality
 * Run with: npx tsx scripts/test-admin-access.ts <email>
 */

import { supabaseAdminClient } from '../src/libs/supabase/supabase-admin'
import { isAdmin } from '../src/libs/supabase/admin-utils'

async function testAdminAccess(email: string) {
  try {
    console.log(`🔍 Testing admin access for: ${email}`)
    
    // Find the user by email
    const { data: users, error: listError } = await supabaseAdminClient.auth.admin.listUsers()
    
    if (listError) {
      console.error('❌ Error listing users:', listError)
      return
    }
    
    const user = users.users.find(u => u.email === email)
    
    if (!user) {
      console.error(`❌ User with email ${email} not found`)
      return
    }
    
    console.log(`👤 Found user: ${user.email} (ID: ${user.id})`)
    
    // Check current role in metadata
    const currentRole = user.user_metadata?.role || user.user_metadata?.role || 'user'
    console.log(`🎭 Current role in metadata: ${currentRole}`)
    
    // Test the isAdmin function
    const adminStatus = await isAdmin(user.id)
    console.log(`🔐 isAdmin() function result: ${adminStatus}`)
    
    // Test the database function directly
    const { data: dbAdminStatus, error: dbError } = await supabaseAdminClient.rpc('is_admin', { 
      user_id: user.id 
    })
    
    if (dbError) {
      console.error('❌ Error checking admin status via DB function:', dbError)
    } else {
      console.log(`🗄️  Database is_admin() function result: ${dbAdminStatus}`)
    }
    
    // Summary
    console.log('\n📊 Summary:')
    console.log(`- User exists: ✅`)
    console.log(`- Metadata role: ${currentRole}`)
    console.log(`- Admin utility function: ${adminStatus ? '✅ Admin' : '❌ Not Admin'}`)
    console.log(`- Database function: ${dbAdminStatus ? '✅ Admin' : '❌ Not Admin'}`)
    
    if (adminStatus && dbAdminStatus) {
      console.log('\n🎉 Admin access verified! User should be able to access admin panel.')
    } else if (!adminStatus && !dbAdminStatus) {
      console.log('\n⚠️  User does not have admin access. Use bootstrap-admin.ts to grant admin role.')
    } else {
      console.log('\n🚨 Inconsistent admin status! Check role metadata and database function.')
    }
    
  } catch (error) {
    console.error('❌ Test error:', error)
  }
}

// Get email from command line arguments
const email = process.argv[2]

if (!email) {
  console.error('Usage: npx tsx scripts/test-admin-access.ts <email>')
  console.error('Example: npx tsx scripts/test-admin-access.ts admin@example.com')
  process.exit(1)
}

testAdminAccess(email)
  .then(() => {
    console.log('\n✅ Test completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Test failed:', error)
    process.exit(1)
  })