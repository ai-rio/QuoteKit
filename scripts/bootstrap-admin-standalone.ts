#!/usr/bin/env tsx

/**
 * Bootstrap script to create the first admin user
 * Run with: npx tsx scripts/bootstrap-admin-standalone.ts <email>
 */

// Load environment variables first
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })

import { createClient } from '@supabase/supabase-js'

async function bootstrapAdmin(email: string) {
  try {
    // Get environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    console.log('Environment check:')
    console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl)
    console.log('SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? 'SET' : 'NOT SET')
    
    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing required environment variables')
      return
    }
    
    // Create admin client
    const supabaseAdminClient = createClient(supabaseUrl, serviceRoleKey)
    
    console.log(`Setting up admin role for: ${email}`)
    
    // Find the user by email
    const { data: users, error: listError } = await supabaseAdminClient.auth.admin.listUsers()
    
    if (listError) {
      console.error('Error listing users:', listError)
      return
    }
    
    const user = users.users.find(u => u.email === email)
    
    if (!user) {
      console.error(`User with email ${email} not found. Please make sure the user has signed up first.`)
      return
    }
    
    // Update user metadata to include admin role
    const { error: updateError } = await supabaseAdminClient.auth.admin.updateUserById(
      user.id,
      {
        user_metadata: {
          ...user.user_metadata,
          role: 'admin'
        }
      }
    )
    
    if (updateError) {
      console.error('Error updating user metadata:', updateError)
      return
    }
    
    console.log(`✅ Successfully granted admin role to ${email}`)
    console.log(`User ID: ${user.id}`)
    
  } catch (error) {
    console.error('Bootstrap error:', error)
  }
}

// Get email from command line arguments
const email = process.argv[2]

if (!email) {
  console.error('Usage: npx tsx scripts/bootstrap-admin-standalone.ts <email>')
  console.error('Example: npx tsx scripts/bootstrap-admin-standalone.ts admin@example.com')
  process.exit(1)
}

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
if (!emailRegex.test(email)) {
  console.error('Invalid email format')
  process.exit(1)
}

bootstrapAdmin(email)
  .then(() => {
    console.log('Bootstrap completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Bootstrap failed:', error)
    process.exit(1)
  })