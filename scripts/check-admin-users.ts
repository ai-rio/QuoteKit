#!/usr/bin/env npx ts-node

async function checkAdminUsers() {
  // Set required environment variables if not already set
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://bujajubcktlpblewxtel.supabase.co'
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1amFqdWJja3RscGJsZXd4dGVsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDg0MzM1NCwiZXhwIjoyMDcwNDE5MzU0fQ.pIsMT2ohSRtkLDWS57GGpQYQOL5SVtUd8gDyNtdKjS8'
  }

  console.log('🔍 Checking admin users...')
  
  try {
    // Import after setting env vars
    const { supabaseAdminClient } = await import('../src/libs/supabase/supabase-admin')
    
    // Get all users
    const { data: users, error: usersError } = await supabaseAdminClient.auth.admin.listUsers()
    
    if (usersError) {
      console.error('Error fetching users:', usersError)
      return
    }
    
    console.log(`Found ${users.users.length} total users:`)
    
    for (const user of users.users) {
      console.log(`\n👤 User: ${user.email}`)
      console.log(`   ID: ${user.id}`)
      console.log(`   Created: ${user.created_at}`)
      
      // Using any type for user object to avoid type conflicts (following README methodology)
      const userAny = user as any
      console.log(`   Super Admin: ${userAny.is_super_admin || false}`)
      
      // Check admin status using RPC
      try {
        const { data: isAdmin, error: adminError } = await supabaseAdminClient.rpc('is_admin', {
          user_id: user.id
        })
        
        if (adminError) {
          console.log(`   ❌ Admin check failed: ${adminError.message}`)
        } else {
          console.log(`   🔑 Admin status: ${isAdmin ? '✅ ADMIN' : '❌ Regular user'}`)
        }
      } catch (error) {
        console.log(`   ❌ Admin check error: ${error}`)
      }
    }
    
    // Check for existing admin users using RPC (most reliable method)
    let hasAdminUser = false
    let firstNonAdminUser: any = null
    
    for (const user of users.users) {
      try {
        const { data: isAdmin } = await supabaseAdminClient.rpc('is_admin', {
          user_id: user.id
        })
        if (isAdmin) {
          hasAdminUser = true
          console.log(`\n✅ Found admin user: ${user.email}`)
        } else if (!firstNonAdminUser) {
          firstNonAdminUser = user
        }
      } catch (error) {
        // Continue checking other users
        if (!firstNonAdminUser) {
          firstNonAdminUser = user
        }
      }
    }
    
    if (!hasAdminUser && firstNonAdminUser) {
      console.log('\n⚠️  No admin users found via RPC check!')
      console.log(`🎯 Attempting to promote first user to admin: ${firstNonAdminUser.email}`)
      
      try {
        // Using type assertion for admin update (following README methodology)
        const { error: updateError } = await supabaseAdminClient.auth.admin.updateUserById(
          firstNonAdminUser.id, 
          { is_super_admin: true } as any
        )
        
        if (updateError) {
          console.error('❌ Failed to make user admin:', updateError)
          console.log('💡 You may need to manually set admin permissions in your database.')
        } else {
          console.log('✅ User successfully promoted to admin!')
          console.log('🔄 Re-checking admin status...')
          
          // Verify the promotion worked
          setTimeout(async () => {
            const { data: isNowAdmin } = await supabaseAdminClient.rpc('is_admin', {
              user_id: firstNonAdminUser.id
            })
            console.log(`   Admin verification: ${isNowAdmin ? '✅ SUCCESS' : '❌ FAILED'}`)
          }, 1000)
        }
      } catch (promoteError) {
        console.error('❌ Error promoting user to admin:', promoteError)
        console.log('💡 Manual database update may be required.')
      }
    } else if (!hasAdminUser && users.users.length === 0) {
      console.log('\n⚠️  No users found in the system!')
      console.log('💡 Please create a user account first, then run this script.')
    }
    
  } catch (error) {
    console.error('Script error:', error)
  }
}

checkAdminUsers().then(() => {
  console.log('\n✅ Admin check complete!')
  process.exit(0)
}).catch(error => {
  console.error('Script failed:', error)
  process.exit(1)
})